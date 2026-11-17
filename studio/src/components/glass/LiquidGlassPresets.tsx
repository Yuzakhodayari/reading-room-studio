import React from "react";
import { useCurrentFrame } from "remotion";
import { FONTS } from "../../design/fonts";
import { OVER_FOOTAGE_PALETTE } from "../../design/tokens";
import {
  GlassTint,
  LiquidGlassObject,
  LiquidGlassObjectProps,
} from "./LiquidGlassObject";

export type GlassPresetBaseProps = Omit<LiquidGlassObjectProps, "children">;

function pickGlassProps(props: GlassPresetBaseProps): GlassPresetBaseProps {
  return {
    id: props.id,
    width: props.width,
    height: props.height,
    borderRadius: props.borderRadius,
    tint: props.tint,
    style: props.style,
    className: props.className,
    lifecycle: props.lifecycle,
    enableOpticalRefraction: props.enableOpticalRefraction ?? true,
    enableSpecularSweep: props.enableSpecularSweep ?? true,
    enableSfx: props.enableSfx ?? true,
    sfxEnterCue: props.sfxEnterCue,
    sfxDockCue: props.sfxDockCue,
    sfxExitCue: props.sfxExitCue,
    displacementScale: props.displacementScale,
    roughness: props.roughness,
    blurAmount: props.blurAmount,
  };
}

function getSurfacePalette(tint: GlassTint) {
  const isRisk = tint === "warning";

  return {
    isRisk,
    title: OVER_FOOTAGE_PALETTE.textHeadline,
    body: OVER_FOOTAGE_PALETTE.textBody,
    muted: OVER_FOOTAGE_PALETTE.textMuted,
    textShadow: OVER_FOOTAGE_PALETTE.textShadow,
    divider: isRisk
      ? OVER_FOOTAGE_PALETTE.riskBorder
      : OVER_FOOTAGE_PALETTE.glassInnerHairline,
    subBg: isRisk
      ? OVER_FOOTAGE_PALETTE.riskFill
      : OVER_FOOTAGE_PALETTE.glassDarkWell,
    subBorder: isRisk
      ? OVER_FOOTAGE_PALETTE.riskBorder
      : OVER_FOOTAGE_PALETTE.glassInnerHairline,
    subBgActive: "rgba(15, 25, 35, 0.50)",
    subBorderActive: OVER_FOOTAGE_PALETTE.accentPrimary,
    accentText: OVER_FOOTAGE_PALETTE.accentWarm,
    accentWarm: OVER_FOOTAGE_PALETTE.accentWarm,
    secondaryMetric: OVER_FOOTAGE_PALETTE.chartSecondary,
    riskText: OVER_FOOTAGE_PALETTE.brickRedText,
    riskChipBg: OVER_FOOTAGE_PALETTE.brickRedFill,
    riskChipText: OVER_FOOTAGE_PALETTE.textHeadline,
    riskBg: OVER_FOOTAGE_PALETTE.riskFill,
    riskBorder: OVER_FOOTAGE_PALETTE.riskBorder,
    vsBg: "rgba(15, 25, 35, 0.54)",
    vsBorder: "rgba(255, 255, 255, 0.36)",
  };
}

function sanitizeDockText(raw: string | undefined): string {
  if (!raw) return "";
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (cleaned.toUpperCase() === "LIQUID-G" || cleaned.toUpperCase() === "LIQUID-GL") {
    return "Glass Overlay";
  }
  if (cleaned.length <= 28) return cleaned;
  const cut = cleaned.slice(0, 28);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 10 ? cut.slice(0, lastSpace) : cut).trim();
}

// ============================================================================
// 1. GlassCard — Crystal smoked-navy glass card with header tag, metric & citation
// ============================================================================
export interface GlassCardProps extends GlassPresetBaseProps {
  title: string;
  badge?: string;
  badgeTone?: "gold" | "warning" | "highlight" | "neutral";
  subtitle?: string;
  body?: React.ReactNode;
  metric?: {
    value: string;
    label?: string;
    delta?: string;
    deltaPositive?: boolean;
  };
  citation?: string;
  children?: React.ReactNode;
}

