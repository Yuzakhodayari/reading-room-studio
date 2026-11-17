import { CSSProperties } from "react";
import { Easing, interpolate, spring, SpringConfig } from "remotion";

export const ENTRY_ACTIONS = [
  "pop-out",
  "elastic-open",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
  "whip-slide",
  "curtain-wipe",
  "iris-reveal",
  "paper-unfold",
  "flip-x",
  "flip-y",
  "stamp-slam",
  "blur-snap",
  "zoom-burst",
  "shutter-flash",
  "bounce-drop",
  "skew-wipe",
  "accordion-unfold",
  "rubber-snap",
  "zoom-punch",
] as const;

export type EntryAction = (typeof ENTRY_ACTIONS)[number];

export const EXIT_ACTIONS = [
  "fade-out",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
  "pop-down",
  "blur-fade",
  "curtain-close",
  "iris-close",
  "fade-blur-out",
  "skew-wipe",
  "zoom-punch",
] as const;

export type ExitAction = (typeof EXIT_ACTIONS)[number];

export const IN_PLACE_ACTIONS = [
  "highlight-sweep",
  "underline-draw",
  "circle-telestrator",
  "lens-zoom",
  "tilt-3d",
  "float-idle",
  "pulse-warning",
  "nudge",
  "shake-alert",
  "focus-dim",
  "ken-burns",
  "split-compare",
  "glow-rim",
  "glitch-jitter",
  "card-tilt-3d",
  "spotlight-vignette",
  "split-push-left",
  "split-push-right",
  "parallax-hover",
  "dial-rotate",
  "magnifier-pan",
  "border-trace",
  "orbit-float",
  "card-flip-180",
] as const;

export type InPlaceAction = (typeof IN_PLACE_ACTIONS)[number];

export type MotionAction = EntryAction | ExitAction | InPlaceAction;

export function isEntryAction(action: string): action is EntryAction {
  return (ENTRY_ACTIONS as readonly string[]).includes(action);
}

export function isExitAction(action: string): action is ExitAction {
  return (EXIT_ACTIONS as readonly string[]).includes(action);
}

export function isInPlaceAction(action: string): action is InPlaceAction {
  return (IN_PLACE_ACTIONS as readonly string[]).includes(action);
}

export interface MotionTransform {
  transform?: string;
  opacity?: number;
  filter?: string;
  clipPath?: string;
  boxShadow?: string;
}

/**
 * Standard spring configs for motions
 */
export const MOTION_SPRINGS: Record<string, SpringConfig> = {
  snappy: { damping: 20, mass: 0.8, stiffness: 140, overshootClamping: true },
  elastic: { damping: 12, mass: 0.7, stiffness: 180, overshootClamping: false },
  slam: { damping: 26, mass: 1.2, stiffness: 160, overshootClamping: true },
  gentle: { damping: 28, mass: 1.0, stiffness: 85, overshootClamping: true },
  nudge: { damping: 14, mass: 0.5, stiffness: 200, overshootClamping: false },
};

/**
 * Calculate deterministic transform and filter styles for entry transitions.
 */
