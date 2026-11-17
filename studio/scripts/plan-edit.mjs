#!/usr/bin/env node
/**
 * Zero-build Audience-Engineering Director CLI
 *
 * Parses either:
 *   1. Whisper word-level JSON (tools/transcribe.py -> words.json)
 *   2. Plain Markdown / text spoken script (.md / .txt, estimated at 150 WPM)
 *
 * Outputs a deterministic DirectorPlan JSON rotating across all 5 style engine
 * families and 24 implemented styles, balancing Money & Macro talking head (30-40%)
 * with Dual-Palette cutaways (Page #FAF8F3 milk canvas + Over Footage navy Liquid Glass),
 * and auditing pacing & citations.
 *
 * Usage:
 *   node scripts/plan-edit.mjs <words.json_or_script.md> [--out out/director-plan.json] [--title "..."] [--fps 30] [--wpm 150]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ============================================================================
// 1. 24-Style Catalog (Exact parity with studio/src/director/planner.ts)
// ============================================================================
export const STYLE_CATALOG = [
  {
    id: "liquid-glass-card",
    styleFamily: "liquid-glass",
    componentHint: "LiquidGlassObject:card",
    framing: "talking-head-with-glass",
    motionAction: "slide-left -> glow-rim -> fade-blur-out",
    glassPreset: "card",
    typographyMode: "marker-sweep",
    defaultSfx: "glass-enter",
    secondarySfx: "glass-dock",
    paceProfile: "balanced",
  },
  {
    id: "liquid-glass-dock",
    styleFamily: "liquid-glass",
    componentHint: "LiquidGlassObject:dock",
    framing: "talking-head-with-glass",
    motionAction: "slide-up -> highlight-sweep -> fade-out",
    glassPreset: "dock",
    typographyMode: "split-lines",
    defaultSfx: "glass-dock",
    secondarySfx: "marker-sweep",
    paceProfile: "balanced",
  },
  {
    id: "liquid-glass-toast",
    styleFamily: "liquid-glass",
    componentHint: "LiquidGlassObject:toast",
    framing: "talking-head-punch-in",
    motionAction: "pop-out -> nudge -> pop-down",
    glassPreset: "toast",
    typographyMode: "red-correction",
    defaultSfx: "glass-enter",
    secondarySfx: "alert-ping",
    paceProfile: "snappy",
  },
  {
    id: "doc-news-package",
    styleFamily: "doc-broadcast",
    componentHint: "NewsPackageLowerThird",
    framing: "talking-head-with-glass",
    motionAction: "slide-left -> highlight-sweep -> fade-out",
    typographyMode: "karaoke-highlight",
    defaultSfx: "glass-enter",
    secondarySfx: "data-tick",
    paceProfile: "balanced",
  },
  {
    id: "doc-caption-news",
    styleFamily: "doc-broadcast",
    componentHint: "CaptionNewsCard",
    framing: "fullscreen-cutaway",
    motionAction: "paper-unfold -> highlight-sweep -> fade-out",
    typographyMode: "marker-sweep",
    defaultSfx: "paper-slide",
    secondarySfx: "marker-sweep",
    paceProfile: "calm-hold",
  },
  {
    id: "doc-visual-investigation",
    styleFamily: "doc-broadcast",
    componentHint: "VisualInvestigationBoard",
    framing: "fullscreen-cutaway",
    motionAction: "blur-snap -> pulse-warning -> fade-blur-out",
    typographyMode: "stamp-slam",
    defaultSfx: "flash-cut",
    secondarySfx: "warning-thud",
    paceProfile: "calm-hold",
    peakOnly: true,
  },
  {
    id: "doc-archive-light-table",
    styleFamily: "doc-broadcast",
    componentHint: "ArchiveLightTable",
    framing: "fullscreen-cutaway",
    motionAction: "blur-snap -> lens-zoom -> fade-out",
    typographyMode: "typewriter",
    defaultSfx: "paper-slide",
    secondarySfx: "marker-sweep",
    paceProfile: "calm-hold",
  },
  {
    id: "doc-live-countdown-split",
    styleFamily: "doc-broadcast",
    componentHint: "LiveCountdownSplit",
    framing: "split-screen",
    motionAction: "slide-up -> split-compare -> fade-out",
    typographyMode: "word-pop",
    defaultSfx: "data-tick",
    secondarySfx: "riser-subtle",
    paceProfile: "balanced",
  },
  {
    id: "doc-telestrator",
    styleFamily: "doc-broadcast",
    componentHint: "TelestratorOverlay",
    framing: "split-screen",
    motionAction: "pop-out -> circle-telestrator -> fade-out",
    typographyMode: "marker-sweep",
    defaultSfx: "telestrator-draw",
    secondarySfx: "marker-sweep",
    paceProfile: "balanced",
  },
  {
    id: "doc-kino-montage",
    styleFamily: "doc-broadcast",
    componentHint: "KinoMontageStrip",
    framing: "fullscreen-cutaway",
    motionAction: "slide-left -> lens-zoom -> fade-out",
    typographyMode: "word-pop",
    defaultSfx: "flash-cut",
    secondarySfx: "chapter-chime",
    paceProfile: "snappy",
  },
  {
    id: "doc-city-symphony",
    styleFamily: "doc-broadcast",
    componentHint: "CitySymphonyFrame",
    framing: "fullscreen-cutaway",
    motionAction: "blur-snap -> ken-burns -> fade-out",
    typographyMode: "split-lines",
    defaultSfx: "camera-shutter",
    paceProfile: "calm-hold",
  },
  {
    id: "vintage-newsreel",
    styleFamily: "vintage-editorial",
    componentHint: "Newsreel1920s",
    framing: "fullscreen-cutaway",
    motionAction: "iris-reveal -> ken-burns -> fade-out",
    typographyMode: "typewriter",
    defaultSfx: "newsreel-click",
    secondarySfx: "paper-slide",
    paceProfile: "calm-hold",
  },
  {
    id: "vintage-silent-film",
    styleFamily: "vintage-editorial",
    componentHint: "SilentFilmCard",
    framing: "fullscreen-cutaway",
    motionAction: "iris-reveal -> lens-zoom -> fade-out",
    typographyMode: "split-lines",
    defaultSfx: "chapter-chime",
    paceProfile: "balanced",
  },
  {
    id: "vintage-collage",
    styleFamily: "vintage-editorial",
    componentHint: "CollageCutout",
    framing: "fullscreen-cutaway",
    motionAction: "pop-out -> nudge -> fade-out",
    typographyMode: "word-pop",
    defaultSfx: "paper-flip-fast",
    secondarySfx: "sticker-pop",
    paceProfile: "snappy",
  },
  {
    id: "vintage-spy-titles",
    styleFamily: "vintage-editorial",
    componentHint: "SpyTitleSequence",
    framing: "fullscreen-cutaway",
    motionAction: "curtain-wipe -> magnifier-pan -> fade-out",
    typographyMode: "typewriter",
    defaultSfx: "flash-cut",
    secondarySfx: "type-click",
    paceProfile: "balanced",
  },
  {
    id: "vintage-stained-glass",
    styleFamily: "vintage-editorial",
    componentHint: "StainedGlassFrame",
    framing: "split-screen",
    motionAction: "curtain-wipe -> split-compare -> fade-out",
    typographyMode: "split-lines",
    defaultSfx: "chapter-chime",
    paceProfile: "calm-hold",
  },
  {
    id: "diagram-sticker",
    styleFamily: "diagram-metaphor",
    componentHint: "StickerCutout",
    framing: "talking-head-punch-in",
    motionAction: "elastic-open -> nudge -> pop-down",
    typographyMode: "word-pop",
    defaultSfx: "sticker-pop",
    paceProfile: "snappy",
  },
  {
    id: "diagram-stick-figure",
    styleFamily: "diagram-metaphor",
    componentHint: "StickFigureStage",
    framing: "fullscreen-cutaway",
    motionAction: "pop-out -> float-idle -> fade-out",
    typographyMode: "karaoke-highlight",
    defaultSfx: "sticker-pop",
    secondarySfx: "paper-slide",
    paceProfile: "balanced",
  },
  {
    id: "diagram-instruction-manual",
    styleFamily: "diagram-metaphor",
    componentHint: "InstructionManualCard",
    framing: "fullscreen-cutaway",
    motionAction: "paper-unfold -> underline-draw -> fade-out",
    typographyMode: "split-lines",
    defaultSfx: "paper-slide",
    secondarySfx: "telestrator-draw",
    paceProfile: "balanced",
  },
  {
    id: "diagram-isometric",
    styleFamily: "diagram-metaphor",
    componentHint: "IsometricScene",
    framing: "fullscreen-cutaway",
    motionAction: "slide-up -> tilt-3d -> fade-out",
    typographyMode: "word-pop",
    defaultSfx: "data-tick",
    paceProfile: "calm-hold",
  },
  {
    id: "data-map-explainer",
    styleFamily: "data-maps-3d",
    componentHint: "MapExplainer",
    framing: "fullscreen-cutaway",
    motionAction: "blur-snap -> circle-telestrator -> fade-out",
    typographyMode: "split-lines",
    defaultSfx: "map-whoosh",
    secondarySfx: "marker-sweep",
    paceProfile: "calm-hold",
  },
  {
    id: "data-physical-card",
    styleFamily: "data-maps-3d",
    componentHint: "DataPhysicalCard",
    framing: "fullscreen-cutaway",
    motionAction: "slide-up -> card-tilt-3d -> fade-blur-out",
    typographyMode: "word-pop",
    defaultSfx: "data-tick",
    secondarySfx: "marker-sweep",
    paceProfile: "calm-hold",
  },
  {
    id: "data-white-model-3d",
    styleFamily: "data-maps-3d",
    componentHint: "WhiteModel3D",
    framing: "fullscreen-cutaway",
    motionAction: "blur-snap -> parallax-hover -> fade-blur-out",
    typographyMode: "split-lines",
    defaultSfx: "riser-subtle",
    secondarySfx: "data-tick",
    paceProfile: "calm-hold",
  },
  {
    id: "data-blob-simulation",
    styleFamily: "data-maps-3d",
    componentHint: "BlobSimulation",
    framing: "fullscreen-cutaway",
    motionAction: "blur-snap -> orbit-float -> fade-blur-out",
    typographyMode: "karaoke-highlight",
    defaultSfx: "ambient-tension-drone",
    secondarySfx: "data-tick",
    paceProfile: "calm-hold",
  },
];

const RECIPE_BY_ID = Object.fromEntries(STYLE_CATALOG.map((r) => [r.id, r]));

const CATEGORY_RECIPE_PRIORITIES = {
  hook: [
    "doc-kino-montage",
    "liquid-glass-card",
    "vintage-collage",
    "data-physical-card",
    "doc-live-countdown-split",
  ],
  "thesis-promise": [
    "liquid-glass-dock",
    "diagram-instruction-manual",
    "doc-news-package",
    "vintage-stained-glass",
    "data-white-model-3d",
  ],
  "receipt-proof": [
    "doc-archive-light-table",
    "data-physical-card",
    "doc-caption-news",
    "liquid-glass-card",
    "doc-telestrator",
    "doc-news-package",
  ],
  "metaphor-story": [
    "diagram-isometric",
    "data-white-model-3d",
    "diagram-stick-figure",
    "liquid-glass-card",
    "vintage-collage",
    "doc-city-symphony",
  ],
  "good-work-punchline": [
    "diagram-sticker",
    "liquid-glass-toast",
    "vintage-collage",
    "doc-telestrator",
  ],
  "history-archive": [
    "vintage-newsreel",
    "doc-archive-light-table",
    "vintage-silent-film",
    "vintage-spy-titles",
    "data-map-explainer",
  ],
  "map-geopolitics": [
    "data-map-explainer",
    "doc-city-symphony",
    "vintage-spy-titles",
    "liquid-glass-card",
    "doc-telestrator",
  ],
  "warning-escalation": [
    "doc-visual-investigation",
    "doc-live-countdown-split",
    "data-blob-simulation",
    "vintage-spy-titles",
    "liquid-glass-toast",
    "doc-kino-montage",
  ],
  "claire-ledger": [
    "diagram-stick-figure",
    "liquid-glass-card",
    "doc-live-countdown-split",
    "diagram-instruction-manual",
    "data-physical-card",
  ],
  "open-loop": [
    "liquid-glass-dock",
    "vintage-silent-film",
    "doc-news-package",
    "diagram-instruction-manual",
    "vintage-stained-glass",
  ],
  takeaway: [
    "liquid-glass-card",
    "vintage-silent-film",
    "doc-city-symphony",
    "diagram-stick-figure",
  ],
};

// ============================================================================
// 2. Classification & Citation Extraction
// ============================================================================
const JOKE_PATTERNS = [
  /\blandlord\b/i,
  /\bforwarding that\b/i,
  /\bsee how it goes\b/i,
  /\bwhiteboard in palo alto\b/i,
  /\bdon'?t care what the robots are doing\b/i,
  /\bvote for one on purpose\b/i,
  /\bsave .* in a jar\b/i,
  /\bempty seat on a flight\b/i,
  /\bbad paymasters\b/i,
  /\bthat'?s great,?\s*right\b/i,
  /\bair conditioning\b/i,
  /\bshell company\b/i,
  /\bfunny\b|\bjoking\b|\bsarcas/i,
];

const CLAIRE_PATTERNS = [
  /\bclaire\b/i,
  /\b\$?3,?400\b/i,
  /\bthirty-four hundred\b/i,
  /\bthirty-year loan\b/i,
  /\brefinance\b/i,
  /\bunderwater homeowners?\b/i,
  /\bcounty sheriff\b|\bsheriff\b/i,
  /\b2055\b/i,
  /\bmortgage\b/i,
];

const HISTORY_PATTERNS = [
  /\b(1912|1929|1930s?|1933|1938|1941|1947|1982|2009|2020)\b/i,
  /\birving fisher\b/i,
  /\bharry truman\b/i,
  /\bpaint creek\b/i,
  /\bisland creek\b/i,
  /\bfair labor standards\b/i,
  /\bcompany scrip\b|\bbrass tokens\b/i,
  /\bgerman submarines\b|\bministry of food\b|\brationing\b|\bsixteen points\b/i,
  /\bwielechowski\b/i,
  /\bcentury ago\b/i,
  /\brotterdam\b|\bdetroit\b/i,
];

const MAP_PATTERNS = [
  /\btexas\b|\btaxas\b|\baustin\b/i,
  /\balaska\b/i,
  /\bireland\b/i,
  /\bwest london\b|\bm4 corridor\b|\blondon\b/i,
  /\bpjm\b|\bthirteen states\b|\billinois\b|\bnew jersey\b/i,
  /\bohio\b|\bwest virginia\b/i,
  /\bshenzhen\b|\bsuzhou\b|\bjapan\b/i,
  /\bthree mile island\b/i,
  /\bmap\b|\beastern grid\b|\bcorridor\b/i,
];

const PRIMARY_SOURCE_PATTERNS = [
  /\btable\s*9\b/i,
  /\bmonthly treasury statement\b/i,
  /\btreasury\b/i,
  /\bcongressional budget office\b|\bcbo\b/i,
  /\bforbes\b/i,
  /\biea\b|\binternational energy agency\b/i,
  /\bnextera\b/i,
  /\balphabet\b|\bamazon\b|\bmeta\b|\bmicrosoft\b|\boracle\b/i,
  /\bnvidia\b|\bjensen huang\b/i,
  /\blabor data\b|\bproduce per hour\b/i,
  /\bsupreme court\b/i,
  /\bthe economist\b/i,
  /\ball-in podcast\b/i,
  /\bposted\s+on\s+x\b/i,
];

const NUMERIC_RECEIPT_PATTERNS = [
  /\$[0-9]+(?:\.[0-9]+)?\s*(?:trillion|billion|million|thousand)?/i,
  /\b\d+(?:\.\d+)?\s*(?:percent|%|trillion|billion|gigawatts?|terawatt-hours?|megawatt-day|kilowatt)\b/i,
];

const WARNING_PATTERNS = [
  /\b2036\b/i,
  /\b2033\b|\b2034\b/i,
  /\bdebt deflation\b/i,
  /\bdefault\b/i,
  /\bchopping block\b/i,
  /\bprice crashes\b|\bcrashes right when\b/i,
  /\b833 percent\b/i,
  /\bten-year squeeze\b/i,
  /\bnegative free cash flow\b/i,
  /\bcut every check in half\b|\bcut her check in half\b|\bcuts her check in half\b/i,
  /\bwipes out\b|\bwiped out\b|\bthreat\b|\bcollapse\b/i,
  /\bcan'?t buy a single tin\b|\bvanished\b/i,
];

const OPEN_LOOP_PATTERNS = [
  /\bi'?ll show you why\b/i,
  /\bremember\b/i,
  /\bhang on to\b/i,
  /\bwhy does it break\b/i,
  /\bi know what you'?re thinking\b/i,
  /\bthere'?s a catch\b|\bhere'?s the catch\b/i,
  /\bjump ahead\b|\brun her through\b/i,
  /\bwho gets to decide\b|\bwhat happens to your money\b/i,
];

const THESIS_PATTERNS = [
  /\bthree escape hatches\b|\bescape hatch number\b/i,
  /\bbest argument\b|\bsteelman\b/i,
  /\bthe problem with it\b|\bthat'?s the whole problem\b/i,
  /\bunwritten agreement\b/i,
  /\bdoesn'?t survive\b/i,
  /\bdoes it differently\b|\bskip the government\b/i,
];

const METAPHOR_PATTERNS = [
  /\brunning shoes\b|\bdental x-ray\b/i,
  /\bphone charger\b|\bmicrowave\b/i,
  /\bairline miles\b|\bchecking account\b/i,
  /\bcopper wire\b|\btransformers\b|\bpower plants\b/i,
  /\boil well\b|\bdigital company town\b|\bauction\b/i,
  /\bnothing stops\b/i,
];

const TAKEAWAY_PATTERNS = [
  /\bit'?s an allowance\b|\bthat is an allowance\b/i,
  /\bpart people are missing\b/i,
  /\bnegotiate a check\b|\bcan'?t call it income\b/i,
  /\btell me in the comments\b|\bvideo'?s on screen\b/i,
  /\btwo hundred years\b/i,
];

const matchesAny = (text, patterns) => patterns.some((re) => re.test(text));

export function extractSourceCitation(text) {
  if (/table\s*9|monthly\s+treasury\s+statement|84(?:\.1)?\s*percent/i.test(text))
    return "U.S. Treasury — Monthly Treasury Statement, Table 9";
  if (/congressional\s+budget\s+office|\bcbo\b/i.test(text))
    return "Congressional Budget Office (CBO) Budget & Interest Projections";
  if (/40\.5\s*trillion|national\s+debt/i.test(text))
    return "U.S. Treasury — Fiscal Data (Debt to the Penny)";
  if (/18\.8\s*trillion|household(?:s)?\s+owe/i.test(text))
    return "Federal Reserve Bank of New York — Household Debt & Credit";
  if (/the\s+economist/i.test(text))
    return "The Economist (July 2026 Elon Musk Interview)";
  if (/posted\s+on\s+x|october\s+29/i.test(text))
    return "X Public Statement (Oct 29, 2026)";
  if (/1947|harry\s+truman|labor\s+data|produce\s+per\s+hour/i.test(text))
    return "U.S. Bureau of Labor Statistics (BLS) — Productivity & Labor Share";
  if (/alphabet|amazon|meta|microsoft|oracle|free\s+cash\s+flow/i.test(text))
    return "SEC 10-K / Quarterly Filings (Alphabet, Amazon, Meta, Microsoft)";
  if (/all-in\s+podcast|universal\s+basic\s+compute/i.test(text))
    return "All-In Podcast — Sam Altman (May 2024)";
  if (/forbes|uber/i.test(text))
    return "Forbes — Uber Engineering AI Token Cap Report (2026)";
  if (/nvidia|jensen\s+huang/i.test(text))
    return "Nvidia — Token Budget Guidance";
  if (/international\s+energy\s+agency|\biea\b|415\s+terawatt|945/i.test(text))
    return "International Energy Agency (IEA) — Electricity 2024–2030";
  if (/nextera/i.test(text))
    return "NextEra Energy — Hyperscale Load Guidance";
  if (/ireland|21\s*percent|twenty-one\s+percent|metered\s+power/i.test(text))
    return "Central Statistics Office (CSO) Ireland — Metered Electricity";
  if (/west\s+london|m4\s+corridor/i.test(text))
    return "Greater London Authority / UK M4 Substation Capacity Notice";
  if (/\bpjm\b|269\.92|833\s*percent/i.test(text))
    return "PJM Interconnection — 2025/2026 Capacity Auction";
  if (/three\s+mile\s+island/i.test(text))
    return "Constellation Energy / Microsoft 20-Year Nuclear PPA";
  if (/alaska|permanent\s+fund|wielechowski|bill\s+walker|each\s+resident\s+was\s+owed|4\s+billion\s+hole/i.test(text))
    return "Alaska Permanent Fund / Wielechowski v. State (2016)";
  if (/fair\s+labor\s+standards|paint\s+creek|island\s+creek|1938|1912/i.test(text))
    return "U.S. Fair Labor Standards Act (1938) / WV Scrip Archives";
  if (/shenzhen|suzhou|digital\s+yuan/i.test(text))
    return "PBOC Digital Yuan (e-CNY) Pilot Records (2020)";
  if (/ministry\s+of\s+food|1941|sixteen\s+points/i.test(text))
    return "UK Ministry of Food — Points Rationing Order (Dec 1941)";
  if (/irving\s+fisher|debt\s+deflation/i.test(text))
    return "Irving Fisher — Debt-Deflation Theory (1933)";
  if (/2009|underwater/i.test(text))
    return "Federal Reserve / CoreLogic Housing Equity Data (2009)";
  if (/stimulus\s+payments/i.test(text))
    return "U.S. Treasury — 2020 CARES Act Disbursement Data";
  if (/\btreasury\b/i.test(text))
    return "U.S. Department of the Treasury";
  return undefined;
}

export function classifyBeat(text, index, totalSegments) {
  const trimmed = text.trim();
  const safeTotal = Math.max(1, totalSegments);
  const ratio = index / safeTotal;

  if (index === 0) return "hook";
  if (
    index === 1 &&
    safeTotal >= 12 &&
    !matchesAny(trimmed, JOKE_PATTERNS) &&
    !matchesAny(trimmed, THESIS_PATTERNS)
  ) {
    return "hook";
  }

  if ((index >= safeTotal - 2 || ratio >= 0.92) && matchesAny(trimmed, TAKEAWAY_PATTERNS)) {
    return "takeaway";
  }
  if (matchesAny(trimmed, JOKE_PATTERNS)) return "good-work-punchline";
  if (matchesAny(trimmed, CLAIRE_PATTERNS)) return "claire-ledger";

  const hasPrimarySource = matchesAny(trimmed, PRIMARY_SOURCE_PATTERNS);
  const hasNumericReceipt = matchesAny(trimmed, NUMERIC_RECEIPT_PATTERNS);
  const hasWarning = matchesAny(trimmed, WARNING_PATTERNS);
  const hasHistory = matchesAny(trimmed, HISTORY_PATTERNS);
  const hasMap = matchesAny(trimmed, MAP_PATTERNS);

  if (hasHistory && !hasMap) return "history-archive";
  if (hasMap && !hasHistory) return "map-geopolitics";
  if (hasHistory && hasMap) return "history-archive";

  if (
    hasPrimarySource &&
    !/\b(2036|default|crashes|833 percent)\b/i.test(trimmed)
  ) {
    return "receipt-proof";
  }
  if (hasWarning) return "warning-escalation";
  if (matchesAny(trimmed, METAPHOR_PATTERNS)) return "metaphor-story";
  if (hasNumericReceipt) return "receipt-proof";
  if (matchesAny(trimmed, THESIS_PATTERNS)) return "thesis-promise";
  if (matchesAny(trimmed, OPEN_LOOP_PATTERNS) || /\?\s*$/.test(trimmed)) return "open-loop";
  if (index === safeTotal - 1) return "takeaway";
  return "metaphor-story";
}

// ============================================================================
// 3. Input Segmentation (Whisper words.json & Markdown/Plaintext @ 150 WPM)
// ============================================================================

const CONJUNCTION_STARTER_RE =
  /^(and|but|so|because|which|while|although|though|whereas|since|unless|until|when|where|before|after|if|or|yet|who|that)$/i;
const CLAUSE_PREP_VERB_RE =
  /^(is|are|was|were|will|would|could|should|can|has|have|had|come|comes|came|from|into|against|across|through|without|between|during|about|like|with)$/i;
const DETERMINER_PREP_RE =
  /^(the|a|an|this|that|these|those|your|our|their|its|of|to|in|on|at|for|by)$/i;
const TRAILING_FUNCTION_RE =
  /^(the|a|an|of|to|in|on|at|for|by|with|from|and|but|or|so|that|which|who|while|when|where|if|as|is|are|was|were|their|our|your|its|this|these|those)$/i;

function cleanAlphaToken(raw) {
  return String(raw || "").replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
}

function findNaturalWordSplitIndex(words, minK, maxK, targetK) {
  const lo = Math.max(1, Math.min(minK, maxK));
  const hi = Math.min(words.length - 1, Math.max(lo, maxK));
  let bestK = Math.max(lo, Math.min(hi, targetK));
  let bestScore = -1e9;

  for (let k = lo; k <= hi; k++) {
    let score = -Math.abs(k - targetK) * 2;
    const prevRaw = words[k - 1];
    const prevClean = cleanAlphaToken(prevRaw);
    const nextClean = cleanAlphaToken(words[k]);

    if (/[,;:\u2014]$/.test(prevRaw)) {
      score += 100;
    } else if (CONJUNCTION_STARTER_RE.test(nextClean)) {
      score += 75;
    } else if (CLAUSE_PREP_VERB_RE.test(nextClean)) {
      score += 50;
    } else if (DETERMINER_PREP_RE.test(nextClean)) {
      score += 25;
    }

    if (TRAILING_FUNCTION_RE.test(prevClean)) {
      score -= 90;
    }

    if (score > bestScore) {
      bestScore = score;
      bestK = k;
    }
  }
  return bestK;
}

function splitWordsAtNaturalBoundaries(words, maxWords, targetWords, minTailWords = 6) {
  if (words.length <= maxWords) {
    return [words];
  }
  const chunks = [];
  let remaining = words.slice();

  while (remaining.length > maxWords) {
    const safeTail = Math.min(minTailWords, Math.floor(remaining.length / 2));
    const kMax = Math.min(maxWords, remaining.length - safeTail);
    const kMin = Math.min(safeTail, kMax);
    const searchTarget =
      remaining.length - maxWords < safeTail
        ? Math.max(kMin, Math.floor(remaining.length / 2))
        : Math.min(kMax, Math.max(kMin, targetWords));
    const k = findNaturalWordSplitIndex(remaining, kMin, kMax, searchTarget);
    chunks.push(remaining.slice(0, k));
    remaining = remaining.slice(k);
  }
  if (remaining.length > 0) {
    chunks.push(remaining);
  }
  return chunks;
}

function appendBoundedSegment(out, seg, maxDurSec = 12.5) {
  const dur = Math.max(0.5, seg.endSec - seg.startSec);
  const words = seg.text.trim().split(/\s+/).filter(Boolean);
  if (dur <= maxDurSec || words.length < 10) {
    out.push(seg);
    return;
  }

  const maxWords = Math.min(28, Math.max(8, Math.floor((11.5 / dur) * words.length)));
  const targetWords = Math.max(6, Math.round(maxWords * 0.8));
  const wordSlices = splitWordsAtNaturalBoundaries(words, maxWords, targetWords, 6);
  if (wordSlices.length <= 1) {
    out.push(seg);
    return;
  }

  let cursor = seg.startSec;
  for (let i = 0; i < wordSlices.length; i++) {
    const slice = wordSlices[i];
    const isLast = i === wordSlices.length - 1;
    const sliceEnd = isLast
      ? seg.endSec
      : Number((cursor + (slice.length / words.length) * dur).toFixed(2));
    out.push({
      ...seg,
      id: seg.id ? `${seg.id}-${i + 1}` : undefined,
      text: slice.join(" "),
      startSec: Number(cursor.toFixed(2)),
      endSec: Math.max(Number((cursor + 0.5).toFixed(2)), sliceEnd),
    });
    cursor = sliceEnd;
  }
}

function normalizeAndBoundSegments(segments) {
  if (segments.length === 0) return [];
  const bounded = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const dur = Math.max(0.5, seg.endSec - seg.startSec);
    const words = seg.text.trim().split(/\s+/).filter(Boolean);

    if (i === 0 && dur > 4.0 && words.length >= 4) {
      const minK = Math.max(2, Math.floor((2.0 / dur) * words.length));
      const maxK = Math.min(words.length - 2, Math.floor((3.9 / dur) * words.length));
      const targetK = Math.max(2, Math.min(words.length - 2, Math.round((3.0 / dur) * words.length)));
      const splitK = maxK >= minK ? findNaturalWordSplitIndex(words, minK, maxK, targetK) : targetK;
      const part1Dur = Number(
        Math.min(3.95, Math.max(2.05, (splitK / words.length) * dur)).toFixed(2)
      );
      const splitTime = Number((seg.startSec + part1Dur).toFixed(2));
      bounded.push({
        ...seg,
        text: words.slice(0, splitK).join(" "),
        endSec: splitTime,
      });
      appendBoundedSegment(bounded, {
        ...seg,
        id: seg.id ? `${seg.id}-2` : undefined,
        text: words.slice(splitK).join(" "),
        startSec: splitTime,
        endSec: seg.endSec,
      });
    } else {
      appendBoundedSegment(bounded, seg);
    }
  }
  return bounded;
}

/**
 * Group Whisper word timestamps into natural 2-11s beats on punctuation & pauses,
 * shifting segment 0 cleanly within <= 4.0s and capping every beat <= ~12s.
 */
