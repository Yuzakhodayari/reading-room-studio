import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../design/tokens";

interface SourceBadgeProps {
  sourceText?: string;
  docRef?: string;
  tableText?: string;
  archiveLabel?: string;
  startFrame?: number;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  sourceText = "U.S. Treasury Monthly Statement, Table 9 · CBO",
  docRef,
  tableText,
  archiveLabel,
  startFrame = 15,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [startFrame, startFrame + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(frame, [startFrame, startFrame + 14], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const resolvedRef = docRef ?? tableText;
  const subline = [resolvedRef, archiveLabel].filter(Boolean).join(" · ");

  return (
    <div
      style={{
        position: "absolute",
        bottom: "38px",
        left: "64px",
        display: "inline-flex",
        alignItems: "center",
        gap: "12px",
        padding: "8px 14px",
        backgroundColor: "rgba(250, 248, 243, 0.94)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: `1px solid ${COLORS.paperBorder}`,
        borderRadius: "8px",
        boxShadow: "0 8px 20px rgba(28, 43, 58, 0.08)",
        fontFamily: FONTS.mono,
        fontSize: "12px",
        letterSpacing: "0.04em",
        opacity,
        transform: `translateY(${translateY}px)`,
        userSelect: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "3px",
          height: subline ? "24px" : "16px",
          backgroundColor: COLORS.navy,
          borderRadius: "2px",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ color: COLORS.brickRed, fontWeight: 700, fontSize: "11px" }}>
          SOURCE{" "}
          <span style={{ color: COLORS.navy, fontWeight: 600 }}>
            · {sourceText}
          </span>
        </span>
        {subline && (
          <span style={{ color: COLORS.muted, fontSize: "10px" }}>
            {subline}
          </span>
        )}
      </div>
    </div>
  );
};
