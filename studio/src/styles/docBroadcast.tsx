import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SfxCue } from "../components/SfxCue";
import { FONTS } from "../design/fonts";
import {
  COLORS,
  OVER_FOOTAGE_PALETTE,
  PAGE_PALETTE,
  STYLE_FAMILIES,
} from "../design/tokens";
import { MOTION_SPRINGS } from "../motion/primitives";

// ============================================================================
// 1. NewsPackageLowerThird (Over Footage Navy Glass Bar + #FAF6EE + Chips)
// ============================================================================
export interface NewsPackageLowerThirdProps {
  title: string;
  source: string;
  category?: string;
  mode?: "LIVE" | "ANALYSIS" | "REPLAY";
  atFrame?: number;
}

export const NewsPackageLowerThird: React.FC<NewsPackageLowerThirdProps> = ({
  title,
  source,
  category = "Fiscal Report",
  mode = "ANALYSIS",
  atFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < atFrame) return null;
  const elapsed = frame - atFrame;
  const enter = spring({
    frame: elapsed,
    fps,
    config: MOTION_SPRINGS.snappy,
    durationInFrames: 14,
  });

  const modeColors = {
    LIVE: OVER_FOOTAGE_PALETTE.brickRedText,
    ANALYSIS: OVER_FOOTAGE_PALETTE.accentPrimary,
    REPLAY: OVER_FOOTAGE_PALETTE.chartSecondary,
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "54px",
        left: "64px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        transform: `translate3d(0, ${(1 - enter) * 28}px, 0)`,
        opacity: enter,
        zIndex: 50,
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            backgroundColor:
              mode === "LIVE" ? PAGE_PALETTE.brickRed : PAGE_PALETTE.navy,
            color: OVER_FOOTAGE_PALETTE.textHeadline,
            border: "1px solid rgba(255, 255, 255, 0.28)",
            fontFamily: FONTS.mono,
            fontWeight: 700,
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: "6px",
            boxShadow: "0 6px 16px rgba(15, 25, 35, 0.35)",
          }}
        >
          {category}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "rgba(15, 25, 35, 0.48)",
            backdropFilter: "blur(9px) saturate(175%)",
            WebkitBackdropFilter: "blur(9px) saturate(175%)",
            border: `1px solid ${OVER_FOOTAGE_PALETTE.glassBorder}`,
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "11px",
            fontFamily: FONTS.mono,
            fontWeight: 700,
            color: OVER_FOOTAGE_PALETTE.textHeadline,
            textShadow: OVER_FOOTAGE_PALETTE.textShadow,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: modeColors[mode],
            }}
          />
          {mode}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          background:
            "linear-gradient(135deg, rgba(15, 25, 35, 0.68) 0%, rgba(24, 38, 52, 0.62) 100%)",
          backdropFilter: "blur(12px) saturate(165%) brightness(0.66)",
          WebkitBackdropFilter: "blur(12px) saturate(165%) brightness(0.66)",
          border: `1.25px solid ${OVER_FOOTAGE_PALETTE.glassBorder}`,
          borderLeft: `4px solid ${
            mode === "LIVE" ? PAGE_PALETTE.brickRed : PAGE_PALETTE.navy
          }`,
          padding: "16px 26px",
          borderRadius: "14px",
          boxShadow:
            "0 20px 44px rgba(15, 25, 35, 0.42), inset 0 1px 2px rgba(255, 255, 255, 0.32)",
          maxWidth: "820px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            fontFamily: FONTS.sans,
            fontWeight: 700,
            fontSize: "24px",
            lineHeight: 1.25,
            color: OVER_FOOTAGE_PALETTE.textHeadline,
            textShadow: OVER_FOOTAGE_PALETTE.textShadow,
          }}
        >
          {title}
        </div>
        <div
          style={{
            position: "relative",
            zIndex: 1,
            fontFamily: FONTS.mono,
            fontSize: "12px",
            fontWeight: 500,
            color: OVER_FOOTAGE_PALETTE.textMuted,
            marginTop: "5px",
            textShadow: OVER_FOOTAGE_PALETTE.textShadow,
          }}
        >
          Source · {source}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. CaptionNewsCard (Warm Parchment Editorial Summary Card)
// ============================================================================
export interface CaptionNewsCardProps {
  headline: string;
  body: string;
  dateline?: string;
  atFrame?: number;
}

