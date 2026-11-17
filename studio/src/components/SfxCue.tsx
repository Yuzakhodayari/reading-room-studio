import React from "react";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";

export type SfxName =
  | "glass-enter"
  | "glass-expand"
  | "glass-dock"
  | "glass-exit"
  | "marker-sweep"
  | "paper-slide"
  | "data-tick"
  | "warning-thud"
  | "flash-cut"
  | "telestrator-draw"
  | "sticker-pop"
  | "newsreel-click"
  | "map-whoosh"
  | "type-click"
  | "ambient-tension-drone"
  | "riser-subtle"
  | "chapter-chime"
  | "paper-flip-fast"
  | "alert-ping"
  | "camera-shutter";

export interface SfxCueProps {
  cue: SfxName;
  atFrame?: number;
  volume?: number | ((frame: number) => number);
  playbackRate?: number;
}

/**
 * Clean 4.0.506 SfxCue component triggering audio from studio/public/sfx/*.wav
 */
export const SfxCue: React.FC<SfxCueProps> = ({
  cue,
  atFrame = 0,
  volume = 0.7,
  playbackRate = 1.0,
}) => {
  return (
    <Audio
      src={staticFile(`sfx/${cue}.wav`)}
      from={atFrame}
      volume={volume}
      playbackRate={playbackRate}
    />
  );
};

export interface SfxTimelineItem {
  cue: SfxName;
  frame: number;
  volume?: number;
  playbackRate?: number;
}

export interface SfxTimelineProps {
  cues: SfxTimelineItem[];
  masterVolume?: number;
}

/**
 * Timeline array renderer for multi-cue choreographed audio events
 */
export const SfxTimeline: React.FC<SfxTimelineProps> = ({
  cues,
  masterVolume = 1.0,
}) => {
  return (
    <>
      {cues.map((item, idx) => (
        <SfxCue
          key={`${item.cue}-${item.frame}-${idx}`}
          cue={item.cue}
          atFrame={item.frame}
          volume={(item.volume ?? 0.7) * masterVolume}
          playbackRate={item.playbackRate ?? 1.0}
        />
      ))}
    </>
  );
};
