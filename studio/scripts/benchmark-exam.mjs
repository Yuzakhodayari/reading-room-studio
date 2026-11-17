#!/usr/bin/env node
/**
 * Hard Benchmark & Exam Suite — Expanded Node/Remotion Pillar Exams (Exams 1, 2, 3, 4, 6)
 *
 * Covers:
 *   - Exam 1: 100% tuple audit (componentHint + motionAction + alias maps + fullCanvas ObjectAnimator)
 *             + 28 real PNG stills covering all 24/24 STYLE_CATALOG styles, 6/6 LiquidGlassPresets,
 *             and PJM + Ireland MapExplainer variants.
 *   - Exam 2: All 57 motion primitives (including dur=0 safety) + resolveLayerLifecycle holds.
 *   - Exam 3: readingDuration, KineticText (7 modes + empty typewriter + short 20w word-pop),
 *             DataTicker, EditorialHeadline, SourceBadge, MusicBed.computeMusicBedVolume,
 *             and `npm run lint` (`eslint src && tsc`).
 *   - Exam 4: sample-director-plan.json (250 beats) retention audit + 3 adversarial stress runs.
 *   - Exam 6: Pre-bundled 90-frame render speed benchmark (H.264 CRF 14, VP9 yuva420p, ProRes 4444 yuva444p10le).
 */

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  STYLE_CATALOG,
} from "./plan-edit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STUDIO_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(STUDIO_DIR, "src");
const OUT_DIR = path.join(STUDIO_DIR, "out");
const BENCH_DIR = path.join(OUT_DIR, "benchmark");
const STILLS_DIR = path.join(BENCH_DIR, "stills");
const COMPILED_DIR = path.join(BENCH_DIR, ".compiled");
const ADV_DIR = path.join(BENCH_DIR, "adversarial");
const SPEED_DIR = path.join(BENCH_DIR, "speed");
const BUNDLE_DIR = path.join(BENCH_DIR, "bundle");
const REMOTION_CLI = path.join(STUDIO_DIR, "node_modules", "@remotion", "cli", "remotion-cli.js");

const require = createRequire(import.meta.url);
const esbuild = require(path.join(STUDIO_DIR, "node_modules", "esbuild"));

function ensureDirs() {
  for (const dir of [BENCH_DIR, STILLS_DIR, COMPILED_DIR, ADV_DIR, SPEED_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function findMediaBinary(name) {
  const probeCmd = process.platform === "win32" ? "where.exe" : "which";
  const res = spawnSync(probeCmd, [name], { encoding: "utf8" });
  if (res.status === 0 && res.stdout) {
    const first = res.stdout.split(/\r?\n/).find((l) => l.trim().length > 0);
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
          if (ent.isFile() && ent.name.toLowerCase() === `${name}.exe`) {
            return full;
          }
          if (ent.isDirectory() && depth < 5) {
            stack.push({ dir: full, depth: depth + 1 });
          }
        }
      }
    }
  }
  return null;
}

function runCmd(cmd, args, cwd = STUDIO_DIR, timeoutMs = 600_000) {
  const t0 = performance.now();
  let actualCmd = cmd;
  let actualArgs = args;

  if (cmd === "npx" && args[0] === "remotion") {
    actualCmd = process.execPath;
    actualArgs = [REMOTION_CLI, ...args.slice(1)];
  } else if (cmd === "npx" && args[0] === "eslint") {
    actualCmd = process.execPath;
    actualArgs = [path.join(STUDIO_DIR, "node_modules", "eslint", "bin", "eslint.js"), ...args.slice(1)];
  } else if (cmd === "npx" && args[0] === "tsc") {
    actualCmd = process.execPath;
    actualArgs = [path.join(STUDIO_DIR, "node_modules", "typescript", "bin", "tsc"), ...args.slice(1)];
  }

  const res = spawnSync(actualCmd, actualArgs, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    shell: false,
    timeout: timeoutMs,
  });
  const wallSec = (performance.now() - t0) / 1000;
  return {
    status: res.status ?? -1,
    stdout: res.stdout || "",
    stderr: res.stderr || "",
    error: res.error ? String(res.error) : null,
    wallSec: Number(wallSec.toFixed(3)),
  };
}

async function compileTsHarness() {
  // 1. Pure motion, choreography, and planner bundle
  const motionEntry = path.join(COMPILED_DIR, "_motion_entry.ts");
  fs.writeFileSync(
    motionEntry,
    [
      `export * from ${JSON.stringify(path.join(SRC_DIR, "motion", "primitives.ts"))};`,
      `export * from ${JSON.stringify(path.join(SRC_DIR, "design", "choreography.ts"))};`,
      `export * from ${JSON.stringify(path.join(SRC_DIR, "director", "planner.ts"))};`,
    ].join("\n"),
    "utf8"
  );

  const motionOut = path.join(COMPILED_DIR, "motion_bundle.mjs");
  await esbuild.build({
    entryPoints: [motionEntry],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: motionOut,
    logLevel: "silent",
    banner: {
      js: `import { createRequire } from "node:module"; const require = createRequire(import.meta.url);`,
    },
  });

  // 2. React SSR harness for KineticText, DataTicker, EditorialHeadline, SourceBadge, MusicBed
  const componentsEntry = path.join(COMPILED_DIR, "_components_entry.tsx");
  fs.writeFileSync(
    componentsEntry,
    [
      `import React from "react";`,
      `import { renderToStaticMarkup } from "react-dom/server";`,
      `import { KineticText } from ${JSON.stringify(path.join(SRC_DIR, "typography", "KineticText.tsx"))};`,
      `import { DataTicker } from ${JSON.stringify(path.join(SRC_DIR, "typography", "DataTicker.tsx"))};`,
      `import { EditorialHeadline } from ${JSON.stringify(path.join(SRC_DIR, "typography", "EditorialHeadline.tsx"))};`,
      `import { SourceBadge } from ${JSON.stringify(path.join(SRC_DIR, "components", "SourceBadge.tsx"))};`,
      `export { computeMusicBedVolume } from ${JSON.stringify(path.join(SRC_DIR, "components", "MusicBed.tsx"))};`,
      `export function setTestFrame(frame: number, fps = 30) {`,
      `  (globalThis as any).__REMOTION_TEST_FRAME__ = frame;`,
      `  (globalThis as any).__REMOTION_TEST_FPS__ = fps;`,
      `}`,
      `export function renderKineticHtml(props: any, frame = 0, fps = 30): string {`,
      `  setTestFrame(frame, fps);`,
      `  return renderToStaticMarkup(React.createElement(KineticText, props));`,
      `}`,
      `export function renderDataTickerHtml(props: any, frame = 0, fps = 30): string {`,
      `  setTestFrame(frame, fps);`,
      `  return renderToStaticMarkup(React.createElement(DataTicker, props));`,
      `}`,
      `export function renderHeadlineHtml(props: any, frame = 0, fps = 30): string {`,
      `  setTestFrame(frame, fps);`,
      `  return renderToStaticMarkup(React.createElement(EditorialHeadline, props));`,
      `}`,
      `export function renderSourceBadgeHtml(props: any, frame = 30, fps = 30): string {`,
      `  setTestFrame(frame, fps);`,
      `  return renderToStaticMarkup(React.createElement(SourceBadge, props));`,
      `}`,
    ].join("\n"),
    "utf8"
  );

  const remotionShimPlugin = {
    name: "remotion-ssr-shim",
    setup(build) {
      build.onResolve({ filter: /^remotion$/ }, () => ({
        path: "remotion-shim",
        namespace: "remotion-shim",
      }));
      build.onLoad({ filter: /.*/, namespace: "remotion-shim" }, () => {
        const realRemotionPath = path
          .join(STUDIO_DIR, "node_modules", "remotion", "dist", "cjs", "index.js")
          .replace(/\\/g, "/");
        return {
          contents: `
            const real = require(${JSON.stringify(realRemotionPath)});
            export const interpolate = real.interpolate;
            export const spring = real.spring;
            export const Easing = real.Easing;
            export const staticFile = (p) => "/public/" + p;
            export const delayRender = () => 0;
            export const continueRender = () => {};
            export const cancelRender = () => {};
            export const getRemotionEnvironment = () => ({ isRendering: false, isStudio: false, isPlayer: false });
            export const useCurrentFrame = () => globalThis.__REMOTION_TEST_FRAME__ ?? 0;
            export const useVideoConfig = () => ({
              fps: globalThis.__REMOTION_TEST_FPS__ ?? 30,
              width: 1920,
              height: 1080,
              durationInFrames: 150,
              id: "test",
            });
          `,
          resolveDir: STUDIO_DIR,
          loader: "js",
        };
      });
      build.onResolve({ filter: /^@remotion\/media$/ }, () => ({
        path: "remotion-media-shim",
        namespace: "remotion-media-shim",
      }));
      build.onLoad({ filter: /.*/, namespace: "remotion-media-shim" }, () => ({
        contents: `
          import React from "react";
          export const Audio = (props) => React.createElement("audio", { "data-src": props.src, "data-from": props.from });
          export const Video = (props) => React.createElement("video", { "data-src": props.src });
        `,
        resolveDir: STUDIO_DIR,
        loader: "js",
      }));
    },
  };

  const componentsOut = path.join(COMPILED_DIR, "components_bundle.mjs");
  await esbuild.build({
    entryPoints: [componentsEntry],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: componentsOut,
    plugins: [remotionShimPlugin],
    logLevel: "silent",
    banner: {
      js: `import { createRequire } from "node:module"; const require = createRequire(import.meta.url);`,
    },
  });

  const motionMod = await import(pathToFileURL(motionOut).href + `?t=${Date.now()}`);
  const compMod = await import(pathToFileURL(componentsOut).href + `?t=${Date.now()}`);
  return { motionMod, compMod };
}

