import React, { useEffect, useMemo, useRef } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import * as THREE from "three";
import usAtlas from "us-atlas/states-10m.json" with { type: "json" };
import worldAtlas from "world-atlas/countries-110m.json" with { type: "json" };
import { SfxCue } from "../components/SfxCue";
import { FONTS } from "../design/fonts";
import { COLORS, PAGE_PALETTE } from "../design/tokens";
import { MOTION_SPRINGS } from "../motion/primitives";

// ============================================================================
// 1. MapExplainer (Page Mode D3 + TopoJSON US/World Map with Smart Highlight)
// ============================================================================
export interface MapExplainerProps {
  highlightStateFips?: string; // Backward-compatible single FIPS (e.g. "48")
  highlightStatesFips?: string[]; // Array of US state FIPS or World country ISO numeric IDs
  region?: "us" | "world";
  highlightLabel?: string;
  routeTone?: "secondary" | "alert";
  zoomState?: boolean;
  atFrame?: number;
}

export const MapExplainer: React.FC<MapExplainerProps> = ({
  highlightStateFips = "48",
  highlightStatesFips,
  region = "us",
  highlightLabel = "Austin, Texas",
  routeTone = "secondary",
  zoomState = true,
  atFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { width = 1920, height = 1080 } = useVideoConfig();

  const activeIds = useMemo(() => {
    const list =
      highlightStatesFips && highlightStatesFips.length > 0
        ? highlightStatesFips
        : [highlightStateFips];
    return new Set(list.map((id) => String(id).trim()));
  }, [highlightStateFips, highlightStatesFips]);

  // Convert TopoJSON to GeoJSON features for US or World
  const geoFeatures = useMemo(() => {
    if (region === "world") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const atlas = worldAtlas as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fc = topojson.feature(atlas, atlas.objects.countries) as any;
      // Filter out Antarctica ("010") for cleaner editorial framing
      return (fc.features || []).filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (f: any) => String(f.id) !== "010"
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const atlas = usAtlas as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fc = topojson.feature(atlas, atlas.objects.states) as any;
    return fc.features || [];
  }, [region]);

  // Configure D3 projection per region
  const projection = useMemo(() => {
    if (region === "world") {
      return d3
        .geoNaturalEarth1()
        .scale(365)
        .translate([width * 0.5, height * 0.54]);
    }
    return d3
      .geoAlbersUsa()
      .scale(1360)
      .translate([width * 0.5, height * 0.5]);
  }, [region, width, height]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  // Compute centroid & connecting route endpoints dynamically from highlighted features
  const { focusPoint, routePath } = useMemo(() => {
    const centroids: Array<[number, number]> = [];
    for (const feature of geoFeatures) {
      if (activeIds.has(String(feature.id))) {
        const c = pathGenerator.centroid(feature);
        if (Number.isFinite(c[0]) && Number.isFinite(c[1])) {
          centroids.push(c as [number, number]);
        }
      }
    }

    const fallback: [number, number] = [width * 0.5, height * 0.5];
    if (centroids.length === 0) {
      return { focusPoint: fallback, routePath: null as string | null };
    }

    const avgX = centroids.reduce((s, p) => s + p[0], 0) / centroids.length;
    const avgY = centroids.reduce((s, p) => s + p[1], 0) / centroids.length;
    const center: [number, number] = [avgX, avgY];

    // If multi-state (e.g. 13-state PJM), connect westernmost to easternmost state
    if (centroids.length >= 2) {
      const sorted = [...centroids].sort((a, b) => a[0] - b[0]);
      const pStart = sorted[0];
      const pEnd = sorted[sorted.length - 1];
      const midX = (pStart[0] + pEnd[0]) / 2;
      const midY = Math.min(pStart[1], pEnd[1]) - 55;
      return {
        focusPoint: center,
        routePath: `M ${pStart[0].toFixed(1)} ${pStart[1].toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${pEnd[0].toFixed(1)} ${pEnd[1].toFixed(1)}`,
      };
    }

    // Single state/country: draw route from DC (US) or NYC/Atlantic (World) to target centroid
    const origin: [number, number] =
      region === "world" ? [width * 0.32, height * 0.42] : [1440, 445];
    const dist = Math.hypot(center[0] - origin[0], center[1] - origin[1]);
    if (dist < 40) {
      return { focusPoint: center, routePath: null };
    }
    const ctrlX = (origin[0] + center[0]) / 2;
    const ctrlY = Math.min(origin[1], center[1]) - 70;
    return {
      focusPoint: center,
      routePath: `M ${origin[0].toFixed(1)} ${origin[1].toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${center[0].toFixed(1)} ${center[1].toFixed(1)}`,
    };
  }, [geoFeatures, activeIds, pathGenerator, region, width, height]);

  const elapsed = Math.max(0, frame - atFrame);
  const t = zoomState
    ? interpolate(elapsed, [8, 48], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: d3.easeCubicOut,
      })
    : 0;

  const targetZoom =
    region === "world" ? 2.6 : activeIds.size > 2 ? 1.48 : 1.65;
  const scale = 1 + (targetZoom - 1) * t;
  const focusX = interpolate(t, [0, 1], [width * 0.5, focusPoint[0]]);
  const focusY = interpolate(t, [0, 1], [height * 0.5, focusPoint[1]]);

  const routeP = interpolate(elapsed, [14, 54], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const routeColor =
    routeTone === "alert" ? PAGE_PALETTE.brickRed : PAGE_PALETTE.chartSecondary;
  const pulseFill =
    routeTone === "alert"
      ? "rgba(163, 64, 46, 0.24)"
      : "rgba(47, 143, 139, 0.24)";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: PAGE_PALETTE.paperLight,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {frame === atFrame + 10 && (
        <SfxCue cue="map-whoosh" atFrame={atFrame + 10} volume={0.6} />
      )}

      {/* Subtle Paper Grid Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, ${COLORS.gridLine} 1px, transparent 1px),
            linear-gradient(to bottom, ${COLORS.gridLine} 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          pointerEvents: "none",
        }}
      />

      {/* SVG Map Canvas */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        <g
          transform={`translate(${(width * 0.5).toFixed(2)}, ${(height * 0.5).toFixed(2)}) scale(${scale.toFixed(4)}) translate(${(-focusX).toFixed(2)}, ${(-focusY).toFixed(2)})`}
        >
          {/* Base Polygons */}
          <g>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {geoFeatures.map((feature: any, idx: number) => {
              const isHighlighted = activeIds.has(String(feature.id));
              const d = pathGenerator(feature);
              if (!d) return null;

              return (
                <path
                  key={`geo-${feature.id ?? idx}`}
                  d={d}
                  fill={isHighlighted ? PAGE_PALETTE.navy : PAGE_PALETTE.paper}
                  stroke={
                    isHighlighted ? PAGE_PALETTE.navyDeep : PAGE_PALETTE.paperBorder
                  }
                  strokeWidth={
                    isHighlighted
                      ? String(2.2 / Math.sqrt(scale))
                      : String(1.25 / Math.sqrt(scale))
                  }
                />
              );
            })}
          </g>

          {/* Animated Dashed Route */}
          {routePath && (
            <path
              d={routePath}
              fill="none"
              stroke={routeColor}
              strokeWidth={3.4 / Math.sqrt(scale)}
              strokeDasharray="8 6"
              strokeDashoffset={-elapsed * 2.5}
              strokeLinecap="round"
              opacity={routeP}
            />
          )}

          {/* Target Destination Pin Pulse */}
          {elapsed > 16 && (
            <g transform={`translate(${focusPoint[0].toFixed(1)}, ${focusPoint[1].toFixed(1)})`}>
              <circle
                r={(14 + Math.sin(frame * 0.14) * 4) / Math.sqrt(scale)}
                fill={pulseFill}
              />
              <circle
                r={6.5 / Math.sqrt(scale)}
                fill={routeColor}
                stroke={PAGE_PALETTE.paperLight}
                strokeWidth={2 / Math.sqrt(scale)}
              />
            </g>
          )}
        </g>
      </svg>

      {/* Floating Region Information Tag */}
      {elapsed > 12 && (
        <div
          style={{
            position: "absolute",
            top: "52px",
            right: "64px",
            backgroundColor: "rgba(250, 248, 243, 0.95)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: `1px solid ${PAGE_PALETTE.paperBorder}`,
            borderLeft: `4px solid ${PAGE_PALETTE.navy}`,
            borderRadius: "10px",
            padding: "16px 24px",
            boxShadow: "0 16px 36px rgba(28, 43, 58, 0.12)",
            zIndex: 30,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: "11px",
              color: routeColor,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {region === "world" ? "Global Focus" : "Regional Focus"}
          </div>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: "24px",
              fontWeight: 700,
              color: PAGE_PALETTE.navy,
              marginTop: "4px",
            }}
          >
            {highlightLabel}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. DataPhysicalCard (Light-Mood Isometric 3D Comparison Blocks)
// ============================================================================
export interface DataPhysicalCardProps {
  label1?: string;
  value1?: number; // e.g. 84
  label2?: string;
  value2?: number; // e.g. 7
  atFrame?: number;
}

export const DataPhysicalCard: React.FC<DataPhysicalCardProps> = ({
  label1 = "Individual Payroll & Income",
  value1 = 84,
  label2 = "Corporate Income Tax",
  value2 = 7,
  atFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const elapsed = Math.max(0, frame - atFrame);
  const growProgress = spring({
    frame: elapsed,
    fps,
    config: MOTION_SPRINGS.snappy,
    durationInFrames: 24,
  });

  const bar1Height = Math.max(12, value1 * 2.4 * growProgress);
  const bar2Height = Math.max(12, value2 * 2.4 * growProgress);

  const barW = 110;
  const isoDx = 16;
  const isoDy = 14;

  const renderIsoBar = (
    heightPx: number,
    frontFill: string,
    topFill: string,
    rightFill: string
  ) => {
    const svgW = barW + isoDx;
    const svgH = heightPx + isoDy;
    return (
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Top Face */}
        <polygon
          points={`0,${isoDy} ${isoDx},0 ${barW + isoDx},0 ${barW},${isoDy}`}
          fill={topFill}
        />
        {/* Right Face */}
        <polygon
          points={`${barW},${isoDy} ${barW + isoDx},0 ${barW + isoDx},${heightPx} ${barW},${svgH}`}
          fill={rightFill}
        />
        {/* Front Face */}
        <rect
          x={0}
          y={isoDy}
          width={barW}
          height={heightPx}
          rx={0}
          fill={frontFill}
        />
      </svg>
    );
  };

  return (
    <div
      style={{
        display: "inline-block",
        padding: "32px 40px",
        backgroundColor: "#FFFFFF",
        border: `1px solid ${PAGE_PALETTE.paperBorder}`,
        borderRadius: "16px",
        boxShadow: "0 20px 44px rgba(28, 43, 58, 0.12)",
        userSelect: "none",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: "11.5px",
          color: PAGE_PALETTE.brickRed,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "40px",
        }}
      >
        Receipts Breakdown
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "60px",
          height: "340px",
          paddingTop: "24px",
        }}
      >
        {/* Block 1: Classic Dark Navy Bar (84%) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: "36px",
              fontWeight: 800,
              color: PAGE_PALETTE.navy,
              marginBottom: "10px",
            }}
          >
            {Math.round(value1 * growProgress)}%
          </span>
          {renderIsoBar(bar1Height, PAGE_PALETTE.navy, "#2E4357", "#0F1923")}
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: "13px",
              lineHeight: 1.3,
              color: PAGE_PALETTE.navy,
              fontWeight: 700,
              marginTop: "18px",
              maxWidth: "165px",
              textAlign: "center",
            }}
          >
            {label1}
          </span>
        </div>

        {/* Block 2: Brick Red Bar (7%) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: "36px",
              fontWeight: 800,
              color: PAGE_PALETTE.brickRed,
              marginBottom: "10px",
            }}
          >
            {Math.round(value2 * growProgress)}%
          </span>
          {renderIsoBar(bar2Height, PAGE_PALETTE.brickRed, "#C76250", "#74291C")}
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: "13px",
              lineHeight: 1.3,
              color: PAGE_PALETTE.muted,
              fontWeight: 700,
              marginTop: "18px",
              maxWidth: "165px",
              textAlign: "center",
            }}
          >
            {label2}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. WhiteModel3D (Light-Mood Deterministic Three.js Architectural Stage)
// ============================================================================
export interface WhiteModel3DProps {
  width?: number;
  height?: number;
}

export const WhiteModel3D: React.FC<WhiteModel3DProps> = ({
  width = 640,
  height = 420,
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);

    // Page Milk & Slate-Blue / Brick-Red Architectural Materials
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xf2f0ea,
      roughness: 0.4,
      metalness: 0.04,
    });
    const blueMat = new THREE.MeshStandardMaterial({
      color: 0x1c2b3a,
      roughness: 0.35,
      metalness: 0.05,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xa3402e,
      roughness: 0.3,
      metalness: 0.06,
    });

    const groundGeo = new THREE.BoxGeometry(16, 0.4, 16);
    const groundMesh = new THREE.Mesh(groundGeo, paperMat);
    groundMesh.position.y = -0.2;
    scene.add(groundMesh);

    const block1 = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 3), blueMat);
    block1.position.set(-2, 2.5, -1);
    scene.add(block1);

    const block2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 2.5), paperMat);
    block2.position.set(2.5, 1.5, 1);
    scene.add(block2);

    const accentBlock = new THREE.Mesh(new THREE.BoxGeometry(2, 6.5, 2), accentMat);
    accentBlock.position.set(1.5, 3.25, -2);
    scene.add(accentBlock);

    const ambLight = new THREE.AmbientLight(0xfaf8f3, 0.9);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(10, 15, 8);
    scene.add(dirLight);

    const angle = frame * 0.018;
    camera.position.x = Math.sin(angle) * 15;
    camera.position.z = Math.cos(angle) * 15;
    camera.position.y = 8.5;
    camera.lookAt(0, 2.2, 0);

    renderer.render(scene, camera);

    return () => {
      renderer.dispose();
    };
  }, [frame, width, height]);

  return (
    <div
      style={{
        display: "inline-block",
        borderRadius: "16px",
        overflow: "hidden",
        border: `1px solid ${COLORS.paperBorder}`,
        backgroundColor: COLORS.paperLight,
        boxShadow: "0 20px 44px rgba(28, 43, 58, 0.12)",
      }}
    >
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
};

// ============================================================================
// 4. BlobSimulation (Light-Mood Flow/Bottleneck Diagram)
// ============================================================================
export const BlobSimulation: React.FC<{ count?: number }> = ({ count = 48 }) => {
  const frame = useCurrentFrame();

  const particles = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const seed = i * 17 + 101;
      list.push({ id: i, seed });
    }
    return list;
  }, [count]);

  return (
    <div
      style={{
        position: "relative",
        width: "580px",
        height: "230px",
        backgroundColor: COLORS.paperLight,
        border: `1px solid ${COLORS.paperBorder}`,
        borderRadius: "16px",
        boxShadow: "0 18px 38px rgba(28, 43, 58, 0.12)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "20px",
          fontFamily: FONTS.mono,
          fontSize: "11px",
          color: COLORS.brickRed,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Capacity Bottleneck
      </div>

      <svg width="580" height="230" viewBox="0 0 580 230">
        {/* Funnel Boundary Lines */}
        <path d="M 60 45 L 250 90 L 330 90 L 520 45" fill="none" stroke={COLORS.muted} strokeWidth="2" />
        <path d="M 60 185 L 250 140 L 330 140 L 520 185" fill="none" stroke={COLORS.muted} strokeWidth="2" />

        {/* Particles */}
        {particles.map((p) => {
          const speed = 2.2;
          const cycle = (frame * speed + p.seed * 9) % 480;
          const x = 50 + cycle;

          let spread = 60;
          if (x > 180 && x < 400) {
            spread = 18;
          }
          const y = 115 + Math.sin(p.seed * 43 + cycle * 0.05) * spread;

          const isBottleneck = x > 230 && x < 350;
          const fillColor = isBottleneck ? COLORS.brickRed : COLORS.navy;

          return (
            <circle
              key={p.id}
              cx={x}
              cy={y}
              r={isBottleneck ? "4.5" : "3.5"}
              fill={fillColor}
              opacity={0.85}
            />
          );
        })}
      </svg>
    </div>
  );
};
