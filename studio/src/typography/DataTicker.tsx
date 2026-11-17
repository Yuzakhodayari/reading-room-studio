import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { SfxCue } from "../components/SfxCue";
import { FONTS } from "../design/fonts";
import { COLORS, OVER_FOOTAGE_PALETTE } from "../design/tokens";
import { countUpValue } from "../motion/primitives";

export interface DataTickerProps {
  startValue?: number;
  endValue: number;
  atFrame?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label?: string;
  delta?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  fontSize?: number | string;
  fontFamily?: string;
  color?: string;
  accentColor?: string;
  darkSurface?: boolean;
  enableSfx?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * DataTicker Component
 * Animated tabular-numerals counter with prefix/suffix, financial delta indicators,
 * and deterministic UI data-tick audio pulses.
 */
export const DataTicker: React.FC<DataTickerProps> = ({
  startValue = 0,
  endValue,
  atFrame = 0,
  duration = 30,
  prefix = "",
  suffix = "",
  decimals = 1,
  label,
  delta,
  fontSize = 54,
  fontFamily = FONTS.mono,
  color = COLORS.navy,
  accentColor = COLORS.gold,
  darkSurface = false,
  enableSfx = true,
  className,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentNumeric = countUpValue(
    frame,
    atFrame,
    duration,
    startValue,
    endValue,
    fps
  );

  const formattedNum = currentNumeric.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const isCounting = frame >= atFrame && frame < atFrame + duration;
  const shouldPlayTick = enableSfx && isCounting && frame % 4 === 0;
  const labelColor = darkSurface ? "#D4DCE4" : COLORS.muted;
  const textShadow = darkSurface ? OVER_FOOTAGE_PALETTE.textShadow : undefined;

  return (
    <>
      {shouldPlayTick && (
        <SfxCue cue="data-tick" atFrame={frame} volume={0.4} />
      )}

      <div
        className={className}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          gap: "4px",
          fontFamily,
          userSelect: "none",
          ...style,
        }}
      >
        {label && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: labelColor,
              textTransform: "uppercase",
              textShadow,
            }}
          >
            {label}
          </span>
        )}

        <div
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontSize,
              fontWeight: 700,
              color,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              textShadow,
            }}
          >
            {prefix && (
              <span style={{ color: accentColor, marginRight: "2px" }}>
                {prefix}
              </span>
            )}
            {formattedNum}
            {suffix && (
              <span style={{ color: accentColor, marginLeft: "2px" }}>
                {suffix}
              </span>
            )}
          </span>

          {delta && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                backgroundColor: darkSurface
                  ? delta.isPositive
                    ? "rgba(79, 179, 174, 0.24)"
                    : OVER_FOOTAGE_PALETTE.riskFill
                  : delta.isPositive
                  ? "rgba(47, 143, 139, 0.14)"
                  : COLORS.riskFill,
                color: darkSurface
                  ? delta.isPositive
                    ? OVER_FOOTAGE_PALETTE.chartSecondary
                    : OVER_FOOTAGE_PALETTE.brickRedText
                  : delta.isPositive
                  ? COLORS.chartSecondary
                  : COLORS.brickRed,
                border: `1px solid ${
                  darkSurface
                    ? delta.isPositive
                      ? "rgba(79, 179, 174, 0.42)"
                      : OVER_FOOTAGE_PALETTE.riskBorder
                    : delta.isPositive
                    ? "rgba(47, 143, 139, 0.35)"
                    : COLORS.riskBorder
                }`,
                textShadow,
              }}
            >
              <span>{delta.isPositive ? "▲" : "▼"}</span>
              <span>{delta.value}</span>
              {delta.label && (
                <span
                  style={{
                    color: labelColor,
                    fontSize: "10px",
                    marginLeft: "2px",
                  }}
                >
                  {delta.label}
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </>
  );
};