function validateCssString(val, propName) {
  if (val === undefined) return null;
  if (typeof val === "number") {
    if (!Number.isFinite(val)) return `${propName} is non-finite number: ${val}`;
    return null;
  }
  if (typeof val !== "string") return `${propName} unexpected type: ${typeof val}`;
  if (/\bNaN\b|\bInfinity\b|\bundefined\b|\bnull\b/i.test(val)) {
    return `${propName} contains invalid token: "${val}"`;
  }
  let depth = 0;
  for (const ch of val) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth < 0) return `${propName} has unbalanced parens: "${val}"`;
  }
  if (depth !== 0) return `${propName} has unclosed parens: "${val}"`;
  return null;
}

function parseRendererAliasKeys(rendererSrc, mapName) {
  const re = new RegExp(`const ${mapName}:[^=]+=\\s*\\{([\\s\\S]*?)\\};`);
  const m = rendererSrc.match(re);
  const out = new Set();
  if (!m) return out;
  for (const entry of m[1].matchAll(/(?:"([^"]+)"|([A-Za-z0-9_-]+))\s*:/g)) {
    out.add(entry[1] || entry[2]);
  }
  return out;
}

// ============================================================================
// EXAM 1: Integration & 28-Still Pixel/Alpha Render Exam (24/24 Styles)
// ============================================================================
function runExam1Audit(motionMod, skipRenders = false) {
  console.log("\n=== EXAM 1: DirectorBeatRenderer vs plan-edit.mjs (24/24 Styles) ===");
  const samplePlanPath = path.join(OUT_DIR, "sample-director-plan.json");
  const rendererPath = path.join(SRC_DIR, "compositions", "DirectorBeatRenderer.tsx");
  const samplePlan = JSON.parse(fs.readFileSync(samplePlanPath, "utf8"));
  const rendererSrc = fs.readFileSync(rendererPath, "utf8");

  const normMap = {};
  const mapBlockMatch = rendererSrc.match(
    /function normalizeComponentHint[\s\S]*?const map: Record<string, string> = \{([\s\S]*?)\};/
  );
  if (mapBlockMatch) {
    for (const m of mapBlockMatch[1].matchAll(/(?:"([^"]+)"|([A-Za-z0-9_-]+))\s*:\s*"([^"]+)"/g)) {
      const k = m[1] || m[2];
      normMap[k] = m[3];
    }
  }

  const explicitHints = new Set();
  for (const m of rendererSrc.matchAll(/hint === "([^"]+)"/g)) {
    explicitHints.add(m[1]);
  }

  const entryAliasKeys = parseRendererAliasKeys(rendererSrc, "entryAliasMap");
  const inPlaceAliasKeys = parseRendererAliasKeys(rendererSrc, "inPlaceAliasMap");
  const exitAliasKeys = parseRendererAliasKeys(rendererSrc, "exitAliasMap");
  const fullCanvasUsesAnimator =
    /slot\.fullCanvas\s*\?\s*\(\s*<ObjectAnimator/.test(rendererSrc);

  // Unique (styleFamily, componentHint, glassPreset, motionAction) tuples
  const tupleMap = new Map();
  for (const beat of samplePlan.beats) {
    const key = JSON.stringify({
      styleFamily: beat.styleFamily,
      componentHint: beat.componentHint,
      glassPreset: beat.glassPreset ?? null,
      motionAction: beat.motionAction,
    });
    if (!tupleMap.has(key)) {
      tupleMap.set(key, {
        styleFamily: beat.styleFamily,
        componentHint: beat.componentHint,
        glassPreset: beat.glassPreset ?? null,
        motionAction: beat.motionAction,
        count: 0,
      });
    }
    tupleMap.get(key).count += 1;
  }

  const uniqueTuples = [...tupleMap.values()];
  let resolvedHintCount = 0;
  const unresolvedHintTuples = [];
  let totalTokens = 0;
  let recognizedPrimitives = 0;
  let recognizedWithAliases = 0;
  const unresolvedAfterAlias = {};

  for (const t of uniqueTuples) {
    const raw = (t.glassPreset || t.componentHint || "GlassCard").trim();
    const normalized = normMap[raw] ?? raw;
    if (explicitHints.has(normalized)) {
      resolvedHintCount += 1;
    } else {
      unresolvedHintTuples.push({ ...t, normalizedHint: normalized });
    }

    const tokens = String(t.motionAction || "")
      .split("->")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const tok of tokens) {
      totalTokens += 1;
      const inPrimitives =
        motionMod.isEntryAction(tok) ||
        motionMod.isInPlaceAction(tok) ||
        motionMod.isExitAction(tok);
      const inAlias =
        entryAliasKeys.has(tok) || inPlaceAliasKeys.has(tok) || exitAliasKeys.has(tok);
      if (inPrimitives) recognizedPrimitives += 1;
      if (inPrimitives || inAlias) {
        recognizedWithAliases += 1;
      } else {
        unresolvedAfterAlias[tok] = (unresolvedAfterAlias[tok] || 0) + t.count;
      }
    }
  }

  const catalogAudit = STYLE_CATALOG.map((rec) => {
    const raw = (rec.glassPreset || rec.componentHint).trim();
    const normalized = normMap[raw] ?? raw;
    return {
      id: rec.id,
      componentHint: rec.componentHint,
      normalizedHint: normalized,
      explicitlyHandled: explicitHints.has(normalized),
    };
  });

  // Casing / integration / Dual-Palette bug checks
  const primitivesSrc = fs.readFileSync(path.join(SRC_DIR, "motion", "primitives.ts"), "utf8");
  const bugs = {
    spyTitlesWrongCasing: rendererSrc.includes('beat.styleFamily === "spyTitles"'),
    defaultBeatWrongCasing: rendererSrc.includes('styleFamily: "liquidGlass"'),
    sourceBadgeUnnormalized:
      rendererSrc.includes("beat.glassPreset || beat.componentHint") &&
      rendererSrc.includes('!["GlassCard", "GlassSplitModal", "NewsPackageLowerThird"].includes'),
    sourceBadgeUsesNormalizedHint: rendererSrc.includes("].includes(normalizedHint)"),
    fullCanvasWrappedInObjectAnimator: fullCanvasUsesAnimator,
    rendererHasPaletteMode: rendererSrc.includes("paletteMode"),
    noWhiteStrobeInPrimitives: !primitivesSrc.includes("1 + (1 - p / 0.3) * 2.2"),
  };
  const paletteModeCount = samplePlan.beats.filter(
    (b) => b.paletteMode === "page" || b.paletteMode === "over-footage"
  ).length;

  // Render 28 stills covering all 24/24 STYLE_CATALOG styles, 6/6 LiquidGlassPresets, PJM + Ireland Map
  const mkBeat = (id, styleFamily, componentHint, framing, spokenText, opts = {}) => ({
    id,
    startFrame: 0,
    endFrame: 90,
    durationSec: 3,
    category: opts.category || "receipt-proof",
    spokenText,
    framing,
    ...(opts.paletteMode ? { paletteMode: opts.paletteMode } : {}),
    styleFamily,
    componentHint,
    motionAction: opts.motionAction || "slide-left -> glow-rim -> fade-blur-out",
    ...(opts.glassPreset ? { glassPreset: opts.glassPreset } : {}),
    typographyMode: opts.typographyMode || "marker-sweep",
    sfxCues: [],
    musicEnergy: opts.musicEnergy || "calm",
    cutReason: "Expanded Exam 1 still",
    ...(opts.sourceCitation ? { sourceCitation: opts.sourceCitation } : {}),
  });

  const stillSpecs = [
    // 6 Liquid Glass presets (transparent)
    {
      name: "01_GlassCard_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s01",
        "liquid-glass",
        "LiquidGlassObject:card",
        "talking-head-with-glass",
        "Individual paychecks supply 84.1% of federal receipts while corporate taxes fell to 7%.",
        { glassPreset: "card", sourceCitation: "U.S. Treasury — Monthly Treasury Statement, Table 9" }
      ),
    },
    {
      name: "02_GlassCornerPill_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s02",
        "liquid-glass",
        "LiquidGlassObject:card",
        "talking-head-with-glass",
        "Remember that $40.5 trillion cliff waiting in 2036.",
        { category: "open-loop", glassPreset: "pill" }
      ),
    },
    {
      name: "03_GlassBottomDock_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s03",
        "liquid-glass",
        "LiquidGlassObject:dock",
        "talking-head-with-glass",
        "Three escape hatches stand between paychecks and a 2036 debt reset.",
        { category: "thesis-promise", glassPreset: "dock" }
      ),
    },
    {
      name: "04_GlassFloatingToolbar_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s04",
        "liquid-glass",
        "LiquidGlassObject:toolbar",
        "talking-head-with-glass",
        "Compare baseline 84.1% payroll share against 2036 automation curves.",
        { category: "thesis-promise", glassPreset: "toolbar" }
      ),
    },
    {
      name: "05_GlassToastAlert_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s05",
        "liquid-glass",
        "LiquidGlassObject:toast",
        "talking-head-punch-in",
        "PJM capacity auction prices jumped 833% in a single year.",
        { category: "warning-escalation", glassPreset: "toast" }
      ),
    },
    {
      name: "06_GlassSplitModal_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s06",
        "liquid-glass",
        "LiquidGlassObject:card",
        "talking-head-with-glass",
        "Claire owes $3,400 monthly mortgage while AI wages fall by 42%.",
        { category: "claire-ledger", glassPreset: "split-modal", sourceCitation: "Federal Reserve Household Ledger" }
      ),
    },
    // Doc & Broadcast (8 styles)
    {
      name: "07_VisualInvestigationBoard",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s07",
        "doc-broadcast",
        "VisualInvestigationBoard",
        "fullscreen-cutaway",
        "PJM capacity prices spiked 833% to $269.92 per megawatt-day before 2036.",
        { category: "warning-escalation", sourceCitation: "PJM Interconnection Auction" }
      ),
    },
    {
      name: "08_ArchiveLightTable",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s08",
        "doc-broadcast",
        "ArchiveLightTable",
        "fullscreen-cutaway",
        "Table 9 shows individual income and payroll receipts at $4.1T.",
        { sourceCitation: "U.S. Treasury Table 9" }
      ),
    },
    {
      name: "09_TelestratorOverlay_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s09",
        "doc-broadcast",
        "TelestratorOverlay",
        "split-screen",
        "Look at the 84.1% wedge carrying the entire federal budget."
      ),
    },
    {
      name: "10_LiveCountdownSplit",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s10",
        "doc-broadcast",
        "LiveCountdownSplit",
        "split-screen",
        "Ten years from 2026 to the 2036 debt-deflation collision.",
        { category: "warning-escalation" }
      ),
    },
    {
      name: "19_NewsPackageLowerThird_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s19",
        "doc-broadcast",
        "NewsPackageLowerThird",
        "talking-head-with-glass",
        "Congressional Budget Office projects mandatory spending crowds out revenue.",
        { sourceCitation: "CBO Budget Projections" }
      ),
    },
    {
      name: "20_CaptionNewsCard",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s20",
        "doc-broadcast",
        "CaptionNewsCard",
        "fullscreen-cutaway",
        "Meta and Microsoft doubled capital spending while free cash flow narrowed.",
        { sourceCitation: "SEC 10-K Filings" }
      ),
    },
    {
      name: "21_KinoMontageStrip",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s21",
        "doc-broadcast",
        "KinoMontageStrip",
        "fullscreen-cutaway",
        "Over 84 percent of taxes come from paychecks like yours.",
        { category: "hook", sourceCitation: "U.S. Treasury Table 9" }
      ),
    },
    {
      name: "22_CitySymphonyFrame",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s22",
        "doc-broadcast",
        "CitySymphonyFrame",
        "fullscreen-cutaway",
        "Data centers reshape municipal grids from Virginia to Oregon.",
        { category: "map-geopolitics" }
      ),
    },
    // Vintage Editorial (5 styles)
    {
      name: "11_Newsreel1920s",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s11",
        "vintage-editorial",
        "Newsreel1920s",
        "fullscreen-cutaway",
        "In 1933 Irving Fisher warned that debt deflation amplifies every drop in pay.",
        { category: "history-archive", sourceCitation: "Irving Fisher (1933)" }
      ),
    },
    {
      name: "12_SpyTitleSequence",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s12",
        "vintage-editorial",
        "SpyTitleSequence",
        "fullscreen-cutaway",
        "Wielechowski v. State redrew Alaska Permanent Fund payout claims in 2016.",
        { category: "history-archive", sourceCitation: "Wielechowski v. State (2016)" }
      ),
    },
    {
      name: "13_CollageCutout_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s13",
        "vintage-editorial",
        "CollageCutout",
        "talking-head-with-glass",
        "Try forwarding a compute token to your landlord on the first.",
        { category: "good-work-punchline" }
      ),
    },
    {
      name: "23_SilentFilmCard",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s23",
        "vintage-editorial",
        "SilentFilmCard",
        "fullscreen-cutaway",
        "Company scrip paid miners in tokens valid only at the company store.",
        { category: "history-archive", sourceCitation: "Fair Labor Standards Act (1938)" }
      ),
    },
    {
      name: "24_StainedGlassFrame",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s24",
        "vintage-editorial",
        "StainedGlassFrame",
        "split-screen",
        "Three escape hatches decide who holds bargaining power in 2036.",
        { category: "thesis-promise" }
      ),
    },
    // Diagram & Metaphor (4 styles)
    {
      name: "14_StickerCutout_StickFigureStage_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s14",
        "diagram-metaphor",
        "StickFigureStage",
        "talking-head-punch-in",
        "Claire cannot refinance a thirty-year mortgage when paychecks vanish.",
        { category: "claire-ledger" }
      ),
    },
    {
      name: "14b_StickerCutout_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s14b",
        "diagram-metaphor",
        "StickerCutout",
        "talking-head-punch-in",
        "Robots do not pay income tax on a balance sheet.",
        { category: "good-work-punchline" }
      ),
    },
    {
      name: "15_InstructionManualCard_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s15",
        "diagram-metaphor",
        "InstructionManualCard",
        "talking-head-with-glass",
        "Step 1: Tax compute tokens directly before payroll shrinks.",
        { category: "thesis-promise" }
      ),
    },
    {
      name: "25_IsometricScene",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s25",
        "diagram-metaphor",
        "IsometricScene",
        "fullscreen-cutaway",
        "Think of a phone charger plugged into a house with failing copper wiring.",
        { category: "metaphor-story" }
      ),
    },
    // Data, Maps & 3D (4 styles + Ireland Map variant)
    {
      name: "16_MapExplainer_PJM",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s16",
        "data-maps-3d",
        "MapExplainer",
        "fullscreen-cutaway",
        "Thirteen states on the PJM grid face data-center power bottlenecks.",
        { category: "map-geopolitics", sourceCitation: "PJM Interconnection" }
      ),
    },
    {
      name: "16b_MapExplainer_Ireland",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s16b",
        "data-maps-3d",
        "MapExplainer",
        "fullscreen-cutaway",
        "In Ireland, data centers already consume 21 percent of all metered electricity.",
        { category: "map-geopolitics", sourceCitation: "CSO Ireland" }
      ),
    },
    {
      name: "26_DataPhysicalCard",
      previewMode: "light-editorial",
      beat: mkBeat(
        "s26",
        "data-maps-3d",
        "DataPhysicalCard",
        "fullscreen-cutaway",
        "Paychecks deliver 84.1% of federal taxes compared to 7% corporate income.",
        { sourceCitation: "U.S. Treasury Table 9" }
      ),
    },
    {
      name: "17_WhiteModel3D_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s17",
        "data-maps-3d",
        "WhiteModel3D",
        "talking-head-with-glass",
        "Hyperscale power plants and transformers take seven years to build.",
        { category: "metaphor-story" }
      ),
    },
    {
      name: "18_BlobSimulation_transparent",
      previewMode: "transparent",
      beat: mkBeat(
        "s18",
        "data-maps-3d",
        "BlobSimulation",
        "talking-head-with-glass",
        "Grid capacity chokes as compute demand surges past baseload supply.",
        { category: "warning-escalation" }
      ),
    },
  ];

  let bundleWallSec = 0;
  const stillResults = [];
  if (!skipRenders) {
    console.log(`Pre-bundling src/index.ts -> ${BUNDLE_DIR}`);
    const bundleRes = runCmd("npx", [
      "remotion",
      "bundle",
      "src/index.ts",
      "--out-dir",
      BUNDLE_DIR,
      "--quiet",
    ]);
    bundleWallSec = bundleRes.wallSec;
    if (bundleRes.status !== 0) {
      throw new Error(`Remotion bundle failed: ${bundleRes.stderr}`);
    }

    for (const spec of stillSpecs) {
      const propsPath = path.join(STILLS_DIR, `${spec.name}.props.json`);
      const outPng = path.join(STILLS_DIR, `${spec.name}.png`);
      fs.writeFileSync(
        propsPath,
        JSON.stringify(
          {
            beat: spec.beat,
            previewMode: spec.previewMode,
            renderAudio: false,
          },
          null,
          2
        ),
        "utf8"
      );
      console.log(`  Rendering still: ${spec.name}.png (${spec.previewMode})...`);
      const res = runCmd("npx", [
        "remotion",
        "still",
        BUNDLE_DIR,
        "DirectorBeat",
        outPng,
        `--props=${propsPath}`,
        "--frame=45",
        "--image-format=png",
      ]);
      stillResults.push({
        name: spec.name,
        componentHint: spec.beat.componentHint,
        glassPreset: spec.beat.glassPreset ?? null,
        styleFamily: spec.beat.styleFamily,
        previewMode: spec.previewMode,
        expectAlpha: spec.previewMode === "transparent",
        expectGlassSemiAlpha: spec.beat.styleFamily === "liquid-glass",
        pngPath: outPng,
        exitCode: res.status,
        wallSec: res.wallSec,
        error: res.status !== 0 ? res.stderr.slice(-500) : null,
      });
    }

    // Dual-Palette comparison stills (Page + Over Footage over dark & bright rooms)
    const dualSpecs = [
      {
        name: "treasury-full-f250",
        comp: "TreasuryTable9-Full",
        frame: 250,
        outPng: path.join(OUT_DIR, "treasury-full-f250.png"),
        props: null,
        previewMode: "light-editorial",
      },
      {
        name: "showcase-glass",
        comp: "StudioShowcase",
        frame: 70,
        outPng: path.join(OUT_DIR, "showcase-glass.png"),
        props: null,
        previewMode: "light-editorial",
      },
      {
        name: "test_glass_over_dark",
        comp: "DirectorBeat",
        frame: 45,
        outPng: path.join(BENCH_DIR, "test_glass_over_dark.png"),
        previewMode: "simulated-room",
        props: {
          beat: mkBeat(
            "dual-dark",
            "liquid-glass",
            "LiquidGlassObject:card",
            "talking-head-with-glass",
            "Individual paychecks supply 84.1% of federal receipts while corporate taxes fell to 7%.",
            {
              glassPreset: "card",
              paletteMode: "over-footage",
              sourceCitation: "U.S. Treasury — Monthly Treasury Statement, Table 9",
            }
          ),
          previewMode: "simulated-room",
          renderAudio: false,
        },
      },
      {
        name: "test_glass_over_bright",
        comp: "DirectorBeat",
        frame: 45,
        outPng: path.join(BENCH_DIR, "test_glass_over_bright.png"),
        previewMode: "light-editorial",
        props: {
          beat: mkBeat(
            "dual-bright",
            "liquid-glass",
            "LiquidGlassObject:card",
            "talking-head-with-glass",
            "Claire owes $3,400 monthly mortgage while AI wages fall by 42%.",
            {
              category: "warning-escalation",
              glassPreset: "split-modal",
              paletteMode: "over-footage",
              sourceCitation: "Federal Reserve Household Ledger",
            }
          ),
          previewMode: "light-editorial",
          renderAudio: false,
        },
      },
    ];

    for (const dspec of dualSpecs) {
      const cliArgs = ["remotion", "still", BUNDLE_DIR, dspec.comp, dspec.outPng, `--frame=${dspec.frame}`, "--image-format=png"];
      if (dspec.props) {
        const propsPath = path.join(BENCH_DIR, `${dspec.name}.props.json`);
        fs.writeFileSync(propsPath, JSON.stringify(dspec.props, null, 2), "utf8");
        cliArgs.push(`--props=${propsPath}`);
      }
      console.log(`  Rendering dual-palette still: ${path.relative(STUDIO_DIR, dspec.outPng)}...`);
      const res = runCmd("npx", cliArgs);
      stillResults.push({
        name: dspec.name,
        componentHint: dspec.comp,
        glassPreset: dspec.props?.beat?.glassPreset ?? null,
        styleFamily: dspec.props?.beat?.styleFamily ?? "dual-palette",
        previewMode: dspec.previewMode,
        expectAlpha: false,
        expectGlassSemiAlpha: dspec.comp === "DirectorBeat",
        pngPath: dspec.outPng,
        exitCode: res.status,
        wallSec: res.wallSec,
        error: res.status !== 0 ? res.stderr.slice(-500) : null,
      });
    }
  }

  return {
    samplePlanBeats: samplePlan.beats.length,
    paletteModeCoverageCount: paletteModeCount,
    uniqueTupleCount: uniqueTuples.length,
    resolvedHintCount,
    componentCoveragePct: Number(((resolvedHintCount / Math.max(1, uniqueTuples.length)) * 100).toFixed(2)),
    unresolvedHintTuples,
    catalogTotal: STYLE_CATALOG.length,
    catalogExplicitCount: catalogAudit.filter((c) => c.explicitlyHandled).length,
    motionTokenStats: {
      totalTokens,
      recognizedPrimitives,
      recognizedWithAliases,
      primitiveOnlyPct: Number(((recognizedPrimitives / Math.max(1, totalTokens)) * 100).toFixed(2)),
      effectiveCoveragePct: Number(((recognizedWithAliases / Math.max(1, totalTokens)) * 100).toFixed(2)),
      unresolvedAfterAlias,
    },
    bugs,
    bundleWallSec,
    stillsRendered: stillResults,
  };
}