export function calcEntryMotion(
  action: EntryAction,
  progress: number // normalized 0.0 -> 1.0
): MotionTransform {
  const p = Math.max(0, Math.min(1, progress));

  switch (action) {
    case "pop-out":
      return {
        transform: `scale(${0.4 + 0.6 * p})`,
        opacity: p,
      };
    case "elastic-open":
      return {
        transform: `scale(${p < 0.8 ? p * 1.3 : 1 + (1 - p) * 0.2})`,
        opacity: Math.min(1, p * 2),
      };
    case "slide-left":
      return {
        transform: `translate3d(${(1 - p) * 120}px, 0, 0)`,
        opacity: p,
      };
    case "slide-right":
      return {
        transform: `translate3d(${-(1 - p) * 120}px, 0, 0)`,
        opacity: p,
      };
    case "slide-up":
      return {
        transform: `translate3d(0, ${(1 - p) * 80}px, 0)`,
        opacity: p,
      };
    case "slide-down":
      return {
        transform: `translate3d(0, ${-(1 - p) * 80}px, 0)`,
        opacity: p,
      };
    case "whip-slide":
      return {
        transform: `translate3d(${(1 - p) * 240}px, 0, 0) skewX(${-(1 - p) * 12}deg)`,
        opacity: p,
      };
    case "curtain-wipe":
      return {
        clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
        opacity: 1,
      };
    case "iris-reveal":
      return {
        clipPath: `circle(${p * 150}% at 50% 50%)`,
        opacity: 1,
      };
    case "paper-unfold":
      return {
        transform: `perspective(800px) rotateX(${(1 - p) * -85}deg) scale(${0.85 + 0.15 * p})`,
        opacity: p,
        filter: `brightness(${0.7 + 0.3 * p})`,
      };
    case "flip-x":
      return {
        transform: `perspective(600px) rotateX(${(1 - p) * 90}deg)`,
        opacity: p,
      };
    case "flip-y":
      return {
        transform: `perspective(600px) rotateY(${(1 - p) * -90}deg)`,
        opacity: p,
      };
    case "stamp-slam": {
      const slamScale = 1.35 - 0.35 * p;
      const rot = (1 - p) * -6;
      return {
        transform: `scale(${slamScale}) rotate(${rot}deg)`,
        opacity: p,
        filter: p < 0.6 ? "blur(1px)" : "blur(0px)",
      };
    }
    case "blur-snap":
      return {
        transform: `scale(${0.92 + 0.08 * p})`,
        filter: `blur(${(1 - p) * 16}px)`,
        opacity: p,
      };
    case "zoom-burst":
      return {
        transform: `scale(${0.75 + 0.25 * p})`,
        opacity: p,
      };
    case "shutter-flash": {
      // Soft 4-frame luminance dip & gentle settle (zero harsh white strobe)
      const dipBrightness = 0.86 + 0.14 * p;
      return {
        transform: `scale(${0.97 + 0.03 * p})`,
        filter: `brightness(${dipBrightness.toFixed(3)})`,
        opacity: p,
      };
    }
    case "bounce-drop": {
      let y = 0;
      if (p < 0.62) {
        const t = p / 0.62;
        y = -120 * (1 - t * t);
      } else if (p < 0.84) {
        const t = (p - 0.62) / 0.22;
        y = -16 * Math.sin(t * Math.PI);
      } else if (p < 0.999) {
        const t = (p - 0.84) / 0.16;
        y = -5 * Math.sin(t * Math.PI);
      }
      const squash = p < 0.999 ? Math.exp(-Math.pow((p - 0.62) / 0.07, 2)) * 0.06 : 0;
      const scaleY = 1 - squash;
      const scaleX = 1 + squash * 0.7;
      return {
        transform: `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`,
        opacity: Math.min(1, p * 4),
      };
    }
    case "skew-wipe": {
      const eased = 1 - Math.pow(1 - p, 3);
      return {
        clipPath: `inset(0 ${((1 - eased) * 100).toFixed(2)}% 0 0)`,
        transform: `translate3d(${((1 - eased) * 40).toFixed(2)}px, 0, 0) skewX(${((1 - eased) * -14).toFixed(2)}deg)`,
        opacity: Math.min(1, p * 2.5),
      };
    }
    case "accordion-unfold": {
      const eased = 1 - Math.pow(1 - p, 3);
      const insetY = ((1 - eased) * 42).toFixed(2);
      return {
        transform: `perspective(900px) rotateX(${((1 - eased) * 40).toFixed(2)}deg) scaleY(${(0.15 + 0.85 * eased).toFixed(4)})`,
        clipPath: `inset(${insetY}% 0 ${insetY}% 0)`,
        opacity: Math.min(1, p * 2),
      };
    }
    case "rubber-snap": {
      const osc = p >= 0.999 ? 0 : Math.sin(p * Math.PI * 3) * Math.exp(-p * 3.5) * 0.24;
      const baseScale = 0.55 + 0.45 * Math.min(1, p * 1.4);
      const sx = baseScale + osc;
      const sy = baseScale - osc * 0.7;
      return {
        transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
        opacity: Math.min(1, p * 2.5),
      };
    }
    case "zoom-punch": {
      const eased = 1 - Math.pow(1 - p, 3);
      const punchScale = 1.38 - 0.38 * eased;
      const blurPx = (1 - eased) * 8;
      const bright = 1 + (1 - eased) * 0.3;
      return {
        transform: `scale(${punchScale.toFixed(4)})`,
        filter: `blur(${blurPx.toFixed(2)}px) brightness(${bright.toFixed(3)})`,
        opacity: Math.min(1, p * 2.5),
      };
    }
    default:
      return { opacity: p };
  }
}