function resolveBadgeTone(badgeTone: NonNullable<GlassCardProps["badgeTone"]>) {
  if (badgeTone === "warning") {
    return {
      bg: OVER_FOOTAGE_PALETTE.brickRedFill,
      border: OVER_FOOTAGE_PALETTE.riskBorder,
      color: OVER_FOOTAGE_PALETTE.textHeadline,
    };
  }
  if (badgeTone === "gold" || badgeTone === "highlight") {
    return {
      bg: "rgba(28, 43, 58, 0.92)",
      border: "rgba(191, 214, 234, 0.42)",
      color: OVER_FOOTAGE_PALETTE.textHeadline,
    };
  }
  return {
    bg: OVER_FOOTAGE_PALETTE.glassDarkWell,
    border: OVER_FOOTAGE_PALETTE.glassInnerHairline,
    color: OVER_FOOTAGE_PALETTE.textBody,
  };
}

export const GlassCard: React.FC<GlassCardProps> = ({
  title,
  badge = "Notes",
  badgeTone = "gold",
  subtitle,
  body,
  metric,
  citation,
  children,
  width = 580,
  borderRadius = 26,
  tint = "navy-glass",
  ...glassProps
}) => {
  const surface = getSurfacePalette(tint);
  const tone = resolveBadgeTone(badgeTone);
  const isWarningCard = badgeTone === "warning" || surface.isRisk;

  return (
    <LiquidGlassObject
      {...pickGlassProps(glassProps)}
      width={width}
      borderRadius={borderRadius}
      tint={tint}
    >
      <div style={{ padding: "32px 36px", userSelect: "none" }}>
        {/* Header Badge Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            paddingBottom: "14px",
            marginBottom: "18px",
            borderBottom: `1px solid ${surface.divider}`,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: tone.color,
              backgroundColor: tone.bg,
              border: `1px solid ${tone.border}`,
              borderRadius: "8px",
              padding: "4px 10px",
              textShadow: surface.textShadow,
            }}
          >
            {badge}
          </span>
          {subtitle && (
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: "11.5px",
                fontWeight: 600,
                color: surface.body,
                letterSpacing: "0.04em",
                textShadow: surface.textShadow,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            margin: 0,
            fontFamily: FONTS.sans,
            fontSize: "26px",
            fontWeight: 800,
            lineHeight: 1.24,
            letterSpacing: "-0.015em",
            color: surface.title,
            textShadow: surface.textShadow,
          }}
        >
          {title}
        </h3>

        {/* Optional Headline Metric */}
        {metric && (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "16px",
              marginTop: "18px",
              padding: "16px 20px",
              borderRadius: "16px",
              backgroundColor: isWarningCard ? surface.riskBg : surface.subBg,
              border: `1px solid ${isWarningCard ? surface.riskBorder : surface.subBorder}`,
            }}
          >
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: "38px",
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
                color: isWarningCard ? surface.riskText : surface.title,
                textShadow: surface.textShadow,
                lineHeight: 1,
              }}
            >
              {metric.value}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {metric.label && (
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "11px",
                    fontWeight: 500,
                    color: surface.muted,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    textShadow: surface.textShadow,
                  }}
                >
                  {metric.label}
                </span>
              )}
              {metric.delta && (
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: metric.deltaPositive
                      ? surface.secondaryMetric
                      : surface.riskText,
                    textShadow: surface.textShadow,
                  }}
                >
                  {metric.delta}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Body Content */}
        {body && (
          <div
            style={{
              marginTop: "16px",
              fontFamily: FONTS.sans,
              fontSize: "15.5px",
              fontWeight: 500,
              lineHeight: 1.58,
              color: surface.body,
              textShadow: surface.textShadow,
            }}
          >
            {body}
          </div>
        )}

        {children && <div style={{ marginTop: "16px" }}>{children}</div>}

        {/* Optional Footer Citation */}
        {citation && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "14px",
              borderTop: `1px solid ${surface.divider}`,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "3px",
                height: "14px",
                borderRadius: "2px",
                backgroundColor: isWarningCard
                  ? surface.riskText
                  : surface.accentText,
              }}
            />
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: "11px",
                fontWeight: 500,
                color: surface.muted,
                letterSpacing: "0.03em",
                textShadow: surface.textShadow,
              }}
            >
              {citation}
            </span>
          </div>
        )}
      </div>
    </LiquidGlassObject>
  );
};