// ============================================================================
// EXAM 2: Motion Vocabulary (57 primitives) & Choreography
// ============================================================================
function runExam2Motion(motionMod) {
  console.log("\n=== EXAM 2: Motion Vocabulary (57 primitives) & Choreography ===");
  const entryActions = motionMod.ENTRY_ACTIONS;
  const exitActions = motionMod.EXIT_ACTIONS;
  const inPlaceActions = motionMod.IN_PLACE_ACTIONS;
  const totalPrimitives = entryActions.length + exitActions.length + inPlaceActions.length;

  const boundaryProgs = [-0.25, 0, 0.001, 0.25, 0.5, 0.75, 0.999, 1, 1.25];
  const entryErrors = [];
  const exitErrors = [];
  const inPlaceErrors = [];
  const inPlaceZeroDurErrors = [];

  for (const action of entryActions) {
    for (const p of boundaryProgs) {
      const res = motionMod.calcEntryMotion(action, p);
      for (const k of ["transform", "opacity", "filter", "clipPath", "boxShadow"]) {
        const err = validateCssString(res[k], `${action}@p=${p}.${k}`);
        if (err) entryErrors.push(err);
      }
      if (res.opacity !== undefined && (res.opacity < 0 || res.opacity > 1)) {
        entryErrors.push(`${action}@p=${p}.opacity out of [0,1]: ${res.opacity}`);
      }
    }
  }

  for (const action of exitActions) {
    for (const p of boundaryProgs) {
      const res = motionMod.calcExitMotion(action, p);
      for (const k of ["transform", "opacity", "filter", "clipPath", "boxShadow"]) {
        const err = validateCssString(res[k], `${action}@p=${p}.${k}`);
        if (err) exitErrors.push(err);
      }
      if (res.opacity !== undefined && (res.opacity < 0 || res.opacity > 1)) {
        exitErrors.push(`${action}@p=${p}.opacity out of [0,1]: ${res.opacity}`);
      }
    }
  }

  const frames = [0, 1, 9, 10, 11, 25, 39, 40, 41, 90, 300];
  for (const action of inPlaceActions) {
    for (const f of frames) {
      const res = motionMod.calcInPlaceMotion(action, f, 30, 10, 30);
      for (const k of ["transform", "opacity", "filter", "clipPath", "boxShadow", "progress", "highlightProgress"]) {
        const err = validateCssString(res[k], `${action}@f=${f}.${k}`);
        if (err) inPlaceErrors.push(err);
      }
    }
    for (const f of [10, 15]) {
      try {
        const resZero = motionMod.calcInPlaceMotion(action, f, 30, 10, 0);
        for (const k of ["transform", "opacity", "filter", "clipPath", "boxShadow", "progress"]) {
          const err = validateCssString(resZero[k], `${action}@dur=0,f=${f}.${k}`);
          if (err) inPlaceZeroDurErrors.push(err);
        }
      } catch (err) {
        inPlaceZeroDurErrors.push(`${action}@dur=0,f=${f} threw: ${err.message}`);
      }
    }
  }

  // Lifecycle sweep: enter -> focus -> highlight -> nudge -> dock -> exit
  const planDefaultDock = {
    enterFrame: 10,
    enterDuration: 12,
    focusFrame: 30,
    focusDuration: 10,
    highlightFrame: 50,
    highlightDuration: 16,
    nudgeFrame: 75,
    nudgeDuration: 8,
    dockFrame: 95,
    dockDuration: 14,
    exitFrame: 130,
    exitDuration: 12,
  };
  const lifecycleDefaultErrors = [];
  for (let f = 0; f <= 160; f++) {
    const st = motionMod.resolveLayerLifecycle(f, 30, planDefaultDock);
    for (const k of ["x", "y", "scale", "opacity", "highlightProgress", "focusGlow"]) {
      if (!Number.isFinite(st[k])) lifecycleDefaultErrors.push(`f=${f} non-finite ${k}`);
    }
    if (f <= 10 && st.opacity !== 0) lifecycleDefaultErrors.push(`f=${f} opacity=${st.opacity} != 0`);
    const inSteadyHold =
      (f >= 22 && f <= 30) ||
      (f >= 40 && f <= 50) ||
      (f >= 66 && f <= 75) ||
      (f >= 83 && f <= 95);
    if (inSteadyHold && Math.abs(st.opacity - 1) > 1e-6) {
      lifecycleDefaultErrors.push(`f=${f} hold opacity=${st.opacity} != 1`);
    }
    if (f >= 142 && st.opacity !== 0) {
      lifecycleDefaultErrors.push(`f=${f} post-exit opacity=${st.opacity} != 0`);
    }
  }

  // Test highlight hold behavior: verify highlightProgress stays 1.0 between highlight end and dock start
  const postHighlightState = motionMod.resolveLayerLifecycle(70, 30, planDefaultDock);
  const postDockDefaultOpacity = motionMod.resolveLayerLifecycle(115, 30, planDefaultDock).opacity;

  return {
    passed:
      totalPrimitives === 57 &&
      entryErrors.length === 0 &&
      exitErrors.length === 0 &&
      inPlaceErrors.length === 0 &&
      inPlaceZeroDurErrors.length === 0 &&
      lifecycleDefaultErrors.length === 0,
    counts: { entry: entryActions.length, exit: exitActions.length, inPlace: inPlaceActions.length, total: totalPrimitives },
    entryErrors,
    exitErrors,
    inPlaceErrors,
    inPlaceZeroDurErrors,
    lifecycleDefaultErrors,
    postHighlightProgressAtF70: postHighlightState.highlightProgress,
    postDockDefaultOpacityAtF115: postDockDefaultOpacity,
  };
}

