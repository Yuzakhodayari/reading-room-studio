import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LiquidGlassObject } from "../components/glass/LiquidGlassObject";
import { FONTS, OVER_FOOTAGE_PALETTE, SPRINGS } from "../design/tokens";

/**
 * Transparent Overlay Card for DaVinci Resolve PiP composite (Over Footage Navy Glass).
 *
 * Designed specifically for video editing:
 * - Canvas is completely transparent.
 * - Anchored on the right third (right: 72px), reserving the left two-thirds
 *   for the creator's talking-head video.
 * - Uses crystal-clear smoked-navy Apple Liquid Glass (blur 9px, saturate 175%, SVG refraction)
 *   with light text + textShadow for guaranteed readability over dark & bright video.
 * - Render with: npx remotion render TreasuryTable9-Overlay out/overlay.mov --codec=prores --prores-profile=4444 --image-format=png
 */
export const TreasuryOverlayCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring (frames 0–35)
  const cardEntrance = spring({
    frame,
    fps,
    config: SPRINGS.documentSnap,
  });

  const cardTranslateX = interpolate(cardEntrance, [0, 1], [140, 0]);
  const cardOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Payroll ticker (frames 45–95)
  const payrollTick = interpolate(frame, [45, 95], [84.1, 86.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const payrollBar = interpolate(frame, [45, 95], [84.1, 86.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Corporate drop ticker (frames 110–165)
  const corpTick = interpolate(frame, [110, 165], [10.8, 7.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const corpBar = interpolate(frame, [110, 165], [10.8, 7.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Highlight pulse on the Corporate drop
  const alertPulse =
    frame >= 140
      ? interpolate(Math.sin((frame - 140) * 0.15), [-1, 1], [0.85, 1])
      : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent", // CRITICAL: zero background for video editor alpha overlay
        fontFamily: FONTS.sans,
      }}
    >
      {/* Crystal-Clear Smoked-Navy Liquid Glass Card anchored to Right Third */}
      <div
        style={{
          position: "absolute",
          top: "160px",
          right: "72px",
          opacity: cardOpacity,
          transform: `translateX(${cardTranslateX}px)`,
        }}
      >
        <LiquidGlassObject
          width={520}
          borderRadius={24}
          tint="navy-glass"
          enableSfx={false}
        >
          <div style={{ padding: "32px 36px", userSelect: "none" }}>
            {/* Card Eyebrow */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: `1px solid ${OVER_FOOTAGE_PALETTE.glassInnerHairline}`,
                paddingBottom: "12px",
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: OVER_FOOTAGE_PALETTE.brickRedText,
                  textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                }}
              >
                RECEIPTS BREAKDOWN
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "10.5px",
                  fontWeight: 500,
                  color: OVER_FOOTAGE_PALETTE.textMuted,
                  backgroundColor: OVER_FOOTAGE_PALETTE.glassDarkWell,
                  border: `1px solid ${OVER_FOOTAGE_PALETTE.glassInnerHairline}`,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                }}
              >
                Treasury Table 9
              </div>
            </div>

            {/* Metric 1: Individual / Paychecks */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "15.5px",
                      fontWeight: 700,
                      color: OVER_FOOTAGE_PALETTE.textHeadline,
                      textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                    }}
                  >
                    Paychecks & Individual Taxes
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: "10.5px",
                      color: OVER_FOOTAGE_PALETTE.textMuted,
                      textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                    }}
                  >
                    Direct Wage & Salary Withholding
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "26px",
                    fontWeight: 800,
                    color: OVER_FOOTAGE_PALETTE.textHeadline,
                    textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                  }}
                >
                  {payrollTick.toFixed(1)}%
                </div>
              </div>

              {/* Bar track */}
              <div
                style={{
                  height: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.16)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${payrollBar}%`,
                    height: "100%",
                    backgroundColor: OVER_FOOTAGE_PALETTE.accentPrimary,
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>

            {/* Metric 2: Corporate Share */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "15.5px",
                      fontWeight: 700,
                      color: OVER_FOOTAGE_PALETTE.textHeadline,
                      textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                    }}
                  >
                    Corporate Net Taxes
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: "10.5px",
                      color: OVER_FOOTAGE_PALETTE.textMuted,
                      textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                    }}
                  >
                    Projected After Hardware Write-Offs
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "26px",
                    fontWeight: 800,
                    color:
                      frame >= 110
                        ? OVER_FOOTAGE_PALETTE.brickRedText
                        : OVER_FOOTAGE_PALETTE.textHeadline,
                    textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                    transform: `scale(${alertPulse})`,
                    transformOrigin: "right center",
                  }}
                >
                  {corpTick.toFixed(1)}%
                </div>
              </div>

              {/* Bar track */}
              <div
                style={{
                  height: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.16)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${corpBar}%`,
                    height: "100%",
                    backgroundColor:
                      frame >= 110
                        ? OVER_FOOTAGE_PALETTE.brickRedText
                        : OVER_FOOTAGE_PALETTE.accentPrimary,
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>

            {/* Bottom Risk Annotation Banner */}
            <div
              style={{
                backgroundColor: OVER_FOOTAGE_PALETTE.riskFill,
                border: `1px solid ${OVER_FOOTAGE_PALETTE.riskBorder}`,
                borderRadius: "10px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: OVER_FOOTAGE_PALETTE.brickRedText,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "11.5px",
                  color: OVER_FOOTAGE_PALETTE.textBody,
                  letterSpacing: "0.01em",
                  textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                }}
              >
                CBO Projection: Corporate share drops toward{" "}
                <strong style={{ color: OVER_FOOTAGE_PALETTE.textHeadline }}>
                  ~7%
                </strong>
              </div>
            </div>
          </div>
        </LiquidGlassObject>
      </div>
    </AbsoluteFill>
  );
};
