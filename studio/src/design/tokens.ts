import { SpringConfig } from "remotion";

export { FONTS } from "./fonts";

/**
 * 1. Dual-Palette Token System:
 *    - PAGE_PALETTE: "Reading Room: Page (milk canvas)" for full-screen cutaways
 *    - OVER_FOOTAGE_PALETTE: "Reading Room: Over Footage (navy glass)" for translucent smoked-navy glass floating on video
 */
export const PAGE_PALETTE = {
  paperLight: "#FAF8F3", // Main full-screen cutaway milk canvas
  paper: "#F2F0EA", // Secondary card / table ground
  paperBorder: "#E1DED5", // Crisp warm milk hairline border
  navy: "#1C2B3A", // Primary classic dark navy ink, hero bars, map highlights, active badges
  navyDeep: "#0F1923", // Deepest ink / shadow vignette / dark cover
  muted: "#6B7783", // Secondary metadata, footnotes
  gold: "#3E6A94", // Subtle editorial slate hairline glint ONLY (use navy #1C2B3A for hero bars & map fills)
  goldWarm: "#A9C4DE", // Soft blue accent for dark cover text / borders
  highlightSweep: "rgba(255, 213, 79, 0.38)", // Yellow marker sweep behind #1C2B3A ink
  chartSecondary: "#2F8F8B", // Teal second metric / route / comparison accent
  brickRed: "#A3402E", // Warnings, drops, risk headings, eyebrow tags
  riskFill: "#F8ECE8", // Soft blush fill (ONLY on risk/warning boxes)
  riskBorder: "#E6C3B9", // Soft blush border (ONLY on risk/warning boxes)
} as const;

export const OVER_FOOTAGE_PALETTE = {
  // Optical silky smoked-navy crystal glass fills (~0.58-0.64 smoked depth; crystal translucent while >=4.5:1 over pure white)
  glassPrimary:
    "linear-gradient(135deg, rgba(28, 43, 58, 0.64) 0%, rgba(15, 25, 35, 0.60) 55%, rgba(28, 43, 58, 0.66) 100%)",
  glassDarkWell: "rgba(15, 25, 35, 0.50)", // Readable smoked inner well behind key numbers/sub-boxes
  glassBorder: "rgba(255, 255, 255, 0.58)", // Crisp glass specular rim
  glassInnerHairline: "rgba(255, 255, 255, 0.16)", // Subtle inner hairline
  // Rich warmer cream text & crisp accents (zero muddy grey, zero blurry halo)
  textBody: "#FAECD4", // Body copy (rich warmer cream, >=4.6:1 over bright walls)
  textHeadline: "#FFF6E5", // Headlines & key metrics (luminous warmer cream)
  textMuted: "#F7E8CE", // Subtitles, citations, eyebrows & timestamps (warm soft cream)
  accentPrimary: "#BFD6EA", // Subtle ice-blue accent for lines, dots & borders
  accentWarm: "#FAECD4", // Warm sand-cream highlight for eyebrows & active tags
  highlightSweep: "rgba(255, 213, 79, 0.30)", // Marker sweep on glass
  chartSecondary: "#4FB3AE", // Lifted teal secondary metric / positive delta
  brickRedText: "#E27358", // Lifted brick red for readable text & deltas on glass
  brickRedFill: "#A3402E", // Solid red chip/badge fill with #FFF6E5 text
  riskFill: "rgba(163, 64, 46, 0.38)", // Translucent glass risk wash
  riskBorder: "rgba(255, 200, 185, 0.44)", // Soft coral glass risk rim
  textShadow: "0 1px 2px rgba(8, 14, 22, 0.85)", // Tight razor-sharp optical drop (zero smear)
} as const;

/**
 * 2. Shared Global Color Tokens (Mapped cleanly to Dual-Palette)
 */