// ============================================================================
// EXAM 3: Typography, Components (DataTicker, EditorialHeadline, SourceBadge, MusicBed) & Lint
// ============================================================================
function runExam3Expanded(motionMod, compMod) {
  console.log("\n=== EXAM 3: Typography, Components, MusicBed Ducking & npm run lint ===");
  const tinyText = "Nothing stops.";
  const denseText =
    "Federal debt reached $40.5T while payroll taxes supplied 84.1% of revenue under *Wielechowski v. State* constitutional reserve fund constraints today.";
  const denseWordCount = denseText.trim().split(/\s+/).length;

  const checkFormula = (text, fps = 30) => {
    const letters = text.replace(/\s+/g, "").length;
    const expectedFrames = Math.ceil((letters / 15 + 1.5) * fps);
    const actualFrames = motionMod.readingDuration(text, fps);
    return {
      text,
      letters,
      expectedFrames,
      actualFrames,
      matches: expectedFrames === actualFrames,
    };
  };
  const readingChecks = [checkFormula(tinyText, 30), checkFormula(denseText, 30), checkFormula("", 30)];

  // 1. KineticText 7 modes x 4 edge cases
  const timedWords = [
    { word: "Federal", start: 0, end: 12 },
    { word: "debt", start: 12, end: 22 },
    { word: "reached", start: 22, end: 36 },
    { word: "$40.5T", start: 36, end: 54 },
  ];
  const modes = [
    "word-pop",
    "karaoke-highlight",
    "typewriter",
    "stamp-slam",
    "split-lines",
    "marker-sweep",
    "red-correction",
  ];
  const kineticCases = [];
  for (const mode of modes) {
    for (const [label, props] of [
      ["tiny", { text: tinyText, mode, atFrame: 0, duration: 75, enableSfx: false }],
      ["dense20w", { text: denseText, mode, atFrame: 0, duration: 300, enableSfx: false }],
      ["timedWords", { text: "Federal debt reached $40.5T", timedWords, mode, atFrame: 0, duration: 90, enableSfx: false }],
      ["empty", { text: "", mode, atFrame: 0, duration: 45, enableSfx: false }],
    ]) {
      try {
        const html0 = compMod.renderKineticHtml(props, 0, 30);
        const htmlMid = compMod.renderKineticHtml(props, 25, 30);
        const htmlEnd = compMod.renderKineticHtml(props, 89, 30);
        const hasNaN = /\bNaN\b|\bInfinity\b/.test(html0 + htmlMid + htmlEnd);
        kineticCases.push({ mode, case: label, ok: !hasNaN && htmlEnd.length > 0, hasNaN });
      } catch (err) {
        kineticCases.push({ mode, case: label, ok: false, error: err.message });
      }
    }
  }
  const shortDur20wHtml = compMod.renderKineticHtml(
    { text: denseText, mode: "word-pop", atFrame: 0, duration: 45, enableSfx: false },
    44,
    30
  );
  const shortDurIncludesLastWord = shortDur20wHtml.includes("today.");

  // 2. DataTicker test
  const dt0 = compMod.renderDataTickerHtml(
    { startValue: 0, endValue: 84.1, prefix: "", suffix: "%", decimals: 1, label: "Payroll Share", enableSfx: false, atFrame: 0, duration: 30 },
    0,
    30
  );
  const dtMid = compMod.renderDataTickerHtml(
    { startValue: 0, endValue: 84.1, prefix: "", suffix: "%", decimals: 1, label: "Payroll Share", enableSfx: false, atFrame: 0, duration: 30 },
    15,
    30
  );
  const dtEnd = compMod.renderDataTickerHtml(
    { startValue: 0, endValue: 84.1, prefix: "", suffix: "%", decimals: 1, label: "Payroll Share", enableSfx: false, atFrame: 0, duration: 30 },
    30,
    30
  );
  const dataTickerOk = dt0.includes("0.0") && !dtMid.includes("NaN") && dtEnd.includes("84.1");

  // 3. EditorialHeadline 4 variants
  const headlineVariants = ["newspaper-cutout", "broadcast-lower-third", "spy-title", "chapter-card"];
  const headlineResults = [];
  for (const variant of headlineVariants) {
    const hPre = compMod.renderHeadlineHtml({ variant, title: "Wielechowski v. State", atFrame: 10, duration: 60, enableSfx: false }, 5, 30);
    const hMid = compMod.renderHeadlineHtml({ variant, title: "Wielechowski v. State", atFrame: 10, duration: 60, enableSfx: false }, 25, 30);
    const hPost = compMod.renderHeadlineHtml({ variant, title: "Wielechowski v. State", atFrame: 10, duration: 60, enableSfx: false }, 70, 30);
    headlineResults.push({
      variant,
      ok: hPre === "" && hMid.includes("Wielechowski v. State") && hPost === "" && !hMid.includes("NaN"),
    });
  }

  // 4. SourceBadge test (no hardcoded MTS-2024-T09 on unrelated sources)
  const sbUnrelated = compMod.renderSourceBadgeHtml(
    { sourceText: "PJM Interconnection Auction", startFrame: 0 },
    30,
    30
  );
  const sbExplicit = compMod.renderSourceBadgeHtml(
    { sourceText: "CBO Projections", docRef: "CBO-2026-01", startFrame: 0 },
    30,
    30
  );
  const sourceBadgeOk =
    sbUnrelated.includes("PJM Interconnection Auction") &&
    !sbUnrelated.includes("MTS-2024-T09") &&
    sbExplicit.includes("CBO-2026-01");

  // 5. MusicBed.computeMusicBedVolume ducking & fade envelope test
  const mbOpts = {
    from: 10,
    durationInFrames: 200, // active global [10..209]
    baseVolume: 0.25,
    duckVolume: 0.06,
    speechRanges: [{ startFrame: 80, endFrame: 140 }],
    attackFrames: 8,
    releaseFrames: 8,
    fadeInFrames: 24,
    fadeOutFrames: 30,
  };
  const vBefore = compMod.computeMusicBedVolume(5, mbOpts);
  const vFadeStart = compMod.computeMusicBedVolume(10, mbOpts);
  const vFadeMid = compMod.computeMusicBedVolume(22, mbOpts);
  const vSteady = compMod.computeMusicBedVolume(50, mbOpts);
  const vAttackMid = compMod.computeMusicBedVolume(76, mbOpts); // halfway into 8f attack [72..80]
  const vDucked = compMod.computeMusicBedVolume(110, mbOpts);
  const vReleaseMid = compMod.computeMusicBedVolume(144, mbOpts); // halfway into 8f release [140..148]
  const vPostSpeech = compMod.computeMusicBedVolume(160, mbOpts);
  const vFadeOutMid = compMod.computeMusicBedVolume(195, mbOpts);
  const vEnd = compMod.computeMusicBedVolume(210, mbOpts);

  const musicBedOk =
    vBefore === 0 &&
    vFadeStart === 0 &&
    vFadeMid > 0.1 && vFadeMid < 0.25 &&
    Math.abs(vSteady - 0.25) < 1e-6 &&
    vAttackMid < 0.25 && vAttackMid > 0.06 &&
    Math.abs(vDucked - 0.06) < 1e-6 &&
    vReleaseMid > 0.06 && vReleaseMid < 0.25 &&
    Math.abs(vPostSpeech - 0.25) < 1e-6 &&
    vFadeOutMid > 0 && vFadeOutMid < 0.25 &&
    vEnd === 0;

  // 6. npm run lint (`eslint src && tsc`)
  const eslintRes = runCmd("npx", ["eslint", "src"]);
  const tscRes = runCmd("npx", ["tsc", "--noEmit"]);
  const lintWarnings = ((eslintRes.stdout + eslintRes.stderr).match(/\bwarning\b/g) || []).length;
  const lintErrors = ((eslintRes.stdout + eslintRes.stderr).match(/\berror\b/g) || []).length;

  return {
    denseWordCount,
    readingChecks,
    allReadingChecksPass: readingChecks.every((r) => r.matches),
    kineticTotal: kineticCases.length,
    kineticPassed: kineticCases.filter((c) => c.ok).length,
    kineticFailures: kineticCases.filter((c) => !c.ok),
    shortDuration20WordWordPopFixed: shortDurIncludesLastWord,
    dataTickerOk,
    headlineVariantsPassed: headlineResults.every((h) => h.ok),
    headlineResults,
    sourceBadgeNoHardcodedMtsLeak: sourceBadgeOk,
    musicBedDuckingOk: musicBedOk,
    musicBedSamples: { vBefore, vFadeStart, vFadeMid, vSteady, vAttackMid, vDucked, vReleaseMid, vPostSpeech, vFadeOutMid, vEnd },
    eslint: {
      exitCode: eslintRes.status,
      errorCount: lintErrors,
      warningCount: lintWarnings,
      wallSec: eslintRes.wallSec,
      output: (eslintRes.stdout + eslintRes.stderr).trim(),
    },
    tsc: {
      exitCode: tscRes.status,
      wallSec: tscRes.wallSec,
      output: (tscRes.stdout + tscRes.stderr).trim(),
    },
  };
}

