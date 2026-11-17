import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SfxCue } from "../components/SfxCue";
import { FONTS } from "../design/fonts";
import { COLORS, OVER_FOOTAGE_PALETTE } from "../design/tokens";
import { MOTION_SPRINGS } from "../motion/primitives";

export type HeadlineVariant =
  | "newspaper-cutout"
  | "broadcast-lower-third"
  | "spy-title"
  | "chapter-card";

export interface EditorialHeadlineProps {
  variant?: HeadlineVariant;
  title: string;
  subtitle?: string;
  category?: string;
  atFrame?: number;
  duration?: number;
  fontSize?: number | string;
  enableSfx?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * EditorialHeadline Component
 * Four canonical headline treatments:
 * - newspaper-cutout: Scissor-cut tactile print card
 * - broadcast-lower-third: Newsthink/broadcast lower-third with dateline badge
 * - spy-title: Redacted classified cold-open dossier
 * - chapter-card: Cinematic act chapter title with structural numbers
 */
export const EditorialHeadline: React.FC<EditorialHeadlineProps> = ({
  variant = "broadcast-lower-third",
  title,
  subtitle,
  category = "SPECIAL INVESTIGATION",
  atFrame = 0,
  duration = 90,
  fontSize,
  enableSfx = true,
  className,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < atFrame) return null;
  if (frame >= atFrame + duration) return null;

  const elapsed = Math.max(0, frame - atFrame);
  const enterSpring = spring({
    frame: elapsed,
    fps,
    config: MOTION_SPRINGS.snappy,
    durationInFrames: 14,
  });

  // 1. Newspaper Cutout
  if (variant === "newspaper-cutout") {
    const rot = -1.2 + (1 - enterSpring) * -4;
    return (
      <>
        {enableSfx && frame === atFrame && (
          <SfxCue cue="paper-slide" atFrame={atFrame} volume={0.6} />
        )}
        <div
          className={className}
          style={{
            display: "inline-block",
            transform: `translate3d(0, ${(1 - enterSpring) * 34}px, 0) rotate(${rot}deg) scale(${0.92 + 0.08 * enterSpring})`,
            opacity: enterSpring,
            backgroundColor: COLORS.paper,
            color: COLORS.paperInk,
            padding: "30px 40px",
            borderRadius: "6px",
            boxShadow: "0 18px 40px rgba(28, 43, 58, 0.14)",
            border: `1px solid ${COLORS.paperBorder}`,
            maxWidth: "820px",
            userSelect: "none",
            ...style,
          }}
        >
          {category && (
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: COLORS.brickRed,
                borderBottom: `2px solid ${COLORS.navy}`,
                paddingBottom: "6px",
                marginBottom: "10px",
                textTransform: "uppercase",
              }}
            >
              {category}
            </div>
          )}
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: fontSize ?? 42,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              color: COLORS.navy,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: "16px",
                color: COLORS.navy,
                marginTop: "10px",
                lineHeight: 1.5,
                fontWeight: 500,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </>
    );
  }

  // 2. Broadcast Lower Third
  if (variant === "broadcast-lower-third") {
    return (
      <>
        {enableSfx && frame === atFrame && (
          <SfxCue cue="glass-dock" atFrame={atFrame} volume={0.6} />
        )}
        <div
          className={className}
          style={{
            position: "absolute",
            bottom: "64px",
            left: "64px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            transform: `translate3d(${(1 - enterSpring) * -50}px, 0, 0)`,
            opacity: enterSpring,
            zIndex: 40,
            userSelect: "none",
            ...style,
          }}
        >
          {/* Header Slug Bar */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: COLORS.brickRed,
              color: COLORS.paperLight,
              fontFamily: FONTS.mono,
              fontWeight: 700,
              fontSize: "11px",
              letterSpacing: "0.08em",
              padding: "4px 12px",
              textTransform: "uppercase",
              alignSelf: "flex-start",
              borderRadius: "6px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: COLORS.paperLight,
              }}
            />
            {category}
          </div>

          {/* Main Content Card */}
          <div
            style={{
              backgroundColor: "rgba(250, 248, 243, 0.95)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: `1px solid ${COLORS.paperBorder}`,
              borderLeft: `4px solid ${COLORS.navy}`,
              padding: "18px 28px",
              borderRadius: "10px",
              boxShadow: "0 16px 36px rgba(28, 43, 58, 0.14)",
              maxWidth: "800px",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: fontSize ?? 28,
                fontWeight: 700,
                color: COLORS.navy,
                letterSpacing: "-0.01em",
                lineHeight: 1.24,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "13px",
                  color: COLORS.muted,
                  marginTop: "6px",
                  letterSpacing: "0.03em",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // 3. Spy Title (Navy Cover Dossier)
  if (variant === "spy-title") {
    const revealProgress = interpolate(elapsed, [4, 22], [0, 100], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <>
        {enableSfx && frame === atFrame && (
          <SfxCue cue="newsreel-click" atFrame={atFrame} volume={0.6} />
        )}
        <div
          className={className}
          style={{
            display: "inline-flex",
            flexDirection: "column",
            gap: "12px",
            padding: "32px 40px",
            background: `linear-gradient(145deg, ${COLORS.navyDeep} 0%, ${COLORS.navy} 100%)`,
            border: `1px solid ${OVER_FOOTAGE_PALETTE.accentPrimary}`,
            borderRadius: "12px",
            boxShadow: "0 20px 44px rgba(15, 25, 35, 0.28)",
            opacity: enterSpring,
            userSelect: "none",
            ...style,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
              borderBottom: "1px solid rgba(143, 180, 217, 0.35)",
              paddingBottom: "8px",
            }}
          >
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: "11px",
                color: OVER_FOOTAGE_PALETTE.accentPrimary,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {category}
            </span>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: "10px",
                color: OVER_FOOTAGE_PALETTE.textMuted,
              }}
            >
              Record Brief
            </span>
          </div>

          <div style={{ position: "relative", display: "inline-block" }}>
            <div
              style={{
                fontFamily: FONTS.serif,
                fontSize: fontSize ?? 36,
                fontWeight: 700,
                color: OVER_FOOTAGE_PALETTE.textHeadline,
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </div>

            {/* Sliding Navy Redaction Bar Reveal */}
            <div
              style={{
                position: "absolute",
                inset: "-2px -4px",
                backgroundColor: COLORS.navyDeep,
                transform: `scaleX(${Math.max(0, 1 - revealProgress / 100)})`,
                transformOrigin: "right center",
                pointerEvents: "none",
              }}
            />
          </div>

          {subtitle && (
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: "15px",
                color: OVER_FOOTAGE_PALETTE.textBody,
                lineHeight: 1.45,
                maxWidth: "740px",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </>
    );
  }

  // 4. Chapter Card (Navy Chapter Cover Box)
  if (variant === "chapter-card") {
    return (
      <>
        {enableSfx && frame === atFrame && (
          <SfxCue cue="chapter-chime" atFrame={atFrame} volume={0.6} />
        )}
        <div
          className={className}
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "16px",
            padding: "48px 64px",
            background: `linear-gradient(145deg, ${COLORS.navyDeep} 0%, ${COLORS.navy} 100%)`,
            border: `1.5px solid ${OVER_FOOTAGE_PALETTE.accentPrimary}`,
            borderRadius: "16px",
            boxShadow: "0 24px 52px rgba(15, 25, 35, 0.28)",
            transform: `scale(${0.92 + 0.08 * enterSpring})`,
            opacity: enterSpring,
            userSelect: "none",
            ...style,
          }}
        >
          {category && (
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: "12px",
                letterSpacing: "0.14em",
                color: OVER_FOOTAGE_PALETTE.accentPrimary,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {category}
            </div>
          )}

          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: fontSize ?? 56,
              fontWeight: 700,
              color: OVER_FOOTAGE_PALETTE.textHeadline,
              letterSpacing: "-0.015em",
              lineHeight: 1.14,
              maxWidth: "920px",
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: "18px",
                color: OVER_FOOTAGE_PALETTE.textBody,
                maxWidth: "700px",
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </>
    );
  }

  return null;
};