export const COLORS = {
  navy: PAGE_PALETTE.navy,
  navyDeep: PAGE_PALETTE.navyDeep,
  ink: PAGE_PALETTE.navy,
  panel: PAGE_PALETTE.paperLight,
  panelDark: PAGE_PALETTE.navyDeep,
  panelBorder: PAGE_PALETTE.paperBorder,
  paper: PAGE_PALETTE.paper,
  paperLight: PAGE_PALETTE.paperLight,
  paperBorder: PAGE_PALETTE.paperBorder,
  paperInk: PAGE_PALETTE.navy,
  paperMuted: PAGE_PALETTE.muted,
  highlight: PAGE_PALETTE.gold,
  highlightSweep: PAGE_PALETTE.highlightSweep,
  highlightBg: PAGE_PALETTE.highlightSweep,
  gold: PAGE_PALETTE.gold,
  goldWarm: PAGE_PALETTE.goldWarm,
  chartSecondary: PAGE_PALETTE.chartSecondary,
  brickRed: PAGE_PALETTE.brickRed,
  warning: PAGE_PALETTE.brickRed,
  warningBg: "rgba(163, 64, 46, 0.12)",
  riskFill: PAGE_PALETTE.riskFill,
  riskBorder: PAGE_PALETTE.riskBorder,
  muted: PAGE_PALETTE.muted,
  gridLine: "rgba(28, 43, 58, 0.045)",
  gridLineDark: "rgba(169, 196, 222, 0.06)",
  glassBg: "rgba(28, 43, 58, 0.32)",
  glassDarkWell: OVER_FOOTAGE_PALETTE.glassDarkWell,
  glassBorder: OVER_FOOTAGE_PALETTE.glassBorder,
  glassInnerHairline: OVER_FOOTAGE_PALETTE.glassInnerHairline,
  glassHighlight: "rgba(255, 255, 255, 0.56)",
};

/**
 * 3. Dedicated Style Family Palettes
 */