// ============================================================================
// 2. GlassCornerPill — Compact docked status/metric pill for corners
// ============================================================================
export interface GlassCornerPillProps extends GlassPresetBaseProps {
  label: string;
  value?: string;
  badge?: string;
  statusColor?: string;
  pulseDot?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const GlassCornerPill: React.FC<GlassCornerPillProps> = ({
  label,
  value,
  badge,
  statusColor,
  pulseDot = true,
  icon,
  children,
  borderRadius = 999,
  tint = "navy-glass",
  blurAmount = 12,
  displacementScale = 18,
  ...glassProps
}) => {
  const frame = useCurrentFrame();
  const surface = getSurfacePalette(tint);
  const dotColor =
    statusColor ??
    (tint === "warning" ? surface.riskText : surface.accentText);
  const dotScale = pulseDot ? 0.9 + Math.sin(frame * 0.14) * 0.12 : 1;

  return (
    <LiquidGlassObject
      {...pickGlassProps(glassProps)}
      borderRadius={borderRadius}
      tint={tint}
      blurAmount={blurAmount}
      displacementScale={displacementScale}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 22px",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {icon ? (
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            {icon}
          </span>
        ) : (
          <span
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              backgroundColor: dotColor,
              boxShadow: `0 0 10px ${dotColor}88`,
              transform: `scale(${dotScale})`,
            }}
          />
        )}

        {badge && (
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: OVER_FOOTAGE_PALETTE.textHeadline,
              backgroundColor:
                tint === "warning"
                  ? surface.riskChipBg
                  : "rgba(28, 43, 58, 0.92)",
              border:
                tint === "warning"
                  ? `1px solid ${surface.riskBorder}`
                  : `1px solid ${surface.subBorderActive}`,
              padding: "3px 10px",
              borderRadius: "999px",
              textShadow: surface.textShadow,
            }}
          >
            {badge}
          </span>
        )}

        <span
          style={{
            fontFamily: FONTS.sans,
            fontSize: "14px",
            fontWeight: 600,
            color: surface.body,
            letterSpacing: "0.01em",
            textShadow: surface.textShadow,
          }}
        >
          {label}
        </span>

        {value && (
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: "16px",
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              color: tint === "warning" ? surface.riskText : surface.title,
              paddingLeft: "10px",
              borderLeft: `1px solid ${surface.divider}`,
              textShadow: surface.textShadow,
            }}
          >
            {value}
          </span>
        )}

        {children}
      </div>
    </LiquidGlassObject>
  );
};

// ============================================================================
// 3. GlassBottomDock — Clean horizontal dock holding 2–4 stats or chapters
// ============================================================================
export interface GlassDockItem {
  id?: string;
  label: string;
  value?: string;
  icon?: React.ReactNode;
  active?: boolean;
  accentColor?: string;
}

export interface GlassBottomDockProps extends GlassPresetBaseProps {
  items: GlassDockItem[];
  activeIndex?: number;
  caption?: string;
}

export const GlassBottomDock: React.FC<GlassBottomDockProps> = ({
  items,
  activeIndex,
  caption,
  borderRadius = 28,
  tint = "navy-glass",
  blurAmount = 12,
  ...glassProps
}) => {
  const surface = getSurfacePalette(tint);

  return (
    <LiquidGlassObject
      {...pickGlassProps(glassProps)}
      borderRadius={borderRadius}
      tint={tint}
      blurAmount={blurAmount}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 20px",
          userSelect: "none",
        }}
      >
        {caption && (
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: surface.isRisk ? surface.riskChipText : surface.accentWarm,
              backgroundColor: surface.isRisk
                ? surface.riskChipBg
                : surface.subBg,
              border: `1px solid ${
                surface.isRisk ? surface.riskBorder : surface.accentText
              }`,
              borderRadius: "10px",
              padding: "6px 12px",
              whiteSpace: "nowrap",
              textShadow: surface.textShadow,
            }}
          >
            {sanitizeDockText(caption)}
          </div>
        )}

        {items.slice(0, 4).map((item, idx) => {
          const isActive = item.active ?? activeIndex === idx;
          const accent = item.accentColor ?? surface.accentText;
          const safeValue = sanitizeDockText(item.value);
          const safeLabel = sanitizeDockText(item.label);

          return (
            <div
              key={item.id ?? `${safeLabel}-${idx}`}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 18px",
                borderRadius: "18px",
                backgroundColor: isActive ? surface.subBgActive : surface.subBg,
                border: isActive
                  ? `1.5px solid ${accent}`
                  : `1px solid ${surface.subBorder}`,
                minWidth: "160px",
                maxWidth: "280px",
              }}
            >
              {item.icon && (
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    backgroundColor: isActive
                      ? "rgba(143, 180, 217, 0.28)"
                      : "rgba(15, 25, 35, 0.45)",
                    border: `1px solid ${isActive ? accent : surface.subBorder}`,
                    color: surface.title,
                    fontFamily: FONTS.mono,
                    fontWeight: 700,
                    fontSize: "13px",
                    textShadow: surface.textShadow,
                  }}
                >
                  {item.icon}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {safeValue && (
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: "17px",
                      fontWeight: 800,
                      fontVariantNumeric: "tabular-nums",
                      color: isActive ? surface.accentWarm : surface.title,
                      lineHeight: 1.15,
                      whiteSpace: "nowrap",
                      textShadow: surface.textShadow,
                    }}
                  >
                    {safeValue}
                  </span>
                )}
                <span
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: isActive ? surface.title : surface.muted,
                    letterSpacing: "0.01em",
                    lineHeight: 1.25,
                    textShadow: surface.textShadow,
                  }}
                >
                  {safeLabel}
                </span>
              </div>

              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "3px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "22px",
                    height: "3px",
                    borderRadius: "999px",
                    backgroundColor: accent,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </LiquidGlassObject>
  );
};