export const CaptionNewsCard: React.FC<CaptionNewsCardProps> = ({
  headline,
  body,
  dateline = "Washington, D.C.",
  atFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < atFrame) return null;
  const elapsed = frame - atFrame;
  const enter = spring({
    frame: elapsed,
    fps,
    config: MOTION_SPRINGS.snappy,
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "64px",
        left: "64px",
        maxWidth: "500px",
        backgroundColor: COLORS.paperLight,
        border: `1px solid ${COLORS.paperBorder}`,
        borderTop: `3px solid ${COLORS.navy}`,
        borderRadius: "12px",
        padding: "28px 32px",
        boxShadow: "0 18px 40px rgba(28, 43, 58, 0.12)",
        transform: `translate3d(${(1 - enter) * -36}px, 0, 0)`,
        opacity: enter,
        zIndex: 45,
        userSelect: "none",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: "11px",
          fontWeight: 700,
          color: COLORS.brickRed,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        {dateline}
      </div>
      <div
        style={{
          fontFamily: FONTS.serif,
          fontSize: "24px",
          fontWeight: 700,
          color: COLORS.navy,
          lineHeight: 1.25,
          marginBottom: "10px",
        }}
      >
        {headline}
      </div>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: "14.5px",
          color: COLORS.navy,
          lineHeight: 1.55,
        }}
      >
        {body}
      </div>
    </div>
  );
};

// ============================================================================
// 3. VisualInvestigationBoard (Page Milk Evidence Desk + #F8ECE8/#E6C3B9 Risk Box)
// ============================================================================
export interface VisualInvestigationBoardProps {
  evidenceItems: { id: string; label: string; value: string; isFlagged?: boolean }[];
  pointerTargetId?: string;
  atFrame?: number;
}

