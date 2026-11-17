import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SfxCue } from "../components/SfxCue";
import { FONTS } from "../design/fonts";
import { COLORS } from "../design/tokens";
import { MOTION_SPRINGS, readingDuration } from "../motion/primitives";

export type KineticTextMode =
  | "word-pop"
  | "karaoke-highlight"
  | "typewriter"
  | "stamp-slam"
  | "split-lines"
  | "marker-sweep"
  | "red-correction";

export interface TimedWord {
  word: string;
  start: number; // In frames
  end?: number; // In frames
}

export interface KineticTextProps {
  text: string;
  mode?: KineticTextMode;
  timedWords?: TimedWord[];
  atFrame?: number;
  duration?: number;
  correctionText?: string; // For 'red-correction' mode
  correctionFrame?: number;
  fontSize?: number | string;
  fontFamily?: string;
  fontWeight?: number | string;
  color?: string;
  highlightColor?: string;
  enableSfx?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function isDarkTextColor(hexOrCss: string): boolean {
  const m = hexOrCss.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return false;
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

/**
 * KineticText Engine
 * High-performance typography renderer supporting Whisper word-level timing,
 * auto-paced editorial duration, and 7 distinct kinetic reveal modes.
 */
export const KineticText: React.FC<KineticTextProps> = ({
  text,
  mode = "word-pop",
  timedWords,
  atFrame = 0,
  duration,
  correctionText = "REVISED",
  correctionFrame,
  fontSize = 36,
  fontFamily = FONTS.sans,
  fontWeight = 700,
  color = COLORS.navy,
  highlightColor = COLORS.gold,
  enableSfx = true,
  className,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalDuration = Math.max(1, duration ?? readingDuration(text, fps));
  const words = React.useMemo(() => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/) : [];
  }, [text]);

  // Compute normalized word timings so all words finish cleanly before totalDuration
  const resolvedWords: TimedWord[] = React.useMemo(() => {
    if (timedWords && timedWords.length > 0) {
      return timedWords;
    }
    if (words.length === 0) return [];
    const wordInterval = Math.max(
      1,
      Math.floor((totalDuration * 0.78) / Math.max(1, words.length))
    );
    return words.map((w, i) => ({
      word: w,
      start: atFrame + i * wordInterval,
      end: atFrame + (i + 1) * wordInterval + 4,
    }));
  }, [timedWords, words, atFrame, totalDuration]);

  // Common typography base styles
  const baseStyle: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight,
    color,
    display: "inline-flex",
    flexWrap: "wrap",
    gap: "0.28em",
    lineHeight: 1.25,
    userSelect: "none",
    ...style,
  };

  // 1. Word Pop Mode
  if (mode === "word-pop") {
    return (
      <div className={className} style={baseStyle}>
        {resolvedWords.map((item, idx) => {
          const isVisible = frame >= item.start;
          if (!isVisible) return null;

          const elapsed = frame - item.start;
          const pop = spring({
            frame: elapsed,
            fps,
            config: MOTION_SPRINGS.snappy,
            durationInFrames: 10,
          });

          return (
            <span
              key={`${item.word}-${idx}`}
              style={{
                display: "inline-block",
                transform: `scale(${0.6 + 0.4 * pop})`,
                opacity: pop,
              }}
            >
              {item.word}
            </span>
          );
        })}
      </div>
    );
  }

  // 2. Karaoke Highlight Mode
  if (mode === "karaoke-highlight") {
    const dimColor = isDarkTextColor(color)
      ? "rgba(28, 43, 58, 0.36)"
      : "rgba(243, 234, 217, 0.45)";
    return (
      <div className={className} style={baseStyle}>
        {resolvedWords.map((item, idx) => {
          const isPast = frame >= (item.end ?? item.start + 10);
          const isActive =
            frame >= item.start && frame < (item.end ?? item.start + 10);

          let wordColor = dimColor;
          let wordScale = 1.0;
          let textShadow = "none";

          if (isActive) {
            wordColor = highlightColor;
            wordScale = 1.05;
            textShadow = `0 0 12px ${highlightColor}55`;
          } else if (isPast) {
            wordColor = color;
          }

          return (
            <span
              key={`${item.word}-${idx}`}
              style={{
                display: "inline-block",
                color: wordColor,
                transform: `scale(${wordScale})`,
                textShadow,
                willChange: "transform, color",
              }}
            >
              {item.word}
            </span>
          );
        })}
      </div>
    );
  }

