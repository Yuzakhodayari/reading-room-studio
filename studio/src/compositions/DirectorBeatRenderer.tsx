import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { CameraPreviewStage, PreviewMode } from "../components/glass/CameraPreviewStage";
import { LiquidGlassObject } from "../components/glass/LiquidGlassObject";
import {
  GlassBottomDock,
  GlassCard,
  GlassCornerPill,
  GlassFloatingToolbar,
  GlassSplitModal,
  GlassToastAlert,
} from "../components/glass/LiquidGlassPresets";
import { SfxCue, SfxName } from "../components/SfxCue";
import { SourceBadge } from "../components/SourceBadge";
import { LayerLifecyclePlan } from "../design/choreography";
import { FONTS } from "../design/fonts";
import { COLORS, OVER_FOOTAGE_PALETTE, PAGE_PALETTE } from "../design/tokens";
import { EntryAction, ExitAction, InPlaceAction, ObjectAnimator } from "../motion/ObjectAnimator";
import { isEntryAction, isExitAction, isInPlaceAction } from "../motion/primitives";
import {
  BlobSimulation,
  DataPhysicalCard,
  MapExplainer,
  WhiteModel3D,
} from "../styles/dataMaps3D";
import {
  ArchiveLightTable,
  CaptionNewsCard,
  CitySymphonyFrame,
  KinoMontageStrip,
  LiveCountdownSplit,
  NewsPackageLowerThird,
  TelestratorOverlay,
  VisualInvestigationBoard,
} from "../styles/docBroadcast";
import {
  InstructionManualCard,
  IsometricScene,
  StickFigureStage,
  StickerCutout,
} from "../styles/diagramMetaphor";
import {
  CollageCutout,
  Newsreel1920s,
  SilentFilmCard,
  SpyTitleSequence,
  StainedGlassFrame,
} from "../styles/vintageEditorial";
import { DataTicker } from "../typography/DataTicker";
import { EditorialHeadline } from "../typography/EditorialHeadline";
import { KineticText, KineticTextMode } from "../typography/KineticText";

export interface DirectorSfxCue {
  cue: string;
  offsetFrame: number;
  volume?: number;
}

export interface DirectorBeat {
  id: string;
  startFrame: number;
  endFrame: number;
  durationSec: number;
  category: string;
  spokenText: string;
  framing: string;
  paletteMode?: "page" | "over-footage";
  styleFamily: string;
  componentHint: string;
  motionAction: string;
  glassPreset?: string;
  typographyMode?: string;
  sfxCues: DirectorSfxCue[];
  musicEnergy: string;
  cutReason: string;
  sourceCitation?: string;
  title?: string;
  subtitle?: string;
  data?: Record<string, unknown>;
}

export interface DirectorPlan {
  title: string;
  fps: number;
  totalFrames: number;
  beats: DirectorBeat[];
}

export type DirectorBeatRendererProps = {
  beat?: DirectorBeat;
  previewMode?: PreviewMode;
  cameraSrc?: string;
  renderAudio?: boolean;
};

export const DEFAULT_DIRECTOR_BEAT: DirectorBeat = {
  id: "beat-sample-001",
  startFrame: 0,
  endFrame: 150,
  durationSec: 5,
  category: "receipt-proof",
  spokenText: "Individual paychecks now supply 84% of federal receipts while corporate taxes fell to 7%.",
  framing: "talking-head-with-glass",
  paletteMode: "over-footage",
  styleFamily: "liquid-glass",
  componentHint: "LiquidGlassObject:card",
  motionAction: "slide-left -> card-tilt-3d -> fade-blur-out",
  glassPreset: "card",
  typographyMode: "marker-sweep",
  sfxCues: [{ cue: "glass-enter", offsetFrame: 0, volume: 0.65 }],
  musicEnergy: "calm",
  cutReason: "Anchor primary statistic while speaker introduces receipt gap.",
  sourceCitation: "U.S. Treasury Monthly Statement, Table 9",
};

const VALID_SFX = new Set<string>([
  "glass-enter",
  "glass-expand",
  "glass-dock",
  "glass-exit",
  "marker-sweep",
  "paper-slide",
  "data-tick",
  "warning-thud",
  "flash-cut",
  "telestrator-draw",
  "sticker-pop",
  "newsreel-click",
  "map-whoosh",
  "type-click",
  "ambient-tension-drone",
  "riser-subtle",
  "chapter-chime",
  "paper-flip-fast",
  "alert-ping",
  "camera-shutter",
]);

const VALID_KINETIC_MODES = new Set<string>([
  "word-pop",
  "karaoke-highlight",
  "typewriter",
  "stamp-slam",
  "split-lines",
  "marker-sweep",
  "red-correction",
]);

const NON_BREAKING_ABBREVS = new Set<string>([
  "v",
  "vs",
  "u.s",
  "u.k",
  "dr",
  "mr",
  "mrs",
  "ms",
  "prof",
  "sr",
  "jr",
  "st",
  "no",
  "fig",
  "inc",
  "corp",
  "ltd",
  "co",
  "jan",
  "feb",
  "mar",
  "apr",
  "aug",
  "sept",
  "oct",
  "nov",
  "dec",
  "al",
  "e.g",
  "i.e",
]);

const CATEGORY_LABELS: Record<string, string> = {
  hook: "Opening Hook",
  "thesis-promise": "Core Thesis",
  "receipt-proof": "Key Record",
  "metaphor-story": "Illustration",
  "good-work-punchline": "Aside",
  "history-archive": "Archive",
  "map-geopolitics": "Geography",
  "warning-escalation": "Risk Flag",
  "claire-ledger": "Household Ledger",
  "open-loop": "Looking Ahead",
  takeaway: "Takeaway",
};

const STYLE_LABELS: Record<string, string> = {
  "liquid-glass": "Liquid Glass",
  "doc-broadcast": "Editorial",
  "vintage-editorial": "Archive",
  "diagram-metaphor": "Diagram",
  "data-maps-3d": "Data & Maps",
};