export const STYLE_FAMILIES = {
  // Family 1: Newsthink Reading Room (Page Milk Canvas / Deep Navy / Slate Blue)
  newsthink: {
    ink: PAGE_PALETTE.navy,
    navyDeep: PAGE_PALETTE.navyDeep,
    panel: PAGE_PALETTE.paperLight,
    panelBorder: PAGE_PALETTE.paperBorder,
    paper: PAGE_PALETTE.paper,
    paperLight: PAGE_PALETTE.paperLight,
    paperBorder: PAGE_PALETTE.paperBorder,
    paperInk: PAGE_PALETTE.navy,
    paperMuted: PAGE_PALETTE.muted,
    highlight: PAGE_PALETTE.gold,
    highlightSweep: PAGE_PALETTE.highlightSweep,
    highlightBg: PAGE_PALETTE.highlightSweep,
    gold: PAGE_PALETTE.gold,
    goldWarm: PAGE_PALETTE.goldWarm,
    chartSecondary: PAGE_PALETTE.chartSecondary,
    brickRed: PAGE_PALETTE.brickRed,
    riskFill: PAGE_PALETTE.riskFill,
    riskBorder: PAGE_PALETTE.riskBorder,
    goldMuted: "rgba(62, 106, 148, 0.18)",
    divider: PAGE_PALETTE.paperBorder,
  },

  // Family 2: Visual Investigation (Page Milk Evidence Desk + Brick Red Risk Pointer)
  visualInvestigation: {
    lightDesk: PAGE_PALETTE.paperLight,
    darkDesk: PAGE_PALETTE.paper,
    deskCard: PAGE_PALETTE.paperLight,
    deskCardBorder: PAGE_PALETTE.paperBorder,
    gridLine: "rgba(28, 43, 58, 0.05)",
    accentRed: PAGE_PALETTE.brickRed,
    accentRedBg: PAGE_PALETTE.riskFill,
    accentRedBorder: PAGE_PALETTE.riskBorder,
    monochromeHigh: PAGE_PALETTE.navy,
    monochromeMid: PAGE_PALETTE.muted,
    monochromeLow: PAGE_PALETTE.paperBorder,
    coordinateLine: "rgba(28, 43, 58, 0.08)",
  },

  // Family 3: Apple Liquid Glass Optical System (Over Footage Smoked-Navy Crystal Glass)
  liquidGlass: {
    tintBase: OVER_FOOTAGE_PALETTE.glassPrimary,
    tintDark: OVER_FOOTAGE_PALETTE.glassPrimary,
    tintNavy: OVER_FOOTAGE_PALETTE.glassPrimary,
    tintLight:
      "linear-gradient(135deg, rgba(28, 43, 58, 0.48) 0%, rgba(15, 25, 35, 0.40) 55%, rgba(28, 43, 58, 0.50) 100%)",
    borderHighlight: OVER_FOOTAGE_PALETTE.glassBorder,
    borderSubtle: OVER_FOOTAGE_PALETTE.glassInnerHairline,
    innerGlow: "rgba(191, 214, 234, 0.34)",
    specularSweep:
      "linear-gradient(180deg, rgba(255, 250, 240, 0.18) 0%, rgba(255, 250, 240, 0.04) 16%, transparent 45%)",
    frostedBackdrop: "blur(12px) saturate(165%) brightness(0.76)",
    dockPillBackdrop: "blur(12px) saturate(165%) brightness(0.76)",
    refractionScale: 18,
    turbulenceFreq: "0.006 0.006",
    shadow:
      "0 22px 48px -12px rgba(15, 25, 35, 0.46), 0 0 0 1px rgba(255, 255, 255, 0.22)",
  },

  // Family 4: Vintage 1920s / Silent Film (Preserved authentic 1920s sepia/noir)
  vintage1920s: {
    cardBlack: "#0D0C0B",
    intertitleCream: "#EFE6CF",
    sepiaDark: "#271E15",
    sepiaGlow: "#9E7B54",
    agedPaper: "#E3DAC2",
    agedInk: "#231D15",
    filmBorder: "#4A3C2A",
    grainTint: "rgba(227, 218, 194, 0.07)",
    vignette: "radial-gradient(ellipse at center, rgba(39,30,21,0) 40%, rgba(13,12,11,0.92) 100%)",
  },

  // Family 5: Constructivist Red / Milk / Navy
  constructivist: {
    agitpropRed: PAGE_PALETTE.brickRed,
    paperCream: PAGE_PALETTE.paper,
    industrialBlack: PAGE_PALETTE.navy,
    steelGrey: PAGE_PALETTE.muted,
    redAccentBg: PAGE_PALETTE.riskFill,
    hairline: PAGE_PALETTE.navy,
  },

  // Family 6: Spy Titles / Chapter Cover Dossier (Deep Navy + Slate Blue + Brick Red)
  spyTitles: {
    dossierManila: PAGE_PALETTE.paper,
    classifiedRed: PAGE_PALETTE.brickRed,
    redactedBlack: PAGE_PALETTE.navy,
    typewriterCharcoal: PAGE_PALETTE.navyDeep,
    stampInk: PAGE_PALETTE.brickRed,
    topSecretYellow: OVER_FOOTAGE_PALETTE.accentPrimary,
    tapeTranslucent: "rgba(242, 240, 234, 0.55)",
  },

  // Family 7: Stained Glass (Milk Canvas Framed Panes + Soft Blue & Blush)
  stainedGlass: {
    leadCame: PAGE_PALETTE.navy,
    cobaltBlue: PAGE_PALETTE.gold,
    rubyRed: PAGE_PALETTE.brickRed,
    amberGold: PAGE_PALETTE.goldWarm,
    emeraldGreen: PAGE_PALETTE.chartSecondary,
    amethystViolet: "#5A6B7E",
    illuminationGlow: "rgba(250, 248, 243, 0.45)",
  },

  // Family 8: Blueprint Technical Manual (Deep Navy & Crisp Ice Blue)
  blueprintManual: {
    blueprintBg: PAGE_PALETTE.navy,
    blueprintGrid: "#2A3F54",
    chalkWhite: OVER_FOOTAGE_PALETTE.textHeadline,
    draftingAmber: OVER_FOOTAGE_PALETTE.accentPrimary,
    hairlineCyan: OVER_FOOTAGE_PALETTE.accentWarm,
    ruleMuted: OVER_FOOTAGE_PALETTE.textMuted,
  },
} as const;

export type StyleFamilyName = keyof typeof STYLE_FAMILIES;

/**
 * 3. Expressive Spring Configs
 */
export const SPRINGS: Record<string, SpringConfig> = {
  documentSnap: {
    damping: 24,
    mass: 0.9,
    stiffness: 110,
    overshootClamping: true,
  },
  cardGlide: {
    damping: 30,
    mass: 1.1,
    stiffness: 90,
    overshootClamping: true,
  },
  smoothFocus: {
    damping: 28,
    mass: 1.2,
    stiffness: 75,
    overshootClamping: false,
  },
  liquidGlass: {
    damping: 22,
    mass: 0.85,
    stiffness: 120,
    overshootClamping: false,
  },
  dockSnap: {
    damping: 26,
    mass: 0.75,
    stiffness: 140,
    overshootClamping: true,
  },
  nudgeAlert: {
    damping: 14,
    mass: 0.5,
    stiffness: 180,
    overshootClamping: false,
  },
  exitGlide: {
    damping: 28,
    mass: 0.9,
    stiffness: 100,
    overshootClamping: true,
  },
};