export function segmentWhisperWords(data) {
  const rawWords = Array.isArray(data) ? data : data.words || [];
  if (rawWords.length === 0) {
    const rawSegs = Array.isArray(data?.segments) ? data.segments : [];
    return rawSegs.map((s, idx) => ({
      id: `seg-${idx + 1}`,
      text: String(s.text || "").trim(),
      startSec: Number(s.startSec ?? s.start ?? 0),
      endSec: Number(s.endSec ?? s.end ?? 3),
    }));
  }

  const normalized = rawWords
    .map((w) => ({
      word: String(w.word ?? w.text ?? "").trim(),
      startSec: Number(w.startSec ?? w.start ?? 0),
      endSec: Number(w.endSec ?? w.end ?? (Number(w.startSec ?? w.start ?? 0) + 0.3)),
    }))
    .filter((w) => w.word.length > 0);

  const segments = [];
  let chunk = [];

  const flushChunk = () => {
    if (chunk.length === 0) return;
    segments.push({
      text: chunk.map((w) => w.word).join(" ").replace(/\s+([.,!?;:])/g, "$1"),
      startSec: chunk[0].startSec,
      endSec: chunk[chunk.length - 1].endSec,
    });
    chunk = [];
  };

  for (let i = 0; i < normalized.length; i++) {
    const curr = normalized[i];
    chunk.push(curr);

    const dur = curr.endSec - chunk[0].startSec;
    const next = normalized[i + 1];
    const pauseGap = next ? next.startSec - curr.endSec : 1.0;
    const isSentenceEnd = /[.!?]["”']?$/.test(curr.word);
    const isClauseEnd = /[,;:\u2014]$/.test(curr.word);
    const isFirstHookBeat = segments.length === 0;
    const inHook = curr.endSec <= 15;

    if (!next) {
      flushChunk();
      continue;
    }

    if (isFirstHookBeat) {
      const nextTok = cleanAlphaToken(next.word);
      const currTok = cleanAlphaToken(curr.word);
      const naturalClausePivot =
        !TRAILING_FUNCTION_RE.test(currTok) &&
        (CONJUNCTION_STARTER_RE.test(nextTok) || CLAUSE_PREP_VERB_RE.test(nextTok));

      if (isSentenceEnd && dur >= 2.0) {
        flushChunk();
      } else if (pauseGap >= 0.42 && dur >= 1.4) {
        flushChunk();
      } else if (isClauseEnd && dur >= 2.1) {
        flushChunk();
      } else if (dur >= 2.8 && naturalClausePivot) {
        flushChunk();
      } else if (dur >= 3.8) {
        flushChunk();
      }
    } else if (isSentenceEnd && dur >= (inHook ? 2.2 : 2.6)) {
      flushChunk();
    } else if (pauseGap >= 0.42 && dur >= 3.0) {
      flushChunk();
    } else if (pauseGap >= 0.8 && dur >= 1.8) {
      flushChunk();
    } else if (isClauseEnd && dur >= (inHook ? 3.5 : 5.4)) {
      flushChunk();
    } else if (dur >= 9.6 && (isClauseEnd || pauseGap >= 0.18)) {
      flushChunk();
    } else if (dur >= 11.2) {
      flushChunk();
    }
  }

  return segments;
}

/**
 * Split plain text or markdown script into spoken beats using 150 WPM (2.5 wps).
 * Enforces 2.0-4.0s opening hook visual shift and <= 11-13s / <= 28-word hard beat cap.
 */
export function segmentScriptText(rawText, wpm = 150) {
  const wordsPerSec = Math.max(80, wpm) / 60;
  const maxHookFirstWords = Math.min(9, Math.max(4, Math.floor((3.85 - 0.25) * wordsPerSec)));
  const targetHookWords = Math.min(maxHookFirstWords, Math.max(5, Math.round(3.0 * wordsPerSec)));
  const maxBodyWords = Math.min(28, Math.max(12, Math.floor((11.6 - 0.25) * wordsPerSec)));
  const targetBodyWords = Math.min(maxBodyWords - 3, Math.max(10, Math.round(8.5 * wordsPerSec)));

  const cleaned = rawText
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_`~]/g, "");

  const paragraphs = cleaned
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const rawClauses = [];

  const pushBoundedSentence = (sentenceText, isParaEnd, pIdx, isHookOrJoke, isShortDramatic) => {
    const words = sentenceText.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    const maxSentenceWords = isHookOrJoke ? Math.min(maxBodyWords, 13) : Math.min(maxBodyWords, 24);
    if (words.length <= maxSentenceWords) {
      rawClauses.push({
        text: sentenceText,
        wordCount: words.length,
        paraEnd: isParaEnd,
        dramaticShort: isShortDramatic,
        paragraphIndex: pIdx,
      });
      return;
    }

    const splitRegex = isHookOrJoke
      ? /(?<=[,;:\u2014])\s+|\s+(?=(?:before\s+2036|who's\s+going|and\s+see\s+how|so\s+if\s+ai))/i
      : /(?<=[,;:\u2014])\s+/;
    const parts = sentenceText.split(splitRegex).filter(Boolean);
    const targetWords = isHookOrJoke ? Math.min(11, maxBodyWords) : Math.min(18, targetBodyWords);
    const chunks = [];
    let acc = [];
    let accWords = 0;

    for (let p = 0; p < parts.length; p++) {
      const partWords = parts[p].split(/\s+/).filter(Boolean).length;
      if (accWords > 0 && accWords + partWords > targetWords) {
        chunks.push({ text: acc.join(" "), wordCount: accWords });
        acc = [parts[p]];
        accWords = partWords;
      } else {
        acc.push(parts[p]);
        accWords += partWords;
      }
    }
    if (acc.length > 0) {
      if (
        chunks.length > 0 &&
        accWords < 7 &&
        chunks[chunks.length - 1].wordCount + accWords <= maxBodyWords
      ) {
        chunks[chunks.length - 1].text = `${chunks[chunks.length - 1].text} ${acc.join(" ")}`;
        chunks[chunks.length - 1].wordCount += accWords;
      } else {
        chunks.push({ text: acc.join(" "), wordCount: accWords });
      }
    }

    // Split any unpunctuated/overlong chunk cleanly on conjunctions/clauses <= maxBodyWords
    const boundedChunks = [];
    const applyShortHookCap = isHookOrJoke && words.length <= 36;
    for (let c = 0; c < chunks.length; c++) {
      const chWords = chunks[c].text.split(/\s+/).filter(Boolean);
      const localMax = applyShortHookCap ? Math.min(maxBodyWords, 13) : maxBodyWords;
      const localTarget = applyShortHookCap ? Math.min(10, targetBodyWords) : targetBodyWords;
      const localMinTail = applyShortHookCap ? 5 : 6;
      if (chWords.length > localMax) {
        const subSlices = splitWordsAtNaturalBoundaries(chWords, localMax, localTarget, localMinTail);
        for (const sub of subSlices) {
          boundedChunks.push({ text: sub.join(" "), wordCount: sub.length });
        }
      } else {
        boundedChunks.push(chunks[c]);
      }
    }

    for (let c = 0; c < boundedChunks.length; c++) {
      rawClauses.push({
        text: boundedChunks[c].text,
        wordCount: boundedChunks[c].wordCount,
        paraEnd: isParaEnd && c === boundedChunks.length - 1,
        dramaticShort: false,
        paragraphIndex: pIdx,
      });
    }
  };

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx];
    const protectedText = para
      .replace(/(\d)\.(\d)/g, "$1<DOT>$2")
      .replace(/\b(v|Mr|Mrs|Ms|Dr|St|U\.S)\./g, "$1<DOT>");

    const sentences = protectedText
      .split(/(?<=[.!?]["”']?)\s+/)
      .map((s) => s.replace(/<DOT>/g, ".").trim())
      .filter(Boolean);

    for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
      const sentence = sentences[sIdx];
      const words = sentence.split(/\s+/).filter(Boolean);
      const isShortDramatic =
        words.length <= 5 &&
        (/allowance|nothing stops|it's|that is/i.test(sentence) ||
          sentences.length === 1);
      const isHookOrJoke = pIdx === 0 || matchesAny(sentence, JOKE_PATTERNS);
      const isParaEnd = sIdx === sentences.length - 1;

      // Guarantee opening beat 0 splits cleanly inside 2.0-4.0s (<= maxHookFirstWords)
      if (rawClauses.length === 0 && words.length > maxHookFirstWords) {
        const minHookK = Math.min(5, Math.floor(words.length / 2));
        const safeTail = Math.min(4, Math.floor(words.length / 2));
        const maxHookK = Math.max(minHookK, Math.min(maxHookFirstWords, words.length - safeTail));
        const hookK = findNaturalWordSplitIndex(words, minHookK, maxHookK, targetHookWords);
        rawClauses.push({
          text: words.slice(0, hookK).join(" "),
          wordCount: hookK,
          paraEnd: false,
          dramaticShort: false,
          paragraphIndex: pIdx,
        });
        pushBoundedSentence(words.slice(hookK).join(" "), isParaEnd, pIdx, isHookOrJoke, false);
      } else {
        pushBoundedSentence(sentence, isParaEnd, pIdx, isHookOrJoke, isShortDramatic);
      }
    }
  }

  // Merge tiny non-dramatic fragments (< 6 words) with adjacent sentence in same paragraph
  const merged = [];
  for (let i = 0; i < rawClauses.length; i++) {
    const curr = rawClauses[i];
    const prev = merged.length > 0 ? merged[merged.length - 1] : null;
    const maxMergedWords = merged.length === 1 ? maxHookFirstWords : Math.min(26, maxBodyWords);
    if (
      prev &&
      curr.wordCount < 6 &&
      !curr.dramaticShort &&
      prev.paragraphIndex === curr.paragraphIndex &&
      !prev.paraEnd &&
      prev.wordCount + curr.wordCount <= maxMergedWords
    ) {
      prev.text = `${prev.text} ${curr.text}`;
      prev.wordCount += curr.wordCount;
      prev.paraEnd = curr.paraEnd;
    } else {
      merged.push({ ...curr });
    }
  }

  const segments = [];
  let cursorSec = 0;
  for (let i = 0; i < merged.length; i++) {
    const item = merged[i];
    const baseDur = item.wordCount / wordsPerSec;
    const pausePad = item.paraEnd ? 0.25 : 0.08;
    const minDur = item.dramaticShort ? 1.8 : i === 0 ? 2.1 : item.paragraphIndex === 0 ? 2.5 : 2.3;
    const durationSec = Math.max(minDur, Number((baseDur + pausePad).toFixed(2)));
    segments.push({
      text: item.text,
      startSec: Number(cursorSec.toFixed(2)),
      endSec: Number((cursorSec + durationSec).toFixed(2)),
      paragraphIndex: item.paragraphIndex,
    });
    cursorSec += durationSec;
  }

  return segments;
}

// ============================================================================
// 4. Planner & Auditor
// ============================================================================
const isTalkingHeadFraming = (framing) =>
  framing === "talking-head-full" ||
  framing === "talking-head-punch-in" ||
  framing === "talking-head-with-glass";

function selectGlassPreset(category, basePreset, text) {
  if (!basePreset) return undefined;
  if (category === "claire-ledger" || /\bversus\b|\bagainst\b|\bon the one hand\b/i.test(text)) {
    return "split-modal";
  }
  if (category === "open-loop" || /\bremember\b|\bhatch\b/i.test(text)) {
    return "pill";
  }
  return basePreset;
}

function buildCutReason(category, recipe, framing, durationSec, isHeroPeak, isPrePeakQuiet, sourceCitation) {
  const durLabel = `${durationSec.toFixed(1)}s`;
  if (isHeroPeak) {
    return `Hero peak (60-75% zone): #a3402e brick-red focal ${recipe.componentHint} + warning-thud on systemic chokepoint (${durLabel})`;
  }
  if (isPrePeakQuiet && framing === "talking-head-full") {
    return `Quiet-before-reveal room breath (talking-head-full, ${durLabel}): drop music bed before peak spike`;
  }
  if (framing === "talking-head-full") {
    return `Quiet room breath (talking-head-full, ${durLabel}) — Money & Macro anchor without overlay`;
  }
  if (isPrePeakQuiet) {
    return `Quiet-before-reveal breath: drop music bed before peak spike (${durLabel}, ${recipe.componentHint})`;
  }
  switch (category) {
    case "hook":
      return `0-15s claim-vs-receipt collision in ${recipe.componentHint} (${durLabel})`;
    case "good-work-punchline":
      return `Dry-wit punchline: snappy ${durLabel} ${framing} + ${recipe.componentHint}`;
    case "receipt-proof":
      return `Calm documentary hold (${durLabel}) for primary receipt${sourceCitation ? ` [${sourceCitation}]` : ""}`;
    case "history-archive":
      return `Period-anchored archival cutaway (${durLabel}) via ${recipe.componentHint}`;
    case "map-geopolitics":
      return `Spatial grid/region zoom (${durLabel}) via ${recipe.componentHint}`;
    case "claire-ledger":
      return `Human-scale household ledger check (${durLabel}) via ${recipe.componentHint}`;
    case "warning-escalation":
      return `Escalating structural tension (${durLabel}) via ${recipe.componentHint}`;
    case "open-loop":
      return `Retention open-loop plant (${durLabel}) on ${recipe.componentHint}`;
    case "thesis-promise":
      return `Structural roadmap framing (${durLabel}) via ${recipe.componentHint}`;
    case "takeaway":
      return `Grounded Money & Macro room takeaway (${durLabel}) via ${recipe.componentHint}`;
    default:
      return `Tangible metaphor illustration (${durLabel}) via ${recipe.componentHint}`;
  }
}