const PJM_STATE_FIPS = [
  "42",
  "34",
  "24",
  "10",
  "11",
  "51",
  "54",
  "39",
  "17",
  "18",
  "26",
  "21",
  "37",
];

function formatCategoryLabel(category: string): string {
  const key = (category || "").trim().toLowerCase();
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  return (category || "Note").replace(/[-_]+/g, " ");
}

function formatStyleLabel(styleFamily: string): string {
  const key = (styleFamily || "").trim().toLowerCase();
  if (STYLE_LABELS[key]) return STYLE_LABELS[key];
  return (styleFamily || "Editorial").replace(/[-_]+/g, " ");
}

function extractAllMetrics(text: string): Array<{
  raw: string;
  numeric: number;
  prefix: string;
  suffix: string;
}> {
  const regex =
    /([$€£])?\s*(\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(?:\s*(%|percent\b|trillion\b|billion\b|million\b|thousand\b)|([TBMK]\b))?/gi;
  const results: Array<{
    raw: string;
    numeric: number;
    prefix: string;
    suffix: string;
  }> = [];

  for (const match of text.matchAll(regex)) {
    const prefix = match[1] ?? "";
    const numRaw = match[2];
    const numStr = numRaw.replace(/,/g, "");
    const numeric = Number(numStr);
    if (!Number.isFinite(numeric)) continue;

    const unitWord = match[3]?.toLowerCase();
    const unitAbbr = match[4]?.toUpperCase();
    const hasCurrency = Boolean(prefix);
    const hasUnit = Boolean(unitWord || unitAbbr);

    if (!hasCurrency && !hasUnit && Number.isInteger(numeric) && numeric >= 1900 && numeric <= 2099) {
      continue;
    }
    if (!hasCurrency && !hasUnit) {
      continue;
    }

    let suffix = "";
    if (unitWord === "%" || unitWord === "percent") {
      suffix = "%";
    } else if (unitWord === "trillion" || unitAbbr === "T") {
      suffix = "T";
    } else if (unitWord === "billion" || unitAbbr === "B") {
      suffix = "B";
    } else if (unitWord === "million" || unitAbbr === "M") {
      suffix = "M";
    } else if (unitWord === "thousand" || unitAbbr === "K") {
      suffix = "K";
    }

    results.push({
      raw: `${prefix}${numRaw}${suffix}`,
      numeric,
      prefix,
      suffix,
    });
  }

  return results;
}

function extractPrimaryMetric(text: string): {
  raw: string;
  numeric: number | null;
  prefix: string;
  suffix: string;
} | null {
  return extractAllMetrics(text)[0] ?? null;
}

function extractFirstSentence(clean: string): string {
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch !== "." && ch !== "!" && ch !== "?") continue;

    if (ch === "!" || ch === "?") {
      return clean.slice(0, i).trim();
    }

    // Period: skip decimal numbers like 84.1% or $40.5
    const prev = i > 0 ? clean[i - 1] : "";
    const next = i + 1 < clean.length ? clean[i + 1] : "";
    if (/\d/.test(prev) && /\d/.test(next)) {
      continue;
    }

    // Skip intra-abbreviation dots like U.S. or e.g. when followed directly by letter/dot
    if (next && /[A-Za-z.]/.test(next)) {
      continue;
    }

    // Inspect token immediately preceding the period
    const before = clean.slice(0, i);
    const tokenMatch = before.match(/([A-Za-z.]+)$/);
    if (tokenMatch) {
      const token = tokenMatch[1];
      const lower = token.toLowerCase();
      if (NON_BREAKING_ABBREVS.has(lower) || /^[A-Z]$/.test(token)) {
        continue;
      }
    }

    return before.trim();
  }

  return clean.replace(/[.!?]+$/, "").trim();
}

const DANGLING_TAIL_WORDS = new Set<string>([
  "of",
  "the",
  "a",
  "an",
  "to",
  "in",
  "for",
  "and",
  "or",
  "while",
  "with",
  "on",
  "at",
  "by",
  "from",
  "that",
  "who",
  "which",
  "than",
  "as",
  "into",
  "between",
]);

function trimToWholeWords(text: string, maxChars: number): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  const result = (lastSpace > 4 ? cut.slice(0, lastSpace) : cut).trim();
  const words = result.split(/\s+/);
  while (words.length > 2 && DANGLING_TAIL_WORDS.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }
  return words.join(" ");
}

function deriveHeadline(beat: DirectorBeat): string {
  if (beat.title && beat.title.trim()) return beat.title.trim();

  const clean = (beat.spokenText || "").replace(/\s+/g, " ").trim();
  const citation = (beat.sourceCitation || "").trim();
  const combined = `${clean} ${citation}`;

  // Concise, non-redundant editorial headings for recurring concepts
  if (/\bPJM\b/i.test(combined)) {
    if (/price|auction|833|spiked|jumped|269\.92|megawatt-day/i.test(combined)) {
      return "PJM Grid Price Shock";
    }
    return "PJM Grid Capacity Crunch";
  }
  if (/escape hatch|hatches/i.test(clean)) {
    return "Three Escape Hatches";
  }
  if (/Alaska|Wielechowski|Permanent Fund/i.test(combined)) {
    return "Alaska Dividend Veto";
  }
  if (/Claire|mortgage|\$3,400|thirty-year loan|Austin/i.test(clean)) {
    return "Claire's Mortgage Trap";
  }
  if (/Irving Fisher|1933|debt deflation/i.test(combined)) {
    return "Irving Fisher (1933)";
  }
  if (/Ministry of Food|London|1941|sixteen points|submarines/i.test(combined)) {
    return "London Rationing (1941)";
  }
  if (/Ireland|Irish/i.test(combined)) {
    return "Ireland Tax Concentration";
  }
  if (/Table 9|paycheck|payroll|individual.*corporate|corporate.*income|federal taxes|federal receipts/i.test(combined)) {
    return "U.S. Tax Receipts";
  }
  if (/CBO|national debt|\$40\.5|\$2\.1|\$1\.83|interest|bond/i.test(combined)) {
    return "Federal Debt & Interest";
  }
  if (/\$18\.8|household.*owe|monthly payment/i.test(clean)) {
    return "Household Debt Burden";
  }
  if (/compute|token|credit|wallet/i.test(clean)) {
    return "Compute Token Risk";
  }
  if (/Three Mile Island|nuclear|reactor|power plant|transformers|electricity|print.*power|megawatts/i.test(clean)) {
    return "Physical Grid Limits";
  }
  if (/Musk|abundance|Palo Alto|whiteboard/i.test(clean)) {
    return "The Abundance Thesis";
  }
  if (/landlord|rent/i.test(clean)) {
    return "Rent Due in Dollars";
  }
  if (/running shoes|dental|robot|cheaper/i.test(clean)) {
    return "AI Price Deflation";
  }
  if (/bargaining|negotiate|allowance|unwritten agreement/i.test(clean)) {
    return "Bargaining Power Shift";
  }

  if (!clean) return formatCategoryLabel(beat.category);

  // Clean non-truncated fallback from leading clause
  const firstClause = extractFirstSentence(clean) || clean;
  const subClause = firstClause.split(/[,;—:]/)[0]?.trim() || firstClause;
  const words = subClause.split(/\s+/).filter(Boolean).slice(0, 5);
  while (words.length > 2 && DANGLING_TAIL_WORDS.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }
  return words.join(" ") || formatCategoryLabel(beat.category);
}

