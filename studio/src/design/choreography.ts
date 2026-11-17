import { Easing, interpolate, spring, SpringConfig } from "remotion";

export { SPRINGS } from "./tokens";

export type LayerStage =
  | "hidden"
  | "enter"
  | "hold"
  | "focus"
  | "dock"
  | "highlight"
  | "nudge"
  | "exit";

export interface LayerState {
  stage: LayerStage;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  highlightProgress: number;
  focusGlow: number;
}

export interface LayerKeyframe {
  frame: number;
  stage: LayerStage;
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  highlightProgress?: number;
  focusGlow?: number;
  springConfig?: SpringConfig;
}

export interface LayerLifecyclePlan {
  enterFrame: number;
  enterDuration?: number;
  focusFrame?: number;
  focusDuration?: number;
  highlightFrame?: number;
  highlightDuration?: number;
  dockFrame?: number;
  dockDuration?: number;
  nudgeFrame?: number;
  nudgeDuration?: number;
  exitFrame?: number;
  exitDuration?: number;

  initial?: Partial<LayerState>;
  entered?: Partial<LayerState>;
  focused?: Partial<LayerState>;
  docked?: Partial<LayerState>;
  exited?: Partial<LayerState>;
}

export const EASINGS = {
  // Apple / Editorial Out-Cubic: quick entry with silky friction settle
  editorial: Easing.bezier(0.16, 1, 0.3, 1),
  // Snappy UI dock transition
  snappy: Easing.bezier(0.05, 0.9, 0.1, 1),
  // Smooth symmetrical glide
  smooth: Easing.bezier(0.42, 0, 0.58, 1),
  // Gentle tactile drift
  gentle: Easing.bezier(0.33, 1, 0.68, 1),
};

const DEFAULT_STATE: LayerState = {
  stage: "hidden",
  x: 0,
  y: 0,
  scale: 1,
  opacity: 1,
  highlightProgress: 0,
  focusGlow: 0,
};

/**
 * Convert a declarative LayerLifecyclePlan into an ordered array of keyframes.
 */
function planToKeyframes(plan: LayerLifecyclePlan): LayerKeyframe[] {
  const kfs: LayerKeyframe[] = [];

  const enterDur = plan.enterDuration ?? 14;
  const initial = plan.initial ?? {};
  const entered = plan.entered ?? {};

  // Hidden start keyframe
  kfs.push({
    frame: plan.enterFrame,
    stage: "hidden",
    x: initial.x ?? 0,
    y: initial.y ?? 24,
    scale: initial.scale ?? 0.94,
    opacity: initial.opacity ?? 0,
    highlightProgress: 0,
    focusGlow: 0,
  });

  // Entered steady-state baseline
  const enteredFrame = plan.enterFrame + enterDur;
  let cur = {
    x: entered.x ?? 0,
    y: entered.y ?? 0,
    scale: entered.scale ?? 1.0,
    opacity: entered.opacity ?? 1.0,
    highlightProgress: entered.highlightProgress ?? 0,
    focusGlow: entered.focusGlow ?? 0,
  };
  let lastFrame = enteredFrame;

  kfs.push({
    frame: enteredFrame,
    stage: "enter",
    ...cur,
  });

  type ScheduledStage = {
    startFrame: number;
    run: () => void;
  };
  const scheduled: ScheduledStage[] = [];

  const pushHoldIfNeeded = (startFrame: number) => {
    if (startFrame > lastFrame) {
      kfs.push({
        frame: startFrame,
        stage: "hold",
        ...cur,
      });
      lastFrame = startFrame;
    }
  };

  // Focus stage
  if (plan.focusFrame !== undefined) {
    const startFrame = plan.focusFrame;
    const focusDur = plan.focusDuration ?? 12;
    const focused = plan.focused ?? {};
    scheduled.push({
      startFrame,
      run: () => {
        pushHoldIfNeeded(startFrame);
        cur = {
          x: focused.x ?? cur.x,
          y: focused.y ?? cur.y,
          scale: focused.scale ?? 1.03,
          opacity: focused.opacity ?? cur.opacity,
          highlightProgress: focused.highlightProgress ?? cur.highlightProgress,
          focusGlow: focused.focusGlow ?? 1.0,
        };
        const endFrame = startFrame + focusDur;
        kfs.push({
          frame: endFrame,
          stage: "focus",
          ...cur,
        });
        lastFrame = Math.max(lastFrame, endFrame);
      },
    });
  }

  // Highlight stage
  if (plan.highlightFrame !== undefined) {
    const startFrame = plan.highlightFrame;
    const hlDur = plan.highlightDuration ?? 18;
    scheduled.push({
      startFrame,
      run: () => {
        cur = { ...cur, highlightProgress: 0 };
        pushHoldIfNeeded(startFrame);
        if (lastFrame < startFrame) {
          kfs.push({
            frame: startFrame,
            stage: "highlight",
            ...cur,
          });
          lastFrame = startFrame;
        }
        cur = { ...cur, highlightProgress: 1.0 };
        const endFrame = startFrame + hlDur;
        kfs.push({
          frame: endFrame,
          stage: "highlight",
          ...cur,
        });
        lastFrame = Math.max(lastFrame, endFrame);
      },
    });
  }

  // Nudge stage (tactile alert micro-impulse)
  if (plan.nudgeFrame !== undefined) {
    const startFrame = plan.nudgeFrame;
    const nudgeDur = plan.nudgeDuration ?? 8;
    scheduled.push({
      startFrame,
      run: () => {
        pushHoldIfNeeded(startFrame);
        const midFrame = startFrame + Math.floor(nudgeDur / 2);
        kfs.push({
          frame: midFrame,
          stage: "nudge",
          ...cur,
          y: cur.y - 6,
          scale: cur.scale * 1.015,
          focusGlow: 0.8,
        });
        const endFrame = startFrame + nudgeDur;
        cur = {
          ...cur,
          focusGlow: 0.2,
        };
        kfs.push({
          frame: endFrame,
          stage: "nudge",
          ...cur,
        });
        lastFrame = Math.max(lastFrame, endFrame);
      },
    });
  }

  // Dock stage
  if (plan.dockFrame !== undefined) {
    const startFrame = plan.dockFrame;
    const dockDur = plan.dockDuration ?? 16;
    const docked = plan.docked ?? {};
    scheduled.push({
      startFrame,
      run: () => {
        pushHoldIfNeeded(startFrame);
        cur = {
          x: docked.x ?? 480,
          y: docked.y ?? 260,
          scale: docked.scale ?? 0.78,
          opacity: docked.opacity ?? 0.95,
          highlightProgress: docked.highlightProgress ?? 0,
          focusGlow: docked.focusGlow ?? 0,
        };
        const endFrame = startFrame + dockDur;
        kfs.push({
          frame: endFrame,
          stage: "dock",
          ...cur,
        });
        lastFrame = Math.max(lastFrame, endFrame);
      },
    });
  }

  // Exit stage
  if (plan.exitFrame !== undefined) {
    const startFrame = plan.exitFrame;
    const exitDur = plan.exitDuration ?? 14;
    const exited = plan.exited ?? {};
    scheduled.push({
      startFrame,
      run: () => {
        pushHoldIfNeeded(startFrame);
        cur = {
          x: exited.x ?? cur.x,
          y: exited.y ?? cur.y - 20,
          scale: exited.scale ?? cur.scale * 0.92,
          opacity: exited.opacity ?? 0,
          highlightProgress: 0,
          focusGlow: 0,
        };
        const endFrame = startFrame + exitDur;
        kfs.push({
          frame: endFrame,
          stage: "exit",
          ...cur,
        });
        lastFrame = Math.max(lastFrame, endFrame);
      },
    });
  }

  // Process stages in chronological start order so hold keyframes preserve
  // the active steady state before each transition begins.
  scheduled.sort((a, b) => a.startFrame - b.startFrame);
  for (const stage of scheduled) {
    stage.run();
  }

  // Sort chronologically by frame
  kfs.sort((a, b) => a.frame - b.frame);
  return kfs;
}

