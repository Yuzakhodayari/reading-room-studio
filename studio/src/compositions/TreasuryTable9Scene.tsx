import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EditorialBackdrop } from "../components/EditorialBackdrop";
import { SourceBadge } from "../components/SourceBadge";
import { COLORS, FONTS, SPRINGS } from "../design/tokens";

export const TreasuryTable9Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ==========================================
  // 1. SCENE PHASING & CAMERA FOCUS
  // ==========================================
  // Hook entry (frame 0-30): Quick, crisp card entrance within 0.4s
  const cardEntranceProgress = spring({
    frame,
    fps,
    config: SPRINGS.documentSnap,
  });

  const cardTranslateY = interpolate(cardEntranceProgress, [0, 1], [60, 0]);
  const cardRotate = interpolate(cardEntranceProgress, [0, 1], [-1.2, -0.2]);
  const cardOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Camera shift / zoom for Corporate focus (frame 195 - 240)
  const cameraZoom = interpolate(frame, [195, 245], [1, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cameraPanY = interpolate(frame, [195, 245], [0, -32], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // End card reveal (frame 345 - 380)
  const summaryProgress = spring({
    frame: frame - 345,
    fps,
    config: SPRINGS.cardGlide,
  });
  const summaryOpacity = interpolate(frame, [345, 360], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const summaryTranslateY = interpolate(summaryProgress, [0, 1], [30, 0]);

  // ==========================================
  // 2. DATA VALUES & ANIMATIONS
  // ==========================================
  // Row 1 (Individual / Payroll Taxes)
  const row1Opacity = interpolate(frame, [35, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Highlighter sweep across 84.1% (frame 60 - 90)
  const highlightWidth = interpolate(frame, [60, 90], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Tick from 84.1% to 86.4% (frame 110 - 150)
  const payrollTick = interpolate(frame, [110, 155], [84.1, 86.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const payrollBarPct = interpolate(frame, [45, 80], [0, 84.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const payrollBarGrow = interpolate(frame, [110, 155], [0, 2.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Row 2 (Corporate Income Tax)
  const row2Opacity = interpolate(frame, [50, 62], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Corporate decline from 10.8% down to 7.1% (frame 220 - 275)
  const corpTick = interpolate(frame, [220, 275], [10.8, 7.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const corpBarPct = interpolate(frame, [55, 90], [0, 10.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const corpBarShrink = interpolate(frame, [220, 275], [0, 3.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Row 3 (Customs & Other)
  const row3Opacity = interpolate(frame, [62, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Telestrator callout pointer (frame 234 - 265, settled by f250)
  const calloutProgress = spring({
    frame: frame - 234,
    fps,
    config: SPRINGS.documentSnap,
    durationInFrames: 14,
  });
  const calloutOpacity = interpolate(frame, [234, 244], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Micro-motion breathing on the final 1.5s
  const holdBreathing = Math.sin((frame - 345) * 0.04) * 1.5;

  // Deterministic row focus highlight (replaces CSS transition)
  const row2FocusAlpha = interpolate(frame, [195, 203], [0, 0.72], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: FONTS.sans }}>
      {/* Background layer */}
      <EditorialBackdrop driftSpeed={0.2} showGrid tone="light" />

      {/* Main Container with Camera Zoom/Pan */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${cameraZoom}) translateY(${cameraPanY - 24}px)`,
          transformOrigin: "52% 48%",
        }}
      >
        {/* ========================================================= */}
        {/* DOCUMENT CARD: Page Secondary Ground (#F2F0EA)            */}
        {/* ========================================================= */}
        <div
          style={{
            width: "1280px",
            backgroundColor: COLORS.paper,
            color: COLORS.paperInk,
            borderRadius: "10px",
            border: `1px solid ${COLORS.paperBorder}`,
            boxShadow:
              "0 24px 52px -14px rgba(28, 43, 58, 0.16), 0 4px 16px rgba(28, 43, 58, 0.06)",
            padding: "44px 56px",
            opacity: cardOpacity,
            transform: `translateY(${cardTranslateY}px) rotate(${cardRotate}deg)`,
            position: "relative",
          }}
        >
          {/* Paper texture top accent bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              backgroundColor: COLORS.navy,
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
            }}
          />

          {/* Header Section */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: `2px solid ${COLORS.navy}`,
              paddingBottom: "18px",
              marginBottom: "28px",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: COLORS.brickRed,
                  marginBottom: "4px",
                }}
              >
                DEPARTMENT OF THE TREASURY · FINANCIAL MANAGEMENT SERVICE
              </div>
              <div
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: "28px",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: COLORS.paperInk,
                }}
              >
                Table 9. Summary of Receipts by Source
              </div>
            </div>

            <div
              style={{
                fontFamily: FONTS.mono,
                textAlign: "right",
                fontSize: "11px",
                color: COLORS.paperMuted,
                lineHeight: "1.5",
              }}
            >
              <span
                style={{
                  backgroundColor: COLORS.navy,
                  color: COLORS.paper,
                  padding: "4px 10px",
                  fontWeight: 700,
                  borderRadius: "4px",
                }}
              >
                FISCAL 2024–2026
              </span>
              <div style={{ marginTop: "4px" }}>CBO Outlook Dataset</div>
            </div>
          </div>

          {/* Table Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Table Header Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "380px 170px 170px 1fr",
                fontFamily: FONTS.mono,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: COLORS.paperMuted,
                borderBottom: `1px solid ${COLORS.paperBorder}`,
                paddingBottom: "8px",
              }}
            >
              <span>SOURCE CLASSIFICATION</span>
              <span>FY2024 ACTUAL</span>
              <span>PROJECTED</span>
              <span>PROPORTION TO TOTAL RECEIPTS</span>
            </div>

            {/* ROW 1: Individual Income & Payroll Taxes */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "380px 170px 170px 1fr",
                alignItems: "center",
                opacity: row1Opacity,
                padding: "8px 0",
                position: "relative",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "17px", color: COLORS.paperInk }}>
                  Individual Income & Payroll Taxes
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "11px",
                    color: COLORS.paperMuted,
                  }}
                >
                  Line 01 · Wages, salaries & FICA withholdings
                </div>
              </div>

              {/* 84.1% with Translucent Gold Highlighter Sweep */}
              <div
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  width: "fit-content",
                  padding: "0 6px",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: "2px",
                    height: "24px",
                    width: `${highlightWidth}%`,
                    backgroundColor: COLORS.highlightSweep,
                    zIndex: 1,
                    borderRadius: "3px",
                  }}
                />
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "22px",
                    fontWeight: 700,
                    position: "relative",
                    zIndex: 2,
                    color: COLORS.paperInk,
                  }}
                >
                  84.1%
                </span>
              </div>

              {/* Projected Ticking Value */}
              <div>
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "22px",
                    fontWeight: 800,
                    color: frame >= 110 ? COLORS.paperInk : COLORS.paperMuted,
                  }}
                >
                  {payrollTick.toFixed(1)}%
                </span>
                {frame >= 130 && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "11px",
                      fontFamily: FONTS.mono,
                      fontWeight: 700,
                      color: COLORS.chartSecondary,
                      backgroundColor: "rgba(47, 143, 139, 0.14)",
                      padding: "2px 6px",
                      borderRadius: "3px",
                    }}
                  >
                    +2.3%
                  </span>
                )}
              </div>

              {/* Bar visualization */}
              <div
                style={{
                  height: "18px",
                  backgroundColor: "rgba(28, 43, 58, 0.08)",
                  borderRadius: "3px",
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: `${payrollBarPct}%`,
                    backgroundColor: COLORS.navy,
                    height: "100%",
                  }}
                />
                <div
                  style={{
                    width: `${payrollBarGrow}%`,
                    backgroundColor: COLORS.chartSecondary,
                    height: "100%",
                  }}
                />
              </div>
            </div>

            {/* ROW 2: Corporate Income Taxes (Hero turn in Scene 2) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "380px 170px 170px 1fr",
                alignItems: "center",
                opacity: row2Opacity,
                padding: "10px 8px",
                margin: "0 -8px",
                position: "relative",
                backgroundColor: `rgba(248, 236, 232, ${row2FocusAlpha})`,
                border:
                  frame >= 195
                    ? `1px solid ${COLORS.riskBorder}`
                    : "1px solid transparent",
                borderRadius: "6px",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "17px", color: COLORS.paperInk }}>
                  Corporate Income Taxes
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "11px",
                    color: COLORS.paperMuted,
                  }}
                >
                  Line 02 · Domestic corporate net receipts
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "22px",
                    fontWeight: 700,
                    color: COLORS.paperInk,
                  }}
                >
                  10.8%
                </span>
              </div>

              {/* Downward Animating Value */}
              <div>
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "22px",
                    fontWeight: 800,
                    color: frame >= 220 ? COLORS.brickRed : COLORS.paperInk,
                  }}
                >
                  {corpTick.toFixed(1)}%
                </span>
                {frame >= 235 && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "11px",
                      fontFamily: FONTS.mono,
                      fontWeight: 700,
                      color: COLORS.brickRed,
                      backgroundColor: COLORS.riskFill,
                      border: `1px solid ${COLORS.riskBorder}`,
                      padding: "2px 6px",
                      borderRadius: "3px",
                    }}
                  >
                    -3.7%
                  </span>
                )}
              </div>

              {/* Bar visualization */}
              <div
                style={{
                  height: "18px",
                  backgroundColor: "rgba(28, 43, 58, 0.08)",
                  borderRadius: "3px",
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: `${Math.max(0, corpBarPct - corpBarShrink)}%`,
                    backgroundColor: frame >= 220 ? COLORS.brickRed : COLORS.paperInk,
                    height: "100%",
                  }}
                />
              </div>

              {/* TELESTRATOR CALLOUT FLAG */}
              {frame >= 234 && (
                <div
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: `translateY(-50%) scale(${calloutProgress})`,
                    opacity: calloutOpacity,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: COLORS.brickRed,
                    color: COLORS.paperLight,
                    padding: "6px 14px",
                    borderRadius: "6px",
                    boxShadow: "0 6px 16px rgba(28, 43, 58, 0.18)",
                    fontFamily: FONTS.mono,
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    zIndex: 20,
                  }}
                >
                  <span style={{ fontSize: "12px" }}>◀</span>
                  2025 Hardware Write-Off Acceleration
                </div>
              )}
            </div>

            {/* ROW 3: Customs, Excise & Other Receipts */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "380px 170px 170px 1fr",
                alignItems: "center",
                opacity: row3Opacity,
                padding: "8px 0",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "16px", color: COLORS.paperInk }}>
                  Customs, Tariffs & Other Receipts
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "11px",
                    color: COLORS.paperMuted,
                  }}
                >
                  Line 03 · Duties, fees & misc. deposits
                </div>
              </div>

              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "20px",
                  fontWeight: 600,
                  color: COLORS.paperMuted,
                }}
              >
                5.1%
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "20px",
                  fontWeight: 600,
                  color: COLORS.paperMuted,
                }}
              >
                ~6.5%
              </div>

              <div
                style={{
                  height: "18px",
                  backgroundColor: "rgba(28, 43, 58, 0.08)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "5.1%",
                    backgroundColor: COLORS.paperMuted,
                    height: "100%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SUMMARY CARD: Frames 345 - 450                            */}
        {/* ========================================================= */}
        {frame >= 340 && (
          <div
            style={{
              position: "absolute",
              bottom: "92px",
              width: "1160px",
              backgroundColor: COLORS.paperLight,
              border: `1px solid ${COLORS.paperBorder}`,
              borderLeft: `5px solid ${COLORS.navy}`,
              borderRadius: "10px",
              padding: "22px 34px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 20px 44px rgba(28, 43, 58, 0.14)",
              opacity: summaryOpacity,
              transform: `translateY(${summaryTranslateY + holdBreathing}px)`,
              zIndex: 40,
            }}
          >
            {/* Split Metrics */}
            <div style={{ display: "flex", gap: "48px" }}>
              <div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "11px",
                    letterSpacing: "0.06em",
                    color: COLORS.muted,
                  }}
                >
                  PAYCHECKS SHARE (2026)
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "34px",
                    fontWeight: 800,
                    color: COLORS.navy,
                  }}
                >
                  &gt;86%
                </div>
              </div>

              <div
                style={{
                  width: "1px",
                  backgroundColor: COLORS.paperBorder,
                  height: "54px",
                }}
              />

              <div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "11px",
                    letterSpacing: "0.06em",
                    color: COLORS.muted,
                  }}
                >
                  CORPORATE SHARE (2026 PROJ.)
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "34px",
                    fontWeight: 800,
                    color: COLORS.brickRed,
                  }}
                >
                  ~7%
                </div>
              </div>
            </div>

            {/* Analytical Takeaway Risk Callout Box */}
            <div
              style={{
                maxWidth: "560px",
                backgroundColor: COLORS.riskFill,
                border: `1px solid ${COLORS.riskBorder}`,
                borderRadius: "8px",
                padding: "14px 20px",
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: COLORS.brickRed,
                  marginBottom: "4px",
                }}
              >
                THE STRUCTURAL RISK
              </div>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: "16.5px",
                  fontWeight: 700,
                  color: COLORS.navy,
                  lineHeight: "1.35",
                  letterSpacing: "-0.01em",
                }}
              >
                Paychecks fund 84%+ of federal taxes while corporate share drops toward ~7%.
              </div>
            </div>
          </div>
        )}
      </AbsoluteFill>

      {/* Source Citation Badge */}
      <SourceBadge
        sourceText="U.S. Treasury Monthly Statement, Table 9 · CBO"
        docRef="DOC REF: MTS-2024-T09"
        startFrame={15}
      />
    </AbsoluteFill>
  );
};
