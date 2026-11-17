#!/usr/bin/env node
/**
 * A-roll preparation pipeline wrapping WinGet/PATH ffmpeg & ffprobe:
 *   1. VFR -> constant frame rate (default 30fps)
 *   2. Optional silence detection & natural padded trimming (--cut-silence)
 *   3. Optional .cube 3D LUT grading + subtle skin-friendly luma sharpening
 *   4. Two-pass EBU R128 loudness normalization (-14 LUFS, -1.0 dBTP)
 *
 * Usage:
 *   node scripts/prep-aroll.mjs <input.mp4> --out <output.mp4> [--lut editorial-warm] [--cut-silence] [--fps 30]
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LUTS_DIR = path.resolve(__dirname, "../luts");

function printUsage() {
  console.log(`Usage:
  node scripts/prep-aroll.mjs <input.mp4> --out <output.mp4> [options]

Options:
  --out <path>           Output MP4 file path (default: <input>.prepped.mp4)
  --lut <name-or-path>   .cube LUT name in studio/luts/ or path to .cube file
  --cut-silence          Detect silences > 0.65s below -34dB and trim with 120ms padding
  --fps <number>         Constant output framerate (default: 30)
  --noise-db <number>    Silence threshold in dB (default: -34)
  --min-silence <sec>    Minimum silence duration in seconds (default: 0.65)
  --pad-ms <ms>          Natural cut padding on each side in ms (default: 120)
  --no-sharpen           Disable subtle luma sharpening
  -h, --help             Show help`);
}

function parseArgs(argv) {
  const opts = {
    input: null,
    out: null,
    lut: null,
    cutSilence: false,
    fps: 30,
    noiseDb: -34,
    minSilence: 0.65,
    padMs: 120,
    sharpen: true,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg === "--out") {
      opts.out = argv[++i];
    } else if (arg === "--lut") {
      opts.lut = argv[++i];
    } else if (arg === "--cut-silence") {
      opts.cutSilence = true;
    } else if (arg === "--no-sharpen") {
      opts.sharpen = false;
    } else if (arg === "--fps") {
      opts.fps = Number(argv[++i]);
    } else if (arg === "--noise-db") {
      opts.noiseDb = Number(argv[++i]);
    } else if (arg === "--min-silence") {
      opts.minSilence = Number(argv[++i]);
    } else if (arg === "--pad-ms") {
      opts.padMs = Number(argv[++i]);
    } else if (!arg.startsWith("-") && !opts.input) {
      opts.input = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.input) {
    throw new Error("Missing required positional argument: <input.mp4>");
  }
  if (!Number.isFinite(opts.fps) || opts.fps <= 0) {
    throw new Error(`Invalid --fps value: ${opts.fps}`);
  }
  return opts;
}

function findExecutableOnPath(name) {
  const locator = process.platform === "win32" ? "where.exe" : "which";
  const res = spawnSync(locator, [name], { encoding: "utf8" });
  if (res.status === 0 && res.stdout) {
    const first = res.stdout.split(/\r?\n/).find((l) => l.trim().length > 0);
    if (first && fs.existsSync(first.trim())) {
      return first.trim();
    }
  }
  return null;
}

function findInDirRecursive(rootDir, targetFile, maxDepth = 4) {
  if (!rootDir || !fs.existsSync(rootDir) || maxDepth < 0) return null;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(rootDir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === targetFile.toLowerCase()) {
      return full;
    }
  }
  if (maxDepth === 0) return null;
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const found = findInDirRecursive(
        path.join(rootDir, entry.name),
        targetFile,
        maxDepth - 1
      );
      if (found) return found;
    }
  }
  return null;
}

function resolveMediaBinaries() {
  const resolveOne = (envKey, exeName) => {
    if (process.env[envKey] && fs.existsSync(process.env[envKey])) {
      return process.env[envKey];
    }
    const onPath = findExecutableOnPath(exeName);
    if (onPath) return onPath;

    if (process.platform === "win32" && process.env.LOCALAPPDATA) {
      const wingetPkgs = path.join(
        process.env.LOCALAPPDATA,
        "Microsoft",
        "WinGet",
        "Packages"
      );
      const found = findInDirRecursive(wingetPkgs, `${exeName}.exe`, 4);
      if (found) return found;
    }
    throw new Error(
      `Could not locate ${exeName}. Add it to PATH, install via WinGet (Gyan.FFmpeg), or set ${envKey}.`
    );
  };

  return {
    ffmpeg: resolveOne("FFMPEG_PATH", "ffmpeg"),
    ffprobe: resolveOne("FFPROBE_PATH", "ffprobe"),
  };
}

function runBin(bin, args, { allowFailure = false } = {}) {
  const res = spawnSync(bin, args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (res.error) throw res.error;
  if (!allowFailure && res.status !== 0) {
    throw new Error(
      `Command failed (${res.status}): ${path.basename(bin)} ${args.join(" ")}\n${res.stderr}`
    );
  }
  return res;
}

function getFfmpegCapabilities(ffmpeg) {
  const res = runBin(ffmpeg, ["-hide_banner", "-h", "full"], {
    allowFailure: true,
  });
  const text = `${res.stdout || ""}\n${res.stderr || ""}`;
  const verRes = runBin(ffmpeg, ["-version"], { allowFailure: true });
  const verMatch = `${verRes.stdout || ""}`.match(/ffmpeg version (\d+)\./i);
  const major = verMatch ? Number(verMatch[1]) : 0;

  return {
    supportsFpsMode: text.includes("-fps_mode") || major >= 6,
    supportsFilterScriptLegacy: text.includes("-filter_complex_script"),
    supportsSlashOption: major >= 7 || !text.includes("-filter_complex_script"),
  };
}

function buildFilterComplexArgs(filterGraph, caps, tag) {
  const cleanGraph = filterGraph.replace(/\r?\n/g, " ");
  if (cleanGraph.length <= 3500) {
    return {
      args: ["-filter_complex", cleanGraph],
      cleanup: () => {},
    };
  }
  const tmpPath = path.join(os.tmpdir(), `aroll-${tag}-${Date.now()}.txt`);
  fs.writeFileSync(tmpPath, filterGraph.replace(/\r\n/g, "\n"), "utf8");
  const flag = caps.supportsFilterScriptLegacy
    ? "-filter_complex_script"
    : "-/filter_complex";
  return {
    args: [flag, tmpPath],
    cleanup: () => fs.rmSync(tmpPath, { force: true }),
  };
}

function resolveLutPath(lutArg) {
  if (!lutArg) return null;
  const candidates = [
    path.resolve(lutArg),
    path.join(LUTS_DIR, lutArg),
    path.join(LUTS_DIR, `${lutArg}.cube`),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return c;
    }
  }
  const available = fs.existsSync(LUTS_DIR)
    ? fs
        .readdirSync(LUTS_DIR)
        .filter((f) => f.endsWith(".cube"))
        .join(", ")
    : "none";
  throw new Error(`LUT not found: "${lutArg}". Available LUTs: ${available}`);
}

function escapeFilterPath(filePath) {
  return filePath
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'");
}

function probeMedia(ffprobe, inputPath) {
  const res = runBin(ffprobe, [
    "-v",
    "error",
    "-show_format",
    "-show_streams",
    "-of",
    "json",
    inputPath,
  ]);
  const info = JSON.parse(res.stdout);
  const videoStream = info.streams?.find((s) => s.codec_type === "video") || null;
  const audioStream = info.streams?.find((s) => s.codec_type === "audio") || null;
  const durationSec = Number(
    info.format?.duration || videoStream?.duration || audioStream?.duration || 0
  );
  return {
    hasVideo: Boolean(videoStream),
    hasAudio: Boolean(audioStream),
    durationSec,
    videoStream,
    audioStream,
  };
}

function detectSpeechIntervals(ffmpeg, inputPath, durationSec, noiseDb, minSilence, padMs) {
  const res = runBin(ffmpeg, [
    "-hide_banner",
    "-i",
    inputPath,
    "-af",
    `silencedetect=noise=${noiseDb}dB:d=${minSilence}`,
    "-vn",
    "-f",
    "null",
    "-",
  ]);
  const log = res.stderr || "";
  const silences = [];
  let currentStart = null;

  for (const line of log.split(/\r?\n/)) {
    const startMatch = line.match(/silence_start:\s*([0-9.]+)/);
    if (startMatch) {
      currentStart = Number(startMatch[1]);
      continue;
    }
    const endMatch = line.match(/silence_end:\s*([0-9.]+)/);
    if (endMatch) {
      const s = currentStart ?? 0;
      const e = Number(endMatch[1]);
      silences.push({ start: s, end: e });
      currentStart = null;
    }
  }
  if (currentStart !== null && durationSec > currentStart) {
    silences.push({ start: currentStart, end: durationSec });
  }

  if (silences.length === 0) {
    return [{ start: 0, end: durationSec }];
  }

  // Build raw speech segments between silences
  const speech = [];
  let cursor = 0;
  for (const sil of silences) {
    if (sil.start > cursor + 0.02) {
      speech.push({ start: cursor, end: sil.start });
    }
    cursor = Math.max(cursor, sil.end);
  }
  if (durationSec > cursor + 0.02) {
    speech.push({ start: cursor, end: durationSec });
  }

  if (speech.length === 0) {
    return [{ start: 0, end: durationSec }];
  }

  // Pad each interval naturally and merge overlaps
  const padSec = padMs / 1000;
  const padded = speech.map((seg) => ({
    start: Math.max(0, Number((seg.start - padSec).toFixed(3))),
    end: Math.min(durationSec, Number((seg.end + padSec).toFixed(3))),
  }));

  const merged = [padded[0]];
  for (let i = 1; i < padded.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = padded[i];
    if (curr.start <= prev.end + 0.02) {
      prev.end = Math.max(prev.end, curr.end);
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

function buildAudioChainForIntervals(intervals) {
  if (!intervals || (intervals.length === 1 && intervals[0].start <= 0.001 && intervals[0].full)) {
    return { audioPrefix: "", audioPad: "[0:a]" };
  }
  if (intervals.length === 1) {
    const { start, end } = intervals[0];
    return {
      audioPrefix: `[0:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[atrim];`,
      audioPad: "[atrim]",
    };
  }
  const n = intervals.length;
  const splitLabels = intervals.map((_, idx) => `[a_in_${idx}]`).join("");
  const trims = intervals.map(
    ({ start, end }, idx) =>
      `[a_in_${idx}]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[a_seg_${idx}];`
  );
  const concatInputs = intervals.map((_, idx) => `[a_seg_${idx}]`).join("");
  return {
    audioPrefix: `[0:a]asplit=${n}${splitLabels};${trims.join("")}${concatInputs}concat=n=${n}:v=0:a=1[atrim];`,
    audioPad: "[atrim]",
  };
}

function measureLoudnorm(ffmpeg, caps, inputPath, intervals) {
  const { audioPrefix, audioPad } = buildAudioChainForIntervals(intervals);
  const filterGraph = `${audioPrefix}${audioPad}loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json[anull]`;

  const fc = buildFilterComplexArgs(filterGraph, caps, "ln");
  try {
    const res = runBin(ffmpeg, [
      "-hide_banner",
      "-i",
      inputPath,
      ...fc.args,
      "-map",
      "[anull]",
      "-vn",
      "-f",
      "null",
      "-",
    ]);
    const stderr = res.stderr || "";
    const jsonMatch = stderr.match(/\{\s*"input_i"\s*:[\s\S]*?\}/);
    if (!jsonMatch) {
      return null;
    }
    return JSON.parse(jsonMatch[0]);
  } finally {
    fc.cleanup();
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(opts.input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const parsedInput = path.parse(inputPath);
  const outPath = opts.out
    ? path.resolve(opts.out)
    : path.join(parsedInput.dir, `${parsedInput.name}.prepped.mp4`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const { ffmpeg, ffprobe } = resolveMediaBinaries();
  const caps = getFfmpegCapabilities(ffmpeg);
  const lutPath = resolveLutPath(opts.lut);
  const media = probeMedia(ffprobe, inputPath);

  if (!media.hasVideo) {
    throw new Error(`Input has no video stream: ${inputPath}`);
  }

  console.log(`FFmpeg: ${ffmpeg}`);
  console.log(
    `Input:  ${inputPath} (${media.durationSec.toFixed(2)}s, audio=${media.hasAudio})`
  );

  let intervals = [{ start: 0, end: media.durationSec, full: true }];
  if (opts.cutSilence && media.hasAudio) {
    const detected = detectSpeechIntervals(
      ffmpeg,
      inputPath,
      media.durationSec,
      opts.noiseDb,
      opts.minSilence,
      opts.padMs
    );
    const totalKept = detected.reduce((acc, s) => acc + (s.end - s.start), 0);
    const isFullSpan =
      detected.length === 1 &&
      detected[0].start <= 0.02 &&
      detected[0].end >= media.durationSec - 0.02;
    if (!isFullSpan) {
      intervals = detected;
      console.log(
        `Silence cut: kept ${intervals.length} segment(s) totaling ${totalKept.toFixed(2)}s ` +
          `(removed ${(media.durationSec - totalKept).toFixed(2)}s)`
      );
    } else {
      console.log("Silence cut: no silences above threshold detected; keeping full timeline.");
    }
  } else if (opts.cutSilence && !media.hasAudio) {
    console.warn("[warn] --cut-silence skipped because input has no audio stream.");
  }

  // Build video filter chain: CFR lock -> optional trim/concat -> LUT -> skin-friendly sharpen -> yuv420p
  const postVideoOps = [];
  if (lutPath) {
    postVideoOps.push(`lut3d=file='${escapeFilterPath(lutPath)}'`);
    console.log(`LUT:    ${path.basename(lutPath)}`);
  }
  if (opts.sharpen) {
    // Luma-only mild crispness (0.35), zero chroma sharpening to keep skin smooth
    postVideoOps.push("unsharp=5:5:0.35:5:5:0.0");
  }
  postVideoOps.push("format=yuv420p");
  const postChain = postVideoOps.join(",");

  const filterParts = [];
  let videoOutPad = "[vout]";

  const isSingleFull =
    intervals.length === 1 && intervals[0].full === true;

  if (isSingleFull) {
    filterParts.push(`[0:v]fps=${opts.fps},${postChain}${videoOutPad}`);
  } else if (intervals.length === 1) {
    const { start, end } = intervals[0];
    filterParts.push(
      `[0:v]fps=${opts.fps},trim=start=${start}:end=${end},setpts=PTS-STARTPTS,${postChain}${videoOutPad}`
    );
  } else {
    const n = intervals.length;
    const vSplit = intervals.map((_, idx) => `[v_in_${idx}]`).join("");
    filterParts.push(`[0:v]fps=${opts.fps},split=${n}${vSplit}`);
    for (let idx = 0; idx < n; idx++) {
      const { start, end } = intervals[idx];
      filterParts.push(
        `[v_in_${idx}]trim=start=${start}:end=${end},setpts=PTS-STARTPTS[v_seg_${idx}]`
      );
    }
    const vConcat = intervals.map((_, idx) => `[v_seg_${idx}]`).join("");
    filterParts.push(`${vConcat}concat=n=${n}:v=1:a=0,${postChain}${videoOutPad}`);
  }

  // Two-pass EBU R128 loudness normalization (-14 LUFS, -1.0 dBTP)
  let hasNormalizedAudio = false;
  if (media.hasAudio) {
    console.log("Pass 1/2: measuring EBU R128 loudness (-14 LUFS / -1.0 dBTP)...");
    const stats = measureLoudnorm(ffmpeg, caps, inputPath, intervals);
    const { audioPrefix, audioPad } = buildAudioChainForIntervals(intervals);

    const inputI = stats ? Number(stats.input_i) : NaN;
    if (stats && Number.isFinite(inputI) && inputI > -70) {
      console.log(
        `Measured: input_i=${stats.input_i} LUFS, input_tp=${stats.input_tp} dBTP, offset=${stats.target_offset} dB`
      );
      const ln = [
        "loudnorm=I=-14",
        "TP=-1.0",
        "LRA=11",
        `measured_I=${stats.input_i}`,
        `measured_TP=${stats.input_tp}`,
        `measured_LRA=${stats.input_lra}`,
        `measured_thresh=${stats.input_thresh}`,
        `offset=${stats.target_offset}`,
        "linear=true",
      ].join(":");
      filterParts.push(`${audioPrefix}${audioPad}${ln}[aout]`.replace(/;;+/g, ";"));
    } else {
      console.warn(
        "[warn] Input audio is silent or unmeasurable; applying single-pass loudnorm fallback."
      );
      filterParts.push(
        `${audioPrefix}${audioPad}loudnorm=I=-14:TP=-1.0:LRA=11[aout]`.replace(
          /;;+/g,
          ";"
        )
      );
    }
    hasNormalizedAudio = true;
  }

  const filterScript = filterParts.join(";\n");
  const fc = buildFilterComplexArgs(filterScript, caps, "fc");

  try {
    const cfrArgs = caps.supportsFpsMode
      ? ["-fps_mode", "cfr", "-r", String(opts.fps)]
      : ["-vsync", "cfr", "-r", String(opts.fps)];

    const ffArgs = [
      "-y",
      "-hide_banner",
      "-i",
      inputPath,
      ...fc.args,
      "-map",
      videoOutPad,
      ...(hasNormalizedAudio ? ["-map", "[aout]"] : []),
      ...cfrArgs,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      ...(hasNormalizedAudio
        ? ["-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
        : ["-an"]),
      "-movflags",
      "+faststart",
      outPath,
    ];

    console.log(`Pass 2/2: encoding CFR ${opts.fps}fps MP4 -> ${outPath}`);
    runBin(ffmpeg, ffArgs);
  } finally {
    fc.cleanup();
  }

  const outMedia = probeMedia(ffprobe, outPath);
  console.log(
    `Done: ${outPath} (duration=${outMedia.durationSec.toFixed(2)}s, ` +
      `fps=${outMedia.videoStream?.r_frame_rate || opts.fps})`
  );
}

main();