// ============================================================================
// EXAM 4: Director Retention & Adversarial Stress Exam
// ============================================================================
function auditRetentionPlan(plan, label) {
  const fps = plan.fps || 30;
  const beats = plan.beats || [];
  const consecutiveFamilyRepeats = [];
  const adjacentComponentRepeats = [];
  const cooldownViolations = [];
  const staticGapsOver18s = [];
  const missingCitationReceipts = [];
  const nonPositiveBeats = [];
  const overlapBeats = [];
  const frameGaps = [];
  const lastByComp = {};

  let fullTalkingHeadCount = 0;
  let fullTalkingHeadSec = 0;

  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const frames = b.endFrame - b.startFrame;
    const durSec = frames / fps;
    if (b.framing === "talking-head-full") {
      fullTalkingHeadCount += 1;
      fullTalkingHeadSec += durSec;
    }
    if (frames <= 0 || b.durationSec <= 0) {
      nonPositiveBeats.push({ id: b.id, startFrame: b.startFrame, endFrame: b.endFrame });
    }
    if (durSec > 18) {
      staticGapsOver18s.push({ id: b.id, durSec: Number(durSec.toFixed(2)), componentHint: b.componentHint });
    }
    if (b.category === "receipt-proof" && (!b.sourceCitation || !b.sourceCitation.trim())) {
      missingCitationReceipts.push({ id: b.id, spokenText: b.spokenText.slice(0, 70) });
    }
    if (i > 0) {
      const prev = beats[i - 1];
      if (b.startFrame < prev.endFrame) {
        overlapBeats.push({ prev: prev.id, curr: b.id });
      } else if (b.startFrame > prev.endFrame) {
        frameGaps.push({ prev: prev.id, curr: b.id, gapFrames: b.startFrame - prev.endFrame });
      }
      if (b.styleFamily === prev.styleFamily) {
        consecutiveFamilyRepeats.push({ prev: prev.id, curr: b.id, styleFamily: b.styleFamily });
      }
      if (b.componentHint === prev.componentHint) {
        adjacentComponentRepeats.push({ prev: prev.id, curr: b.id, componentHint: b.componentHint });
      }
    }
    if (lastByComp[b.componentHint] !== undefined && i - lastByComp[b.componentHint] < 6) {
      cooldownViolations.push({
        beat: b.id,
        prevBeat: beats[lastByComp[b.componentHint]].id,
        componentHint: b.componentHint,
        beatGap: i - lastByComp[b.componentHint],
      });
    }
    lastByComp[b.componentHint] = i;
  }

  const totalSec = Number(((plan.totalFrames || 0) / fps).toFixed(2));
  const firstVisualShiftSec = beats.length > 0 ? Number((beats[0].endFrame / fps).toFixed(2)) : 0;
  return {
    label,
    beatCount: beats.length,
    nonFullTalkingHeadCount: beats.length - fullTalkingHeadCount,
    fullTalkingHeadCount,
    fullTalkingHeadPct: totalSec > 0 ? Number(((fullTalkingHeadSec / totalSec) * 100).toFixed(1)) : 0,
    totalSec,
    firstVisualShiftSec,
    hookShiftWithin4_0s: firstVisualShiftSec <= 4.0,
    hookShiftWithin4_5s: firstVisualShiftSec <= 4.5,
    heroPeakPercent: plan.audit?.heroPeakPercent ?? null,
    heroPeakIn60to75:
      plan.audit?.heroPeakPercent >= 60 && plan.audit?.heroPeakPercent <= 75,
    talkingHeadSharePercent: plan.audit?.talkingHeadSharePercent ?? null,
    styleDiversityScore: plan.audit?.styleDiversityScore ?? null,
    uniqueStyleFamilies: new Set(beats.map((b) => b.styleFamily)).size,
    uniqueComponentHints: new Set(beats.map((b) => b.componentHint)).size,
    consecutiveFamilyRepeats: consecutiveFamilyRepeats.length,
    adjacentComponentRepeats: adjacentComponentRepeats.length,
    cooldownViolationsUnder6Beats: cooldownViolations.length,
    cooldownViolationsSample: cooldownViolations.slice(0, 10),
    staticGapsOver18s,
    missingCitationReceiptsCount: missingCitationReceipts.length,
    nonPositiveBeats,
    overlapBeats,
    frameGapCount: frameGaps.length,
    plannerAuditWarnings: plan.audit?.repetitionWarnings ?? [],
  };
}