export function buildDraftDirectorPlan(rawSegments, options = {}) {
  const fps = options.fps && options.fps > 0 ? Math.round(options.fps) : 30;
  const title = options.title || "The Reading Room — Audience Director Plan";
  const targetTalkingHeadShare = options.targetTalkingHeadShare ?? 0.35;
  const heroStartPct = options.heroStartPct ?? 0.6;
  const heroEndPct = options.heroEndPct ?? 0.75;

  const segments = normalizeAndBoundSegments(rawSegments || []);

  if (segments.length === 0) {
    return validateDirectorPlan({
      title,
      fps,
      totalFrames: 0,
      beats: [],
      audit: {
        avgShotDurationSec: 0,
        styleDiversityScore: 0,
        repetitionWarnings: ["No transcript segments provided."],
        heroPeakPercent: 0,
        talkingHeadSharePercent: 0,
      },
    });
  }

  const totalSec = Math.max(0.5, segments[segments.length - 1].endSec - segments[0].startSec);
  const firstStartSec = segments[0].startSec;

  const categories = segments.map((seg, i) => classifyBeat(seg.text, i, segments.length));
  const citations = [];
  let activeParaIndex = undefined;
  let activeParaCitation = undefined;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const directCitation = seg.sourceCitation || extractSourceCitation(seg.text);
    if (seg.paragraphIndex !== undefined && seg.paragraphIndex !== activeParaIndex) {
      activeParaIndex = seg.paragraphIndex;
      activeParaCitation = directCitation;
    } else if (directCitation) {
      activeParaCitation = directCitation;
    }
    const inheritedCitation =
      directCitation ||
      (seg.paragraphIndex !== undefined &&
      seg.paragraphIndex === activeParaIndex &&
      categories[i] === "receipt-proof"
        ? activeParaCitation
        : undefined);
    citations.push(inheritedCitation);
  }

  let heroPeakIdx = -1;
  let bestHeroScore = -1;
  for (let i = 0; i < segments.length; i++) {
    const midRatio = ((segments[i].startSec + segments[i].endSec) * 0.5 - firstStartSec) / totalSec;
    if (midRatio >= heroStartPct && midRatio <= heroEndPct) {
      let score = 1;
      if (categories[i] === "warning-escalation") score += 4;
      if (categories[i] === "map-geopolitics") score += 2;
      if (categories[i] === "receipt-proof") score += 2;
      if (/833|auction|frozen|269\.92|nuclear|crashes|2036/i.test(segments[i].text)) score += 3;
      const finalScore = score - Math.abs(midRatio - 0.675) * 2;
      if (finalScore > bestHeroScore) {
        bestHeroScore = finalScore;
        heroPeakIdx = i;
      }
    }
  }
  if (heroPeakIdx === -1 && segments.length >= 2) {
    heroPeakIdx = Math.min(segments.length - 1, Math.max(1, Math.round((segments.length - 1) * 0.675)));
  }
  const prePeakQuietIdx = heroPeakIdx > 0 ? heroPeakIdx - 1 : -1;

  const beats = [];
  const lastUsedBeatByComponent = {};
  const lastUsedBeatByFamily = {};
  const usageCountByComponent = {};

  let talkingHeadSecAccum = 0;
  let fullThBeatsCount = 0;
  let overlayThBeatsCount = 0;
  let lastFullThBeatIdx = -999;
  let totalSecAccum = 0;
  let consecutiveTalkingHeadSec = 0;
  let consecutiveCutawaySec = 0;
  let lastWarningThudSec = -999;

  const targetFullThRatio = 0.16;
  const targetOverlayThRatio = 0.185;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const category = categories[i];
    const sourceCitation = citations[i];
    const segStartRel = Math.max(0, seg.startSec - firstStartSec);
    const segEndRel = Math.max(segStartRel + 0.5, seg.endSec - firstStartSec);
    const startFrame = Math.round(segStartRel * fps);
    const endFrame = Math.max(startFrame + 15, Math.round(segEndRel * fps));
    const durationSec = Number(((endFrame - startFrame) / fps).toFixed(2));
    const midSec = (segStartRel + segEndRel) * 0.5;
    const isHeroPeak = i === heroPeakIdx;
    const isPrePeakQuiet = i === prePeakQuietIdx;

    const prevFamily = beats.length > 0 ? beats[beats.length - 1].styleFamily : null;
    const prevFraming = beats.length > 0 ? beats[beats.length - 1].framing : null;
    const currentThShare = totalSecAccum > 0 ? talkingHeadSecAccum / totalSecAccum : targetTalkingHeadShare;
    const currentFullThBeatRatio = i > 0 ? fullThBeatsCount / i : 0;
    const currentOverlayThBeatRatio = i > 0 ? overlayThBeatsCount / i : 0;
    const needTalkingHead = currentThShare < targetTalkingHeadShare - 0.015 || consecutiveCutawaySec >= 13;
    const needCutaway = currentThShare > targetTalkingHeadShare + 0.04 || consecutiveTalkingHeadSec >= 13;
    const hasNumericReceipt = matchesAny(seg.text, NUMERIC_RECEIPT_PATTERNS);
    const isCalmConnective =
      i >= 2 &&
      !isHeroPeak &&
      !sourceCitation &&
      !hasNumericReceipt &&
      durationSec <= 9.5 &&
      (isPrePeakQuiet ||
        category === "thesis-promise" ||
        category === "open-loop" ||
        category === "metaphor-story" ||
        category === "takeaway");
    const wantFullThBreath =
      isCalmConnective &&
      prevFraming !== "talking-head-full" &&
      i - lastFullThBeatIdx >= 4 &&
      currentFullThBeatRatio < targetFullThRatio &&
      currentThShare < Math.min(0.38, targetTalkingHeadShare + 0.025) &&
      (isPrePeakQuiet || needTalkingHead || currentFullThBeatRatio < 0.145);

    const priorityIds = CATEGORY_RECIPE_PRIORITIES[category] || [];
    const candidateRecipes = [];
    const seenIds = new Set();
    for (const id of priorityIds) {
      if (RECIPE_BY_ID[id] && !seenIds.has(id)) {
        candidateRecipes.push(RECIPE_BY_ID[id]);
        seenIds.add(id);
      }
    }
    for (const rec of STYLE_CATALOG) {
      if (!seenIds.has(rec.id)) {
        candidateRecipes.push(rec);
        seenIds.add(rec.id);
      }
    }

    let chosen = candidateRecipes[0];
    if (isHeroPeak) {
      const investigation = RECIPE_BY_ID["doc-visual-investigation"];
      chosen =
        investigation && prevFamily !== investigation.styleFamily
          ? investigation
          : RECIPE_BY_ID["data-blob-simulation"] || chosen;
    } else {
      let bestScore = -1e9;
      for (const rec of candidateRecipes) {
        if (prevFamily && rec.styleFamily === prevFamily) continue;
        if (rec.peakOnly && !isHeroPeak) continue;
        if (isPrePeakQuiet && rec.styleFamily === "doc-broadcast") continue;

        let score = 0;
        const pIdx = priorityIds.indexOf(rec.id);
        score += pIdx !== -1 ? 50 - pIdx * 7 : 5;

        const usedCount = usageCountByComponent[rec.componentHint] || 0;
        score += usedCount === 0 ? 22 : -usedCount * 6;

        const lastCompIdx = lastUsedBeatByComponent[rec.componentHint];
        if (lastCompIdx !== undefined && i - lastCompIdx < 6) {
          score -= (6 - (i - lastCompIdx)) * 32 + 12;
        }
        const lastFamIdx = lastUsedBeatByFamily[rec.styleFamily];
        if (lastFamIdx !== undefined) {
          score += Math.min(10, (i - lastFamIdx) * 2);
        }

        const recIsTH = isTalkingHeadFraming(rec.framing);
        if (wantFullThBreath) {
          if (usedCount >= 1) score += 14;
        } else {
          if (needTalkingHead && recIsTH && currentOverlayThBeatRatio < targetOverlayThRatio) {
            score += 32;
          }
          if (needTalkingHead && !recIsTH) score -= 14;
          if (needCutaway && !recIsTH) score += 32;
          if (needCutaway && recIsTH) score -= 24;
          if (rec.styleFamily === "liquid-glass" && needTalkingHead && currentOverlayThBeatRatio < targetOverlayThRatio) {
            score += 8;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          chosen = rec;
        }
      }
    }

    let framing = chosen.framing;
    const chosenAlreadyRendered = (usageCountByComponent[chosen.componentHint] || 0) >= 1;
    if (wantFullThBreath && (chosenAlreadyRendered || segments.length <= 24)) {
      framing = "talking-head-full";
    } else if (
      needTalkingHead &&
      !isTalkingHeadFraming(framing) &&
      currentOverlayThBeatRatio < targetOverlayThRatio &&
      (chosen.componentHint === "StickerCutout" ||
        chosen.componentHint === "NewsPackageLowerThird" ||
        chosen.componentHint === "TelestratorOverlay")
    ) {
      framing =
        category === "good-work-punchline"
          ? "talking-head-punch-in"
          : "talking-head-with-glass";
    } else if (i === segments.length - 1 && category === "takeaway") {
      if (isCalmConnective && prevFraming !== "talking-head-full" && currentFullThBeatRatio < 0.18) {
        framing = "talking-head-full";
      } else if (chosen.styleFamily === "liquid-glass") {
        framing = "talking-head-with-glass";
      }
    }

    const isFullTalkingHead = framing === "talking-head-full";
    const glassPreset = isFullTalkingHead
      ? undefined
      : selectGlassPreset(category, chosen.glassPreset, seg.text);
    const paletteMode =
      framing === "fullscreen-cutaway" ||
      chosen.componentHint === "StainedGlassFrame" ||
      chosen.componentHint === "LiveCountdownSplit"
        ? "page"
        : "over-footage";

    let musicEnergy = "calm";
    if (isPrePeakQuiet) {
      musicEnergy = "drop-silence";
    } else if (isHeroPeak) {
      musicEnergy = "tense";
    } else if (category === "hook" || category === "good-work-punchline") {
      musicEnergy = "pulse";
    } else if (category === "warning-escalation") {
      musicEnergy = midSec / totalSec >= 0.55 ? "tense" : "pulse";
    } else if (category === "takeaway") {
      musicEnergy = "drop-silence";
    }

    const sfxCues = [];
    if (!isFullTalkingHead) {
      const primaryCue =
        isHeroPeak && chosen.secondarySfx === "warning-thud" ? "flash-cut" : chosen.defaultSfx;
      sfxCues.push({
        cue: primaryCue,
        offsetFrame: 0,
        volume: category === "good-work-punchline" ? 0.72 : 0.62,
      });

      if (isHeroPeak && midSec - lastWarningThudSec >= 20) {
        sfxCues.push({
          cue: "warning-thud",
          offsetFrame: Math.min(8, Math.max(2, Math.floor((endFrame - startFrame) / 4))),
          volume: 0.88,
        });
        lastWarningThudSec = midSec;
      } else if (chosen.secondarySfx && chosen.secondarySfx !== "warning-thud") {
        const totalBeatFrames = endFrame - startFrame;
        if (totalBeatFrames >= 45) {
          sfxCues.push({
            cue: chosen.secondarySfx,
            offsetFrame: Math.floor(totalBeatFrames * 0.45),
            volume: 0.52,
          });
        }
      }
    }

    const beatId = `beat-${String(i + 1).padStart(3, "0")}`;
    beats.push({
      id: beatId,
      startFrame,
      endFrame,
      durationSec,
      category,
      spokenText: seg.text.trim(),
      framing,
      paletteMode,
      styleFamily: chosen.styleFamily,
      componentHint: chosen.componentHint,
      motionAction: chosen.motionAction,
      ...(glassPreset ? { glassPreset } : {}),
      ...(chosen.typographyMode ? { typographyMode: chosen.typographyMode } : {}),
      sfxCues,
      musicEnergy,
      cutReason: buildCutReason(category, chosen, framing, durationSec, isHeroPeak, isPrePeakQuiet, sourceCitation),
      ...(sourceCitation ? { sourceCitation } : {}),
    });

    lastUsedBeatByComponent[chosen.componentHint] = i;
    lastUsedBeatByFamily[chosen.styleFamily] = i;
    if (!isFullTalkingHead) {
      usageCountByComponent[chosen.componentHint] = (usageCountByComponent[chosen.componentHint] || 0) + 1;
    }

    totalSecAccum += durationSec;
    if (isTalkingHeadFraming(framing)) {
      talkingHeadSecAccum += durationSec;
      consecutiveTalkingHeadSec += durationSec;
      consecutiveCutawaySec = 0;
      if (isFullTalkingHead) {
        fullThBeatsCount += 1;
        lastFullThBeatIdx = i;
      } else {
        overlayThBeatsCount += 1;
      }
    } else {
      consecutiveCutawaySec += durationSec;
      consecutiveTalkingHeadSec = 0;
    }
  }

  const totalFrames = beats.length > 0 ? beats[beats.length - 1].endFrame : 0;
  return validateDirectorPlan({
    title,
    fps,
    totalFrames,
    beats,
    audit: {
      avgShotDurationSec: 0,
      styleDiversityScore: 0,
      repetitionWarnings: [],
      heroPeakPercent: 0,
      talkingHeadSharePercent: 0,
    },
  });
}

