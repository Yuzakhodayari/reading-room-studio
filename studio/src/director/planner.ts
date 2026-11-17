import {
  BeatCategory,
  CameraFraming,
  DirectorAudit,
  DirectorBeat,
  DirectorOptions,
  DirectorPlan,
  DirectorSfxCue,
  MusicEnergy,
  PaletteMode,
  StyleEngineFamily,
  StyleRecipe,
  TranscriptSegment,
} from "./schema";

/**
 * Complete 24-style catalog aligned with studio/src/components & studio/src/styles:
 * - 3 Over-Footage Apple Liquid Glass live camera overlay styles (card, dock, toast; tint="navy-glass" default)
 * - 8 Document & Broadcast styles (src/styles/docBroadcast.tsx — Page milk canvas or Over-Footage navy glass)
 * - 5 Vintage Editorial styles (src/styles/vintageEditorial.tsx)
 * - 4 Diagram & Metaphor styles (src/styles/diagramMetaphor.tsx)
 * - 4 Data & Maps 3D styles (src/styles/dataMaps3D.tsx)
 *
 * Every motionAction uses valid composable primitives.ts tokens in
 * `enterAction -> inPlaceAction -> exitAction` order with calm editorial pacing
 * (zero glitch-jitter or harsh strobe flashes).
 */
export const STYLE_CATALOG: StyleRecipe[] = [
  // 1-3: Over-Footage Crystal Smoked-Navy Apple Liquid Glass (live over A-roll camera)
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

  // 4-11: Document & Broadcast (8 styles)
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

  // 12-16: Vintage Editorial (5 styles)
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

  // 17-20: Diagram & Metaphor (4 styles)
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

  // 21-24: Data & Maps 3D (4 styles)
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

const RECIPE_BY_ID: Record<string, StyleRecipe> = {};
for (let i = 0; i < STYLE_CATALOG.length; i++) {
  RECIPE_BY_ID[STYLE_CATALOG[i].id] = STYLE_CATALOG[i];
}

/**
 * Preferred style recipe order per BeatCategory (always rotates across families).
 */
const CATEGORY_RECIPE_PRIORITIES: Record<BeatCategory, string[]> = {
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

function matchesAny(text: string, patterns: RegExp[]): boolean {
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i].test(text)) return true;
  }
  return false;
}

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

/**
 * Extract primary source citation when present in spoken text.
 */
