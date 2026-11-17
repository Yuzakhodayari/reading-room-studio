#!/usr/bin/env node
/**
 * DaVinci Resolve Free bridge: exports a Final Cut Pro XML v1.9 (.fcpxml)
 * timeline from a DirectorPlan JSON.
 *
 * Timeline layout:
 *   - Spine (Track V1 + A1): prepped A-roll
 *   - Connected clips (Track V2, lane="1"): graphic / Liquid Glass overlays at exact 30fps offsets
 *   - Connected audio (Track A2, lane="-1"): synced SFX .wav cues from beat.sfxCues
 *
 * Usage:
 *   node scripts/export-fcpxml.mjs <director-plan.json> [--aroll path/to/aroll.mp4] [--overlays-dir out/overlays] [--out out/timeline.fcpxml]
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STUDIO_DIR = path.resolve(__dirname, "..");
const SFX_DIR = path.join(STUDIO_DIR, "public", "sfx");

function printUsage() {
  console.log(`Usage:
  node scripts/export-fcpxml.mjs <director-plan.json> [options]

Options:
  --aroll <path>         Path to prepped A-roll MP4 (placed on Spine V1/A1)
  --overlays-dir <dir>   Directory containing rendered overlays and/or overlay-manifest.json
  --out <path>           Output .fcpxml file path (default: out/timeline.fcpxml)
  -h, --help             Show help`);
}

function parseArgs(argv) {
  const opts = {
    planPath: null,
    arollPath: null,
    overlaysDir: path.join(STUDIO_DIR, "out", "overlays"),
    outPath: path.join(STUDIO_DIR, "out", "timeline.fcpxml"),
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg === "--aroll") {
      opts.arollPath = path.resolve(argv[++i]);
    } else if (arg === "--overlays-dir") {
      opts.overlaysDir = path.resolve(argv[++i]);
    } else if (arg === "--out") {
      opts.outPath = path.resolve(argv[++i]);
    } else if (!arg.startsWith("-") && !opts.planPath) {
      opts.planPath = path.resolve(arg);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.planPath) {
    throw new Error("Missing required positional argument: <director-plan.json>");
  }
  return opts;
}

function escapeXml(val) {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeId(raw) {
  return String(raw || "item").replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function toRationalTime(frames, fps) {
  const cleanFrames = Math.max(0, Math.round(frames));
  if (cleanFrames === 0) return "0s";
  const den = Math.round(fps) * 100;
  const num = cleanFrames * 100;
  return `${num}/${den}s`;
}

function readWavDurationFrames(wavPath, fps) {
  if (!fs.existsSync(wavPath)) {
    return Math.max(1, Math.round(0.35 * fps));
  }
  try {
    const buf = fs.readFileSync(wavPath);
    if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF") {
      return Math.max(1, Math.round(0.35 * fps));
    }
    const byteRate = buf.readUInt32LE(28);
    // Find 'data' chunk robustly
    let offset = 12;
    let dataSize = 0;
    while (offset + 8 <= buf.length) {
      const chunkId = buf.toString("ascii", offset, offset + 4);
      const chunkSize = buf.readUInt32LE(offset + 4);
      if (chunkId === "data") {
        dataSize = chunkSize;
        break;
      }
      offset += 8 + chunkSize;
    }
    if (byteRate > 0 && dataSize > 0) {
      const sec = dataSize / byteRate;
      return Math.max(1, Math.round(sec * fps));
    }
  } catch {
    // Fallback below
  }
  return Math.max(1, Math.round(0.35 * fps));
}

function findFfprobe() {
  const probeCmd = process.platform === "win32" ? "where.exe" : "which";
  const onPath = spawnSync(probeCmd, ["ffprobe"], { encoding: "utf8" });
  if (onPath.status === 0 && onPath.stdout) {
    const first = onPath.stdout.split(/\r?\n/).find((l) => l.trim().length > 0);
    if (first && fs.existsSync(first.trim())) return first.trim();
  }
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    const wingetRoot = path.join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages");
    if (fs.existsSync(wingetRoot)) {
      const stack = [{ dir: wingetRoot, depth: 0 }];
      while (stack.length > 0) {
        const { dir, depth } = stack.pop();
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, ent.name);
          if (ent.isFile() && ent.name.toLowerCase() === "ffprobe.exe") return full;
          if (ent.isDirectory() && depth < 4) stack.push({ dir: full, depth: depth + 1 });
        }
      }
    }
  }
  return null;
}

function probeMediaDurationFrames(ffprobeBin, mediaPath, fps, fallbackFrames) {
  if (!ffprobeBin || !fs.existsSync(mediaPath)) return fallbackFrames;
  const res = spawnSync(
    ffprobeBin,
    ["-v", "error", "-show_entries", "format=duration", "-of", "json", mediaPath],
    { encoding: "utf8" }
  );
  if (res.status !== 0 || !res.stdout) return fallbackFrames;
  try {
    const parsed = JSON.parse(res.stdout);
    const sec = Number(parsed?.format?.duration || 0);
    if (Number.isFinite(sec) && sec > 0) {
      return Math.max(1, Math.round(sec * fps));
    }
  } catch {
    // ignore
  }
  return fallbackFrames;
}

function resolveOverlayClipPath(beat, overlaysDir, manifestById) {
  if (manifestById[beat.id]) {
    return path.resolve(manifestById[beat.id]);
  }
  const safeId = sanitizeId(beat.id);
  const candidates =
    beat.framing === "fullscreen-cutaway"
      ? [`${safeId}.mp4`, `${safeId}.mov`, `${safeId}.webm`]
      : [`${safeId}.mov`, `${safeId}.webm`, `${safeId}.mp4`];

  for (const name of candidates) {
    const candidate = path.join(overlaysDir, name);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.join(overlaysDir, candidates[0]);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(opts.planPath)) {
    throw new Error(`Director plan file not found: ${opts.planPath}`);
  }

  const rawPlan = fs.readFileSync(opts.planPath, "utf8").replace(/^\uFEFF/, "");
  const plan = JSON.parse(rawPlan);
  const fps = Math.round(Number(plan.fps) || 30);
  const beats = Array.isArray(plan.beats) ? plan.beats : [];
  const maxBeatFrame = beats.reduce((acc, b) => Math.max(acc, Number(b.endFrame) || 0), 0);
  const totalFrames = Math.max(1, Number(plan.totalFrames) || maxBeatFrame || fps * 10);

  const arollPath =
    opts.arollPath || path.join(path.dirname(opts.planPath), "aroll_prepped.mp4");
  const ffprobeBin = findFfprobe();
  const arollFrames = probeMediaDurationFrames(ffprobeBin, arollPath, fps, totalFrames);
  const timelineFrames = Math.max(totalFrames, arollFrames);

  // Load overlay-manifest.json if available
  const manifestPath = path.join(opts.overlaysDir, "overlay-manifest.json");
  let manifestById = {};
  if (fs.existsSync(manifestPath)) {
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      if (m && typeof m.byBeatId === "object" && m.byBeatId) {
        manifestById = m.byBeatId;
      }
    } catch {
      // ignore invalid manifest
    }
  }

  const formatDenom = fps * 100;
  const frameDurationAttr = `100/${formatDenom}s`;
  const timelineDurationAttr = toRationalTime(timelineFrames, fps);
  const arollDurationAttr = toRationalTime(arollFrames, fps);

  const assetLines = [];
  const overlayClipXml = [];
  const sfxClipXml = [];
  const seenSfxAssets = new Map();

  // Primary A-roll asset
  const arollUrl = pathToFileURL(path.resolve(arollPath)).href;
  assetLines.push(
    `    <asset id="r_aroll" name="${escapeXml(path.basename(arollPath))}" start="0s" duration="${arollDurationAttr}" hasVideo="1" hasAudio="1" format="r1" audioSources="1" audioChannels="2" audioRate="48000">`,
    `      <media-rep kind="original-media" src="${escapeXml(arollUrl)}"/>`,
    `    </asset>`
  );

  // Overlay assets & V2 connected clips
  let overlayCount = 0;
  let sfxCount = 0;

  for (const beat of beats) {
    const startFrame = Math.max(0, Math.round(Number(beat.startFrame) || 0));
    const endFrame = Math.max(
      startFrame + 1,
      Math.round(Number(beat.endFrame) || startFrame + Math.round((beat.durationSec || 3) * fps))
    );
    const durFrames = Math.max(1, endFrame - startFrame);

    if (beat.framing !== "talking-head-full") {
      overlayCount += 1;
      const assetId = `r_ov_${sanitizeId(beat.id)}`;
      const clipPath = resolveOverlayClipPath(beat, opts.overlaysDir, manifestById);
      const clipUrl = pathToFileURL(clipPath).href;
      const durAttr = toRationalTime(durFrames, fps);
      const offsetAttr = toRationalTime(startFrame, fps);
      const clipLabel = `${beat.id} [${beat.glassPreset || beat.componentHint || beat.framing}]`;

      assetLines.push(
        `    <asset id="${escapeXml(assetId)}" name="${escapeXml(path.basename(clipPath))}" start="0s" duration="${durAttr}" hasVideo="1" hasAudio="0" format="r1">`,
        `      <media-rep kind="original-media" src="${escapeXml(clipUrl)}"/>`,
        `    </asset>`
      );

      overlayClipXml.push(
        `          <asset-clip ref="${escapeXml(assetId)}" lane="1" offset="${offsetAttr}" name="${escapeXml(clipLabel)}" start="0s" duration="${durAttr}" format="r1" tcFormat="NDF"/>`
      );
    }

    // SFX cues -> Audio Track A2 (lane="-1")
    const cues = Array.isArray(beat.sfxCues) ? beat.sfxCues : [];
    for (const cueObj of cues) {
      if (!cueObj || !cueObj.cue) continue;
      const cueName = String(cueObj.cue).trim();
      if (!cueName) continue;

      const wavFile = path.join(SFX_DIR, `${cueName}.wav`);
      let sfxAssetId = seenSfxAssets.get(cueName);
      const wavDurFrames = readWavDurationFrames(wavFile, fps);
      const wavDurAttr = toRationalTime(wavDurFrames, fps);

      if (!sfxAssetId) {
        sfxAssetId = `r_sfx_${sanitizeId(cueName)}`;
        seenSfxAssets.set(cueName, sfxAssetId);
        const wavUrl = pathToFileURL(wavFile).href;
        assetLines.push(
          `    <asset id="${escapeXml(sfxAssetId)}" name="${escapeXml(cueName + ".wav")}" start="0s" duration="${wavDurAttr}" hasVideo="0" hasAudio="1" audioSources="1" audioChannels="1" audioRate="48000">`,
          `      <media-rep kind="original-media" src="${escapeXml(wavUrl)}"/>`,
          `    </asset>`
        );
      }

      const cueFrame = Math.max(0, startFrame + Math.round(Number(cueObj.offsetFrame) || 0));
      const cueOffsetAttr = toRationalTime(cueFrame, fps);
      const vol = cueObj.volume !== undefined ? Number(cueObj.volume) : 0.7;

      sfxCount += 1;
      if (Number.isFinite(vol) && vol > 0 && Math.abs(vol - 1.0) > 0.02) {
        const db = (20 * Math.log10(vol)).toFixed(2);
        sfxClipXml.push(
          `          <asset-clip ref="${escapeXml(sfxAssetId)}" lane="-1" offset="${cueOffsetAttr}" name="${escapeXml(cueName)}" start="0s" duration="${wavDurAttr}" audioRole="effects">`,
          `            <adjust-volume amount="${db}dB"/>`,
          `          </asset-clip>`
        );
      } else {
        sfxClipXml.push(
          `          <asset-clip ref="${escapeXml(sfxAssetId)}" lane="-1" offset="${cueOffsetAttr}" name="${escapeXml(cueName)}" start="0s" duration="${wavDurAttr}" audioRole="effects"/>`
        );
      }
    }
  }

  const projectTitle = plan.title || path.basename(opts.planPath, ".json");
  const xmlLines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!DOCTYPE fcpxml>`,
    `<fcpxml version="1.9">`,
    `  <resources>`,
    `    <format id="r1" name="FFVideoFormat1080p${fps}" frameDuration="${frameDurationAttr}" width="1920" height="1080" colorSpace="1-1-1 (Rec. 709)"/>`,
    ...assetLines,
    `  </resources>`,
    `  <library>`,
    `    <event name="${escapeXml(projectTitle)}">`,
    `      <project name="${escapeXml(projectTitle)}">`,
    `        <sequence format="r1" duration="${timelineDurationAttr}" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">`,
    `          <spine>`,
    `            <asset-clip ref="r_aroll" offset="0s" name="${escapeXml(path.basename(arollPath))}" start="0s" duration="${arollDurationAttr}" format="r1" tcFormat="NDF">`,
    ...overlayClipXml.map((l) => `    ${l}`),
    ...sfxClipXml.map((l) => `    ${l}`),
    `            </asset-clip>`,
    `          </spine>`,
    `        </sequence>`,
    `      </project>`,
    `    </event>`,
    `  </library>`,
    `</fcpxml>`,
    ``,
  ];

  fs.mkdirSync(path.dirname(opts.outPath), { recursive: true });
  fs.writeFileSync(opts.outPath, xmlLines.join("\n"), "utf8");

  console.log(`Exported FCPXML v1.9 -> ${opts.outPath}`);
  console.log(
    `  Timeline : ${timelineFrames} frames @ ${fps}fps (${(timelineFrames / fps).toFixed(2)}s)\n` +
      `  V1/A1    : ${arollPath}\n` +
      `  V2 Clips : ${overlayCount} overlay/cutaway beat(s)\n` +
      `  A2 SFX   : ${sfxCount} synced SFX cue(s) (${seenSfxAssets.size} unique .wav files)`
  );
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