export function validateDirectorPlan(plan) {
  const beats = plan.beats || [];
  const fps = plan.fps > 0 ? plan.fps : 30;
  const totalFrames =
    plan.totalFrames > 0 ? plan.totalFrames : beats.length > 0 ? beats[beats.length - 1].endFrame : 0;

  if (beats.length === 0 || totalFrames <= 0) {
    return {
      ...plan,
      fps,
      totalFrames: 0,
      audit: {
        avgShotDurationSec: 0,
        styleDiversityScore: 0,
        repetitionWarnings: ["DirectorPlan contains zero beats."],
        heroPeakPercent: 0,
        talkingHeadSharePercent: 0,
      },
    };
  }

  const warnings = [];
  const uniqueFamilies = new Set();
  const uniqueComponents = new Set();

  let totalDurationSec = 0;
  let talkingHeadFrames = 0;
  let consecutiveFamilyRepeats = 0;
  let staticRunFrames = 0;
  let bestPeakScore = -1;
  let bestPeakMidFrame = Math.round(totalFrames * 0.675);

  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const beatFrames = Math.max(1, b.endFrame - b.startFrame);
    const durSec = beatFrames / fps;
    totalDurationSec += durSec;

    uniqueFamilies.add(b.styleFamily);
    uniqueComponents.add(b.componentHint);
    if (isTalkingHeadFraming(b.framing)) talkingHeadFrames += beatFrames;

    if (durSec > 18) {
      warnings.push(`Excessive static gap (${durSec.toFixed(1)}s > 18s) at ${b.id} (${b.componentHint}).`);
    }

    if (i > 0) {
      const prev = beats[i - 1];
      if (b.styleFamily === prev.styleFamily) {
        consecutiveFamilyRepeats++;
        warnings.push(`Consecutive styleFamily '${b.styleFamily}' repeated at ${prev.id} -> ${b.id}.`);
      }
      if (
        b.styleFamily === prev.styleFamily &&
        b.componentHint === prev.componentHint &&
        b.framing === prev.framing
      ) {
        staticRunFrames += beatFrames;
      } else {
        staticRunFrames = beatFrames;
      }
      if (staticRunFrames / fps > 18) {
        warnings.push(`Unvaried visual run > 18s ending at ${b.id} (${b.componentHint}).`);
      }
    } else {
      staticRunFrames = beatFrames;
    }

    if (b.category === "receipt-proof" && (!b.sourceCitation || !b.sourceCitation.trim())) {
      warnings.push(`Missing sourceCitation on receipt-proof beat ${b.id} ("${b.spokenText.slice(0, 48)}...").`);
    }

    let peakScore = 0;
    if (b.sfxCues.some((s) => s.cue === "warning-thud")) peakScore += 4;
    if (b.componentHint === "VisualInvestigationBoard") peakScore += 3;
    if (b.category === "warning-escalation") peakScore += 2;
    if (b.musicEnergy === "tense") peakScore += 2;

    const midFrame = (b.startFrame + b.endFrame) * 0.5;
    const midPct = (midFrame / totalFrames) * 100;
    if (midPct >= 60 && midPct <= 75) peakScore += 1;

    if (peakScore > bestPeakScore) {
      bestPeakScore = peakScore;
      bestPeakMidFrame = midFrame;
    } else if (peakScore === bestPeakScore) {
      if (Math.abs(midPct - 67.5) < Math.abs((bestPeakMidFrame / totalFrames) * 100 - 67.5)) {
        bestPeakMidFrame = midFrame;
      }
    }
  }

  if (beats[0].category !== "hook") {
    warnings.push(`Opening beat (${beats[0].id}) is not classified as 'hook'.`);
  }

  const avgShotDurationSec = Number((totalDurationSec / beats.length).toFixed(2));
  const familyRatio = uniqueFamilies.size / 5;
  const targetCompMax = Math.min(STYLE_CATALOG.length, beats.length);
  const compRatio = targetCompMax > 0 ? Math.min(1, uniqueComponents.size / targetCompMax) : 0;
  const transitionScore =
    beats.length > 1 ? Math.max(0, 1 - consecutiveFamilyRepeats / (beats.length - 1)) : 1;

  const styleDiversityScore = Number(
    ((familyRatio * 0.35 + compRatio * 0.4 + transitionScore * 0.25) * 100).toFixed(1)
  );
  const heroPeakPercent = Number(((bestPeakMidFrame / totalFrames) * 100).toFixed(1));
  const talkingHeadSharePercent = Number(((talkingHeadFrames / totalFrames) * 100).toFixed(1));

  return {
    ...plan,
    fps,
    totalFrames,
    audit: {
      avgShotDurationSec,
      styleDiversityScore,
      repetitionWarnings: warnings,
      heroPeakPercent,
      talkingHeadSharePercent,
    },
  };
}