/**
 * Calculate deterministic transform and filter styles for exit transitions.
 */
export function calcExitMotion(
  action: ExitAction,
  progress: number // normalized 0.0 -> 1.0 (0 = start exit, 1 = fully exited)
): MotionTransform {
  const p = Math.max(0, Math.min(1, progress));
  const remaining = 1 - p;

  switch (action) {
    case "fade-out":
      return { opacity: remaining };
    case "slide-left":
      return {
        transform: `translate3d(${-p * 120}px, 0, 0)`,
        opacity: remaining,
      };
    case "slide-right":
      return {
        transform: `translate3d(${p * 120}px, 0, 0)`,
        opacity: remaining,
      };
    case "slide-up":
      return {
        transform: `translate3d(0, ${-p * 80}px, 0)`,
        opacity: remaining,
      };
    case "slide-down":
      return {
        transform: `translate3d(0, ${p * 80}px, 0)`,
        opacity: remaining,
      };
    case "pop-down":
      return {
        transform: `scale(${1 - p * 0.3})`,
        opacity: remaining,
      };
    case "blur-fade":
      return {
        filter: `blur(${p * 18}px)`,
        opacity: remaining,
      };
    case "curtain-close":
      return {
        clipPath: `inset(0 0 0 ${p * 100}%)`,
        opacity: 1,
      };
    case "iris-close":
      return {
        clipPath: `circle(${remaining * 150}% at 50% 50%)`,
        opacity: 1,
      };
    case "fade-blur-out":
      return {
        transform: `scale(${(1 - p * 0.08).toFixed(4)}) translate3d(0, ${(-p * 10).toFixed(2)}px, 0)`,
        filter: `blur(${(p * 20).toFixed(2)}px)`,
        opacity: remaining,
      };
    case "skew-wipe":
      return {
        clipPath: `inset(0 0 0 ${(p * 100).toFixed(2)}%)`,
        transform: `translate3d(${(-p * 40).toFixed(2)}px, 0, 0) skewX(${(p * 14).toFixed(2)}deg)`,
        opacity: Math.max(0, 1 - p * 0.4),
      };
    case "zoom-punch":
      return {
        transform: `scale(${(1 + p * 0.35).toFixed(4)})`,
        filter: `blur(${(p * 14).toFixed(2)}px)`,
        opacity: remaining,
      };
    default:
      return { opacity: remaining };
  }
}

/**
 * Calculate deterministic in-place continuous or periodic motions.
 */