/**
 * Resolves the active transformation and optical properties for any layer
 * at the given frame and fps across its entire lifecycle.
 */
export function resolveLayerLifecycle(
  frame: number,
  fps: number,
  lifecycle: LayerKeyframe[] | LayerLifecyclePlan
): LayerState {
  const keyframes = Array.isArray(lifecycle)
    ? [...lifecycle].sort((a, b) => a.frame - b.frame)
    : planToKeyframes(lifecycle);

  if (keyframes.length === 0) {
    return { ...DEFAULT_STATE };
  }

  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];

  // Before first keyframe: hidden
  if (frame < first.frame) {
    return {
      stage: "hidden",
      x: first.x ?? 0,
      y: first.y ?? 24,
      scale: first.scale ?? 0.94,
      opacity: 0,
      highlightProgress: 0,
      focusGlow: 0,
    };
  }

  // At or after last keyframe: clamped to final state
  if (frame >= last.frame) {
    return {
      stage: last.stage,
      x: last.x ?? 0,
      y: last.y ?? 0,
      scale: last.scale ?? 1,
      opacity: last.opacity ?? (last.stage === "exit" ? 0 : 1),
      highlightProgress: last.highlightProgress ?? 0,
      focusGlow: last.focusGlow ?? 0,
    };
  }

  // Locate bounding keyframe interval [k0, k1]
  let k0 = first;
  let k1 = last;

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (frame >= keyframes[i].frame && frame < keyframes[i + 1].frame) {
      k0 = keyframes[i];
      k1 = keyframes[i + 1];
      break;
    }
  }

  const span = Math.max(1, k1.frame - k0.frame);
  const elapsed = frame - k0.frame;

  // Use spring if defined, else smooth bezier interpolation
  let progress: number;
  if (k1.springConfig) {
    progress = spring({
      frame: elapsed,
      fps,
      config: k1.springConfig,
      durationInFrames: span,
    });
  } else {
    progress = interpolate(elapsed, [0, span], [0, 1], {
      easing: EASINGS.editorial,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  const currentStage: LayerStage = progress > 0.5 ? k1.stage : k0.stage;

  const interp = (v0?: number, v1?: number, fallback: number = 0): number => {
    const start = v0 ?? fallback;
    const end = v1 ?? start;
    return start + (end - start) * progress;
  };

  return {
    stage: currentStage,
    x: interp(k0.x, k1.x, 0),
    y: interp(k0.y, k1.y, 0),
    scale: interp(k0.scale, k1.scale, 1),
    opacity: Math.max(0, Math.min(1, interp(k0.opacity, k1.opacity, 1))),
    highlightProgress: Math.max(
      0,
      Math.min(1, interp(k0.highlightProgress, k1.highlightProgress, 0))
    ),
    focusGlow: Math.max(0, Math.min(1, interp(k0.focusGlow, k1.focusGlow, 0))),
  };
}
