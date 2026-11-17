export type BeatCategory =
  | "hook"
  | "thesis-promise"
  | "receipt-proof"
  | "metaphor-story"
  | "good-work-punchline"
  | "history-archive"
  | "map-geopolitics"
  | "warning-escalation"
  | "claire-ledger"
  | "open-loop"
  | "takeaway";

export type StyleEngineFamily =
  | "liquid-glass"
  | "doc-broadcast"
  | "vintage-editorial"
  | "diagram-metaphor"
  | "data-maps-3d";

export type CameraFraming =
  | "talking-head-full"
  | "talking-head-punch-in"
  | "talking-head-with-glass"
  | "fullscreen-cutaway"
  | "split-screen";

export type GlassPreset = "card" | "pill" | "dock" | "toast" | "split-modal";

export type PaletteMode = "page" | "over-footage";

export type MusicEnergy = "calm" | "pulse" | "tense" | "drop-silence";

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
  category: BeatCategory;
  spokenText: string;
  framing: CameraFraming;
  paletteMode?: PaletteMode;
  styleFamily: StyleEngineFamily;
  componentHint: string;
  motionAction: string;
  glassPreset?: GlassPreset;
  typographyMode?: string;
  sfxCues: Array<{ cue: string; offsetFrame: number; volume?: number }>;
  musicEnergy: MusicEnergy;
  cutReason: string;
  sourceCitation?: string;
}

export interface DirectorAudit {
  avgShotDurationSec: number;
  styleDiversityScore: number;
  repetitionWarnings: string[];
  heroPeakPercent: number;
  talkingHeadSharePercent: number;
}

export interface DirectorPlan {
  title: string;
  fps: number;
  totalFrames: number;
  beats: DirectorBeat[];
  audit: {
    avgShotDurationSec: number;
    styleDiversityScore: number;
    repetitionWarnings: string[];
    heroPeakPercent: number;
    talkingHeadSharePercent: number;
  };
}

export interface TranscriptSegment {
  id?: string;
  text: string;
  startSec: number;
  endSec: number;
  sourceCitation?: string;
  paragraphIndex?: number;
}

export interface DirectorOptions {
  title?: string;
  fps?: number;
  targetTalkingHeadShare?: number;
  heroStartPct?: number;
  heroEndPct?: number;
}

export interface StyleRecipe {
  id: string;
  styleFamily: StyleEngineFamily;
  componentHint: string;
  framing: CameraFraming;
  motionAction: string;
  glassPreset?: GlassPreset;
  typographyMode?: string;
  defaultSfx: string;
  secondarySfx?: string;
  paceProfile: "snappy" | "balanced" | "calm-hold";
  peakOnly?: boolean;
}
