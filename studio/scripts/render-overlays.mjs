#!/usr/bin/env node
/**
 * Batch overlay & cutaway renderer for DirectorPlan JSONs.
 *
 * Usage:
 *   node scripts/render-overlays.mjs <director-plan.json> [--out-dir out/overlays] [--codec prores|vp9] [--limit N] [--dry-run]
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STUDIO_DIR = path.resolve(__dirname, "..");
const REMOTION_CLI = path.join(
  STUDIO_DIR,
  "node_modules",
  "@remotion",
  "cli",
  "remotion-cli.js"
);
const DEFAULT_BUNDLE_DIR = path.join(STUDIO_DIR, "out", ".bundle");

function printUsage() {
  console.log(`Usage:
  node scripts/render-overlays.mjs <director-plan.json> [options]

Options:
  --out-dir <dir>    Output directory for rendered clips & overlay-manifest.json (default: out/overlays)
  --codec <codec>    Transparent overlay codec: prores | vp9 (default: prores)
  --limit <N>        Render at most N non-talking-head beats
  --dry-run          Print exact Remotion render commands without executing
  -h, --help         Show help`);
}

function parseArgs(argv) {
  const opts = {
    planPath: null,
    outDir: path.join(STUDIO_DIR, "out", "overlays"),
    codec: "prores",
    limit: null,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg === "--out-dir") {
      opts.outDir = path.resolve(argv[++i]);
    } else if (arg === "--codec") {
      const val = String(argv[++i] || "").toLowerCase();
      if (val !== "prores" && val !== "vp9") {
        throw new Error(`Invalid --codec "${val}". Supported values: prores, vp9`);
      }
      opts.codec = val;
    } else if (arg === "--limit") {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`Invalid --limit value: ${n}`);
      }
      opts.limit = n;
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
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

function sanitizeId(raw) {
  return String(raw || "beat").replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function resolveRemotionRenderArgs(bundleDir, compId, outPath, propsPath, codecArgs) {
  return [
    REMOTION_CLI,
    "render",
    bundleDir,
    compId,
    outPath,
    `--props=${propsPath}`,
    ...codecArgs,
  ];
}

function formatCmdForLog(bin, args) {
  const q = (s) => (/[\s"]/g.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s);
  return [q(bin), ...args.map(q)].join(" ");
}

function runRemotionCli(args, label) {
  const res = spawnSync(process.execPath, args, {
    cwd: STUDIO_DIR,
    stdio: "inherit",
    shell: false,
  });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    throw new Error(`${label} failed (exit ${res.status})`);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(opts.planPath)) {
    throw new Error(`Director plan file not found: ${opts.planPath}`);
  }
  if (!fs.existsSync(REMOTION_CLI)) {
    throw new Error(`Remotion CLI script not found: ${REMOTION_CLI}`);
  }

  const rawJson = fs.readFileSync(opts.planPath, "utf8").replace(/^\uFEFF/, "");
  const plan = JSON.parse(rawJson);
  const allBeats = Array.isArray(plan.beats) ? plan.beats : [];
  const renderBeatsAll = allBeats.filter((b) => b.framing !== "talking-head-full");
  const renderBeats = opts.limit ? renderBeatsAll.slice(0, opts.limit) : renderBeatsAll;

  console.log(
    `Plan: "${plan.title || path.basename(opts.planPath)}" (${allBeats.length} total beats, ` +
      `${renderBeatsAll.length} graphic/cutaway beats, rendering ${renderBeats.length})`
  );
  console.log(`Out : ${opts.outDir} (overlay codec=${opts.codec}, dryRun=${opts.dryRun})`);

  const propsDir = path.join(opts.outDir, ".props");
  const bundleDir = DEFAULT_BUNDLE_DIR;
  const bundleArgs = [
    REMOTION_CLI,
    "bundle",
    "src/index.ts",
    "--out-dir",
    bundleDir,
    "--quiet",
  ];

  if (!opts.dryRun) {
    fs.mkdirSync(opts.outDir, { recursive: true });
    fs.mkdirSync(propsDir, { recursive: true });
    if (renderBeats.length > 0) {
      fs.mkdirSync(path.dirname(bundleDir), { recursive: true });
      console.log(`Pre-bundling src/index.ts -> ${bundleDir}...`);
      runRemotionCli(bundleArgs, "Remotion pre-bundle");
    }
  } else {
    console.log(`[dry-run] Pre-bundle: ${formatCmdForLog(process.execPath, bundleArgs)}`);
  }

  const clips = [];
  const byBeatId = {};

  for (const beat of renderBeats) {
    const safeId = sanitizeId(beat.id);
    const isFullscreen = beat.framing === "fullscreen-cutaway";
    const previewMode = isFullscreen ? "light-editorial" : "transparent";

    let ext = ".mov";
    let codecName = opts.codec;
    let codecArgs = [
      "--codec=prores",
      "--prores-profile=4444",
      "--image-format=png",
      "--pixel-format=yuva444p10le",
    ];

    if (isFullscreen) {
      ext = ".mp4";
      codecName = "h264";
      codecArgs = ["--codec=h264", "--crf=14"];
    } else if (opts.codec === "vp9") {
      ext = ".webm";
      codecName = "vp9";
      codecArgs = [
        "--codec=vp9",
        "--image-format=png",
        "--pixel-format=yuva420p",
      ];
    }

    const fileName = `${safeId}${ext}`;
    const outClipPath = path.join(opts.outDir, fileName);
    const propsPath = path.join(propsDir, `${safeId}.props.json`);
    const payload = {
      beat,
      previewMode,
      renderAudio: true,
    };

    const durationFrames = Math.max(
      1,
      (beat.endFrame ?? 0) - (beat.startFrame ?? 0) ||
        Math.round((beat.durationSec || 5) * (plan.fps || 30))
    );

    const cliArgs = resolveRemotionRenderArgs(
      bundleDir,
      "DirectorBeat",
      outClipPath,
      propsPath,
      codecArgs
    );

    if (opts.dryRun) {
      console.log(
        `[dry-run] ${beat.id} (${beat.framing}, ${previewMode}, ${durationFrames}f) -> ${fileName}`
      );
      console.log(`          ${formatCmdForLog(process.execPath, cliArgs)}`);
    } else {
      fs.writeFileSync(propsPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
      console.log(
        `Rendering ${beat.id} (${beat.framing}, ${previewMode}, ${durationFrames}f) -> ${fileName}...`
      );
      runRemotionCli(cliArgs, `Remotion render for beat "${beat.id}"`);
    }

    clips.push({
      beatId: beat.id,
      startFrame: beat.startFrame ?? 0,
      endFrame: beat.endFrame ?? (beat.startFrame ?? 0) + durationFrames,
      durationFrames,
      framing: beat.framing,
      styleFamily: beat.styleFamily,
      componentHint: beat.componentHint,
      previewMode,
      codec: codecName,
      fileName,
      path: outClipPath,
      rendered: !opts.dryRun,
    });
    byBeatId[beat.id] = outClipPath;
  }

  const manifestPath = path.join(opts.outDir, "overlay-manifest.json");
  const manifest = {
    generatedAt: new Date().toISOString(),
    planPath: opts.planPath,
    title: plan.title || path.basename(opts.planPath, ".json"),
    fps: plan.fps || 30,
    outDir: opts.outDir,
    codec: opts.codec,
    dryRun: opts.dryRun,
    clips,
    byBeatId,
  };

  if (opts.dryRun) {
    console.log(`\n[dry-run] Planned overlay manifest (${clips.length} clips): ${manifestPath}`);
  } else {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    console.log(`\nOverlay manifest written: ${manifestPath} (${clips.length} clips)`);
  }
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