function resolveLocationConfig(
  spokenText: string,
  fallbackLabel: string
): {
  region: "us" | "world";
  highlightStatesFips: string[];
  highlightLabel: string;
} {
  const txt = spokenText || "";
  if (/\bPJM\b|thirteen states|13 states|Illinois to New Jersey/i.test(txt)) {
    return {
      region: "us",
      highlightStatesFips: PJM_STATE_FIPS,
      highlightLabel: "PJM Grid · 13 States",
    };
  }
  if (/\bIreland\b/i.test(txt)) {
    return {
      region: "world",
      highlightStatesFips: ["372"],
      highlightLabel: "Ireland",
    };
  }
  if (/\b(?:London|Britain|UK|United Kingdom|British)\b/i.test(txt)) {
    return {
      region: "world",
      highlightStatesFips: ["826"],
      highlightLabel: "United Kingdom",
    };
  }
  if (/\bAlaska\b/i.test(txt)) {
    return {
      region: "us",
      highlightStatesFips: ["02"],
      highlightLabel: "Alaska Permanent Fund",
    };
  }
  if (/\b(?:Texas|Austin|Claire|Taxas)\b/i.test(txt)) {
    return {
      region: "us",
      highlightStatesFips: ["48"],
      highlightLabel: "Austin, Texas",
    };
  }
  return {
    region: "us",
    highlightStatesFips: ["48"],
    highlightLabel: fallbackLabel,
  };
}

function softenActionToken(tok: string, isPunchline: boolean): string {
  if (tok === "shutter-flash") return "blur-snap";
  if (tok === "shake-alert" && !isPunchline) return "nudge";
  if (tok === "whip-slide") return "slide-left";
  if (tok === "elastic-open" && !isPunchline) return "pop-out";
  return tok;
}

function resolveMotionProps(
  beat: DirectorBeat,
  durationFrames: number,
  isFullCanvas: boolean
): {
  enter: EntryAction;
  activeEffect?: InPlaceAction;
  exit?: ExitAction;
  exitDuration: number;
  lifecycle?: LayerLifecyclePlan;
} {
  const rawTokens = (beat.motionAction || "")
    .split("->")
    .map((s) => s.trim())
    .filter(Boolean);

  const isPunchline =
    beat.category.toLowerCase().includes("punchline") ||
    beat.category.toLowerCase().includes("joke");
  const isOverlay = beat.framing !== "fullscreen-cutaway";

  let enter: EntryAction = isFullCanvas ? "blur-snap" : isOverlay ? "slide-up" : "blur-snap";
  let activeEffect: InPlaceAction | undefined;
  let exit: ExitAction | undefined;
  let foundEntry = false;

  const entryAliasMap: Record<string, EntryAction> = {
    enter: "slide-up",
    "fade-blur": "blur-snap",
  };
  const inPlaceAliasMap: Record<string, InPlaceAction> = {
    focus: "spotlight-vignette",
    highlight: "highlight-sweep",
    "marker-sweep": "highlight-sweep",
    dock: "float-idle",
    "zoom-burst": "lens-zoom",
  };
  const exitAliasMap: Record<string, ExitAction> = {
    exit: "fade-blur-out",
    "glass-exit": "fade-blur-out",
    "fade-blur": "fade-blur-out",
  };

  for (const rawTok of rawTokens) {
    const tok = softenActionToken(rawTok, isPunchline);

    if (!foundEntry && (isEntryAction(tok) || entryAliasMap[tok])) {
      enter = isEntryAction(tok) ? tok : entryAliasMap[tok];
      foundEntry = true;
    } else if (!activeEffect && (isInPlaceAction(tok) || inPlaceAliasMap[tok])) {
      activeEffect = isInPlaceAction(tok) ? tok : inPlaceAliasMap[tok];
      // If slot-1 was already an in-place action, keep soft entry active
      foundEntry = true;
    } else if (!exit && (isExitAction(tok) || exitAliasMap[tok])) {
      exit = isExitAction(tok) ? tok : exitAliasMap[tok];
    }
  }

  const exitDuration = durationFrames >= 24 ? Math.min(10, Math.floor(durationFrames / 5)) : 0;

  // Build synchronized LiquidGlassObject lifecycle when lifecycle tokens are present
  const hasLifecycleTokens = rawTokens.some((t) =>
    ["enter", "focus", "dock", "highlight", "highlight-sweep", "marker-sweep", "nudge"].includes(t)
  );

  let lifecycle: LayerLifecyclePlan | undefined;
  if (hasLifecycleTokens && durationFrames >= 24) {
    const hint = normalizeComponentHint(beat);
    const isBottomOrTopBar =
      hint === "GlassBottomDock" || hint === "GlassFloatingToolbar";

    lifecycle = {
      enterFrame: 0,
      enterDuration: 1,
      initial: { x: 0, y: 0, scale: 1, opacity: 1 },
      entered: { x: 0, y: 0, scale: 1, opacity: 1 },
    };

    if (rawTokens.includes("focus")) {
      lifecycle.focusFrame = Math.floor(durationFrames * 0.24);
      lifecycle.focusDuration = 12;
      lifecycle.focused = { scale: 1.03, focusGlow: 0.85 };
    }
    if (
      rawTokens.includes("highlight") ||
      rawTokens.includes("highlight-sweep") ||
      rawTokens.includes("marker-sweep")
    ) {
      lifecycle.highlightFrame = Math.floor(durationFrames * 0.42);
      lifecycle.highlightDuration = 16;
    }
    if (rawTokens.includes("nudge")) {
      lifecycle.nudgeFrame = Math.floor(durationFrames * 0.45);
      lifecycle.nudgeDuration = 10;
    }
    if (rawTokens.includes("dock")) {
      lifecycle.dockFrame = Math.floor(durationFrames * 0.66);
      lifecycle.dockDuration = 14;
      lifecycle.docked = isBottomOrTopBar
        ? { x: 0, y: 8, scale: 0.96, opacity: 1 }
        : { x: 0, y: 88, scale: 0.90, opacity: 1 };
    }
  }

  return {
    enter,
    activeEffect,
    exit: exit ?? (exitDuration > 0 ? "fade-blur-out" : undefined),
    exitDuration,
    lifecycle,
  };
}