export const VisualInvestigationBoard: React.FC<VisualInvestigationBoardProps> = ({
  evidenceItems,
  pointerTargetId,
  atFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - atFrame);

  // Soft 4-frame smooth cross-dissolve + gentle luminance dip (zero harsh white flash)
  const crossDissolveOpacity = elapsed < 4 ? 0.88 + (elapsed / 4) * 0.12 : 1.0;
  const luminanceDipAlpha = elapsed < 4 ? 0.14 * (1 - elapsed / 4) : 0;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.paperLight,
        opacity: crossDissolveOpacity,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {elapsed === 0 && <SfxCue cue="paper-slide" atFrame={atFrame} volume={0.6} />}

      {/* Subtle Page Coordinate Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, ${STYLE_FAMILIES.visualInvestigation.gridLine} 1px, transparent 1px),
            linear-gradient(to bottom, ${STYLE_FAMILIES.visualInvestigation.gridLine} 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Soft Milk Canvas Radial Depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 88% 82% at 50% 45%, rgba(250, 248, 243, 0.25) 0%, rgba(242, 240, 234, 0.85) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Gentle 4-frame navy luminance dip veil */}
      {luminanceDipAlpha > 0.001 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: `rgba(28, 43, 58, ${luminanceDipAlpha.toFixed(3)})`,
            pointerEvents: "none",
            zIndex: 80,
          }}
        />
      )}

      {/* Clean Editorial Header */}
      <div
        style={{
          position: "absolute",
          top: "52px",
          left: "72px",
          fontFamily: FONTS.mono,
          fontSize: "12px",
          fontWeight: 700,
          color: COLORS.brickRed,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Case Notes · Key Figures
      </div>

      {/* Evidence Items Container */}
      <div
        style={{
          position: "absolute",
          top: "148px",
          left: "72px",
          right: "72px",
          display: "flex",
          gap: "28px",
          flexWrap: "wrap",
          alignItems: "stretch",
        }}
      >
        {evidenceItems.map((item, idx) => {
          const isTarget = item.id === pointerTargetId || item.isFlagged;
          const itemStart = atFrame + 4 + idx * 4;
          const isRevealed = frame >= itemStart;
          if (!isRevealed) return null;

          return (
            <div
              key={item.id}
              style={{
                position: "relative",
                minWidth: "300px",
                flex: "1 1 340px",
                maxWidth: "560px",
                backgroundColor: isTarget ? COLORS.riskFill : COLORS.paperLight,
                border: isTarget
                  ? `2px solid ${COLORS.riskBorder}`
                  : `1px solid ${COLORS.paperBorder}`,
                boxShadow: isTarget
                  ? "0 18px 36px rgba(163, 64, 46, 0.12)"
                  : "0 14px 30px rgba(28, 43, 58, 0.08)",
                padding: "28px 32px",
                borderRadius: "12px",
              }}
            >
              {isTarget && (
                <div
                  style={{
                    position: "absolute",
                    top: "-12px",
                    right: "16px",
                    backgroundColor: COLORS.brickRed,
                    color: COLORS.paperLight,
                    fontFamily: FONTS.mono,
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "4px",
                    letterSpacing: "0.08em",
                  }}
                >
                  KEY RISK
                </div>
              )}
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: isTarget ? COLORS.brickRed : COLORS.muted,
                  marginBottom: "10px",
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: item.value.length > 16 ? "23px" : "30px",
                  fontWeight: 800,
                  lineHeight: 1.25,
                  color: COLORS.navy,
                  overflowWrap: "break-word",
                }}
              >
                {item.value}
              </div>

              {/* Decisive Brick Red Pointer */}
              {isTarget && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "-34px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: COLORS.brickRed,
                    fontSize: "22px",
                    fontWeight: 900,
                  }}
                >
                  ▲
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 4. ArchiveLightTable (Page Milk Backlit Reading Room Light Table)
// ============================================================================
export interface ArchiveLightTableProps {
  children?: React.ReactNode;
}

export const ArchiveLightTable: React.FC<ArchiveLightTableProps> = ({ children }) => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.paper,
        overflow: "hidden",
      }}
    >
      {/* Backlit Milk Canvas Surface */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "80%",
          height: "80%",
          borderRadius: "20px",
          background:
            "radial-gradient(circle at 50% 50%, rgba(250, 248, 243, 0.96) 0%, rgba(242, 240, 234, 0.72) 75%, transparent 100%)",
          border: `1px solid ${COLORS.paperBorder}`,
          boxShadow: "0 20px 50px rgba(28, 43, 58, 0.08)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// 5. LiveCountdownSplit (Light-Mood Split-Screen Timeline Horizon)
// ============================================================================
export interface LiveCountdownSplitProps {
  leftTitle: string;
  rightTitle: string;
  startYear?: number;
  endYear?: number;
  atFrame?: number;
  duration?: number;
}

export const LiveCountdownSplit: React.FC<LiveCountdownSplitProps> = ({
  leftTitle,
  rightTitle,
  startYear = 2026,
  endYear = 2036,
  atFrame = 0,
  duration = 90,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame - atFrame, [0, Math.max(1, duration)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const currentYear = Math.round(startYear + (endYear - startYear) * progress);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        userSelect: "none",
      }}
    >
      {/* Left Slice: Warm Cream Baseline */}
      <div
        style={{
          flex: 1,
          backgroundColor: COLORS.paperLight,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "56px",
          borderRight: `2px solid ${COLORS.navy}`,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: COLORS.muted,
          }}
        >
          BASELINE
        </span>
        <h2
          style={{
            fontFamily: FONTS.serif,
            fontSize: "36px",
            fontWeight: 700,
            color: COLORS.navy,
            marginTop: "12px",
            textAlign: "center",
          }}
        >
          {leftTitle}
        </h2>
      </div>

      {/* Right Slice: Risk Horizon Box (#F8ECE8 / #E6C3B9) */}
      <div
        style={{
          flex: 1,
          backgroundColor: COLORS.riskFill,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "56px",
          borderLeft: `2px solid ${COLORS.navy}`,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: COLORS.brickRed,
          }}
        >
          PROJECTED OUTCOME
        </span>
        <h2
          style={{
            fontFamily: FONTS.serif,
            fontSize: "36px",
            fontWeight: 700,
            color: COLORS.navy,
            marginTop: "12px",
            textAlign: "center",
          }}
        >
          {rightTitle}
        </h2>
      </div>

      {/* Center Year Badge */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: COLORS.paperLight,
          border: `2px solid ${COLORS.navy}`,
          borderRadius: "14px",
          padding: "18px 32px",
          boxShadow: "0 18px 38px rgba(28, 43, 58, 0.16)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: COLORS.muted,
          }}
        >
          TIMELINE HORIZON
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: "48px",
            fontWeight: 800,
            color: COLORS.navy,
          }}
        >
          {currentYear}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 6. TelestratorOverlay (Hand-drawn SVG Rings & Arrows + Crisp Navy Pill Label)
// ============================================================================
export interface TelestratorOverlayProps {
  circleTarget?: { cx: number; cy: number; r: number; label?: string };
  arrowTarget?: { x1: number; y1: number; x2: number; y2: number };
  color?: string;
  atFrame?: number;
  duration?: number;
}

