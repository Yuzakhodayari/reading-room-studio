import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  LayerKeyframe,
  LayerLifecyclePlan,
  resolveLayerLifecycle,
} from "../../design/choreography";

export interface ObjectLayerItem {
  id: string;
  content: React.ReactNode;
  lifecycle?: LayerKeyframe[] | LayerLifecyclePlan;
  position?: {
    left?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
  };
  zIndex?: number;
  style?: React.CSSProperties;
  className?: string;
}

export interface ObjectLayerProps {
  id: string;
  children: React.ReactNode;
  lifecycle?: LayerKeyframe[] | LayerLifecyclePlan;
  position?: {
    left?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
  };
  zIndex?: number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Individual layer wrapper resolving lifecycle transforms for its child.
 */
export const ObjectLayer: React.FC<ObjectLayerProps> = ({
  id,
  children,
  lifecycle,
  position,
  zIndex = 10,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const state = lifecycle
    ? resolveLayerLifecycle(frame, fps, lifecycle)
    : {
        stage: "enter" as const,
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        highlightProgress: 0,
        focusGlow: 0,
      };

  if (state.opacity <= 0.001) {
    return null;
  }

  return (
    <div
      id={`layer-${id}`}
      className={className}
      style={{
        position: "absolute",
        left: position?.left,
        top: position?.top,
        right: position?.right,
        bottom: position?.bottom,
        transform: `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`,
        opacity: state.opacity,
        transformOrigin: "center center",
        zIndex,
        pointerEvents: "none",
        ...style,
      }}
    >
      <div style={{ pointerEvents: "auto" }}>{children}</div>
    </div>
  );
};

export interface ObjectLayerStageProps {
  layers?: ObjectLayerItem[];
  children?: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * ObjectLayerStage orchestrates multiple independent floating objects
 * (cards, pills, markers, pointers, stickers) across a continuous video timeline.
 */
export const ObjectLayerStage: React.FC<ObjectLayerStageProps> = ({
  layers,
  children,
  width,
  height,
  style,
  className,
}) => {
  return (
    <AbsoluteFill
      className={className}
      style={{
        width,
        height,
        pointerEvents: "none",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* 1. Explicit layers passed via array */}
      {layers?.map((layer) => (
        <ObjectLayer
          key={layer.id}
          id={layer.id}
          lifecycle={layer.lifecycle}
          position={layer.position}
          zIndex={layer.zIndex}
          style={layer.style}
          className={layer.className}
        >
          {layer.content}
        </ObjectLayer>
      ))}

      {/* 2. Declarative children layers */}
      {children}
    </AbsoluteFill>
  );
};