function normalizeComponentHint(beat: DirectorBeat): string {
  const raw = (beat.glassPreset || beat.componentHint || "GlassCard").trim();
  const map: Record<string, string> = {
    card: "GlassCard",
    LiquidGlassObject: "GlassCard",
    "LiquidGlassObject:card": "GlassCard",
    pill: "GlassCornerPill",
    "LiquidGlassObject:pill": "GlassCornerPill",
    dock: "GlassBottomDock",
    "LiquidGlassObject:dock": "GlassBottomDock",
    toolbar: "GlassFloatingToolbar",
    "LiquidGlassObject:toolbar": "GlassFloatingToolbar",
    toast: "GlassToastAlert",
    "LiquidGlassObject:toast": "GlassToastAlert",
    "split-modal": "GlassSplitModal",
    "LiquidGlassObject:split-modal": "GlassSplitModal",
  };
  return map[raw] ?? raw;
}

function resolveDefaultPreviewMode(beat: DirectorBeat, explicit?: PreviewMode): PreviewMode {
  if (explicit) return explicit;
  return beat.framing === "fullscreen-cutaway" ? "light-editorial" : "transparent";
}

interface BeatLayoutSlot {
  node: React.ReactNode;
  wrapperStyle?: React.CSSProperties;
  fullCanvas?: boolean;
}

const PagePaperCard: React.FC<{
  badge: string;
  subtitle?: string;
  title: string;
  body: string;
  metric?: { value: string; label?: string };
  citation?: string;
  isWarning?: boolean;
  width?: number;
}> = ({
  badge,
  subtitle,
  title,
  body,
  metric,
  citation,
  isWarning = false,
  width = 680,
}) => (
  <div
    style={{
      width,
      padding: "32px 36px",
      borderRadius: "16px",
      backgroundColor: PAGE_PALETTE.paperLight,
      border: `1px solid ${isWarning ? PAGE_PALETTE.riskBorder : PAGE_PALETTE.paperBorder}`,
      borderTop: `4px solid ${isWarning ? PAGE_PALETTE.brickRed : PAGE_PALETTE.navy}`,
      boxShadow: "0 22px 48px -12px rgba(28, 43, 58, 0.14)",
      userSelect: "none",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        paddingBottom: "14px",
        marginBottom: "18px",
        borderBottom: `1px solid ${PAGE_PALETTE.paperBorder}`,
      }}
    >
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: isWarning ? PAGE_PALETTE.brickRed : PAGE_PALETTE.paperLight,
          backgroundColor: isWarning ? PAGE_PALETTE.riskFill : PAGE_PALETTE.navy,
          border: `1px solid ${isWarning ? PAGE_PALETTE.riskBorder : PAGE_PALETTE.navy}`,
          borderRadius: "8px",
          padding: "4px 10px",
        }}
      >
        {badge}
      </span>
      {subtitle && (
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: "11px",
            color: PAGE_PALETTE.muted,
            letterSpacing: "0.04em",
          }}
        >
          {subtitle}
        </span>
      )}
    </div>

    <h3
      style={{
        margin: 0,
        fontFamily: FONTS.serif,
        fontSize: "28px",
        fontWeight: 700,
        lineHeight: 1.24,
        letterSpacing: "-0.015em",
        color: PAGE_PALETTE.navy,
      }}
    >
      {title}
    </h3>

    {metric && (
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "16px",
          marginTop: "18px",
          padding: "16px 20px",
          borderRadius: "12px",
          backgroundColor: isWarning ? PAGE_PALETTE.riskFill : PAGE_PALETTE.paper,
          border: `1px solid ${isWarning ? PAGE_PALETTE.riskBorder : PAGE_PALETTE.paperBorder}`,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: "38px",
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
            color: isWarning ? PAGE_PALETTE.brickRed : PAGE_PALETTE.navy,
            lineHeight: 1,
          }}
        >
          {metric.value}
        </span>
        {metric.label && (
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: "11px",
              color: PAGE_PALETTE.muted,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {metric.label}
          </span>
        )}
      </div>
    )}

    <div
      style={{
        marginTop: "16px",
        fontFamily: FONTS.sans,
        fontSize: "16px",
        fontWeight: 500,
        lineHeight: 1.58,
        color: PAGE_PALETTE.navy,
      }}
    >
      {body}
    </div>

    {citation && (
      <div
        style={{
          marginTop: "20px",
          paddingTop: "14px",
          borderTop: `1px solid ${PAGE_PALETTE.paperBorder}`,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "3px",
            height: "14px",
            borderRadius: "2px",
            backgroundColor: isWarning ? PAGE_PALETTE.brickRed : PAGE_PALETTE.navy,
          }}
        />
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: "11px",
            color: PAGE_PALETTE.muted,
            letterSpacing: "0.03em",
          }}
        >
          {citation}
        </span>
      </div>
    )}
  </div>
);