export function extractSourceCitation(text: string): string | undefined {
  if (/table\s*9|monthly\s+treasury\s+statement|84(?:\.1)?\s*percent/i.test(text)) {
    return "U.S. Treasury — Monthly Treasury Statement, Table 9";
  }
  if (/congressional\s+budget\s+office|\bcbo\b/i.test(text)) {
    return "Congressional Budget Office (CBO) Budget & Interest Projections";
  }
  if (/40\.5\s*trillion|national\s+debt/i.test(text)) {
    return "U.S. Treasury — Fiscal Data (Debt to the Penny)";
  }
  if (/18\.8\s*trillion|household(?:s)?\s+owe/i.test(text)) {
    return "Federal Reserve Bank of New York — Household Debt & Credit";
  }
  if (/the\s+economist/i.test(text)) {
    return "The Economist (July 2026 Elon Musk Interview)";
  }
  if (/posted\s+on\s+x|october\s+29/i.test(text)) {
    return "X Public Statement (Oct 29, 2026)";
  }
  if (/1947|harry\s+truman|labor\s+data|produce\s+per\s+hour/i.test(text)) {
    return "U.S. Bureau of Labor Statistics (BLS) — Productivity & Labor Share";
  }
  if (/alphabet|amazon|meta|microsoft|oracle|free\s+cash\s+flow/i.test(text)) {
    return "SEC 10-K / Quarterly Filings (Alphabet, Amazon, Meta, Microsoft)";
  }
  if (/all-in\s+podcast|universal\s+basic\s+compute/i.test(text)) {
    return "All-In Podcast — Sam Altman (May 2024)";
  }
  if (/forbes|uber/i.test(text)) {
    return "Forbes — Uber Engineering AI Token Cap Report (2026)";
  }
  if (/nvidia|jensen\s+huang/i.test(text)) {
    return "Nvidia — Token Budget Guidance";
  }
  if (/international\s+energy\s+agency|\biea\b|415\s+terawatt|945/i.test(text)) {
    return "International Energy Agency (IEA) — Electricity 2024–2030";
  }
  if (/nextera/i.test(text)) {
    return "NextEra Energy — Hyperscale Load Guidance";
  }
  if (/ireland|21\s*percent|twenty-one\s+percent|metered\s+power/i.test(text)) {
    return "Central Statistics Office (CSO) Ireland — Metered Electricity";
  }
  if (/west\s+london|m4\s+corridor/i.test(text)) {
    return "Greater London Authority / UK M4 Substation Capacity Notice";
  }
  if (/\bpjm\b|269\.92|833\s*percent/i.test(text)) {
    return "PJM Interconnection — 2025/2026 Capacity Auction";
  }
  if (/three\s+mile\s+island/i.test(text)) {
    return "Constellation Energy / Microsoft 20-Year Nuclear PPA";
  }
  if (/alaska|permanent\s+fund|wielechowski|bill\s+walker|each\s+resident\s+was\s+owed|4\s+billion\s+hole/i.test(text)) {
    return "Alaska Permanent Fund / Wielechowski v. State (2016)";
  }
  if (/fair\s+labor\s+standards|paint\s+creek|island\s+creek|1938|1912/i.test(text)) {
    return "U.S. Fair Labor Standards Act (1938) / WV Scrip Archives";
  }
  if (/shenzhen|suzhou|digital\s+yuan/i.test(text)) {
    return "PBOC Digital Yuan (e-CNY) Pilot Records (2020)";
  }
  if (/ministry\s+of\s+food|1941|sixteen\s+points/i.test(text)) {
    return "UK Ministry of Food — Points Rationing Order (Dec 1941)";
  }
  if (/irving\s+fisher|debt\s+deflation/i.test(text)) {
    return "Irving Fisher — Debt-Deflation Theory (1933)";
  }
  if (/2009|underwater/i.test(text)) {
    return "Federal Reserve / CoreLogic Housing Equity Data (2009)";
  }
  if (/stimulus\s+payments/i.test(text)) {
    return "U.S. Treasury — 2020 CARES Act Disbursement Data";
  }
  if (/\btreasury\b/i.test(text)) {
    return "U.S. Department of the Treasury";
  }
  return undefined;
}

/**
 * Deterministic text classifier mapping a script segment to one of the 11 BeatCategory roles.
 */