  // 3. Typewriter Mode
  if (mode === "typewriter") {
    if (text.trim() === "") {
      return <div className={className} style={{ ...baseStyle, display: "inline-block" }} />;
    }
    const charsTotal = text.length;
    const typeDur = Math.max(1, Math.min(totalDuration, charsTotal * 2));
    const charCount = Math.floor(
      interpolate(frame - atFrame, [0, typeDur], [0, charsTotal], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
    const visibleChars = text.slice(0, charCount);
    const cursorVisible = frame >= atFrame && Math.floor(frame / 12) % 2 === 0;

    return (
      <>
        {enableSfx && frame >= atFrame && frame < atFrame + typeDur && frame % 4 === 0 && (
          <SfxCue cue="type-click" atFrame={frame} volume={0.4} />
        )}
        <div className={className} style={{ ...baseStyle, display: "inline-block" }}>
          <span>{visibleChars}</span>
          <span
            style={{
              opacity: cursorVisible ? 1 : 0,
              color: highlightColor,
              marginLeft: "2px",
            }}
          >
            |
          </span>
        </div>
      </>
    );
  }

  // 4. Stamp Slam Mode
  if (mode === "stamp-slam") {
    const elapsed = Math.max(0, frame - atFrame);
    const slam = spring({
      frame: elapsed,
      fps,
      config: MOTION_SPRINGS.slam,
      durationInFrames: 14,
    });
    const slamScale = 1.4 - 0.4 * slam;
    const rot = (1 - slam) * -5;

    return (
      <>
        {enableSfx && frame === atFrame && (
          <SfxCue cue="warning-thud" atFrame={atFrame} volume={0.65} />
        )}
        <div
          className={className}
          style={{
            ...baseStyle,
            transform: `scale(${slamScale}) rotate(${rot}deg)`,
            opacity: slam,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {text}
        </div>
      </>
    );
  }

  // 5. Split Lines Mode
  if (mode === "split-lines") {
    const lines = text.split("\n");
    return (
      <div
        className={className}
        style={{
          ...baseStyle,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {lines.map((line, lIdx) => {
          const lineStart = atFrame + lIdx * 6;
          const elapsed = Math.max(0, frame - lineStart);
          const lineSpring = spring({
            frame: elapsed,
            fps,
            config: MOTION_SPRINGS.snappy,
            durationInFrames: 14,
          });

          return (
            <div
              key={`line-${lIdx}`}
              style={{
                overflow: "hidden",
                display: "block",
              }}
            >
              <div
                style={{
                  transform: `translate3d(0, ${(1 - lineSpring) * 100}%, 0)`,
                  opacity: lineSpring,
                }}
              >
                {line}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 6. Marker Sweep Mode
  if (mode === "marker-sweep") {
    const sweepProgress = interpolate(
      frame - atFrame,
      [0, Math.max(1, Math.min(30, totalDuration))],
      [0, 100],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    return (
      <>
        {enableSfx && frame === atFrame && (
          <SfxCue cue="marker-sweep" atFrame={atFrame} volume={0.6} />
        )}
        <div
          className={className}
          style={{
            ...baseStyle,
            position: "relative",
            display: "inline-block",
          }}
        >
          {/* Underlay marker stroke */}
          <span
            style={{
              position: "absolute",
              inset: "-4px -8px",
              backgroundColor: highlightColor,
              opacity: 0.42,
              width: `${sweepProgress}%`,
              borderRadius: "3px",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
          <span style={{ position: "relative", zIndex: 1 }}>{text}</span>
        </div>
      </>
    );
  }

  // 7. Red Correction Mode (Reading Room Brick-Red Correction)
  if (mode === "red-correction") {
    const strikeStart = atFrame + 6;
    const strikeDur = 10;
    const strikeProgress = interpolate(
      frame - strikeStart,
      [0, strikeDur],
      [0, 100],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    const corrStart = correctionFrame ?? strikeStart + strikeDur + 2;
    const corrElapsed = Math.max(0, frame - corrStart);
    const corrSpring = spring({
      frame: corrElapsed,
      fps,
      config: MOTION_SPRINGS.slam,
      durationInFrames: 10,
    });

    return (
      <>
        {enableSfx && frame === strikeStart && (
          <SfxCue cue="telestrator-draw" atFrame={strikeStart} volume={0.55} />
        )}
        {enableSfx && frame === corrStart && (
          <SfxCue cue="paper-slide" atFrame={corrStart} volume={0.65} />
        )}
        <div
          className={className}
          style={{
            ...baseStyle,
            alignItems: "center",
            flexWrap: "nowrap",
            gap: "18px",
          }}
        >
          {/* Original Text with Brick-Red Strikethrough */}
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                opacity: frame >= strikeStart + strikeDur ? 0.45 : 1,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {text}
            </span>
            {frame >= strikeStart && (
              <div
                style={{
                  position: "absolute",
                  top: "52%",
                  left: "-4px",
                  height: "4px",
                  width: `calc(${strikeProgress}% + 8px)`,
                  maxWidth: "calc(100% + 8px)",
                  backgroundColor: COLORS.brickRed,
                  transform: "translateY(-50%) rotate(-2.5deg)",
                  borderRadius: "2px",
                  zIndex: 2,
                }}
              />
            )}
          </div>

          {/* Corrected Text Box (#F8ECE8 fill + #E6C3B9 border + #A3402E text) */}
          {frame >= corrStart && (
            <div
              style={{
                color: COLORS.brickRed,
                transform: `scale(${1.2 - 0.2 * corrSpring})`,
                opacity: corrSpring,
                backgroundColor: COLORS.riskFill,
                padding: "4px 14px",
                borderRadius: "6px",
                border: `1.5px solid ${COLORS.riskBorder}`,
                fontWeight: 800,
                whiteSpace: "nowrap",
                boxShadow: "0 6px 18px rgba(28, 43, 58, 0.12)",
              }}
            >
              {correctionText}
            </div>
          )}
        </div>
      </>
    );
  }

  return <div style={baseStyle}>{text}</div>;
};
