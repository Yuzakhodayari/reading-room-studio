import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SfxCue, SfxName } from "../components/SfxCue";
import {
  calcEntryMotion,
  calcExitMotion,
  calcInPlaceMotion,
  combineMotionStyles,
  EntryAction,
  ExitAction,
  InPlaceAction,
  MOTION_SPRINGS,
  MotionAction,
  steppedHold,
} from "./primitives";

export type { EntryAction, ExitAction, InPlaceAction, MotionAction };

export interface ObjectAnimatorProps {
  children: React.ReactNode;
  enter?: EntryAction;
  enterDuration?: number;
  enterSpring?: keyof typeof MOTION_SPRINGS;
  exit?: ExitAction;
  exitDuration?: number;
  activeEffect?: InPlaceAction;
  activeEffectStart?: number;
  activeEffectDuration?: number;
  loop?: InPlaceAction;
  atFrame?: number;
  duration?: number;
  sfx?: SfxName;
  sfxExit?: SfxName;
  steppedFps?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Unified Object Animator
 * Wraps any visual component with deterministic entry, exit, in-place active effect,
 * optional loop, stepped FPS hold, and synchronized procedural SFX.
 */
export const ObjectAnimator: React.FC<ObjectAnimatorProps> = ({
  children,
  enter = "pop-out",
  enterDuration = 12,
  enterSpring = "snappy",
  exit,
  exitDuration = 12,
  activeEffect,
  activeEffectStart,
  activeEffectDuration = 24,
  loop,
  atFrame = 0,
  duration,
  sfx,
  sfxExit,
  steppedFps,
  className,
  style,
}) => {
  const rawFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Quantize frame if stepped stop-motion FPS is requested
  const frame = steppedFps
    ? steppedHold(rawFrame, steppedFps, fps)
    : rawFrame;

  // Lifecycle boundary calculations
  const exitStartFrame =
    duration !== undefined ? atFrame + duration - exitDuration : Infinity;

  // 1. Before entry frame: hidden
  if (frame < atFrame) {
    return null;
  }

  // 2. Fully exited: hidden
  if (duration !== undefined && frame >= atFrame + duration) {
    return null;
  }

  // 3. Entry animation progress
  const enterElapsed = Math.max(0, frame - atFrame);
  const enterProgress = spring({
    frame: enterElapsed,
    fps,
    config: MOTION_SPRINGS[enterSpring] ?? MOTION_SPRINGS.snappy,
    durationInFrames: enterDuration,
  });
  const entryStyle = calcEntryMotion(enter, enterProgress);

  // 4. Exit animation progress
  let exitStyle;
  if (exit && frame >= exitStartFrame) {
    const exitElapsed = Math.max(0, frame - exitStartFrame);
    const exitProgress = Math.min(1, exitElapsed / Math.max(1, exitDuration));
    exitStyle = calcExitMotion(exit, exitProgress);
  }

  // 5. In-place active effect
  let inPlaceStyle: (ReturnType<typeof calcInPlaceMotion>) | undefined;
  if (activeEffect) {
    const effectStart = activeEffectStart ?? atFrame + enterDuration;
    inPlaceStyle = calcInPlaceMotion(
      activeEffect,
      frame,
      fps,
      effectStart,
      activeEffectDuration
    );
  }

  // 6. Continuous loop
  let loopStyle: (ReturnType<typeof calcInPlaceMotion>) | undefined;
  if (loop) {
    loopStyle = calcInPlaceMotion(loop, frame, fps, atFrame, activeEffectDuration);
  }

  const combinedStyles = combineMotionStyles(
    entryStyle,
    exitStyle,
    inPlaceStyle,
    loopStyle
  );

  const showBorderTrace =
    activeEffect === "border-trace" || loop === "border-trace";
  const borderProgress =
    activeEffect === "border-trace"
      ? (inPlaceStyle?.progress ?? 0)
      : (loopStyle?.progress ?? 0);

  const showSpotlight =
    activeEffect === "spotlight-vignette" || loop === "spotlight-vignette";
  const spotlightProgress =
    activeEffect === "spotlight-vignette"
      ? (inPlaceStyle?.progress ?? 0)
      : (loopStyle?.progress ?? 0);

  return (
    <>
      {/* Synchronized SFX audio cues */}
      {sfx && atFrame !== undefined && (
        <SfxCue cue={sfx} atFrame={atFrame} volume={0.65} />
      )}
      {sfxExit && exitStartFrame !== Infinity && (
        <SfxCue cue={sfxExit} atFrame={exitStartFrame} volume={0.55} />
      )}

      <div
        className={className}
        style={{
          position: "relative",
          display: "inline-block",
          transformOrigin: "center center",
          ...combinedStyles,
          ...style,
        }}
      >
        {showSpotlight && spotlightProgress > 0.01 && (
          <div
            style={{
              position: "absolute",
              inset: "-32px",
              borderRadius: "36px",
              background:
                "radial-gradient(circle at 50% 50%, rgba(62, 106, 148, 0.24) 0%, rgba(250, 248, 243, 0.10) 45%, transparent 72%)",
              opacity: spotlightProgress,
              pointerEvents: "none",
              zIndex: -1,
            }}
          />
        )}

        {children}

        {showBorderTrace && borderProgress > 0.01 && (
          <svg
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "-2px",
              width: "calc(100% + 4px)",
              height: "calc(100% + 4px)",
              pointerEvents: "none",
              overflow: "visible",
              zIndex: 20,
            }}
          >
            <rect
              x="1"
              y="1"
              width="100%"
              height="100%"
              rx="20"
              ry="20"
              fill="none"
              stroke="rgba(143, 180, 217, 0.85)"
              strokeWidth="2.5"
              pathLength={100}
              strokeDasharray="36 64"
              strokeDashoffset={100 * (1 - borderProgress)}
            />
          </svg>
        )}
      </div>
    </>
  );
};
