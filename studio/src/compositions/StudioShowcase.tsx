import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraPreviewStage } from "../components/glass/CameraPreviewStage";
import { LiquidGlassObject } from "../components/glass/LiquidGlassObject";
import { ObjectLayer, ObjectLayerStage } from "../components/layers/ObjectLayerStage";
import { SfxCue } from "../components/SfxCue";
import { FONTS } from "../design/fonts";
import { COLORS, OVER_FOOTAGE_PALETTE, PAGE_PALETTE } from "../design/tokens";
import { ObjectAnimator } from "../motion/ObjectAnimator";
import {
  DataPhysicalCard,
  MapExplainer,
  WhiteModel3D,
} from "../styles/dataMaps3D";
import {
  LiveCountdownSplit,
  NewsPackageLowerThird,
  TelestratorOverlay,
  VisualInvestigationBoard,
} from "../styles/docBroadcast";
import {
  CollageCutout,
  Newsreel1920s,
} from "../styles/vintageEditorial";
import {
  StickFigureStage,
  StickerCutout,
} from "../styles/diagramMetaphor";
import { DataTicker } from "../typography/DataTicker";
import { KineticText } from "../typography/KineticText";

/**
 * StudioShowcase (600 frames / 20 seconds @ 30 fps)
 * Complete multi-chapter showcase demonstrating all 5 style engines,
 * crystal-clear curved Apple Liquid Glass optical refraction,
 * light-mood Reading Room palette, D3 TopoJSON map, 3D white model,
 * kinetic typography, and synchronized procedural SFX library.
 */
