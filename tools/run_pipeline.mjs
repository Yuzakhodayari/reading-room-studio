#!/usr/bin/env node
/**
 * Master one-command YouTube production pipeline runner:
 *   1. studio/scripts/prep-aroll.mjs   -> CFR 30fps + LUT + optional silence cut + -14 LUFS audio
 *   2. tools/.venv/Scripts/python.exe tools/transcribe.py -> words.json + captions.srt
 *   3. studio/scripts/plan-edit.mjs    -> director-plan.json
 *   4. studio/scripts/render-overlays.mjs (only if --render is passed)
 *   5. studio/scripts/export-fcpxml.mjs -> DaVinci Resolve Free timeline.fcpxml
 *
 * Outputs into D:\youtube channel 1\projects\<name>\
 *
 * Usage:
 *   node tools/run_pipeline.mjs <raw-aroll.mp4> [--name my_video] [--script script.md] [--lut editorial-warm] [--cut-silence] [--render] [--codec prores|vp9] [--limit N] [--dry-run]
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const STUDIO_DIR = path.join(REPO_ROOT, "studio");
const PROJECTS_ROOT = path.join(REPO_ROOT, "projects");

const PREP_AROLL = path.join(STUDIO_DIR, "scripts", "prep-aroll.mjs");
const TRANSCRIBE_PY = path.join(REPO_ROOT, "tools", "transcribe.py");
const PLAN_EDIT = path.join(STUDIO_DIR, "scripts", "plan-edit.mjs");
const RENDER_OVERLAYS = path.join(STUDIO_DIR, "scripts", "render-overlays.mjs");
const EXPORT_FCPXML = path.join(STUDIO_DIR, "scripts", "export-fcpxml.mjs");

function resolveVenvPython() {
  const winPy = path.join(REPO_ROOT, "tools", ".venv", "Scripts", "python.exe");
  if (fs.existsSync(winPy)) return winPy;
  const nixPy = path.join(REPO_ROOT, "tools", ".venv", "bin", "python");
  if (fs.existsSync(nixPy)) return nixPy;
  return process.platform === "win32" ? "python" : "python3";
}

function slugify(name) {
  return String(name || "project")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "project";
}

function printUsage() {
  console.log(`Usage:
  node tools/run_pipeline.mjs <raw-aroll.mp4> [options]

Options:
  --name <name>          Project folder name under projects/<name>/ (default: input basename)
  --out-dir <path>       Custom output workspace directory (default: projects/<name>)
  --script <path>        Optional script markdown/text file passed to plan-edit.mjs
  --plan <path>          Reuse an existing director-plan.json (skips plan-edit.mjs)
  --lut <name-or-path>   .cube LUT passed to prep-aroll.mjs (e.g. editorial-warm)
  --cut-silence          Enable silence trimming in prep-aroll.mjs
  --fps <number>         Target timeline FPS (default: 30)
  --whisper-model <size> faster-whisper model (default: small)
  --render               Render overlay/cutaway clips with Remotion (default: skipped)
  --codec <prores|vp9>   Overlay alpha codec when --render is set (default: prores)
  --limit <N>            Limit rendered overlay clips when --render is set
  --skip-prep            Skip prep-aroll.mjs (use <raw-aroll.mp4> directly)
  --skip-transcribe      Skip transcribe.py (reuse existing transcript/words.json)
  --dry-run              Print all planned pipeline steps without executing
  -h, --help             Show help`);
}

function parseArgs(argv) {
  const opts = {
    input: null,
    name: null,
    outDir: null,
    script: null,
    plan: null,
    lut: null,
    cutSilence: false,
    fps: 30,
    whisperModel: "small",
    render: false,
    codec: "prores",
    limit: null,
    skipPrep: false,
    skipTranscribe: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg === "--name") {
      opts.name = argv[++i];
    } else if (arg === "--out-dir") {
      opts.outDir = path.resolve(argv[++i]);
    } else if (arg === "--script") {
      opts.script = path.resolve(argv[++i]);
    } else if (arg === "--plan") {
      opts.plan = path.resolve(argv[++i]);
    } else if (arg === "--lut") {
      opts.lut = argv[++i];
    } else if (arg === "--cut-silence") {
      opts.cutSilence = true;
    } else if (arg === "--fps") {
      opts.fps = Number(argv[++i]);
    } else if (arg === "--whisper-model") {
      opts.whisperModel = argv[++i];
    } else if (arg === "--render") {
      opts.render = true;
    } else if (arg === "--codec") {
      opts.codec = String(argv[++i] || "prores").toLowerCase();
    } else if (arg === "--limit") {
      opts.limit = Number(argv[++i]);
    } else if (arg === "--skip-prep") {
      opts.skipPrep = true;
    } else if (arg === "--skip-transcribe") {
      opts.skipTranscribe = true;
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (!arg.startsWith("-") && !opts.input) {
      opts.input = path.resolve(arg);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.input) {
    throw new Error("Missing required positional argument: <raw-aroll.mp4>");
  }
  return opts;
}

function formatCmd(bin, args) {
  const q = (s) => (/[\s"]/g.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s);
  return [q(bin), ...args.map(q)].join(" ");
}

function runStep(label, bin, args, cwd, dryRun) {
  console.log(`\n==> ${label}`);
  console.log(`    ${formatCmd(bin, args)}`);
  if (dryRun) return;

  const res = spawnSync(bin, args, {
    cwd,
    stdio: "inherit",
  });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    throw new Error(`Step "${label}" failed with exit code ${res.status}`);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.dryRun && !fs.existsSync(opts.input)) {
    throw new Error(`Input A-roll file not found: ${opts.input}`);
  }

  const projectName = slugify(opts.name || path.parse(opts.input).name);
  const projectDir = opts.outDir || path.join(PROJECTS_ROOT, projectName);
  const preppedAroll = opts.skipPrep
    ? opts.input
    : path.join(projectDir, "aroll_prepped.mp4");
  const transcriptDir = path.join(projectDir, "transcript");
  const wordsJson = path.join(transcriptDir, "words.json");
  const directorPlan = opts.plan || path.join(projectDir, "director-plan.json");
  const overlaysDir = path.join(projectDir, "overlays");
  const fcpxmlPath = path.join(projectDir, "timeline.fcpxml");

  console.log(`Project workspace: ${projectDir}`);
  if (!opts.dryRun) {
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(transcriptDir, { recursive: true });
    fs.mkdirSync(overlaysDir, { recursive: true });
  }

  // Step 1: A-roll prep
  if (!opts.skipPrep) {
    const prepArgs = [
      PREP_AROLL,
      opts.input,
      "--out",
      preppedAroll,
      "--fps",
      String(opts.fps),
    ];
    if (opts.lut) prepArgs.push("--lut", opts.lut);
    if (opts.cutSilence) prepArgs.push("--cut-silence");
    runStep("Step 1/5: Prepare A-roll (prep-aroll.mjs)", process.execPath, prepArgs, STUDIO_DIR, opts.dryRun);
  } else {
    console.log(`\n==> Step 1/5: Skipped (--skip-prep), using ${preppedAroll}`);
  }

  // Step 2: Transcription
  if (!opts.skipTranscribe) {
    const pyBin = resolveVenvPython();
    const trArgs = [
      TRANSCRIBE_PY,
      preppedAroll,
      "--out-dir",
      transcriptDir,
      "--model",
      opts.whisperModel,
      "--fps",
      String(opts.fps),
    ];
    runStep("Step 2/5: Transcribe speech (transcribe.py)", pyBin, trArgs, REPO_ROOT, opts.dryRun);
  } else {
    console.log(`\n==> Step 2/5: Skipped (--skip-transcribe), reusing ${wordsJson}`);
  }

  // Step 3: Director edit planning
  if (!opts.plan) {
    if (!opts.dryRun && !fs.existsSync(PLAN_EDIT)) {
      throw new Error(
        `studio/scripts/plan-edit.mjs not found at ${PLAN_EDIT}. Pass --plan <director-plan.json> to reuse an existing plan.`
      );
    }
    const planInput =
      opts.skipTranscribe && opts.script && !fs.existsSync(wordsJson)
        ? opts.script
        : wordsJson;
    const planArgs = [
      PLAN_EDIT,
      planInput,
      "--out",
      directorPlan,
      "--title",
      projectName,
      "--fps",
      String(opts.fps),
    ];
    runStep("Step 3/5: Plan editorial beats (plan-edit.mjs)", process.execPath, planArgs, STUDIO_DIR, opts.dryRun);
  } else {
    console.log(`\n==> Step 3/5: Reusing provided plan ${directorPlan}`);
  }

  // Step 4: Render overlays (optional via --render)
  if (opts.render) {
    const renderArgs = [
      RENDER_OVERLAYS,
      directorPlan,
      "--out-dir",
      overlaysDir,
      "--codec",
      opts.codec,
    ];
    if (opts.limit) renderArgs.push("--limit", String(opts.limit));
    runStep("Step 4/5: Render Remotion overlays (render-overlays.mjs)", process.execPath, renderArgs, STUDIO_DIR, opts.dryRun);
  } else {
    console.log("\n==> Step 4/5: Overlay rendering skipped (pass --render to render ProRes/VP9/MP4 clips)");
  }

  // Step 5: Export DaVinci Resolve .fcpxml
  const fcpxmlArgs = [
    EXPORT_FCPXML,
    directorPlan,
    "--aroll",
    preppedAroll,
    "--overlays-dir",
    overlaysDir,
    "--out",
    fcpxmlPath,
  ];
  runStep("Step 5/5: Export DaVinci Resolve FCPXML (export-fcpxml.mjs)", process.execPath, fcpxmlArgs, STUDIO_DIR, opts.dryRun);

  console.log(`\n${opts.dryRun ? "[dry-run] " : ""}Pipeline complete -> ${fcpxmlPath}`);
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
