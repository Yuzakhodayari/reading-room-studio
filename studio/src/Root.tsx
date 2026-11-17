import "./index.css";
import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { TreasuryTable9Scene } from "./compositions/TreasuryTable9Scene";
import { TreasuryOverlayCard } from "./compositions/TreasuryOverlayCard";
import { StudioShowcase } from "./compositions/StudioShowcase";
import {
  DEFAULT_DIRECTOR_BEAT,
  DirectorBeatRenderer,
  DirectorBeatRendererProps,
} from "./compositions/DirectorBeatRenderer";

const calculateDirectorBeatMetadata: CalculateMetadataFunction<
  DirectorBeatRendererProps
> = ({ props }) => {
  const beat = props?.beat ?? DEFAULT_DIRECTOR_BEAT;
  const frameSpan = (beat.endFrame ?? 0) - (beat.startFrame ?? 0);
  const durationInFrames = Math.max(
    1,
    frameSpan > 0 ? frameSpan : Math.round((beat.durationSec || 5) * 30)
  );
  return {
    durationInFrames,
    fps: 30,
    width: 1920,
    height: 1080,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 1. Full-Screen 15-second Investigative Documentary Scene */}
      <Composition
        id="TreasuryTable9-Full"
        component={TreasuryTable9Scene}
        durationInFrames={450} // 15 seconds at 30 fps
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 2. Transparent 10-second PiP Overlay Card for Video Editor Composite */}
      <Composition
        id="TreasuryTable9-Overlay"
        component={TreasuryOverlayCard}
        durationInFrames={300} // 10 seconds at 30 fps
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 3. Studio Interactive Showcase (600 frames = 20s @ 30fps) */}
      <Composition
        id="StudioShowcase"
        component={StudioShowcase}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 4. Parameterized Director Beat Renderer (ProRes 4444 / VP9 / MP4) */}
      <Composition
        id="DirectorBeat"
        component={DirectorBeatRenderer}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          beat: DEFAULT_DIRECTOR_BEAT,
          previewMode: "simulated-room",
        }}
        calculateMetadata={calculateDirectorBeatMetadata}
      />
    </>
  );
};