export function classifyBeat(
  text: string,
  index: number,
  totalSegments: number
): BeatCategory {
  const trimmed = text.trim();
  const safeTotal = Math.max(1, totalSegments);
  const ratio = index / safeTotal;

  // 1. Opening Hook (first beat always, or second beat if still in cold-open collision and not a joke)
  if (index === 0) {
    return "hook";
  }
  if (
    index === 1 &&
    safeTotal >= 12 &&
    !matchesAny(trimmed, JOKE_PATTERNS) &&
    !matchesAny(trimmed, THESIS_PATTERNS)
  ) {
    return "hook";
  }

  // 2. Final Takeaway (closing ~8% of script)
  if (
    (index >= safeTotal - 2 || ratio >= 0.92) &&
    matchesAny(trimmed, TAKEAWAY_PATTERNS)
  ) {
    return "takeaway";
  }

  // 3. Good Work / GothamChess Sarcastic Punchline
  if (matchesAny(trimmed, JOKE_PATTERNS)) {
    return "good-work-punchline";
  }

  // 4. Claire Mortgage Ledger (prioritize human concrete anchor when she appears)
  if (matchesAny(trimmed, CLAIRE_PATTERNS)) {
    return "claire-ledger";
  }

  // 5. Primary Document Receipt vs Warning Escalation vs Map vs History
  const hasPrimarySource = matchesAny(trimmed, PRIMARY_SOURCE_PATTERNS);
  const hasNumericReceipt = matchesAny(trimmed, NUMERIC_RECEIPT_PATTERNS);
  const hasWarning = matchesAny(trimmed, WARNING_PATTERNS);
  const hasHistory = matchesAny(trimmed, HISTORY_PATTERNS);
  const hasMap = matchesAny(trimmed, MAP_PATTERNS);

  if (hasHistory && !hasMap) {
    return "history-archive";
  }
  if (hasMap && !hasHistory) {
    return "map-geopolitics";
  }
  if (hasHistory && hasMap) {
    // e.g. West Virginia 1912/1938 or London 1941 -> historical newsreel frame
    return "history-archive";
  }

  // Explicit primary source + numbers (e.g. Table 9, IEA, Forbes, BLS) -> receipt-proof
  if (hasPrimarySource && !/\b(2036|default|crashes|833 percent)\b/i.test(trimmed)) {
    return "receipt-proof";
  }

  // Structural threats, 2036 collisions, budget vetoes, crashes -> warning-escalation
  if (hasWarning) {
    return "warning-escalation";
  }

  // Concrete illustrative analogies (even when quoting $120 shoes or 10W chargers)
  if (matchesAny(trimmed, METAPHOR_PATTERNS)) {
    return "metaphor-story";
  }

  // Any remaining hard numerical data / source citation -> receipt-proof
  if (hasNumericReceipt) {
    return "receipt-proof";
  }

  // 6. Thesis / Escape-Hatch Roadmap
  if (matchesAny(trimmed, THESIS_PATTERNS)) {
    return "thesis-promise";
  }

  // 7. Open Loops / Viewer Questions
  if (matchesAny(trimmed, OPEN_LOOP_PATTERNS) || /\?\s*$/.test(trimmed)) {
    return "open-loop";
  }

  // Final segment fallback -> takeaway; otherwise metaphor-story
  if (index === safeTotal - 1) {
    return "takeaway";
  }
  return "metaphor-story";
}

function isTalkingHeadFraming(framing: CameraFraming): boolean {
  return (
    framing === "talking-head-full" ||
    framing === "talking-head-punch-in" ||
    framing === "talking-head-with-glass"
  );
}

function selectGlassPreset(
  category: BeatCategory,
  basePreset: StyleRecipe["glassPreset"],
  text: string
): StyleRecipe["glassPreset"] {
  if (!basePreset) return undefined;
  if (category === "claire-ledger" || /\bversus\b|\bagainst\b|\bon the one hand\b/i.test(text)) {
    return "split-modal";
  }
  if (category === "open-loop" || /\bremember\b|\bhatch\b/i.test(text)) {
    return "pill";
  }
  return basePreset;
}

const CONJUNCTION_STARTER_RE =
  /^(and|but|so|because|which|while|although|though|whereas|since|unless|until|when|where|before|after|if|or|yet|who|that)$/i;
const CLAUSE_PREP_VERB_RE =
  /^(is|are|was|were|will|would|could|should|can|has|have|had|come|comes|came|from|into|against|across|through|without|between|during|about|like|with)$/i;
const DETERMINER_PREP_RE =
  /^(the|a|an|this|that|these|those|your|our|their|its|of|to|in|on|at|for|by)$/i;
const TRAILING_FUNCTION_RE =
  /^(the|a|an|of|to|in|on|at|for|by|with|from|and|but|or|so|that|which|who|while|when|where|if|as|is|are|was|were|their|our|your|its|this|these|those)$/i;

function cleanAlphaToken(raw: string): string {
  return raw.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
}