// ============================================================================
// 4. GlassFloatingToolbar — Compact action / chapter switcher bar
// ============================================================================
export interface GlassToolbarItem {
  id?: string;
  label: string;
  tag?: string;
  icon?: React.ReactNode;
}

export interface GlassFloatingToolbarProps extends GlassPresetBaseProps {
  items: GlassToolbarItem[];
  activeIndex?: number;
  autoCycleFrames?: number;
  prefix?: string;
  rightSlot?: React.ReactNode;
}

export const GlassFloatingToolbar: React.FC<GlassFloatingToolbarProps> = ({
  items,
  activeIndex,
  autoCycleFrames,
  prefix,
  rightSlot,
  borderRadius = 20,
  tint = "navy-glass",
  blurAmount = 12,
  ...glassProps
}) => {
  const frame = useCurrentFrame();
  const surface = getSurfacePalette(tint);
  const safeCount = Math.max(1, items.length);
  const resolvedActive =
    activeIndex !== undefined
      ? activeIndex
      : autoCycleFrames && autoCycleFrames > 0
      ? Math.floor(frame / autoCycleFrames) % safeCount
      : 0;

  return (
    <LiquidGlassObject
      {...pickGlassProps(glassProps)}
      borderRadius={borderRadius}
      tint={tint}
      blurAmount={blurAmount}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          userSelect: "none",
        }}
      >
        {prefix && (
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: surface.isRisk ? surface.riskText : surface.accentWarm,
              textTransform: "uppercase",
              padding: "0 10px 0 6px",
              whiteSpace: "nowrap",
              textShadow: surface.textShadow,
            }}
          >
            {prefix}
          </span>
        )}

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px",
            borderRadius: "14px",
            backgroundColor: surface.subBg,
            border: `1px solid ${surface.subBorder}`,
          }}
        >
          {items.map((item, idx) => {
            const isActive = idx === resolvedActive;
            return (
              <div
                key={item.id ?? `${item.label}-${idx}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "10px",
                  backgroundColor: isActive
                    ? "rgba(28, 43, 58, 0.88)"
                    : "transparent",
                  border: isActive
                    ? `1px solid ${surface.subBorderActive}`
                    : "1px solid transparent",
                  boxShadow: isActive
                    ? "0 4px 12px rgba(15, 25, 35, 0.28)"
                    : "none",
                }}
              >
                {item.icon && (
                  <span
                    style={{
                      display: "inline-flex",
                      color: isActive ? surface.accentWarm : surface.muted,
                    }}
                  >
                    {item.icon}
                  </span>
                )}
                {item.tag && (
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: "10px",
                      fontWeight: 700,
                      color: isActive ? surface.accentText : surface.muted,
                      textShadow: surface.textShadow,
                    }}
                  >
                    {item.tag}
                  </span>
                )}
                <span
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: "13px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? surface.title : surface.muted,
                    whiteSpace: "nowrap",
                    textShadow: surface.textShadow,
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {rightSlot && (
          <div
            style={{
              paddingLeft: "10px",
              borderLeft: `1px solid ${surface.divider}`,
              fontFamily: FONTS.mono,
              fontSize: "13px",
              fontWeight: 700,
              color: surface.title,
              whiteSpace: "nowrap",
              textShadow: surface.textShadow,
            }}
          >
            {rightSlot}
          </div>
        )}
      </div>
    </LiquidGlassObject>
  );
};

// ============================================================================
// 5. GlassToastAlert — Editorial notification & risk callout toast
// ============================================================================
export interface GlassToastAlertProps extends GlassPresetBaseProps {
  title: string;
  message: React.ReactNode;
  variant?: "info" | "warning" | "success" | "joke";
  tag?: string;
  timestamp?: string;
  icon?: React.ReactNode;
}

const TOAST_VARIANTS = {
  info: {
    defaultTint: "navy-glass" as const,
    accent: OVER_FOOTAGE_PALETTE.accentPrimary,
    defaultTag: "Note",
    glyph: "i",
  },
  warning: {
    defaultTint: "warning" as const,
    accent: OVER_FOOTAGE_PALETTE.brickRedText,
    defaultTag: "Risk Flag",
    glyph: "!",
  },
  success: {
    defaultTint: "navy-glass" as const,
    accent: OVER_FOOTAGE_PALETTE.chartSecondary,
    defaultTag: "Verified",
    glyph: "✓",
  },
  joke: {
    defaultTint: "gold" as const,
    accent: OVER_FOOTAGE_PALETTE.accentWarm,
    defaultTag: "Aside",
    glyph: "★",
  },
} as const;

export const GlassToastAlert: React.FC<GlassToastAlertProps> = ({
  title,
  message,
  variant = "info",
  tag,
  timestamp,
  icon,
  width = 450,
  borderRadius = 22,
  tint,
  sfxEnterCue = "alert-ping",
  ...glassProps
}) => {
  const cfg = TOAST_VARIANTS[variant];
  const resolvedTint = tint ?? cfg.defaultTint;
  const surface = getSurfacePalette(resolvedTint);
  const isRisk = variant === "warning" || resolvedTint === "warning";
  const accentColor = isRisk ? surface.riskText : cfg.accent;

  return (
    <LiquidGlassObject
      {...pickGlassProps(glassProps)}
      width={width}
      borderRadius={borderRadius}
      tint={resolvedTint}
      sfxEnterCue={sfxEnterCue}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          padding: "20px 24px",
          userSelect: "none",
        }}
      >
        {/* Icon Badge */}
        <div
          style={{
            flexShrink: 0,
            width: "38px",
            height: "38px",
            borderRadius: "12px",
            backgroundColor: isRisk
              ? surface.riskChipBg
              : OVER_FOOTAGE_PALETTE.glassDarkWell,
            border: `1px solid ${
              isRisk ? surface.riskBorder : surface.accentText
            }`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTS.mono,
            fontSize: "16px",
            fontWeight: 800,
            color: isRisk ? surface.riskChipText : accentColor,
            textShadow: surface.textShadow,
          }}
        >
          {icon ?? cfg.glyph}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: isRisk ? surface.riskChipText : accentColor,
                backgroundColor: isRisk ? surface.riskChipBg : "transparent",
                border: isRisk ? `1px solid ${surface.riskBorder}` : "none",
                borderRadius: isRisk ? "6px" : 0,
                padding: isRisk ? "2px 8px" : 0,
                textTransform: "uppercase",
                textShadow: surface.textShadow,
              }}
            >
              {tag ?? cfg.defaultTag}
            </span>
            {timestamp && (
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: surface.body,
                  textShadow: surface.textShadow,
                }}
              >
                {timestamp}
              </span>
            )}
          </div>

          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: "16.5px",
              fontWeight: 700,
              color: surface.title,
              lineHeight: 1.3,
              textShadow: surface.textShadow,
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop: "6px",
              fontFamily: FONTS.sans,
              fontSize: "13.5px",
              fontWeight: 500,
              lineHeight: 1.5,
              color: surface.body,
              textShadow: surface.textShadow,
            }}
          >
            {message}
          </div>
        </div>
      </div>
    </LiquidGlassObject>
  );
};

// ============================================================================
// 6. GlassSplitModal — 2-column comparative smoked-navy glass sheet
// ============================================================================
export interface GlassSplitColumn {
  label: string;
  value: string;
  sublabel?: string;
  items?: Array<{ label: string; value: string }>;
  accentColor?: string;
  highlight?: boolean;
  isRisk?: boolean;
  children?: React.ReactNode;
}

export interface GlassSplitModalProps extends GlassPresetBaseProps {
  title: string;
  eyebrow?: string;
  left: GlassSplitColumn;
  right: GlassSplitColumn;
  vsLabel?: string;
  footer?: string;
}

const SplitColumnBody: React.FC<{
  col: GlassSplitColumn;
  defaultAccent: string;
  surface: ReturnType<typeof getSurfacePalette>;
}> = ({ col, defaultAccent, surface }) => {
  const accent = col.accentColor ?? defaultAccent;
  const isRiskCol = Boolean(col.isRisk);

  return (
    <div
      style={{
        flex: 1,
        padding: "22px 24px",
        borderRadius: "18px",
        background: isRiskCol
          ? "linear-gradient(135deg, rgba(163, 64, 46, 0.36) 0%, rgba(15, 25, 35, 0.40) 100%)"
          : col.highlight
          ? surface.subBgActive
          : surface.subBg,
        border: isRiskCol
          ? `1.5px solid ${surface.riskBorder}`
          : col.highlight
          ? `1.5px solid ${surface.accentText}`
          : `1px solid ${surface.subBorder}`,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          width: "fit-content",
          color: isRiskCol ? surface.riskChipText : accent,
          backgroundColor: isRiskCol ? surface.riskChipBg : "transparent",
          border: isRiskCol ? `1px solid ${surface.riskBorder}` : "none",
          borderRadius: isRiskCol ? "6px" : 0,
          padding: isRiskCol ? "3px 9px" : 0,
          textShadow: surface.textShadow,
        }}
      >
        {col.label}
      </span>

      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: "36px",
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          color: surface.title,
          lineHeight: 1.08,
          textShadow: surface.textShadow,
        }}
      >
        {col.value}
      </div>

      {col.sublabel && (
        <span
          style={{
            fontFamily: FONTS.sans,
            fontSize: "13px",
            fontWeight: 500,
            lineHeight: 1.45,
            color: isRiskCol ? surface.body : surface.muted,
            textShadow: surface.textShadow,
          }}
        >
          {col.sublabel}
        </span>
      )}

      {col.items && col.items.length > 0 && (
        <div
          style={{
            marginTop: "6px",
            paddingTop: "10px",
            borderTop: `1px solid ${
              isRiskCol ? surface.riskBorder : surface.divider
            }`,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {col.items.map((row, idx) => (
            <div
              key={`${row.label}-${idx}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                fontSize: "13px",
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.sans,
                  color: surface.body,
                  textShadow: surface.textShadow,
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: isRiskCol ? surface.riskText : surface.title,
                  textShadow: surface.textShadow,
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {col.children}
    </div>
  );
};

export const GlassSplitModal: React.FC<GlassSplitModalProps> = ({
  title,
  eyebrow = "Comparison",
  left,
  right,
  vsLabel = "VS",
  footer,
  width = 780,
  borderRadius = 28,
  tint = "navy-glass",
  ...glassProps
}) => {
  const surface = getSurfacePalette(tint);

  return (
    <LiquidGlassObject
      {...pickGlassProps(glassProps)}
      width={width}
      borderRadius={borderRadius}
      tint={tint}
    >
      <div style={{ padding: "32px 36px", userSelect: "none" }}>
        {/* Header */}
        <div style={{ marginBottom: "22px" }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: "11.5px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: surface.title,
              textTransform: "uppercase",
              marginBottom: "6px",
              textShadow: surface.textShadow,
            }}
          >
            {eyebrow}
          </div>
          <h3
            style={{
              margin: 0,
              fontFamily: FONTS.sans,
              fontSize: "26px",
              fontWeight: 800,
              color: surface.title,
              lineHeight: 1.24,
              textShadow: surface.textShadow,
            }}
          >
            {title}
          </h3>
        </div>

        {/* 2-Column Comparison Grid */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "stretch",
            gap: "16px",
          }}
        >
          <SplitColumnBody
            col={left}
            defaultAccent={surface.accentText}
            surface={surface}
          />

          {/* Center Divider Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: surface.title,
                backgroundColor: surface.vsBg,
                border: `1px solid ${surface.vsBorder}`,
                borderRadius: "999px",
                padding: "6px 10px",
                textShadow: surface.textShadow,
              }}
            >
              {vsLabel}
            </div>
          </div>

          <SplitColumnBody
            col={right}
            defaultAccent={
              right.isRisk ? surface.riskText : surface.secondaryMetric
            }
            surface={surface}
          />
        </div>

        {/* Optional Footer */}
        {footer && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "14px",
              borderTop: `1px solid ${surface.divider}`,
              fontFamily: FONTS.mono,
              fontSize: "12px",
              fontWeight: 600,
              color: surface.title,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textShadow: surface.textShadow,
            }}
          >
            <span style={{ color: surface.accentWarm }}>▸</span>
            <span>{footer}</span>
          </div>
        )}
      </div>
    </LiquidGlassObject>
  );
};