function renderBeatComponent(
  beat: DirectorBeat,
  beatFrames: number,
  glassLifecycle?: LayerLifecyclePlan
): BeatLayoutSlot {
  const hint = normalizeComponentHint(beat);
  const headline = deriveHeadline(beat);
  const metric = extractPrimaryMetric(beat.spokenText);
  const categoryLabel = formatCategoryLabel(beat.category);
  const styleLabel = formatStyleLabel(beat.styleFamily);

  const isWarning =
    beat.category.toLowerCase().includes("warn") ||
    beat.category.toLowerCase().includes("flag") ||
    beat.category.toLowerCase().includes("risk");
  const isJoke =
    beat.category.toLowerCase().includes("joke") ||
    beat.category.toLowerCase().includes("aside") ||
    beat.category.toLowerCase().includes("humor") ||
    beat.category.toLowerCase().includes("punchline");

  const isFullscreen = beat.framing === "fullscreen-cutaway";
  const isPageCutaway =
    beat.paletteMode === "page" || (beat.paletteMode !== "over-footage" && isFullscreen);
  const overFootageGlassTint = isWarning ? "warning" : "navy-glass";
  const kineticMode: KineticTextMode = VALID_KINETIC_MODES.has(beat.typographyMode ?? "")
    ? (beat.typographyMode as KineticTextMode)
    : "word-pop";

  // 1. Six Apple Liquid Glass Presets (Over Footage Smoked-Navy Glass) or Page Cutaway Card
  if (hint === "GlassCard") {
    if (isPageCutaway) {
      return {
        wrapperStyle: {
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        node: (
          <PagePaperCard
            badge={categoryLabel}
            subtitle={styleLabel}
            title={headline}
            metric={metric ? { value: metric.raw, label: "Key Figure" } : undefined}
            body={beat.spokenText}
            citation={beat.sourceCitation}
            isWarning={isWarning}
            width={720}
          />
        ),
      };
    }

    return {
      wrapperStyle: isFullscreen
        ? {
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }
        : { position: "absolute", right: "68px", top: "170px" },
      node: (
        <GlassCard
          badge={categoryLabel}
          badgeTone={isWarning ? "warning" : "gold"}
          subtitle={styleLabel}
          title={headline}
          metric={
            metric
              ? {
                  value: metric.raw,
                  label: "Key Figure",
                  delta: isWarning ? "Risk Signal" : undefined,
                  deltaPositive: !isWarning,
                }
              : undefined
          }
          body={beat.spokenText}
          citation={beat.sourceCitation}
          tint={overFootageGlassTint}
          lifecycle={glassLifecycle}
          enableSfx={false}
        />
      ),
    };
  }

  if (hint === "GlassCornerPill") {
    return {
      wrapperStyle: { position: "absolute", top: "52px", right: "64px" },
      node: (
        <GlassCornerPill
          badge={categoryLabel}
          label={headline}
          value={metric?.raw}
          tint={overFootageGlassTint}
          lifecycle={glassLifecycle}
          enableSfx={false}
        />
      ),
    };
  }

  if (hint === "GlassBottomDock") {
    return {
      wrapperStyle: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "56px",
        display: "flex",
        justifyContent: "center",
      },
      node: (
        <GlassBottomDock
          caption={categoryLabel}
          activeIndex={1}
          tint={overFootageGlassTint}
          lifecycle={glassLifecycle}
          items={[
            { label: "Format", value: styleLabel, icon: "01" },
            { label: trimToWholeWords(headline, 26), value: metric?.raw ?? "Key Point", icon: "02", active: true },
            { label: "Pace", value: `${beat.durationSec.toFixed(1)}s`, icon: "03" },
          ]}
          enableSfx={false}
        />
      ),
    };
  }

  if (hint === "GlassFloatingToolbar") {
    return {
      wrapperStyle: {
        position: "absolute",
        left: 0,
        right: 0,
        top: "48px",
        display: "flex",
        justifyContent: "center",
      },
      node: (
        <GlassFloatingToolbar
          prefix={categoryLabel}
          autoCycleFrames={Math.max(15, Math.floor(beatFrames / 3))}
          tint={overFootageGlassTint}
          lifecycle={glassLifecycle}
          items={[
            { tag: "01", label: "Baseline" },
            { tag: "02", label: trimToWholeWords(headline, 24) },
            { tag: "03", label: "Impact" },
          ]}
          rightSlot={metric?.raw}
          enableSfx={false}
        />
      ),
    };
  }

  if (hint === "GlassToastAlert") {
    return {
      wrapperStyle: { position: "absolute", top: "52px", right: "64px" },
      node: (
        <GlassToastAlert
          title={headline}
          message={beat.spokenText}
          variant={isWarning ? "warning" : isJoke ? "joke" : "info"}
          tint={isWarning ? "warning" : isJoke ? "gold" : "navy-glass"}
          tag={categoryLabel}
          timestamp={`${beat.durationSec.toFixed(1)}s`}
          lifecycle={glassLifecycle}
          enableSfx={false}
        />
      ),
    };
  }

  if (hint === "GlassSplitModal") {
    const parts = beat.spokenText.split(/\bvs\.?\b|\bwhile\b|\bversus\b/i);
    const leftText = parts[0]?.trim() || headline;
    const rightText = parts[1]?.trim() || beat.cutReason || "Counterpoint";
    const leftMetric = extractPrimaryMetric(leftText);
    const rightMetric = extractPrimaryMetric(rightText);

    return {
      wrapperStyle: isFullscreen
        ? {
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }
        : { position: "absolute", right: "64px", top: "160px" },
      node: (
        <GlassSplitModal
          eyebrow={categoryLabel}
          title={headline}
          tint="navy-glass"
          lifecycle={glassLifecycle}
          left={{
            label: "Baseline",
            value: leftMetric?.raw ?? "Current",
            sublabel: leftText.slice(0, 80),
            highlight: true,
          }}
          right={{
            label: isWarning ? "Risk Shift" : "Impact",
            value: rightMetric?.raw ?? "Shift",
            sublabel: rightText.slice(0, 80),
            isRisk: isWarning,
          }}
          footer={beat.sourceCitation}
          width={isFullscreen ? 860 : 660}
          enableSfx={false}
        />
      ),
    };
  }

  // 2. Broadcast & Document Components
  if (hint === "NewsPackageLowerThird") {
    return {
      fullCanvas: true,
      node: (
        <NewsPackageLowerThird
          category={categoryLabel}
          title={headline}
          source={beat.sourceCitation || "Editorial Record"}
          mode={isWarning ? "LIVE" : "ANALYSIS"}
          atFrame={0}
        />
      ),
    };
  }

  if (hint === "CaptionNewsCard") {
    return {
      fullCanvas: true,
      node: (
        <CaptionNewsCard
          dateline={categoryLabel}
          headline={headline}
          body={beat.spokenText}
          atFrame={0}
        />
      ),
    };
  }

  if (hint === "VisualInvestigationBoard") {
    return {
      fullCanvas: true,
      node: (
        <VisualInvestigationBoard
          atFrame={0}
          pointerTargetId="e2"
          evidenceItems={[
            { id: "e1", label: "Topic", value: trimToWholeWords(headline, 28) },
            { id: "e2", label: categoryLabel, value: metric?.raw ?? "Risk Flag", isFlagged: true },
            {
              id: "e3",
              label: "Source",
              value: trimToWholeWords(beat.sourceCitation || "Editorial Record", 32),
            },
          ]}
        />
      ),
    };
  }

  if (hint === "LiveCountdownSplit") {
    return {
      fullCanvas: true,
      node: (
        <LiveCountdownSplit
          leftTitle={trimToWholeWords(headline, 28)}
          rightTitle={categoryLabel}
          atFrame={0}
          duration={Math.max(30, beatFrames - 15)}
        />
      ),
    };
  }

  if (hint === "TelestratorOverlay") {
    return {
      fullCanvas: true,
      node: (
        <TelestratorOverlay
          atFrame={0}
          duration={Math.min(30, beatFrames)}
          circleTarget={{ cx: 1320, cy: 480, r: 160, label: metric?.raw ?? headline }}
        />
      ),
    };
  }

  if (hint === "KinoMontageStrip") {
    return {
      fullCanvas: isFullscreen,
      wrapperStyle: isFullscreen
        ? undefined
        : { position: "absolute", left: "80px", bottom: "140px" },
      node: (
        <KinoMontageStrip
          numberText={metric?.raw ?? "01"}
          headerText={headline}
          subtitle={beat.spokenText}
          category={categoryLabel}
          fullScene={isFullscreen}
          atFrame={0}
        />
      ),
    };
  }

  if (hint === "ArchiveLightTable") {
    return {
      fullCanvas: true,
      node: (
        <ArchiveLightTable>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              padding: "96px",
            }}
          >
            <PagePaperCard
              badge={categoryLabel}
              subtitle="Archive Record"
              title={headline}
              body={beat.spokenText}
              citation={beat.sourceCitation}
              isWarning={isWarning}
              width={680}
            />
          </div>
        </ArchiveLightTable>
      ),
    };
  }

  if (hint === "CitySymphonyFrame") {
    return {
      fullCanvas: true,
      node: (
        <>
          <CitySymphonyFrame
            timecode={`00:${String(Math.floor(beat.startFrame / 30)).padStart(2, "0")}:00`}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "96px",
            }}
          >
            <EditorialHeadline
              variant="chapter-card"
              category={categoryLabel}
              title={headline}
              subtitle={beat.spokenText}
              atFrame={0}
              duration={beatFrames}
              enableSfx={false}
            />
          </div>
        </>
      ),
    };
  }

  if (hint === "StainedGlassFrame") {
    return {
      fullCanvas: true,
      node: (
        <StainedGlassFrame>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              padding: "80px",
            }}
          >
            <PagePaperCard
              badge={categoryLabel}
              subtitle={styleLabel}
              title={headline}
              metric={
                metric
                  ? {
                      value: metric.raw,
                      label: "Key Figure",
                    }
                  : undefined
              }
              body={beat.spokenText}
              citation={beat.sourceCitation}
              isWarning={isWarning}
              width={720}
            />
          </div>
        </StainedGlassFrame>
      ),
    };
  }

  if (hint === "IsometricScene") {
    return {
      fullCanvas: true,
      node: (
        <IsometricScene>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              padding: "80px",
            }}
          >
            <EditorialHeadline
              variant="newspaper-cutout"
              category={categoryLabel}
              title={headline}
              subtitle={beat.spokenText}
              atFrame={0}
              duration={beatFrames}
              enableSfx={false}
            />
          </div>
        </IsometricScene>
      ),
    };
  }

  // 3. Vintage & Diagram Metaphor Components
  if (hint === "Newsreel1920s") {
    return {
      fullCanvas: true,
      node: (
        <Newsreel1920s placeDate={categoryLabel} headline={headline} atFrame={0}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "96px",
              textAlign: "center",
              fontFamily: FONTS.serif,
              fontSize: "34px",
              color: "#EFE6CF",
            }}
          >
            {beat.spokenText}
          </div>
        </Newsreel1920s>
      ),
    };
  }

  if (hint === "SilentFilmCard") {
    return {
      fullCanvas: true,
      node: <SilentFilmCard title={headline} dialogue={beat.spokenText} atFrame={0} />,
    };
  }

  if (hint === "SpyTitleSequence") {
    return {
      fullCanvas: true,
      node: <SpyTitleSequence title={headline} codeName={categoryLabel} atFrame={0} />,
    };
  }

  if (hint === "CollageCutout") {
    return {
      wrapperStyle: { position: "absolute", right: "96px", top: "200px" },
      node: (
        <CollageCutout atFrame={0}>
          <div style={{ padding: "24px 32px", maxWidth: "460px", color: COLORS.navy }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: "12px", fontWeight: 700, color: COLORS.brickRed }}>
              {categoryLabel}
            </div>
            <div style={{ fontFamily: FONTS.serif, fontSize: "28px", fontWeight: 800, marginTop: "8px" }}>
              {headline}
            </div>
          </div>
        </CollageCutout>
      ),
    };
  }

  if (hint === "StickerCutout" || hint === "StickFigureStage") {
    return {
      wrapperStyle: { position: "absolute", right: "96px", top: "140px" },
      node: (
        <StickerCutout atFrame={0}>
          <div style={{ backgroundColor: "#FFFFFF", padding: "16px 24px" }}>
            <StickFigureStage
              pose={isWarning ? "shocked" : "pointing"}
              caption={headline}
              accentColor={COLORS.brickRed}
            />
          </div>
        </StickerCutout>
      ),
    };
  }

  if (hint === "InstructionManualCard") {
    const isTaxBeat = /paycheck|payroll|tax|receipt/i.test(beat.spokenText);
    return {
      wrapperStyle: { position: "absolute", right: "72px", top: "180px" },
      node: (
        <InstructionManualCard
          stepNumber={1}
          title={headline}
          leftLabel={isTaxBeat ? "TAXES (84%)" : "BASELINE"}
          rightLabel={isTaxBeat ? "TREASURY" : "OUTCOME"}
          atFrame={0}
        />
      ),
    };
  }

  // 4. Data, Maps & 3D Components
  if (hint === "MapExplainer") {
    const loc = resolveLocationConfig(beat.spokenText, headline);
    return {
      fullCanvas: true,
      node: (
        <MapExplainer
          region={loc.region}
          highlightStatesFips={loc.highlightStatesFips}
          highlightLabel={loc.highlightLabel}
          routeTone={isWarning ? "alert" : "secondary"}
          atFrame={0}
        />
      ),
    };
  }

  if (hint === "DataPhysicalCard") {
    const metrics = extractAllMetrics(beat.spokenText);
    const val1 = metrics[0]?.numeric ?? 84;
    const hasSecond = metrics.length >= 2;
    const val2 = hasSecond
      ? metrics[1].numeric
      : Math.max(5, Math.min(40, Math.round(100 - val1)));

    const isReceipts = /paycheck|payroll|corporate/i.test(beat.spokenText);
    const label1 = isReceipts
      ? `Paychecks (${metrics[0]?.raw ?? `${Math.round(val1)}%`})`
      : trimToWholeWords(headline, 22);
    const label2 = isReceipts
      ? `Corporate (${metrics[1]?.raw ?? `${Math.round(val2)}%`})`
      : hasSecond
      ? `Comparison (${metrics[1].raw})`
      : "Baseline";

    return {
      wrapperStyle: { position: "absolute", right: "72px", top: "160px" },
      node: (
        <DataPhysicalCard
          label1={label1}
          value1={Math.min(100, Math.max(5, Math.round(val1)))}
          label2={label2}
          value2={Math.min(100, Math.max(5, Math.round(val2)))}
          atFrame={0}
        />
      ),
    };
  }

  if (hint === "WhiteModel3D") {
    return {
      wrapperStyle: { position: "absolute", right: "72px", top: "180px" },
      node: <WhiteModel3D width={580} height={380} />,
    };
  }

  if (hint === "BlobSimulation") {
    return {
      wrapperStyle: { position: "absolute", right: "72px", top: "220px" },
      node: <BlobSimulation />,
    };
  }

  if (hint === "DataTicker" && metric?.numeric !== null && metric) {
    if (!isPageCutaway) {
      return {
        wrapperStyle: { position: "absolute", right: "72px", top: "200px" },
        node: (
          <LiquidGlassObject
            borderRadius={22}
            tint={overFootageGlassTint}
            enableSfx={false}
          >
            <div style={{ padding: "28px 36px" }}>
              <DataTicker
                startValue={0}
                endValue={metric.numeric}
                prefix={metric.prefix}
                suffix={metric.suffix}
                label={headline}
                color={OVER_FOOTAGE_PALETTE.textHeadline}
                accentColor={
                  isWarning
                    ? OVER_FOOTAGE_PALETTE.brickRedText
                    : OVER_FOOTAGE_PALETTE.accentPrimary
                }
                darkSurface={true}
                atFrame={0}
                duration={Math.min(45, Math.max(18, beatFrames - 12))}
                enableSfx={false}
              />
            </div>
          </LiquidGlassObject>
        ),
      };
    }
    return {
      wrapperStyle: { position: "absolute", right: "72px", top: "200px" },
      node: (
        <div
          style={{
            padding: "28px 36px",
            borderRadius: "20px",
            backgroundColor: PAGE_PALETTE.paperLight,
            border: `1px solid ${PAGE_PALETTE.paperBorder}`,
            boxShadow: "0 20px 44px rgba(28, 43, 58, 0.14)",
          }}
        >
          <DataTicker
            startValue={0}
            endValue={metric.numeric}
            prefix={metric.prefix}
            suffix={metric.suffix}
            label={headline}
            color={PAGE_PALETTE.navy}
            accentColor={isWarning ? PAGE_PALETTE.brickRed : PAGE_PALETTE.navy}
            atFrame={0}
            duration={Math.min(45, Math.max(18, beatFrames - 12))}
            enableSfx={false}
          />
        </div>
      ),
    };
  }

  if (hint === "EditorialHeadline" || isFullscreen) {
    return {
      wrapperStyle: {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px",
      },
      node: (
        <EditorialHeadline
          variant={
            beat.styleFamily === "vintage-editorial" && beat.componentHint === "SpyTitleSequence"
              ? "spy-title"
              : "chapter-card"
          }
          category={categoryLabel}
          title={headline}
          subtitle={beat.spokenText}
          atFrame={0}
          duration={beatFrames}
          enableSfx={false}
        />
      ),
    };
  }

  if (hint === "KineticText") {
    if (!isPageCutaway) {
      return {
        wrapperStyle: {
          position: "absolute",
          left: "80px",
          right: "80px",
          bottom: "96px",
          display: "flex",
          justifyContent: "center",
        },
        node: (
          <LiquidGlassObject
            borderRadius={16}
            tint={overFootageGlassTint}
            enableSfx={false}
          >
            <div style={{ padding: "18px 32px" }}>
              <KineticText
                text={beat.spokenText}
                mode={kineticMode}
                atFrame={0}
                duration={beatFrames}
                fontSize={32}
                color={OVER_FOOTAGE_PALETTE.textHeadline}
                highlightColor={
                  isWarning
                    ? OVER_FOOTAGE_PALETTE.brickRedText
                    : OVER_FOOTAGE_PALETTE.accentPrimary
                }
                style={{ textShadow: OVER_FOOTAGE_PALETTE.textShadow }}
                enableSfx={false}
              />
            </div>
          </LiquidGlassObject>
        ),
      };
    }
    return {
      wrapperStyle: {
        position: "absolute",
        left: "80px",
        right: "80px",
        bottom: "96px",
        display: "flex",
        justifyContent: "center",
      },
      node: (
        <div
          style={{
            backgroundColor: "rgba(250, 248, 243, 0.95)",
            padding: "18px 32px",
            borderRadius: "14px",
            border: `1px solid ${PAGE_PALETTE.paperBorder}`,
            borderLeft: `4px solid ${PAGE_PALETTE.navy}`,
            boxShadow: "0 18px 40px rgba(28, 43, 58, 0.14)",
          }}
        >
          <KineticText
            text={beat.spokenText}
            mode={kineticMode}
            atFrame={0}
            duration={beatFrames}
            fontSize={32}
            color={PAGE_PALETTE.navy}
            highlightColor={isWarning ? PAGE_PALETTE.brickRed : PAGE_PALETTE.navy}
            enableSfx={false}
          />
        </div>
      ),
    };
  }

  if (isPageCutaway) {
    return {
      wrapperStyle: {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      node: (
        <PagePaperCard
          badge={categoryLabel}
          subtitle={styleLabel}
          title={headline}
          body={beat.spokenText}
          citation={beat.sourceCitation}
          isWarning={isWarning}
        />
      ),
    };
  }

  // Default fallback: Over Footage crystal-clear smoked-navy Liquid Glass card
  return {
    wrapperStyle: { position: "absolute", right: "68px", top: "170px" },
    node: (
      <GlassCard
        badge={categoryLabel}
        badgeTone={isWarning ? "warning" : "gold"}
        title={headline}
        body={beat.spokenText}
        citation={beat.sourceCitation}
        tint={overFootageGlassTint}
        lifecycle={glassLifecycle}
        enableSfx={false}
      />
    ),
  };
}