export function calcInPlaceMotion(
  action: InPlaceAction,
  frame: number,
  fps: number,
  actionStartFrame: number = 0,
  actionDuration: number = 30
): MotionTransform & { highlightProgress?: number; progress?: number } {
  const safeDuration = Math.max(1, actionDuration);
  const localFrame = Math.max(0, frame - actionStartFrame);
  const p = Math.min(1, localFrame / safeDuration);

  switch (action) {
    case "highlight-sweep": {
      const sweepP = interpolate(localFrame, [0, safeDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      return { highlightProgress: sweepP, progress: sweepP };
    }
    case "underline-draw": {
      const lineP = interpolate(localFrame, [0, safeDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      });
      return {
        transform: `scaleX(${lineP})`,
        progress: lineP,
      };
    }
    case "circle-telestrator": {
      const strokeP = interpolate(localFrame, [0, safeDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return { progress: strokeP };
    }
    case "lens-zoom": {
      const zoom = 1 + Math.sin(p * Math.PI) * 0.08;
      return {
        transform: `scale(${zoom})`,
        boxShadow: `0 20px 40px rgba(28,43,58,${0.18 + Math.sin(p * Math.PI) * 0.14})`,
      };
    }
    case "tilt-3d": {
      const rotY = Math.sin((frame / fps) * 1.5) * 6;
      const rotX = Math.cos((frame / fps) * 1.2) * 4;
      return {
        transform: `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
      };
    }
    case "float-idle": {
      const floatY = Math.sin((frame / fps) * 2.2) * 5;
      return {
        transform: `translate3d(0, ${floatY}px, 0)`,
      };
    }
    case "pulse-warning": {
      const pulse = 1 + Math.sin((frame / fps) * 6) * 0.025;
      const glowAlpha = 0.24 + Math.sin((frame / fps) * 6) * 0.18;
      return {
        transform: `scale(${pulse})`,
        boxShadow: `0 0 24px rgba(163, 64, 46, ${glowAlpha})`,
      };
    }
    case "nudge": {
      const nudgeY =
        localFrame < safeDuration
          ? Math.sin((localFrame / safeDuration) * Math.PI) * -8
          : 0;
      return {
        transform: `translate3d(0, ${nudgeY}px, 0)`,
      };
    }
    case "shake-alert": {
      const intensity = Math.max(0, 1 - localFrame / safeDuration);
      const shakeX = Math.sin(localFrame * 2.8) * 8 * intensity;
      return {
        transform: `translate3d(${shakeX}px, 0, 0)`,
      };
    }
    case "focus-dim": {
      const dimOpacity = interpolate(p, [0, 1], [1, 0.32], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return {
        opacity: dimOpacity,
        filter: `grayscale(${p * 40}%)`,
      };
    }
    case "ken-burns": {
      const kbScale = 1.0 + (frame / (fps * 10)) * 0.08;
      const kbX = Math.sin(frame * 0.01) * 15;
      return {
        transform: `scale(${kbScale}) translate3d(${kbX}px, 0, 0)`,
      };
    }
    case "split-compare": {
      return {
        progress: p,
      };
    }
    case "glow-rim": {
      const glowR = 12 + Math.sin((frame / fps) * 3) * 8;
      return {
        boxShadow: `0 0 ${glowR}px rgba(255, 255, 255, 0.35)`,
      };
    }
    case "glitch-jitter": {
      if (localFrame < safeDuration && localFrame % 3 === 0) {
        const jx = ((localFrame * 37) % 7) - 3;
        const jy = ((localFrame * 53) % 5) - 2;
        return {
          transform: `translate3d(${jx}px, ${jy}px, 0)`,
          filter: `drop-shadow(2px 0 0 rgba(163,64,46,0.55)) drop-shadow(-2px 0 0 rgba(28,43,58,0.45))`,
        };
      }
      return {};
    }
    case "card-tilt-3d": {
      const ramp = Math.min(1, p * 1.5);
      const t = frame / fps;
      const rx = ramp * (2.5 + Math.cos(t * 1.1) * 4.5);
      const ry = ramp * (-4.0 + Math.sin(t * 1.3) * 6.5);
      const lift = 1 + ramp * 0.025;
      return {
        transform: `perspective(1200px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${lift.toFixed(4)})`,
        boxShadow: `${(-ry * 2.2).toFixed(1)}px ${(18 + rx * 2).toFixed(1)}px 48px rgba(28, 43, 58, 0.24)`,
        progress: p,
      };
    }
    case "spotlight-vignette": {
      const easeP = interpolate(localFrame, [0, safeDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      return {
        transform: `scale(${(1 + easeP * 0.035).toFixed(4)})`,
        filter: `brightness(${(1 + easeP * 0.06).toFixed(3)}) contrast(${(1 + easeP * 0.04).toFixed(3)})`,
        boxShadow: `0 24px 64px rgba(15, 25, 35, ${(0.28 * easeP).toFixed(3)}), 0 0 28px rgba(143, 180, 217, ${(0.28 * easeP).toFixed(3)})`,
        progress: easeP,
      };
    }
    case "split-push-left": {
      const easeP = interpolate(localFrame, [0, safeDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      return {
        transform: `translate3d(${(-easeP * 180).toFixed(2)}px, 0, 0) scale(${(1 - easeP * 0.06).toFixed(4)})`,
        progress: easeP,
      };
    }
    case "split-push-right": {
      const easeP = interpolate(localFrame, [0, safeDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      return {
        transform: `translate3d(${(easeP * 180).toFixed(2)}px, 0, 0) scale(${(1 - easeP * 0.06).toFixed(4)})`,
        progress: easeP,
      };
    }
    case "parallax-hover": {
      const t = frame / fps;
      const px = Math.sin(t * 1.4) * 8 + Math.cos(t * 0.7) * 4;
      const py = Math.cos(t * 1.7) * 6 + Math.sin(t * 0.9) * 3;
      const rx = Math.sin(t * 1.2) * 3.5;
      const ry = Math.cos(t * 1.1) * 4.5;
      return {
        transform: `perspective(1000px) translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`,
        progress: p,
      };
    }
    case "dial-rotate": {
      const easeP = interpolate(localFrame, [0, safeDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
      return {
        transform: `rotate(${(easeP * 360).toFixed(2)}deg)`,
        progress: easeP,
      };
    }
    case "magnifier-pan": {
      const env = Math.sin(p * Math.PI);
      const zoom = 1 + env * 0.14;
      const panX = Math.sin(p * Math.PI * 2) * 18 * env;
      const panY = Math.cos(p * Math.PI * 2) * 8 * env;
      return {
        transform: `scale(${zoom.toFixed(4)}) translate3d(${panX.toFixed(2)}px, ${panY.toFixed(2)}px, 0)`,
        filter: `contrast(${(1 + env * 0.06).toFixed(3)})`,
        boxShadow: `0 24px 56px rgba(28, 43, 58, ${(0.20 + env * 0.16).toFixed(3)})`,
        progress: p,
      };
    }
    case "border-trace": {
      const traceP = interpolate(localFrame, [0, safeDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      return {
        boxShadow: `0 0 ${(16 * Math.sin(traceP * Math.PI)).toFixed(1)}px rgba(143, 180, 217, 0.44)`,
        progress: traceP,
      };
    }
    case "orbit-float": {
      const theta = (frame / fps) * 1.8;
      const ox = Math.cos(theta) * 9;
      const oy = Math.sin(theta * 2) * 4.5;
      const rot = Math.sin(theta) * 1.4;
      return {
        transform: `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`,
        progress: p,
      };
    }
    case "card-flip-180": {
      const easeP = interpolate(localFrame, [0, safeDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
      const lift = 1 + Math.sin(easeP * Math.PI) * 0.08;
      return {
        transform: `perspective(1000px) rotateY(${(easeP * 180).toFixed(2)}deg) scale(${lift.toFixed(4)})`,
        progress: easeP,
      };
    }
    default:
      return {};
  }
}

/**
 * Deterministic helper to count up a numeric value with formatting.
 */
export function countUpValue(
  frame: number,
  startFrame: number,
  duration: number,
  fromVal: number,
  toVal: number,
  fps: number = 30
): number {
  const safeDuration = Math.max(1, duration);
  const elapsed = Math.max(0, frame - startFrame);
  if (elapsed <= 0) return fromVal;
  if (elapsed >= safeDuration) return toVal;

  const progress = spring({
    frame: elapsed,
    fps,
    config: MOTION_SPRINGS.snappy,
    durationInFrames: safeDuration,
  });

  return fromVal + (toVal - fromVal) * progress;
}

/**
 * Returns stagger offset in frames for child items.
 */
export function staggerOffset(
  index: number,
  gapFrames: number = 3,
  startFrame: number = 0
): number {
  return startFrame + index * gapFrames;
}

/**
 * Progress fill calculation for bars or gauges.
 */
export function progressFill(
  frame: number,
  startFrame: number,
  duration: number
): number {
  const safeDuration = Math.max(1, duration);
  return interpolate(frame, [startFrame, startFrame + safeDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
}

/**
 * Minimum hold frames calculated from Latin/CJK character counts.
 * Formula: letters / 15 + 1.5s
 */
export function readingDuration(text: string, fps: number = 30): number {
  const letters = text.replace(/\s+/g, "").length;
  const seconds = letters / 15 + 1.5;
  return Math.ceil(seconds * fps);
}

/**
 * Holds motion on a stepped FPS grid (e.g. 12 fps stop-motion aesthetic).
 */
export function steppedHold(
  currentFrame: number,
  targetFps: number = 12,
  baseFps: number = 30
): number {
  const step = baseFps / targetFps;
  return Math.floor(currentFrame / step) * step;
}

/**
 * Combines multiple MotionTransform objects into a valid CSSProperties object.
 */
export function combineMotionStyles(
  ...transforms: (MotionTransform | undefined)[]
): CSSProperties {
  const style: CSSProperties = {};
  const transformParts: string[] = [];
  const filterParts: string[] = [];

  for (const t of transforms) {
    if (!t) continue;
    if (t.transform) transformParts.push(t.transform);
    if (t.filter) filterParts.push(t.filter);
    if (t.opacity !== undefined) style.opacity = t.opacity;
    if (t.clipPath !== undefined) style.clipPath = t.clipPath;
    if (t.boxShadow !== undefined) style.boxShadow = t.boxShadow;
  }

  if (transformParts.length > 0) {
    style.transform = transformParts.join(" ");
  }
  if (filterParts.length > 0) {
    style.filter = filterParts.join(" ");
  }

  return style;
}