// ============================================================================
// 5. CLI Runner
// ============================================================================
function printUsage() {
  console.log(`Usage:
  node scripts/plan-edit.mjs <words.json_or_script.md> [--out out/director-plan.json] [--title "..."] [--fps 30] [--wpm 150]

Options:
  --out <path>     Output JSON file path (default: out/director-plan.json)
  --title <text>   Composition / video title
  --fps <number>   Frames per second (default: 30)
  --wpm <number>   Estimated speech WPM for plain .md/.txt scripts (default: 150)
  -h, --help       Show help`);
}

function parseArgs(argv) {
  const opts = {
    input: null,
    out: "out/director-plan.json",
    title: null,
    fps: 30,
    wpm: 150,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg === "--out") {
      opts.out = argv[++i];
    } else if (arg === "--title") {
      opts.title = argv[++i];
    } else if (arg === "--fps") {
      opts.fps = Number(argv[++i]);
    } else if (arg === "--wpm") {
      opts.wpm = Number(argv[++i]);
    } else if (!arg.startsWith("-") && !opts.input) {
      opts.input = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.input) {
    throw new Error("Missing required input path (<words.json_or_script.md>).");
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(opts.input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const ext = path.extname(inputPath).toLowerCase();
  const raw = fs.readFileSync(inputPath, "utf8");
  const segments =
    ext === ".json" ? segmentWhisperWords(JSON.parse(raw)) : segmentScriptText(raw, opts.wpm);

  const defaultTitle = `The Reading Room — ${path.basename(inputPath, ext)}`;
  const plan = buildDraftDirectorPlan(segments, {
    title: opts.title || defaultTitle,
    fps: opts.fps,
  });

  const outPath = path.resolve(opts.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(plan, null, 2) + "\n", "utf8");

  const uniqueComponents = new Set(plan.beats.map((b) => b.componentHint)).size;
  const totalSec = (plan.totalFrames / plan.fps).toFixed(1);

  console.log(`Director Plan generated: ${outPath}`);
  console.log(`  Title:              ${plan.title}`);
  console.log(`  Beats:              ${plan.beats.length} (${totalSec}s @ ${plan.fps}fps)`);
  console.log(`  Avg Shot Duration:  ${plan.audit.avgShotDurationSec}s`);
  console.log(`  Style Diversity:    ${plan.audit.styleDiversityScore}/100 (${uniqueComponents}/${STYLE_CATALOG.length} styles used)`);
  console.log(`  Talking Head Share: ${plan.audit.talkingHeadSharePercent}%`);
  console.log(`  Hero Peak Position: ${plan.audit.heroPeakPercent}%`);
  console.log(`  Warnings:           ${plan.audit.repetitionWarnings.length}`);
  if (plan.audit.repetitionWarnings.length > 0) {
    for (const w of plan.audit.repetitionWarnings) {
      console.log(`    - ${w}`);
    }
  }
}

const isEntrypoint =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isEntrypoint) {
  try {
    main();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
