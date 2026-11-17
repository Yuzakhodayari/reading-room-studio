import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SfxCue } from "../components/SfxCue";
import { FONTS } from "../design/fonts";
import { COLORS } from "../design/tokens";
import { MOTION_SPRINGS } from "../motion/primitives";

// ============================================================================
// 1. StickerCutout (19-paperclip: 10px white outline + soft shadow + sticker-pop)
// ============================================================================
export interface StickerCutoutProps {
  children?: React.ReactNode;
  outlineWidth?: number;
  rotation?: number;
  atFrame?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const StickerCutout: React.FC<StickerCutoutProps> = ({
  children,
  outlineWidth = 10,
  rotation = 3,
  atFrame = 0,
  className,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < atFrame) return null;
  const elapsed = frame - atFrame;
  const popSpring = spring({
    frame: elapsed,
    fps,
    config: MOTION_SPRINGS.elastic,
    durationInFrames: 14,
  });

  const driftY = Math.sin(frame * 0.04) * 4;

  return (
    <>
      {frame === atFrame && <SfxCue cue="sticker-pop" atFrame={atFrame} volume={0.65} />}
      <div
        className={className}
        style={{
          display: "inline-block",
          transform: `translate3d(0, ${driftY}px, 0) scale(${popSpring}) rotate(${rotation}deg)`,
          padding: `${outlineWidth}px`,
          backgroundColor: "#FFFFFF",
          color: COLORS.navy,
          borderRadius: "18px",
          border: `1px solid ${COLORS.paperBorder}`,
          boxShadow: "0 18px 38px -8px rgba(28, 43, 58, 0.16)",
          userSelect: "none",
          ...style,
        }}
      >
        <div style={{ borderRadius: "10px", overflow: "hidden" }}>{children}</div>
      </div>
    </>
  );
};

// ============================================================================
// 2. StickFigureStage (SVG Articulated Stick Figure with 5 Poses)
// ============================================================================
export type StickPose =
  | "idle"
  | "shocked"
  | "walking"
  | "pointing"
  | "crushed-by-debt";

export interface StickFigureStageProps {
  pose?: StickPose;
  caption?: string;
  accentColor?: string;
  width?: number;
  height?: number;
}

export const StickFigureStage: React.FC<StickFigureStageProps> = ({
  pose = "idle",
  caption,
  accentColor = COLORS.brickRed,
  width = 380,
  height = 480,
}) => {
  const frame = useCurrentFrame();

  // Pose parameters
  let headY = 80;
  let spinePath = "M 190 115 L 190 260";
  let leftArm = "M 190 145 Q 150 190 130 230";
  let rightArm = "M 190 145 Q 230 190 250 230";
  let leftLeg = "M 190 260 Q 170 330 150 400";
  let rightLeg = "M 190 260 Q 210 330 230 400";
  let weightBoxY = -200;

  if (pose === "shocked") {
    headY = 70 + Math.sin(frame * 0.8) * 3;
    leftArm = "M 190 145 Q 120 120 110 80";
    rightArm = "M 190 145 Q 260 120 270 80";
  } else if (pose === "walking") {
    const walkCycle = Math.sin(frame * 0.25);
    leftLeg = `M 190 260 Q ${170 - walkCycle * 25} 330 ${150 - walkCycle * 40} 400`;
    rightLeg = `M 190 260 Q ${210 + walkCycle * 25} 330 ${230 + walkCycle * 40} 400`;
    leftArm = `M 190 145 Q ${150 + walkCycle * 25} 190 ${130 + walkCycle * 35} 230`;
    rightArm = `M 190 145 Q ${230 - walkCycle * 25} 190 ${250 - walkCycle * 35} 230`;
  } else if (pose === "pointing") {
    leftArm = "M 190 145 Q 160 200 150 240";
    rightArm = "M 190 145 L 300 130";
  } else if (pose === "crushed-by-debt") {
    headY = 175;
    spinePath = "M 190 210 Q 190 240 190 280";
    leftArm = "M 190 215 Q 130 180 140 140";
    rightArm = "M 190 215 Q 250 180 240 140";
    leftLeg = "M 190 280 Q 140 330 130 380";
    rightLeg = "M 190 280 Q 240 330 250 380";
    weightBoxY = 60 + Math.sin(frame * 0.05) * 4;
  }

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        userSelect: "none",
      }}
    >
      <svg width={width} height={height} viewBox="0 0 380 480">
        {/* Crushed by Debt Slab */}
        {pose === "crushed-by-debt" && (
          <g transform={`translate(90, ${weightBoxY})`}>
            <rect
              width="200"
              height="80"
              rx="8"
              fill={COLORS.navy}
              stroke={accentColor}
              strokeWidth="3"
            />
            <text
              x="100"
              y="48"
              fill={COLORS.paperLight}
              fontFamily={FONTS.mono}
              fontSize="18"
              fontWeight="800"
              textAnchor="middle"
            >
              $38.4T DEBT
            </text>
          </g>
        )}

        {/* Head */}
        <circle
          cx="190"
          cy={headY}
          r="30"
          fill={COLORS.paper}
          stroke={COLORS.navy}
          strokeWidth="8"
        />

        {/* Spine */}
        <path d={spinePath} fill="none" stroke={COLORS.navy} strokeWidth="8" strokeLinecap="round" />

        {/* Arms */}
        <path d={leftArm} fill="none" stroke={COLORS.navy} strokeWidth="8" strokeLinecap="round" />
        <path d={rightArm} fill="none" stroke={COLORS.navy} strokeWidth="8" strokeLinecap="round" />

        {/* Legs */}
        <path d={leftLeg} fill="none" stroke={COLORS.navy} strokeWidth="8" strokeLinecap="round" />
        <path d={rightLeg} fill="none" stroke={COLORS.navy} strokeWidth="8" strokeLinecap="round" />

        {/* Ground Line */}
        <line x1="40" y1="400" x2="340" y2="400" stroke={COLORS.muted} strokeWidth="3" strokeLinecap="round" />
      </svg>

      {caption && (
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: "14px",
            fontWeight: 700,
            color: COLORS.muted,
            marginTop: "6px",
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. InstructionManualCard (IKEA-Style Technical Line-Art Step Sequence)
// ============================================================================
export interface InstructionManualCardProps {
  stepNumber: number;
  title: string;
  partsCount?: string;
  leftLabel?: string;
  rightLabel?: string;
  atFrame?: number;
}

export const InstructionManualCard: React.FC<InstructionManualCardProps> = ({
  stepNumber,
  title,
  partsCount = "1× FISCAL CLIFF",
  leftLabel = "BASELINE",
  rightLabel = "OUTCOME",
  atFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < atFrame) return null;
  const elapsed = frame - atFrame;
  const enter = spring({ frame: elapsed, fps, config: MOTION_SPRINGS.snappy });

  return (
    <div
      style={{
        display: "inline-block",
        width: "560px",
        backgroundColor: COLORS.paperLight,
        border: `2px solid ${COLORS.navy}`,
        borderRadius: "8px",
        padding: "28px 34px",
        boxShadow: "0 18px 38px rgba(28, 43, 58, 0.14)",
        transform: `scale(${0.92 + 0.08 * enter})`,
        opacity: enter,
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `2px solid ${COLORS.navy}`,
          paddingBottom: "14px",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: COLORS.navy,
              color: COLORS.paperLight,
              fontFamily: FONTS.mono,
              fontWeight: 800,
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {stepNumber}
          </div>
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: "20px",
              fontWeight: 800,
              color: COLORS.navy,
            }}
          >
            {title}
          </span>
        </div>

        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: "12px",
            color: COLORS.muted,
            fontWeight: 700,
          }}
        >
          {partsCount}
        </span>
      </div>

      {/* Assembly Instruction Line Drawing */}
      <svg width="492" height="140" viewBox="0 0 492 140">
        <rect x="20" y="30" width="160" height="70" rx="4" fill={COLORS.paper} stroke={COLORS.navy} strokeWidth="2.5" />
        <text
          x="100"
          y="65"
          fontFamily={FONTS.mono}
          fontSize="13.5"
          fontWeight="700"
          fill={COLORS.navy}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {leftLabel}
        </text>
        <rect x="312" y="30" width="160" height="70" rx="4" fill={COLORS.highlightSweep} stroke={COLORS.navy} strokeWidth="2.5" />
        <text
          x="392"
          y="65"
          fontFamily={FONTS.mono}
          fontSize="13.5"
          fontWeight="700"
          fill={COLORS.navy}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {rightLabel}
        </text>
        {/* Dotted Guide Line */}
        <line x1="180" y1="65" x2="312" y2="65" stroke={COLORS.navy} strokeWidth="2" strokeDasharray="6 6" />
        <polygon points="306,60 318,65 306,70" fill={COLORS.navy} />
        <text x="246" y="55" fontFamily={FONTS.mono} fontSize="11" fontWeight="700" fill={COLORS.muted} textAnchor="middle">
          STEP LINK
        </text>
      </svg>
    </div>
  );
};

// ============================================================================
// 4. IsometricScene (Light-Mood Warm Parchment Isometric Grid Stage)
// ============================================================================
export const IsometricScene: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.paperLight,
        overflow: "hidden",
      }}
    >
      {/* 45° Isometric Grid Lines */}
      <div
        style={{
          position: "absolute",
          inset: "-200px",
          backgroundImage: `
            linear-gradient(30deg, rgba(28, 43, 58, 0.045) 1px, transparent 1px),
            linear-gradient(150deg, rgba(28, 43, 58, 0.045) 1px, transparent 1px)
          `,
          backgroundSize: "60px 34.64px",
          transform: "perspective(1200px) rotateX(60deg) rotateZ(-45deg)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  );
};
