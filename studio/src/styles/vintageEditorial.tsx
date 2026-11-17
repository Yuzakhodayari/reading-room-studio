import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SfxCue } from "../components/SfxCue";
import { FONTS } from "../design/fonts";
import { COLORS, OVER_FOOTAGE_PALETTE, PAGE_PALETTE, STYLE_FAMILIES } from "../design/tokens";
import { MOTION_SPRINGS, steppedHold } from "../motion/primitives";

// ============================================================================
// 1. Newsreel1920s (1.37:1 Gate, Film Flicker, Gate Weave, Newsreel Click)
// ============================================================================
export interface Newsreel1920sProps {
  children?: React.ReactNode;
  placeDate?: string;
  headline?: string;
  atFrame?: number;
}

export const Newsreel1920s: React.FC<Newsreel1920sProps> = ({
  children,
  placeDate = "GENEVA · 1927",
  headline,
  atFrame = 0,
}) => {
  const rawFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Procedural gate weave and flicker
  const weaveX = Math.sin(rawFrame * 1.7) * 1.5;
  const weaveY = Math.cos(rawFrame * 2.1) * 1.8;
  const flicker = 1.0 + Math.sin(rawFrame * 3.4) * 0.04 + ((rawFrame * 19) % 7) * 0.005;

  const elapsed = Math.max(0, rawFrame - atFrame);
  const placeCardSpring = spring({
    frame: elapsed,
    fps,
    config: MOTION_SPRINGS.snappy,
    durationInFrames: 12,
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {rawFrame === atFrame && <SfxCue cue="newsreel-click" atFrame={atFrame} volume={0.65} />}

      {/* 1.37:1 Academy Ratio Gate (1480x1080) */}
      <div
        style={{
          position: "relative",
          width: "1480px",
          height: "1080px",
          borderRadius: "26px",
          overflow: "hidden",
          backgroundColor: "#161412",
          transform: `translate3d(${weaveX}px, ${weaveY}px, 0)`,
          filter: `sepia(0.35) contrast(1.15) brightness(${flicker})`,
        }}
      >
        {/* Child Content inside gate */}
        <div style={{ width: "100%", height: "100%" }}>{children}</div>

        {/* Procedural Film Scratch Lines */}
        {rawFrame % 14 < 6 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "32%",
              width: "1px",
              backgroundColor: "rgba(255, 255, 255, 0.28)",
              pointerEvents: "none",
            }}
          />
        )}
        {rawFrame % 18 < 4 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "68%",
              width: "1.5px",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Vintage Vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 45%, rgba(13,12,11,0.85) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Place Card: Top Left Inside Gate */}
        <div
          style={{
            position: "absolute",
            top: "48px",
            left: "56px",
            backgroundColor: "rgba(12, 11, 10, 0.88)",
            border: "2px solid #EFE6CF",
            padding: "8px 20px",
            transform: `translate3d(${(1 - placeCardSpring) * -60}px, 0, 0)`,
            opacity: placeCardSpring,
            zIndex: 30,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.condensed,
              fontSize: "20px",
              letterSpacing: "0.16em",
              color: "#EFE6CF",
              fontWeight: 700,
            }}
          >
            {placeDate}
          </div>
          {headline && (
            <div
              style={{
                fontFamily: FONTS.serif,
                fontSize: "14px",
                color: "#D6CFC0",
                marginTop: "2px",
              }}
            >
              {headline}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. SilentFilmCard (Classic Ornate Intertitle Card)
// ============================================================================
export interface SilentFilmCardProps {
  title: string;
  dialogue?: string;
  atFrame?: number;
}

export const SilentFilmCard: React.FC<SilentFilmCardProps> = ({
  title,
  dialogue,
  atFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - atFrame);
  const pushScale = 1.0 + (elapsed / 120) * 0.04;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: STYLE_FAMILIES.vintage1920s.cardBlack,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: "1280px",
          height: "860px",
          border: "4px solid #EFE6CF",
          boxShadow: "inset 0 0 0 10px #0D0C0B, inset 0 0 0 12px #EFE6CF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px",
          textAlign: "center",
          transform: `scale(${pushScale})`,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: "44px",
            color: STYLE_FAMILIES.vintage1920s.intertitleCream,
            letterSpacing: "0.08em",
            fontWeight: 700,
            lineHeight: 1.3,
            maxWidth: "920px",
          }}
        >
          {title}
        </div>

        {dialogue && (
          <div
            style={{
              fontFamily: FONTS.serif,
              fontStyle: "italic",
              fontSize: "26px",
              color: "#CFC5B0",
              marginTop: "24px",
            }}
          >
            "{dialogue}"
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 3. CollageCutout (Torn Paper Scissor Edges + Stepped Stop-Motion)
// ============================================================================
export interface CollageCutoutProps {
  children?: React.ReactNode;
  rotation?: number;
  width?: number | string;
  height?: number | string;
  atFrame?: number;
}

export const CollageCutout: React.FC<CollageCutoutProps> = ({
  children,
  rotation = -4,
  width,
  height,
  atFrame = 0,
}) => {
  const rawFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Stepped 12 FPS stop-motion quantization
  const frame = steppedHold(rawFrame, 12, fps);
  const elapsed = Math.max(0, frame - atFrame);

  // Subtle handheld stop-motion placement jitter
  const jitterX = ((frame * 13) % 5) - 2;
  const jitterY = ((frame * 17) % 5) - 2;

  const enter = spring({
    frame: elapsed,
    fps: 12,
    config: MOTION_SPRINGS.snappy,
  });

  return (
    <div
      style={{
        display: "inline-block",
        width,
        height,
        transform: `translate3d(${jitterX}px, ${jitterY}px, 0) rotate(${rotation}deg) scale(${enter})`,
        opacity: enter > 0 ? 1 : 0,
        backgroundColor: COLORS.paperLight,
        padding: "8px",
        borderRadius: "4px",
        border: `1px solid ${COLORS.paperBorder}`,
        boxShadow: "0 16px 36px rgba(28, 43, 58, 0.16)",
        userSelect: "none",
      }}
    >
      <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// 4. SpyTitleSequence (Navy Chapter Cover Dossier: #0F1923/#1C2B3A + #FAF6EE + #8FB4D9)
// ============================================================================
export interface SpyTitleSequenceProps {
  title: string;
  codeName?: string;
  atFrame?: number;
}

export const SpyTitleSequence: React.FC<SpyTitleSequenceProps> = ({
  title,
  codeName = "Chapter Brief",
  atFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - atFrame);

  const barProgress = interpolate(elapsed, [0, 20], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: `linear-gradient(145deg, ${PAGE_PALETTE.navyDeep} 0%, ${PAGE_PALETTE.navy} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px",
        userSelect: "none",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: "13px",
          color: OVER_FOOTAGE_PALETTE.accentPrimary,
          backgroundColor: "rgba(15, 25, 35, 0.45)",
          letterSpacing: "0.18em",
          fontWeight: 700,
          textTransform: "uppercase",
          marginBottom: "18px",
          padding: "5px 14px",
          border: `1px solid ${OVER_FOOTAGE_PALETTE.accentPrimary}`,
          borderRadius: "999px",
        }}
      >
        {codeName}
      </div>

      <div style={{ position: "relative", maxWidth: "1120px", textAlign: "center" }}>
        <h1
          style={{
            fontFamily: FONTS.serif,
            fontSize: "76px",
            fontWeight: 700,
            color: OVER_FOOTAGE_PALETTE.textHeadline,
            letterSpacing: "-0.01em",
            lineHeight: 1.12,
            margin: 0,
          }}
        >
          {title}
        </h1>

        {/* Sliding Deep Navy Redaction Bar */}
        <div
          style={{
            position: "absolute",
            inset: "-6px -12px",
            backgroundColor: PAGE_PALETTE.navyDeep,
            transform: `scaleX(${Math.max(0, 1 - barProgress / 100)})`,
            transformOrigin: "right center",
          }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// 5. StainedGlassFrame (Milk #FAF8F3, #F2F0EA, #A9C4DE Soft Blue, #F8ECE8 Blush, #1C2B3A Lead)
// ============================================================================
export const StainedGlassFrame: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: PAGE_PALETTE.paperLight,
        border: `10px solid ${PAGE_PALETTE.navy}`,
        boxShadow: "inset 0 0 48px rgba(28, 43, 58, 0.12)",
        overflow: "hidden",
      }}
    >
      {/* Geometric Stained-Glass Mosaic Panes & Lead Came Lines */}
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
        }}
        aria-hidden="true"
      >
        {/* Top-left mosaic panes */}
        <polygon points="0,0 440,0 320,260 0,340" fill="rgba(169, 196, 222, 0.42)" />
        <polygon points="440,0 960,0 740,185 320,260" fill="rgba(62, 106, 148, 0.14)" />
        <polygon points="0,340 320,260 390,540 0,680" fill={PAGE_PALETTE.paper} />

        {/* Top-right mosaic panes */}
        <polygon points="960,0 1480,0 1600,260 1180,185" fill={PAGE_PALETTE.riskFill} />
        <polygon points="1480,0 1920,0 1920,340 1600,260" fill="rgba(28, 43, 58, 0.10)" />
        <polygon points="1600,260 1920,340 1920,680 1530,540" fill="rgba(169, 196, 222, 0.34)" />

        {/* Bottom-left mosaic panes */}
        <polygon points="0,680 390,540 320,820 0,1080" fill={PAGE_PALETTE.riskFill} />
        <polygon points="0,1080 320,820 740,895 440,1080" fill="rgba(62, 106, 148, 0.12)" />
        <polygon points="440,1080 740,895 960,1080" fill="rgba(169, 196, 222, 0.36)" />

        {/* Bottom-right mosaic panes */}
        <polygon points="1530,540 1920,680 1920,1080 1600,820" fill={PAGE_PALETTE.paper} />
        <polygon points="1180,895 1600,820 1920,1080 1480,1080" fill="rgba(47, 143, 139, 0.14)" />
        <polygon points="960,1080 1180,895 1480,1080" fill={PAGE_PALETTE.riskFill} />

        {/* Soft luminous central sanctuary octagon */}
        <polygon
          points="440,210 1480,210 1600,340 1600,740 1480,870 440,870 320,740 320,340"
          fill={PAGE_PALETTE.paperLight}
          stroke={PAGE_PALETTE.gold}
          strokeWidth="2.5"
        />

        {/* Lead Came Structural Framework */}
        <g stroke={PAGE_PALETTE.navy} strokeWidth="6" strokeLinejoin="round" fill="none">
          <polyline points="0,340 320,260 440,0" />
          <polyline points="440,0 740,185 960,0 1180,185 1480,0" />
          <polyline points="1480,0 1600,260 1920,340" />
          <polyline points="0,680 390,540 320,260" />
          <polyline points="1920,680 1530,540 1600,260" />
          <polyline points="0,1080 320,820 390,540" />
          <polyline points="1920,1080 1600,820 1530,540" />
          <polyline points="440,1080 740,895 960,1080 1180,895 1480,1080" />
          <line x1="320" y1="820" x2="740" y2="895" />
          <line x1="1600" y1="820" x2="1180" y2="895" />
          <line x1="320" y1="820" x2="440" y2="1080" />
          <line x1="1600" y1="820" x2="1480" y2="1080" />
          <line x1="320" y1="260" x2="740" y2="185" />
          <line x1="1600" y1="260" x2="1180" y2="185" />
          {/* Inner sanctuary lead frame */}
          <polygon points="440,210 1480,210 1600,340 1600,740 1480,870 440,870 320,740 320,340" />
        </g>
      </svg>

      {/* Foreground Content Layer */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  );
};