export const StudioShowcase: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paperLight, overflow: "hidden" }}>
      {/* ================================================================== */}
      {/* CHAPTER 1: Frames 0 - 150 (Crystal-Clear Apple Liquid Glass)       */}
      {/* ================================================================== */}
      {frame < 150 && (
        <CameraPreviewStage previewMode="simulated-room">
          {/* Optical Bevel Arcs & Warm/Teal Depth Bands Framing the Outer Glass Perimeter */}
          <div
            style={{
              position: "absolute",
              top: "12%",
              left: "16%",
              width: "68%",
              height: "640px",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            {/* Upper & Lower Smooth Optical Light Bands for Bevel Refraction Demo */}
            <div
              style={{
                position: "absolute",
                top: "110px",
                left: 0,
                width: "100%",
                height: "12px",
                background: `linear-gradient(90deg, rgba(191, 214, 234, 0.25) 0%, ${OVER_FOOTAGE_PALETTE.accentWarm} 42%, ${OVER_FOOTAGE_PALETTE.chartSecondary} 78%, rgba(226, 115, 88, 0.72) 100%)`,
                borderRadius: "6px",
                opacity: 0.78,
              }}
            />
            <svg width="100%" height="640" viewBox="0 0 1100 640" fill="none">
              <path
                d="M 0 135 Q 280 55 560 118 T 1100 88"
                stroke={OVER_FOOTAGE_PALETTE.accentPrimary}
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.72"
              />
              <path
                d="M 0 535 Q 320 455 620 518 T 1100 445"
                stroke={OVER_FOOTAGE_PALETTE.chartSecondary}
                strokeWidth="6.5"
                strokeLinecap="round"
                opacity="0.78"
              />
              <path
                d="M 0 570 Q 340 495 660 558 T 1100 490"
                stroke={OVER_FOOTAGE_PALETTE.brickRedText}
                strokeWidth="4.5"
                strokeDasharray="12 8"
                opacity="0.78"
              />
            </svg>
          </div>

          <ObjectLayerStage>
            {/* 1. Main Crystal-Clear Smoked-Navy Liquid Glass Document Card */}
            <ObjectLayer
              id="glass-card-main"
              lifecycle={{
                enterFrame: 8,
                enterDuration: 14,
                focusFrame: 45,
                focusDuration: 12,
                highlightFrame: 70,
                highlightDuration: 16,
                dockFrame: 100,
                dockDuration: 16,
                exitFrame: 138,
                exitDuration: 10,
                entered: { x: 0, y: 0, scale: 1.0 },
                focused: { scale: 1.04, focusGlow: 1.0 },
                docked: { x: 460, y: 210, scale: 0.76 },
              }}
              position={{ left: "34%", top: "24%" }}
              zIndex={10}
            >
              <LiquidGlassObject
                width={640}
                borderRadius={28}
                tint="navy-glass"
                enableOpticalRefraction={true}
                enableSpecularSweep={true}
                enableSfx={true}
              >
                <div style={{ padding: "36px 40px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "18px",
                      borderBottom: `1px solid ${OVER_FOOTAGE_PALETTE.glassInnerHairline}`,
                      paddingBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: "12px",
                        color: OVER_FOOTAGE_PALETTE.accentWarm,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                      }}
                    >
                      Treasury Statement · Table 9
                    </span>
                    <span
                      style={{
                        backgroundColor: OVER_FOOTAGE_PALETTE.brickRedFill,
                        color: OVER_FOOTAGE_PALETTE.textHeadline,
                        fontFamily: FONTS.mono,
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "6px",
                        border: `1px solid ${OVER_FOOTAGE_PALETTE.riskBorder}`,
                      }}
                    >
                      LIVE DATA
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: FONTS.serif,
                      fontSize: "28px",
                      fontWeight: 700,
                      color: OVER_FOOTAGE_PALETTE.textHeadline,
                      textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                      margin: 0,
                      lineHeight: 1.24,
                    }}
                  >
                    Receipts Balance & Debt Trajectory
                  </h3>

                  <p
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: "15px",
                      fontWeight: 500,
                      color: OVER_FOOTAGE_PALETTE.textBody,
                      textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                      marginTop: "10px",
                      lineHeight: 1.55,
                    }}
                  >
                    Curved optical refraction bends underlying trends cleanly while preserving full legibility.
                  </p>

                  <div
                    style={{
                      marginTop: "20px",
                      padding: "16px 20px",
                      borderRadius: "16px",
                      backgroundColor: "rgba(15, 25, 35, 0.44)",
                      border: `1px solid ${OVER_FOOTAGE_PALETTE.glassInnerHairline}`,
                    }}
                  >
                    <DataTicker
                      startValue={12.4}
                      endValue={38.4}
                      prefix="$"
                      suffix="T"
                      atFrame={24}
                      duration={40}
                      decimals={1}
                      fontSize={44}
                      color={OVER_FOOTAGE_PALETTE.textHeadline}
                      accentColor={OVER_FOOTAGE_PALETTE.brickRedText}
                      darkSurface={true}
                      label="NATIONAL FISCAL BALANCE"
                      delta={{ value: "+210%", isPositive: false, label: "VS BASELINE" }}
                    />
                  </div>
                </div>
              </LiquidGlassObject>
            </ObjectLayer>

            {/* 2. Top Chapter Pill */}
            <ObjectLayer
              id="ch1-title"
              lifecycle={{ enterFrame: 4, exitFrame: 140 }}
              position={{ left: "64px", top: "54px" }}
              zIndex={20}
            >
              <LiquidGlassObject
                borderRadius={999}
                tint="navy-glass"
                blurAmount={9}
                enableSfx={false}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "10px 22px",
                    userSelect: "none",
                  }}
                >
                    <span
                      style={{
                        backgroundColor: PAGE_PALETTE.navy,
                        color: OVER_FOOTAGE_PALETTE.textHeadline,
                        border: "1px solid rgba(191, 214, 234, 0.36)",
                        fontFamily: FONTS.mono,
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        padding: "4px 11px",
                        borderRadius: "999px",
                      }}
                    >
                      PART 01
                    </span>
                  <span
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: "17px",
                      fontWeight: 700,
                      color: OVER_FOOTAGE_PALETTE.textHeadline,
                      textShadow: OVER_FOOTAGE_PALETTE.textShadow,
                      letterSpacing: "0.01em",
                    }}
                  >
                    Liquid Glass Overlay
                  </span>
                </div>
              </LiquidGlassObject>
            </ObjectLayer>
          </ObjectLayerStage>
        </CameraPreviewStage>
      )}

      {/* ================================================================== */}
      {/* CHAPTER 2: Frames 150 - 300 (Case Notes & Broadcast Lower Third)   */}
      {/* ================================================================== */}
      {frame >= 150 && frame < 300 && (
        <AbsoluteFill>
          <VisualInvestigationBoard
            atFrame={150}
            evidenceItems={[
              { id: "e1", label: "CBO Reported Deficit", value: "$1.83T" },
              { id: "e2", label: "Net Interest Payments", value: "$882B", isFlagged: true },
              { id: "e3", label: "Defense Outlays", value: "$874B" },
            ]}
            pointerTargetId="e2"
          />

          {/* Telestrator Hand-Drawn Ring Highlight + Crisp Navy Backing Pill */}
          <TelestratorOverlay
            atFrame={175}
            duration={24}
            color={COLORS.brickRed}
            circleTarget={{
              cx: 960,
              cy: 225,
              r: 140,
              label: "INTEREST SURPASSES DEFENSE",
            }}
          />

          {/* Lower Third News Bug */}
          <NewsPackageLowerThird
            atFrame={160}
            category="Fiscal Analysis"
            title="Interest Costs Cross Historical Parity Threshold"
            source="U.S. Treasury Monthly Statement, Table 9"
            mode="ANALYSIS"
          />

          {/* Split Countdown Mini Overlay */}
          {frame >= 220 && (
            <div
              style={{
                position: "absolute",
                bottom: "160px",
                right: "64px",
                width: "680px",
                height: "260px",
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: "0 20px 44px rgba(28, 43, 58, 0.16)",
                border: `2px solid ${COLORS.navy}`,
              }}
            >
              <LiveCountdownSplit
                atFrame={220}
                duration={70}
                leftTitle="Historical Baseline"
                rightTitle="Accelerated Trajectory"
                startYear={2026}
                endYear={2036}
              />
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* ================================================================== */}
      {/* CHAPTER 3: Frames 300 - 450 (1920s Newsreel & Stick Figure Metaphor)*/}
      {/* ================================================================== */}
      {frame >= 300 && frame < 450 && (
        <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "space-around",
              padding: "64px",
            }}
          >
            {/* 1. Authentic 1920s Newsreel Gate + Collage Cutout */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ width: "680px", height: "420px", borderRadius: "12px", overflow: "hidden" }}>
                <Newsreel1920s
                  atFrame={302}
                  placeDate="WASHINGTON · 1929"
                  headline="CONGRESS ENACTS DEFICIT MEASURES"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "#EFE6CF",
                      fontFamily: FONTS.serif,
                      fontSize: "22px",
                      textAlign: "center",
                      padding: "36px",
                    }}
                  >
                    "The Treasury balance hangs in delicate equilibrium upon the speaker's gavel."
                  </div>
                </Newsreel1920s>
              </div>

              <CollageCutout rotation={-2} atFrame={315}>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: COLORS.navy,
                    padding: "8px 16px",
                  }}
                >
                  Archive Clipping · 1929
                </div>
              </CollageCutout>
            </div>

            {/* 2. Sticker Cutout + Stick Figure Stage */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <StickerCutout atFrame={310} outlineWidth={10} rotation={2}>
                <div style={{ backgroundColor: "#FFFFFF", padding: "16px 24px" }}>
                  <StickFigureStage
                    pose="crushed-by-debt"
                    caption="Obligations Outpace Payroll"
                    accentColor={COLORS.brickRed}
                  />
                </div>
              </StickerCutout>

              {/* Kinetic Typographic Correction */}
              <div style={{ marginTop: "24px" }}>
                <KineticText
                  text="$1.8 TRILLION"
                  correctionText="$38.4 TRILLION"
                  mode="red-correction"
                  atFrame={315}
                  fontSize={28}
                  fontFamily={FONTS.mono}
                  color={COLORS.navy}
                />
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ================================================================== */}
      {/* CHAPTER 4: Frames 450 - 600 (Page Mode D3 Map, 3D Physical & Text)  */}
      {/* ================================================================== */}
      {frame >= 450 && (
        <AbsoluteFill style={{ backgroundColor: COLORS.paperLight }}>
          {/* Background D3 TopoJSON Map Explainer */}
          <MapExplainer
            atFrame={452}
            highlightStatesFips={["48"]}
            highlightLabel="Austin, Texas"
            zoomState={true}
          />

          {/* Foreground Data Physicalization Card */}
          <div
            style={{
              position: "absolute",
              top: "84px",
              left: "64px",
              zIndex: 30,
            }}
          >
            <ObjectAnimator enter="slide-right" atFrame={460} duration={130}>
              <DataPhysicalCard
                atFrame={462}
                label1="Individual Payroll & Income"
                value1={84}
                label2="Corporate Income"
                value2={7}
              />
            </ObjectAnimator>
          </div>

          {/* Vanilla Three.js Architectural White Model */}
          <div
            style={{
              position: "absolute",
              bottom: "64px",
              right: "64px",
              zIndex: 35,
            }}
          >
            <ObjectAnimator enter="blur-snap" atFrame={475} duration={120}>
              <WhiteModel3D width={460} height={300} />
            </ObjectAnimator>
          </div>

          {/* Bottom Left Kinetic Karaoke Subtitle */}
          <div
            style={{
              position: "absolute",
              bottom: "54px",
              left: "64px",
              maxWidth: "800px",
              backgroundColor: "rgba(250, 248, 243, 0.95)",
              padding: "14px 24px",
              borderRadius: "10px",
              border: `1px solid ${COLORS.paperBorder}`,
              borderLeft: `4px solid ${COLORS.navy}`,
              boxShadow: "0 14px 32px rgba(28, 43, 58, 0.12)",
              zIndex: 40,
            }}
          >
            <KineticText
              text="Individual taxpayers supply eighty-four percent of all federal revenue."
              mode="karaoke-highlight"
              atFrame={470}
              duration={110}
              fontSize={22}
              color={COLORS.navy}
              highlightColor={COLORS.brickRed}
            />
          </div>
        </AbsoluteFill>
      )}

      {/* Chapter Transition Audio Cues */}
      {frame === 150 && <SfxCue cue="paper-slide" atFrame={150} volume={0.6} />}
      {frame === 300 && <SfxCue cue="paper-slide" atFrame={300} volume={0.6} />}
      {frame === 450 && <SfxCue cue="map-whoosh" atFrame={450} volume={0.6} />}
    </AbsoluteFill>
  );
};