function findNaturalWordSplitIndex(
  words: string[],
  minK: number,
  maxK: number,
  targetK: number
): number {
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

function splitWordsAtNaturalBoundaries(
  words: string[],
  maxWords: number,
  targetWords: number,
  minTailWords: number = 6
): string[][] {
  if (words.length <= maxWords) {
    return [words];
  }
  const chunks: string[][] = [];
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

function appendBoundedSegment(
  out: TranscriptSegment[],
  seg: TranscriptSegment,
  maxDurSec: number = 12.5
): void {
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

function normalizeAndBoundSegments(segments: TranscriptSegment[]): TranscriptSegment[] {
  if (segments.length === 0) return [];
  const bounded: TranscriptSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const dur = Math.max(0.5, seg.endSec - seg.startSec);
    const words = seg.text.trim().split(/\s+/).filter(Boolean);

    if (i === 0 && dur > 4.0 && words.length >= 4) {
      const minK = Math.max(2, Math.floor((2.0 / dur) * words.length));
      const maxK = Math.min(words.length - 2, Math.floor((3.9 / dur) * words.length));
      const targetK = Math.max(2, Math.min(words.length - 2, Math.round((3.0 / dur) * words.length)));
      const splitK =
        maxK >= minK
          ? findNaturalWordSplitIndex(words, minK, maxK, targetK)
          : targetK;
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

function buildCutReason(
  category: BeatCategory,
  recipe: StyleRecipe,
  framing: CameraFraming,
  durationSec: number,
  isHeroPeak: boolean,
  isPrePeakQuiet: boolean,
  sourceCitation?: string
): string {
  const durLabel = durationSec.toFixed(1) + "s";
  if (isHeroPeak) {
    return (
      "Hero peak (60-75% zone): #a3402e brick-red focal " +
      recipe.componentHint +
      " + warning-thud on systemic chokepoint (" +
      durLabel +
      ")"
    );
  }
  if (isPrePeakQuiet && framing === "talking-head-full") {
    return (
      "Quiet-before-reveal room breath (talking-head-full, " +
      durLabel +
      "): drop music bed before peak spike"
    );
  }
  if (framing === "talking-head-full") {
    return (
      "Quiet room breath (talking-head-full, " +
      durLabel +
      ") — Money & Macro anchor without overlay"
    );
  }
  if (isPrePeakQuiet) {
    return (
      "Quiet-before-reveal breath: drop music bed before peak spike (" +
      durLabel +
      ", " +
      recipe.componentHint +
      ")"
    );
  }
  switch (category) {
    case "hook":
      return "0-15s claim-vs-receipt collision in " + recipe.componentHint + " (" + durLabel + ")";
    case "good-work-punchline":
      return "Dry-wit punchline: snappy " + durLabel + " " + framing + " + " + recipe.componentHint;
    case "receipt-proof":
      return (
        "Calm documentary hold (" +
        durLabel +
        ") for primary receipt" +
        (sourceCitation ? " [" + sourceCitation + "]" : "")
      );
    case "history-archive":
      return "Period-anchored archival cutaway (" + durLabel + ") via " + recipe.componentHint;
    case "map-geopolitics":
      return "Spatial grid/region zoom (" + durLabel + ") via " + recipe.componentHint;
    case "claire-ledger":
      return "Human-scale household ledger check (" + durLabel + ") via " + recipe.componentHint;
    case "warning-escalation":
      return "Escalating structural tension (" + durLabel + ") via " + recipe.componentHint;
    case "open-loop":
      return "Retention open-loop plant (" + durLabel + ") on " + recipe.componentHint;
    case "thesis-promise":
      return "Structural roadmap framing (" + durLabel + ") via " + recipe.componentHint;
    case "takeaway":
      return "Grounded Money & Macro room takeaway (" + durLabel + ") via " + recipe.componentHint;
    default:
      return "Tangible metaphor illustration (" + durLabel + ") via " + recipe.componentHint;
  }
}

/**
 * Deterministic Dual-Palette Audience-Engineering Director Planner:
 * - Page (#FAF8F3 milk canvas / #1C2B3A classic dark navy hero bars & maps / #2F8F8B teal / #A3402E brick red) for fullscreen cutaways
 * - Over Footage silky smoked-navy Liquid Glass (tint="navy-glass", #FFF6E5 / #F7E8CE / #EDD8B4 warmer cream) for camera overlays
 * - Opening hook shifts cleanly within 2.0-4.0s and caps every beat <= ~12-13s
 * - Never repeats adjacent styleFamily; rotates organically across all 5 families & 24 styles
 * - Balances ~15% talking-head-full room breaths + ~15-20% glass/punch-in (~30-38% total TH)
 * - Reserves brick-red #A3402E / warning-thud for 60-75% hero peak zone with drop-silence breath
 */
export function buildDraftDirectorPlan(
  rawSegments: TranscriptSegment[],
  options: DirectorOptions = {}
): DirectorPlan {
  const fps = options.fps && options.fps > 0 ? Math.round(options.fps) : 30;
  const title = options.title || "The Reading Room — Audience Director Plan";
  const targetTalkingHeadShare = options.targetTalkingHeadShare ?? 0.35;
  const heroStartPct = options.heroStartPct ?? 0.6;
  const heroEndPct = options.heroEndPct ?? 0.75;

  const segments = normalizeAndBoundSegments(rawSegments);

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

  const totalSec = Math.max(
    0.5,
    segments[segments.length - 1].endSec - segments[0].startSec
  );
  const firstStartSec = segments[0].startSec;

  // Step 1: Pre-classify every segment (with same-paragraph primary source inheritance)
  const categories: BeatCategory[] = [];
  const citations: Array<string | undefined> = [];
  let activeParaIndex: number | undefined = undefined;
  let activeParaCitation: string | undefined = undefined;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const cat = classifyBeat(seg.text, i, segments.length);
    categories.push(cat);
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
      cat === "receipt-proof"
        ? activeParaCitation
        : undefined);
    citations.push(inheritedCitation);
  }

  // Step 2: Locate the primary Hero Peak index inside the 60-75% timeline window
  let heroPeakIdx = -1;
  let bestHeroScore = -1;
  for (let i = 0; i < segments.length; i++) {
    const midRatio =
      ((segments[i].startSec + segments[i].endSec) * 0.5 - firstStartSec) /
      totalSec;
    if (midRatio >= heroStartPct && midRatio <= heroEndPct) {
      let score = 1;
      if (categories[i] === "warning-escalation") score += 4;
      if (categories[i] === "map-geopolitics") score += 2;
      if (categories[i] === "receipt-proof") score += 2;
      if (/833|auction|frozen|269\.92|nuclear|crashes|2036/i.test(segments[i].text)) {
        score += 3;
      }
      // Tie-break closer to 67.5% midpoint
      const distPenalty = Math.abs(midRatio - 0.675) * 2;
      const finalScore = score - distPenalty;
      if (finalScore > bestHeroScore) {
        bestHeroScore = finalScore;
        heroPeakIdx = i;
      }
    }
  }
  // Short-clip fallback if no segment midpoint falls cleanly in 60-75%
  if (heroPeakIdx === -1 && segments.length >= 2) {
    heroPeakIdx = Math.min(
      segments.length - 1,
      Math.max(1, Math.round((segments.length - 1) * 0.675))
    );
  }
  const prePeakQuietIdx = heroPeakIdx > 0 ? heroPeakIdx - 1 : -1;

  // Step 3: Walk segments and choose non-repeating style recipes
  const beats: DirectorBeat[] = [];
  const lastUsedBeatByComponent: Record<string, number> = {};
  const lastUsedBeatByFamily: Record<string, number> = {};
  const usageCountByComponent: Record<string, number> = {};

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

    const prevFamily: StyleEngineFamily | null =
      beats.length > 0 ? beats[beats.length - 1].styleFamily : null;
    const prevFraming: CameraFraming | null =
      beats.length > 0 ? beats[beats.length - 1].framing : null;
    const currentThShare =
      totalSecAccum > 0 ? talkingHeadSecAccum / totalSecAccum : targetTalkingHeadShare;
    const currentFullThBeatRatio = i > 0 ? fullThBeatsCount / i : 0;
    const currentOverlayThBeatRatio = i > 0 ? overlayThBeatsCount / i : 0;
    const needTalkingHead =
      currentThShare < targetTalkingHeadShare - 0.015 || consecutiveCutawaySec >= 13;
    const needCutaway =
      currentThShare > targetTalkingHeadShare + 0.04 || consecutiveTalkingHeadSec >= 13;
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

    // Candidate pool: start with category priorities, then add remaining catalog for rich 24-style coverage
    const priorityIds = CATEGORY_RECIPE_PRIORITIES[category] || [];
    const candidateRecipes: StyleRecipe[] = [];
    const seenIds: Record<string, boolean> = {};

    for (let p = 0; p < priorityIds.length; p++) {
      const rec = RECIPE_BY_ID[priorityIds[p]];
      if (rec && !seenIds[rec.id]) {
        candidateRecipes.push(rec);
        seenIds[rec.id] = true;
      }
    }
    for (let c = 0; c < STYLE_CATALOG.length; c++) {
      const rec = STYLE_CATALOG[c];
      if (!seenIds[rec.id]) {
        candidateRecipes.push(rec);
        seenIds[rec.id] = true;
      }
    }

    let chosen: StyleRecipe = candidateRecipes[0];
    if (isHeroPeak) {
      const investigation = RECIPE_BY_ID["doc-visual-investigation"];
      if (investigation && prevFamily !== investigation.styleFamily) {
        chosen = investigation;
      } else {
        chosen = RECIPE_BY_ID["data-blob-simulation"] || chosen;
      }
    } else {
      let bestScore = -1e9;
      for (let k = 0; k < candidateRecipes.length; k++) {
        const rec = candidateRecipes[k];
        // HARD RULE: Adjacent beats NEVER repeat the same styleFamily
        if (prevFamily && rec.styleFamily === prevFamily) {
          continue;
        }
        // Reserve VisualInvestigationBoard (#a3402e hero focal) strictly for hero peak zone
        if (rec.peakOnly && !isHeroPeak) {
          continue;
        }
        // Keep pre-peak beat outside doc-broadcast so hero peak can cleanly enter VisualInvestigationBoard
        if (isPrePeakQuiet && rec.styleFamily === "doc-broadcast") {
          continue;
        }

        let score = 0;
        const priorityIdx = priorityIds.indexOf(rec.id);
        if (priorityIdx !== -1) {
          score += 50 - priorityIdx * 7;
        } else {
          score += 5;
        }

        // Encourage unused / least-used components across all 24 styles
        const usedCount = usageCountByComponent[rec.componentHint] || 0;
        if (usedCount === 0) {
          score += 22;
        } else {
          score -= usedCount * 6;
        }

        // Strong cooldown since last appearance of this component (< 6 beats) & family
        const lastCompIdx = lastUsedBeatByComponent[rec.componentHint];
        if (lastCompIdx !== undefined) {
          const gap = i - lastCompIdx;
          if (gap < 6) score -= (6 - gap) * 32 + 12;
        }
        const lastFamIdx = lastUsedBeatByFamily[rec.styleFamily];
        if (lastFamIdx !== undefined) {
          const famGap = i - lastFamIdx;
          score += Math.min(10, famGap * 2);
        }

        // Balance Talking Head (~15% full breaths + ~15-20% glass/punch-in) vs Cutaway (~62-70%)
        const recIsTH = isTalkingHeadFraming(rec.framing);
        if (wantFullThBreath) {
          // Prefer recipes already seen once so every visual style gets real rendered screen time
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

    // Determine effective CameraFraming (calm talking-head-full breaths + Over Footage Navy Liquid Glass)
    let framing: CameraFraming = chosen.framing;
    const chosenAlreadyRendered = (usageCountByComponent[chosen.componentHint] || 0) >= 1;
    if (
      wantFullThBreath &&
      (chosenAlreadyRendered || segments.length <= 24)
    ) {
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
    const paletteMode: PaletteMode =
      framing === "fullscreen-cutaway" ||
      chosen.componentHint === "StainedGlassFrame" ||
      chosen.componentHint === "LiveCountdownSplit"
        ? "page"
        : "over-footage";

    // Music energy: calm baseline, pulse on momentum, drop-silence before peak reveal, tense on peak
    let musicEnergy: MusicEnergy = "calm";
    if (isPrePeakQuiet) {
      musicEnergy = "drop-silence";
    } else if (isHeroPeak) {
      musicEnergy = "tense";
    } else if (category === "hook" || category === "good-work-punchline") {
      musicEnergy = "pulse";
    } else if (category === "warning-escalation") {
      const midRatio = midSec / totalSec;
      musicEnergy = midRatio >= 0.55 ? "tense" : "pulse";
    } else if (category === "takeaway") {
      musicEnergy = "drop-silence";
    }

    // Build deterministic SFX cues from the 20 SfxName assets (quiet room breaths omit overlay SFX)
    const sfxCues: DirectorSfxCue[] = [];
    if (!isFullTalkingHead) {
      const primaryCue =
        isHeroPeak && chosen.secondarySfx === "warning-thud"
          ? "flash-cut"
          : chosen.defaultSfx;

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

    const beatNumber = i + 1;
    const beatId = "beat-" + (beatNumber < 10 ? "00" + beatNumber : beatNumber < 100 ? "0" + beatNumber : String(beatNumber));

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
      cutReason: buildCutReason(
        category,
        chosen,
        framing,
        durationSec,
        isHeroPeak,
        isPrePeakQuiet,
        sourceCitation
      ),
      ...(sourceCitation ? { sourceCitation } : {}),
    });

    // Update rolling balance & anti-repetition trackers
    lastUsedBeatByComponent[chosen.componentHint] = i;
    lastUsedBeatByFamily[chosen.styleFamily] = i;
    if (!isFullTalkingHead) {
      usageCountByComponent[chosen.componentHint] =
        (usageCountByComponent[chosen.componentHint] || 0) + 1;
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

/**
 * Audit a DirectorPlan for:
 * - Consecutive same-styleFamily runs
 * - Excessive static gaps (>18s single beat or unvaried run)
 * - Missing source citations on receipt-proof beats
 * - Hero peak placement (60-75% zone) and talking-head balance (30-40%)
 */
export function validateDirectorPlan(plan: DirectorPlan): DirectorPlan {
  const beats = plan.beats;
  const fps = plan.fps > 0 ? plan.fps : 30;
  const totalFrames =
    plan.totalFrames > 0
      ? plan.totalFrames
      : beats.length > 0
      ? beats[beats.length - 1].endFrame
      : 0;

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

  const warnings: string[] = [];
  const uniqueFamilies: Record<string, boolean> = {};
  const uniqueComponents: Record<string, boolean> = {};

  let totalDurationSec = 0;
  let talkingHeadFrames = 0;
  let consecutiveFamilyRepeats = 0;
  let staticRunFrames = 0;

  // Track peak intensity beat for heroPeakPercent
  let bestPeakScore = -1;
  let bestPeakMidFrame = Math.round(totalFrames * 0.675);

  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const beatFrames = Math.max(1, b.endFrame - b.startFrame);
    const durSec = beatFrames / fps;
    totalDurationSec += durSec;

    uniqueFamilies[b.styleFamily] = true;
    uniqueComponents[b.componentHint] = true;

    if (isTalkingHeadFraming(b.framing)) {
      talkingHeadFrames += beatFrames;
    }

    // 1. Check excessive single-beat static gap (>18s)
    if (durSec > 18) {
      warnings.push(
        "Excessive static gap (" +
          durSec.toFixed(1) +
          "s > 18s) at " +
          b.id +
          " (" +
          b.componentHint +
          ")."
      );
    }

    // 2. Check consecutive same styleFamily & unvaried visual run > 18s
    if (i > 0) {
      const prev = beats[i - 1];
      if (b.styleFamily === prev.styleFamily) {
        consecutiveFamilyRepeats++;
        warnings.push(
          "Consecutive styleFamily '" +
            b.styleFamily +
            "' repeated at " +
            prev.id +
            " -> " +
            b.id +
            "."
        );
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
        warnings.push(
          "Unvaried visual run > 18s ending at " +
            b.id +
            " (" +
            b.componentHint +
            ")."
        );
      }
    } else {
      staticRunFrames = beatFrames;
    }

    // 3. Check missing source citations on receipt-proof beats
    if (b.category === "receipt-proof" && (!b.sourceCitation || !b.sourceCitation.trim())) {
      warnings.push(
        "Missing sourceCitation on receipt-proof beat " +
          b.id +
          ' ("' +
          b.spokenText.slice(0, 48) +
          '...").'
      );
    }

    // 4. Score peak intensity for heroPeakPercent
    let peakScore = 0;
    for (let s = 0; s < b.sfxCues.length; s++) {
      if (b.sfxCues[s].cue === "warning-thud") peakScore += 4;
    }
    if (b.componentHint === "VisualInvestigationBoard") peakScore += 3;
    if (b.category === "warning-escalation") peakScore += 2;
    if (b.musicEnergy === "tense") peakScore += 2;

    const midFrame = (b.startFrame + b.endFrame) * 0.5;
    const midPct = (midFrame / totalFrames) * 100;
    if (midPct >= 60 && midPct <= 75) {
      peakScore += 1;
    }

    if (peakScore > bestPeakScore) {
      bestPeakScore = peakScore;
      bestPeakMidFrame = midFrame;
    } else if (peakScore === bestPeakScore) {
      const currDist = Math.abs(midPct - 67.5);
      const bestDist = Math.abs((bestPeakMidFrame / totalFrames) * 100 - 67.5);
      if (currDist < bestDist) {
        bestPeakMidFrame = midFrame;
      }
    }
  }

  // 5. Check cold-open hook presence
  if (beats[0].category !== "hook") {
    warnings.push("Opening beat (" + beats[0].id + ") is not classified as 'hook'.");
  }

  const avgShotDurationSec = Number((totalDurationSec / beats.length).toFixed(2));
  const familyCount = Object.keys(uniqueFamilies).length;
  const componentCount = Object.keys(uniqueComponents).length;

  const familyRatio = familyCount / 5;
  const targetCompMax = Math.min(STYLE_CATALOG.length, beats.length);
  const compRatio = targetCompMax > 0 ? Math.min(1, componentCount / targetCompMax) : 0;
  const transitionScore =
    beats.length > 1
      ? Math.max(0, 1 - consecutiveFamilyRepeats / (beats.length - 1))
      : 1;

  const styleDiversityScore = Number(
    ((familyRatio * 0.35 + compRatio * 0.4 + transitionScore * 0.25) * 100).toFixed(1)
  );
  const heroPeakPercent = Number(((bestPeakMidFrame / totalFrames) * 100).toFixed(1));
  const talkingHeadSharePercent = Number(
    ((talkingHeadFrames / totalFrames) * 100).toFixed(1)
  );

  const audit: DirectorAudit = {
    avgShotDurationSec,
    styleDiversityScore,
    repetitionWarnings: warnings,
    heroPeakPercent,
    talkingHeadSharePercent,
  };

  return {
    ...plan,
    fps,
    totalFrames,
    audit,
  };
}
