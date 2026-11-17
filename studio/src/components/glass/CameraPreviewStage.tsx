import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { COLORS } from "../../design/tokens";

export type PreviewMode =
  | "light-editorial"
  | "simulated-room"
  | "camera-video"
  | "dark-desk"
  | "transparent";

export interface CameraPreviewStageProps {
  previewMode?: PreviewMode;
  cameraSrc?: string;
  children?: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * CameraPreviewStage provides multi-mode backdrops for previewing overlays.
 * - 'transparent': Zero background; pure alpha for DaVinci Resolve ProRes 4444 / WebM renders.
 * - 'simulated-room': Photorealistic creator studio lighting with warm key/cool fill & bokeh for testing optical glass refraction.
 * - 'camera-video': Live creator video feed via cameraSrc, with presenter framing fallback.
 * - 'dark-desk': High-contrast investigative coordinate desk.
 */
export const CameraPreviewStage: React.FC<CameraPreviewStageProps> = ({
  previewMode = "simulated-room",
  cameraSrc,
  children,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const { width = 1920, height = 1080 } = useVideoConfig();

  // Subtle natural camera breathing drift
  const driftX = Math.sin(frame * 0.02) * 12;
  const driftY = Math.cos(frame * 0.015) * 8;

  if (previewMode === "transparent") {
    return (
      <AbsoluteFill
        className={className}
        style={{
          width,
          height,
          backgroundColor: "transparent",
          ...style,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      className={className}
      style={{
        width,
        height,
        backgroundColor:
          previewMode === "light-editorial" ? COLORS.paperLight : COLORS.navyDeep,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* 1. Backdrop Layer */}
      {previewMode === "light-editorial" && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          {/* Subtle Page Milk-Canvas Coordinate Grid */}
          <div
            style={{
              position: "absolute",
              inset: "-80px",
              backgroundImage: `
                linear-gradient(to right, ${COLORS.gridLine} 1px, transparent 1px),
                linear-gradient(to bottom, ${COLORS.gridLine} 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px",
              transform: `translate3d(${driftX * 0.4}px, ${driftY * 0.4}px, 0)`,
              opacity: 0.9,
            }}
          />
          {/* Soft Milk Canvas Depth (#FAF8F3 -> #F2F0EA) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 92% 84% at 50% 45%, rgba(250, 248, 243, 0.25) 0%, rgba(242, 240, 234, 0.88) 100%)",
            }}
          />
        </AbsoluteFill>
      )}

      {previewMode === "dark-desk" && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          {/* Subtle coordinate grid on deep navy */}
          <div
            style={{
              position: "absolute",
              inset: "-80px",
              backgroundImage: `
                linear-gradient(to right, ${COLORS.gridLineDark} 1px, transparent 1px),
                linear-gradient(to bottom, ${COLORS.gridLineDark} 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px",
              transform: `translate3d(${driftX * 0.5}px, ${driftY * 0.5}px, 0)`,
              opacity: 0.85,
            }}
          />
          {/* Navy Vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 90% 80% at 50% 45%, rgba(28, 43, 58, 0.38) 0%, rgba(15, 25, 35, 0.96) 100%)",
            }}
          />
        </AbsoluteFill>
      )}

      {previewMode === "simulated-room" && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          {/* Room Base: Deep cinematic slate */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(145deg, #0e1117 0%, #161b22 45%, #0d1015 100%)",
            }}
          />

          {/* Warm Key Light Gradient (Left: warm amber/golden rim) */}
          <div
            style={{
              position: "absolute",
              top: "-15%",
              left: "-10%",
              width: "60%",
              height: "90%",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.04) 55%, transparent 75%)",
              filter: "blur(60px)",
              transform: `translate3d(${driftX * 0.8}px, ${driftY * 0.8}px, 0)`,
            }}
          />

          {/* Cool Practical Backlight Gradient (Right: deep cyan/indigo) */}
          <div
            style={{
              position: "absolute",
              bottom: "-10%",
              right: "-5%",
              width: "55%",
              height: "85%",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.05) 55%, transparent 75%)",
              filter: "blur(70px)",
              transform: `translate3d(${-driftX * 0.6}px, ${-driftY * 0.6}px, 0)`,
            }}
          />

          {/* Blurred Studio Background Elements (Acoustic panels & shelving) */}
          <div
            style={{
              position: "absolute",
              left: "8%",
              top: "18%",
              width: "360px",
              height: "520px",
              borderRadius: "16px",
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.04)",
              filter: "blur(14px)",
              opacity: 0.6,
            }}
          />

          {/* Studio Bokeh Light Orbs */}
          <div
            style={{
              position: "absolute",
              top: "24%",
              left: "32%",
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              background: "rgba(251, 191, 36, 0.08)",
              filter: "blur(24px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "40%",
              right: "28%",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "rgba(96, 165, 250, 0.07)",
              filter: "blur(32px)",
            }}
          />

          {/* Presenter Silhouette Placeholder (Left 60% of frame, leaving right third open) */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "12%",
              width: "520px",
              height: "760px",
              background:
                "radial-gradient(ellipse 55% 85% at 50% 90%, rgba(18, 22, 28, 0.95) 0%, rgba(12, 14, 18, 0.88) 70%, transparent 100%)",
              borderRadius: "280px 280px 0 0",
              filter: "blur(36px)",
              opacity: 0.82,
            }}
          />

          {/* Cinematic Vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 95% 85% at 50% 50%, transparent 40%, rgba(6, 8, 10, 0.88) 100%)",
            }}
          />
        </AbsoluteFill>
      )}

      {previewMode === "camera-video" && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          {cameraSrc ? (
            <Video
              src={cameraSrc}
              objectFit="cover"
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          ) : (
            // Creator Framing Guide Backdrop when no video provided
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #111317 0%, #1a1e24 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "15%",
                  bottom: "0",
                  width: "580px",
                  height: "820px",
                  borderRadius: "290px 290px 0 0",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px dashed rgba(255, 255, 255, 0.12)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255, 255, 255, 0.35)",
                  fontFamily: "sans-serif",
                  fontSize: "14px",
                  letterSpacing: "0.08em",
                }}
              >
                <span>[CREATOR TALKING HEAD REGION]</span>
                <span style={{ fontSize: "12px", marginTop: "8px" }}>
                  Card overlays anchor to the right
                </span>
              </div>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* 2. Micro Dither Noise (Prevents gradient banding during compression) */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.03,
          pointerEvents: "none",
          mixBlendMode: "overlay",
        }}
      >
        <filter id="preview-stage-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#preview-stage-noise)" />
      </svg>

      {/* 3. Children (Liquid Glass Objects / Overlay Layers) */}
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