function runExam4Director() {
  console.log("\n=== EXAM 4: Director Retention & Adversarial Stress Exam ===");
  const samplePlan = JSON.parse(
    fs.readFileSync(path.join(OUT_DIR, "sample-director-plan.json"), "utf8")
  );
  const sampleAudit = auditRetentionPlan(samplePlan, "sample-director-plan.json");

  // Adversarial A: 45s unpunctuated run-on paragraph
  const baseClause =
    "federal payroll taxes keep funding the entire machine while corporate receipts shrink and data centers consume gigawatts across the grid";
  const tokens = baseClause.split(" ");
  const runOnWords = Array.from({ length: 114 }, (_, i) => tokens[i % tokens.length]);
  const advAPath = path.join(ADV_DIR, "adv_a_runon_45s.md");
  const advAOut = path.join(ADV_DIR, "adv_a_plan.json");
  fs.writeFileSync(advAPath, runOnWords.join(" ") + "\n", "utf8");

  // Adversarial B: 20 rapid 1s fragments
  const fragLines = [
    "Wait.", "Stop.", "Look closely.", "Numbers lie.", "Paychecks shrink.",
    "Debt grows.", "Rates spike.", "Watch 2036.", "Table 9.", "Eighty four percent.",
    "Seven percent.", "Who pays?", "Not robots.", "Check Claire.", "Thirty four hundred.",
    "Every month.", "Grid chokes.", "Power fails.", "Check receipts.", "Nothing stops.",
  ];
  const advBPath = path.join(ADV_DIR, "adv_b_20x1s.md");
  const advBOut = path.join(ADV_DIR, "adv_b_plan.json");
  fs.writeFileSync(advBPath, fragLines.join("\n\n") + "\n", "utf8");

  // Adversarial C: Messy Whisper words.json
  const messyWords = [
    { word: "Look", startSec: 0.2, endSec: 0.5 },
    { word: "at", startSec: 0.5, endSec: 0.65 },
    { word: "$3,400", startSec: 0.65, endSec: 1.2 },
    { word: "every", startSec: 1.25, endSec: 1.55 },
    { word: "month,", startSec: 1.55, endSec: 1.95 },
    { word: "while", startSec: 4.15, endSec: 4.4 },
    { word: "84.1%", startSec: 4.42, endSec: 4.95 },
    { word: "comes", startSec: 4.95, endSec: 5.25 },
    { word: "from", startSec: 5.25, endSec: 5.45 },
    { word: "paychecks", startSec: 5.45, endSec: 5.95 },
    { word: "before", startSec: 5.95, endSec: 6.25 },
    { word: "2036!", startSec: 6.25, endSec: 6.85 },
    { word: "—", startSec: 8.35, endSec: 8.45 },
    { word: '"Table', startSec: 8.5, endSec: 8.85 },
    { word: '9"', startSec: 8.85, endSec: 9.2 },
    { word: "proves", startSec: 9.25, endSec: 9.6 },
    { word: "it.", startSec: 9.6, endSec: 9.95 },
    { word: "Wait", startSec: 10.0, endSec: 10.0 },
    { word: "for", startSec: 10.01, endSec: 10.2 },
    { word: "2036.", startSec: 10.2, endSec: 10.7 },
  ];
  const advCPath = path.join(ADV_DIR, "adv_c_messy_whisper.json");
  const advCOut = path.join(ADV_DIR, "adv_c_plan.json");
  fs.writeFileSync(
    advCPath,
    JSON.stringify({ text: messyWords.map((w) => w.word).join(" "), words: messyWords }, null, 2),
    "utf8"
  );

  const adversarialRuns = [];
  for (const [name, inPath, outPath] of [
    ["A_45s_unpunctuated_runon", advAPath, advAOut],
    ["B_20_rapid_1s_fragments", advBPath, advBOut],
    ["C_messy_whisper_gaps_chars", advCPath, advCOut],
  ]) {
    const res = runCmd("node", [
      path.join(STUDIO_DIR, "scripts", "plan-edit.mjs"),
      inPath,
      "--out",
      outPath,
      "--fps",
      "30",
    ]);
    let planAudit = null;
    let schemaValid = false;
    if (res.status === 0 && fs.existsSync(outPath)) {
      const plan = JSON.parse(fs.readFileSync(outPath, "utf8"));
      schemaValid =
        typeof plan.title === "string" &&
        Number.isFinite(plan.fps) &&
        Number.isFinite(plan.totalFrames) &&
        plan.totalFrames > 0 &&
        Array.isArray(plan.beats) &&
        plan.beats.length > 0 &&
        typeof plan.audit === "object";
      planAudit = auditRetentionPlan(plan, name);
    }
    adversarialRuns.push({
      name,
      exitCode: res.status,
      schemaValid,
      wallSec: res.wallSec,
      audit: planAudit,
      stderr: res.stderr.trim() || null,
    });
  }

  return { sampleAudit, adversarialRuns };
}

