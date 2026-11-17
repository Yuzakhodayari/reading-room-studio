import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "../design/tokens";

interface EditorialBackdropProps {
  driftSpeed?: number;
  showGrid?: boolean;
  tone?: "light" | "dark";
}

export const EditorialBackdrop: React.FC<EditorialBackdropProps> = ({
  driftSpeed = 0.15,
  showGrid = true,
  tone = "light",
}) => {
  const frame = useCurrentFrame();

  // Subtle continuous slow camera drift on the desk surface
  const driftY = (frame * driftSpeed) % 80;
  const driftX = (frame * (driftSpeed * 0.4)) % 80;

  const isLight = tone === "light";
  const bg = isLight ? COLORS.paperLight : COLORS.navyDeep;
  const gridColor = isLight ? COLORS.gridLine : COLORS.gridLineDark;
  const vignette = isLight
    ? "radial-gradient(ellipse 92% 84% at 50% 45%, rgba(250, 248, 243, 0.25) 0%, rgba(242, 240, 234, 0.88) 100%)"
    : "radial-gradient(ellipse 90% 80% at 50% 45%, rgba(28, 43, 58, 0.38) 0%, rgba(15, 25, 35, 0.96) 100%)";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        overflow: "hidden",
      }}
    >
      {/* 1. Subtle editorial reading-room grid */}
      {showGrid && (
        <div
          style={{
            position: "absolute",
            inset: "-80px",
            backgroundImage: `
              linear-gradient(to right, ${gridColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            transform: `translate3d(${driftX}px, ${driftY}px, 0)`,
            opacity: isLight ? 0.9 : 0.85,
          }}
        />
      )}

      {/* 2. Soft radial warmth / vignette for focus */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: vignette,
          pointerEvents: "none",
        }}
      />

      {/* 3. Anti-banding paper grain texture filter */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: isLight ? 0.025 : 0.035,
          pointerEvents: "none",
          mixBlendMode: isLight ? "multiply" : "overlay",
        }}
      >
        <filter id="editorial-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#editorial-noise)" />
      </svg>
    </AbsoluteFill>
  );
};