export const TelestratorOverlay: React.FC<TelestratorOverlayProps> = ({
  circleTarget,
  arrowTarget,
  color = OVER_FOOTAGE_PALETTE.accentPrimary,
  atFrame = 0,
  duration = 24,
}) => {
  const frame = useCurrentFrame();

  if (frame < atFrame) return null;
  const elapsed = frame - atFrame;
  const drawProgress = interpolate(elapsed, [0, Math.max(1, duration)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelOpacity = interpolate(drawProgress, [0.5, 0.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {frame === atFrame && <SfxCue cue="telestrator-draw" atFrame={atFrame} volume={0.6} />}
      <svg
        viewBox="0 0 1920 1080"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 60,
        }}
      >
        {circleTarget && (
          <ellipse
            cx={circleTarget.cx}
            cy={circleTarget.cy}
            rx={circleTarget.r}
            ry={circleTarget.r * 0.58}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={2 * Math.PI * circleTarget.r}
            strokeDashoffset={2 * Math.PI * circleTarget.r * (1 - drawProgress)}
            strokeLinecap="round"
            filter="drop-shadow(0 2px 6px rgba(15, 25, 35, 0.42))"
          />
        )}

        {arrowTarget && (
          <line
            x1={arrowTarget.x1}
            y1={arrowTarget.y1}
            x2={arrowTarget.x1 + (arrowTarget.x2 - arrowTarget.x1) * drawProgress}
            y2={arrowTarget.y1 + (arrowTarget.y2 - arrowTarget.y1) * drawProgress}
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            filter="drop-shadow(0 2px 6px rgba(15, 25, 35, 0.42))"
          />
        )}
      </svg>

      {/* Crisp #1C2B3A Backing Pill with #8FB4D9 / #FAF6EE Label */}
      {circleTarget?.label && drawProgress > 0.5 && (
        <div
          style={{
            position: "absolute",
            left: `${circleTarget.cx}px`,
            top: `${Math.max(36, circleTarget.cy - circleTarget.r * 0.68)}px`,
            transform: "translate(-50%, -100%)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: PAGE_PALETTE.navy,
            border: `1.5px solid ${OVER_FOOTAGE_PALETTE.accentPrimary}`,
            color: OVER_FOOTAGE_PALETTE.textHeadline,
            padding: "8px 16px",
            borderRadius: "999px",
            boxShadow: "0 12px 28px rgba(15, 25, 35, 0.36)",
            fontFamily: FONTS.mono,
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            opacity: labelOpacity,
            pointerEvents: "none",
            zIndex: 62,
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: OVER_FOOTAGE_PALETTE.accentPrimary,
              flexShrink: 0,
            }}
          />
          <span>{circleTarget.label}</span>
        </div>
      )}
    </>
  );
};

// ============================================================================
// 7. KinoMontageStrip (Constructivist Geometric Reading Room Composition)
// ============================================================================
export interface KinoMontageStripProps {
  numberText: string;
  headerText: string;
  subtitle?: string;
  category?: string;
  fullScene?: boolean;
  atFrame?: number;
}

export const KinoMontageStrip: React.FC<KinoMontageStripProps> = ({
  numberText,
  headerText,
  subtitle,
  category = "Opening Hook",
  fullScene = false,
  atFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < atFrame) return null;
  const elapsed = frame - atFrame;
  const enter = spring({ frame: elapsed, fps, config: MOTION_SPRINGS.snappy });

  if (fullScene) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          backgroundColor: COLORS.paperLight,
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* Constructivist Diagonal & Structural Geometric Bands */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "110px",
            width: "320px",
            height: "1320px",
            backgroundColor: COLORS.navy,
            transform: `skewX(-16deg) translate3d(${(1 - enter) * 80}px, 0, 0)`,
            opacity: 0.94,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "140px",
            left: 0,
            width: "100%",
            height: "18px",
            backgroundColor: COLORS.navy,
            transform: `scaleX(${enter})`,
            transformOrigin: "left center",
            opacity: 0.88,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "150px",
            left: 0,
            width: "46%",
            height: "28px",
            backgroundColor: COLORS.brickRed,
            transform: `translate3d(${(1 - enter) * -90}px, 0, 0)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "180px",
            left: "112px",
            width: "24px",
            height: "160px",
            backgroundColor: COLORS.brickRed,
            opacity: enter,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "210px",
            right: "185px",
            width: "150px",
            height: "150px",
            border: `6px solid ${COLORS.navy}`,
            transform: `rotate(12deg) scale(${0.85 + 0.15 * enter})`,
            opacity: 0.85 * enter,
          }}
        />

        {/* Balanced Editorial Centerpiece Lockup */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "156px",
            right: "360px",
            transform: `translateY(-50%) translate3d(0, ${(1 - enter) * 28}px, 0)`,
            opacity: enter,
            backgroundColor: COLORS.paper,
            border: `2px solid ${COLORS.navy}`,
            borderRadius: "14px",
            padding: "44px 52px",
            boxShadow: "0 24px 52px rgba(28, 43, 58, 0.16)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: COLORS.brickRed,
              color: COLORS.paperLight,
              fontFamily: FONTS.mono,
              fontSize: "11.5px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "5px 12px",
              borderRadius: "4px",
              marginBottom: "22px",
            }}
          >
            {category}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              marginBottom: subtitle ? "22px" : "0px",
            }}
          >
            <div
              style={{
                backgroundColor: COLORS.navy,
                color: COLORS.goldWarm,
                fontFamily: FONTS.condensed,
                fontSize: "88px",
                fontWeight: 900,
                lineHeight: 1,
                padding: "16px 28px",
                borderRadius: "10px",
                borderLeft: `6px solid ${COLORS.brickRed}`,
                flexShrink: 0,
              }}
            >
              {numberText}
            </div>

            <h1
              style={{
                margin: 0,
                fontFamily: FONTS.serif,
                fontSize: "52px",
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: "-0.015em",
                color: COLORS.navy,
              }}
            >
              {headerText}
            </h1>
          </div>

          {subtitle && (
            <div
              style={{
                borderTop: `1.5px solid ${COLORS.paperBorder}`,
                paddingTop: "18px",
                fontFamily: FONTS.sans,
                fontSize: "20px",
                lineHeight: 1.45,
                color: COLORS.navy,
                fontWeight: 500,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: COLORS.brickRed,
        color: COLORS.paperLight,
        border: `2px solid ${COLORS.navy}`,
        borderRadius: "10px",
        padding: "18px 36px",
        boxShadow: "0 18px 36px rgba(28, 43, 58, 0.16)",
        transform: `scale(${0.92 + 0.08 * enter})`,
        opacity: enter,
        userSelect: "none",
      }}
    >
      <span
        style={{
          fontFamily: FONTS.condensed,
          fontSize: "68px",
          fontWeight: 900,
          marginRight: "22px",
          lineHeight: 1,
          color: COLORS.paperLight,
        }}
      >
        {numberText}
      </span>
      <span
        style={{
          fontFamily: FONTS.serif,
          fontSize: "26px",
          fontWeight: 700,
          letterSpacing: "0.02em",
          color: COLORS.paper,
        }}
      >
        {headerText}
      </span>
    </div>
  );
};

// ============================================================================
// 8. CitySymphonyFrame (Clean Editorial Crop Marks & Timecode)
// ============================================================================
export const CitySymphonyFrame: React.FC<{ timecode?: string }> = ({
  timecode = "00:04:18:22",
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: "36px",
        border: `1px solid ${COLORS.paperBorder}`,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 40,
      }}
    >
      {/* Corner Crop Marks */}
      <div style={{ position: "absolute", top: "-1px", left: "-1px", width: "18px", height: "18px", borderTop: `2px solid ${COLORS.navy}`, borderLeft: `2px solid ${COLORS.navy}` }} />
      <div style={{ position: "absolute", top: "-1px", right: "-1px", width: "18px", height: "18px", borderTop: `2px solid ${COLORS.navy}`, borderRight: `2px solid ${COLORS.navy}` }} />
      <div style={{ position: "absolute", bottom: "-1px", left: "-1px", width: "18px", height: "18px", borderBottom: `2px solid ${COLORS.navy}`, borderLeft: `2px solid ${COLORS.navy}` }} />
      <div style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "18px", height: "18px", borderBottom: `2px solid ${COLORS.navy}`, borderRight: `2px solid ${COLORS.navy}` }} />

      {/* Subtle Timecode HUD */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          fontFamily: FONTS.mono,
          fontSize: "12px",
          letterSpacing: "0.08em",
          color: COLORS.muted,
          backgroundColor: "rgba(250, 248, 243, 0.90)",
          padding: "4px 10px",
          borderRadius: "4px",
          border: `1px solid ${COLORS.paperBorder}`,
        }}
      >
        {timecode}
      </div>
    </div>
  );
};