// ============================================================================
// EXAM 6: Pre-Bundled 90-Frame Speed Benchmark (exact render-overlays.mjs flags)
// ============================================================================
function runExam6Speed(ffprobeBin, bundleWallSec) {
  console.log("\n=== EXAM 6: Pre-Bundled 90-Frame Speed Benchmark (MP4, VP9 yuva420p, ProRes 4444 yuva444p10le) ===");
  const samplePlan = JSON.parse(
    fs.readFileSync(path.join(OUT_DIR, "sample-director-plan.json"), "utf8")
  );
  const overlayBeats = samplePlan.beats.filter((b) => b.framing !== "talking-head-full");
  const meanOverlaySec =
    overlayBeats.reduce((s, b) => s + (b.endFrame - b.startFrame) / 30, 0) /
    Math.max(1, overlayBeats.length);

  const fullscreenBeat = {
    id: "speed-fs-90f",
    startFrame: 0,
    endFrame: 90,
    durationSec: 3,
    category: "warning-escalation",
    spokenText: "PJM capacity auction prices jumped 833 percent to $269.92 per megawatt-day.",
    framing: "fullscreen-cutaway",
    styleFamily: "doc-broadcast",
    componentHint: "VisualInvestigationBoard",
    motionAction: "blur-snap -> pulse-warning -> fade-blur-out",
    typographyMode: "stamp-slam",
    sfxCues: [
      { cue: "flash-cut", offsetFrame: 0, volume: 0.62 },
      { cue: "warning-thud", offsetFrame: 8, volume: 0.85 },
    ],
    musicEnergy: "tense",
    cutReason: "Speed benchmark fullscreen beat",
    sourceCitation: "PJM Interconnection",
  };

  const overlayBeat = {
    id: "speed-ov-90f",
    startFrame: 0,
    endFrame: 90,
    durationSec: 3,
    category: "receipt-proof",
    spokenText: "Individual paychecks supply 84.1% of federal receipts while corporate taxes fell to 7%.",
    framing: "talking-head-with-glass",
    styleFamily: "liquid-glass",
    componentHint: "LiquidGlassObject:card",
    motionAction: "slide-left -> glow-rim -> fade-blur-out",
    glassPreset: "card",
    typographyMode: "marker-sweep",
    sfxCues: [{ cue: "glass-enter", offsetFrame: 0, volume: 0.65 }],
    musicEnergy: "calm",
    cutReason: "Speed benchmark transparent glass overlay",
    sourceCitation: "U.S. Treasury — Monthly Treasury Statement, Table 9",
  };

  const fsProps = path.join(SPEED_DIR, "fs_90f.props.json");
  const ovProps = path.join(SPEED_DIR, "ov_90f.props.json");
  fs.writeFileSync(
    fsProps,
    JSON.stringify({ beat: fullscreenBeat, previewMode: "light-editorial", renderAudio: true }, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    ovProps,
    JSON.stringify({ beat: overlayBeat, previewMode: "transparent", renderAudio: true }, null, 2),
    "utf8"
  );

  const jobs = [
    {
      label: "h264_mp4_crf14_bundled",
      outPath: path.join(SPEED_DIR, "beat90_h264_bundled.mp4"),
      propsPath: fsProps,
      codecArgs: ["--codec=h264", "--crf=14"],
      expectAlpha: false,
    },
    {
      label: "vp9_webm_yuva420p_bundled",
      outPath: path.join(SPEED_DIR, "beat90_vp9_yuva420p_bundled.webm"),
      propsPath: ovProps,
      codecArgs: ["--codec=vp9", "--image-format=png", "--pixel-format=yuva420p"],
      expectAlpha: true,
    },
    {
      label: "prores_4444_yuva444p10le_bundled",
      outPath: path.join(SPEED_DIR, "beat90_prores4444_yuva_bundled.mov"),
      propsPath: ovProps,
      codecArgs: [
        "--codec=prores",
        "--prores-profile=4444",
        "--image-format=png",
        "--pixel-format=yuva444p10le",
      ],
      expectAlpha: true,
    },
  ];

  const results = [];
  for (const job of jobs) {
    console.log(`  Rendering ${job.label} (90 frames, pre-bundled)...`);
    const res = runCmd("npx", [
      "remotion",
      "render",
      BUNDLE_DIR,
      "DirectorBeat",
      job.outPath,
      `--props=${job.propsPath}`,
      ...job.codecArgs,
    ]);

    let fileBytes = 0;
    let probe = null;
    if (res.status === 0 && fs.existsSync(job.outPath)) {
      fileBytes = fs.statSync(job.outPath).size;
      if (ffprobeBin) {
        const pRes = spawnSync(
          ffprobeBin,
          ["-v", "error", "-show_format", "-show_streams", "-of", "json", job.outPath],
          { encoding: "utf8" }
        );
        if (pRes.status === 0 && pRes.stdout) {
          const parsed = JSON.parse(pRes.stdout);
          const v = parsed.streams?.find((s) => s.codec_type === "video") || {};
          const a = parsed.streams?.find((s) => s.codec_type === "audio") || null;
          probe = {
            codec: v.codec_name,
            profile: v.profile,
            pixFmt: v.pix_fmt,
            width: v.width,
            height: v.height,
            rFrameRate: v.r_frame_rate,
            nbFrames: v.nb_frames,
            tags: v.tags || {},
            hasAudio: Boolean(a),
            durationSec: Number(parsed.format?.duration || 0),
          };
        }
      }
    }

    const fpsSpeed = res.wallSec > 0 ? Number((90 / res.wallSec).toFixed(2)) : 0;
    const est175At90fMin = Number(((bundleWallSec + res.wallSec * 175) / 60).toFixed(2));
    const est175AtMeanDurMin = Number(
      ((bundleWallSec + res.wallSec * (meanOverlaySec / 3.0) * 175) / 60).toFixed(2)
    );

    results.push({
      label: job.label,
      exitCode: res.status,
      wallSec: res.wallSec,
      renderFps: fpsSpeed,
      fileBytes,
      fileMB: Number((fileBytes / (1024 * 1024)).toFixed(3)),
      expectAlpha: job.expectAlpha,
      probe,
      est175BeatsAt90fMin: est175At90fMin,
      est175BeatsAtMeanDurMin: est175AtMeanDurMin,
      error: res.status !== 0 ? res.stderr.slice(-500) : null,
    });
  }

  return {
    bundleWallSec,
    sampleOverlayBeatCount: overlayBeats.length,
    sampleMeanOverlaySec: Number(meanOverlaySec.toFixed(2)),
    formats: results,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const skipRenders = args.includes("--skip-renders");
  const skipSpeed = args.includes("--skip-speed");
  ensureDirs();
  const ffprobeBin = findMediaBinary("ffprobe");
  const { motionMod, compMod } = await compileTsHarness();

  const exam1 = runExam1Audit(motionMod, skipRenders);
  const exam2 = runExam2Motion(motionMod);
  const exam3 = runExam3Expanded(motionMod, compMod);
  const exam4 = runExam4Director();
  const exam6 = skipRenders || skipSpeed ? { skipped: true } : runExam6Speed(ffprobeBin, exam1.bundleWallSec);

  const outJson = path.join(BENCH_DIR, "exam_node_results.json");
  fs.writeFileSync(
    outJson,
    JSON.stringify({ generatedAt: new Date().toISOString(), exam1, exam2, exam3, exam4, exam6 }, null, 2) + "\n",
    "utf8"
  );
  console.log(`\nSaved Node benchmark results -> ${outJson}`);

  const venvPython = path.resolve(STUDIO_DIR, "..", "tools", ".venv", "Scripts", "python.exe");
  const mediaAuditScript = path.resolve(STUDIO_DIR, "..", "tools", "benchmark_media.py");
  if (!skipRenders && fs.existsSync(venvPython) && fs.existsSync(mediaAuditScript)) {
    console.log("\n=== Running Python Stills Readability & Dual-Palette Audit ===");
    const pyRes = spawnSync(venvPython, [mediaAuditScript, "--stills-only"], {
      cwd: STUDIO_DIR,
      encoding: "utf8",
      stdio: "inherit",
    });
    if (pyRes.status !== 0) {
      throw new Error(`Python stills readability audit failed with exit code ${pyRes.status}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