/**
 * DirectorBeatRenderer
 * Renders any single beat from director-plan.json in Over Footage smoked-navy
 * Liquid Glass mode (transparent/camera/simulated-room) or Page milk-canvas cutaway mode.
 */
export const DirectorBeatRenderer: React.FC<DirectorBeatRendererProps> = ({
  beat = DEFAULT_DIRECTOR_BEAT,
  previewMode,
  cameraSrc,
  renderAudio = true,
}) => {
  const { durationInFrames } = useVideoConfig();
  const resolvedPreview = resolveDefaultPreviewMode(beat, previewMode);
  const normalizedHint = normalizeComponentHint(beat);
  const isFullCanvas =
    [
      "NewsPackageLowerThird",
      "CaptionNewsCard",
      "VisualInvestigationBoard",
      "LiveCountdownSplit",
      "TelestratorOverlay",
      "ArchiveLightTable",
      "CitySymphonyFrame",
      "StainedGlassFrame",
      "IsometricScene",
      "Newsreel1920s",
      "SilentFilmCard",
      "SpyTitleSequence",
      "MapExplainer",
    ].includes(normalizedHint) ||
    (normalizedHint === "KinoMontageStrip" && beat.framing === "fullscreen-cutaway");

  const { enter, activeEffect, exit, exitDuration, lifecycle } = resolveMotionProps(
    beat,
    durationInFrames,
    isFullCanvas
  );
  const slot = renderBeatComponent(beat, durationInFrames, lifecycle);
  const enterDuration = Math.min(14, Math.max(6, Math.floor(durationInFrames / 6)));

  return (
    <CameraPreviewStage previewMode={resolvedPreview} cameraSrc={cameraSrc}>
      {/* Synchronized procedural SFX cues from beat.sfxCues */}
      {renderAudio &&
        (beat.sfxCues || []).map((cueItem, idx) => {
          if (!VALID_SFX.has(cueItem.cue)) return null;
          return (
            <SfxCue
              key={`${beat.id}-sfx-${idx}`}
              cue={cueItem.cue as SfxName}
              atFrame={Math.max(0, cueItem.offsetFrame ?? 0)}
              volume={cueItem.volume ?? 0.65}
            />
          );
        })}

      {/* Animated graphic / Liquid Glass layer */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {slot.fullCanvas ? (
          <ObjectAnimator
            enter={enter}
            enterDuration={enterDuration}
            activeEffect={activeEffect}
            exit={exit}
            exitDuration={exitDuration}
            atFrame={0}
            duration={durationInFrames}
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {slot.node}
          </ObjectAnimator>
        ) : (
          <div style={slot.wrapperStyle}>
            <ObjectAnimator
              enter={enter}
              enterDuration={enterDuration}
              activeEffect={activeEffect}
              exit={exit}
              exitDuration={exitDuration}
              atFrame={0}
              duration={durationInFrames}
            >
              {slot.node}
            </ObjectAnimator>
          </div>
        )}
      </AbsoluteFill>

      {/* Source citation badge when cutaway doesn't already embed it */}
      {beat.sourceCitation &&
        beat.framing === "fullscreen-cutaway" &&
        ![
          "GlassCard",
          "GlassSplitModal",
          "NewsPackageLowerThird",
          "ArchiveLightTable",
          "StainedGlassFrame",
        ].includes(normalizedHint) && <SourceBadge sourceText={beat.sourceCitation} startFrame={8} />}
    </CameraPreviewStage>
  );
};
