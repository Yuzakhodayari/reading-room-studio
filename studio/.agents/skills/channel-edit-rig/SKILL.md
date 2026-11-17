---
name: channel-edit-rig
description: Reference and visual grammar guide for the channel's motion design rig, Dual-Palette system (Page milk canvas + Over Footage smoked-navy Liquid Glass), typography engine, 5 style modules, and procedural SFX library in Remotion.
---

# Channel Edit Rig — Motion Design & Video Production Engine

This skill documents the motion design architecture, component library, typography engine, style modules, and procedural sound effects library implemented in `studio/src/`.

---

## 1. Core Design Foundations

### Typography (`src/design/fonts.ts`)
Loaded via `@remotion/google-fonts` with explicit Latin subsets:
- `FONTS.sans`: **Inter** (Primary UI, body narration, labels)
- `FONTS.mono`: **IBM Plex Mono** (Ledger tables, financial metrics, timecodes, data readouts)
- `FONTS.serif`: **Newsreader** (Journalistic headlines, historical documents, official records)
- `FONTS.display`: **Space Grotesk** (Modern editorial titles)
- `FONTS.condensed`: **Oswald** (Impact callout slabs, 1920s intertitle tags)

### Dual-Palette Tokens (`src/design/tokens.ts`)
1. **`PAGE_PALETTE` (`Reading Room: Page` — Full-Screen Cutaways):**
   - `paperLight` / `paper` / `paperBorder`: `#FAF8F3` / `#F2F0EA` / `#E1DED5` — Milk canvas and secondary card ground.
   - `navy` / `navyDeep`: `#1C2B3A` / `#0F1923` — Classic dark navy ink, primary hero bars, highlighted map regions, badges, and chapter covers.
   - `muted`: `#6B7783` — Metadata, citations, and footnotes.
   - `gold` / `goldWarm` / `chartSecondary`: `#3E6A94` / `#A9C4DE` / `#2F8F8B` — Faint slate hairline glint (optional), soft blue cover accent, and teal secondary metric/route.
   - `highlightSweep`: `rgba(255, 213, 79, 0.38)` — Yellow marker sweep behind `#1C2B3A` ink.
   - `brickRed` / `riskFill` / `riskBorder`: `#A3402E` / `#F8ECE8` / `#E6C3B9` — Brick-red alerts and blush risk boxes.
2. **`OVER_FOOTAGE_PALETTE` (`Reading Room: Over Footage` — Silky Smoked-Navy Liquid Glass):**
   - `glassPrimary`: `linear-gradient(135deg, rgba(28, 43, 58, 0.64) 0%, rgba(15, 25, 35, 0.60) 55%, rgba(28, 43, 58, 0.66) 100%)`
   - `glassDarkWell`: `rgba(15, 25, 35, 0.50)` | `glassBorder`: `rgba(255, 255, 255, 0.58)` | `glassInnerHairline`: `rgba(255, 255, 255, 0.16)`
   - Rich warmer cream typography: `#FFF6E5` (`textHeadline`), `#FAECD4` (`textBody`), `#F7E8CE` (`textMuted`), `#BFD6EA` / `#FAECD4` (`accentPrimary` / `accentWarm`), `#4FB3AE` (`chartSecondary`), `#E27358` (`brickRedText`), `#A3402E` (`brickRedFill` solid chip), `rgba(163, 64, 46, 0.38)` (`riskFill`), `rgba(255, 200, 185, 0.44)` (`riskBorder`), plus tight `textShadow: 0 1px 2px rgba(8, 14, 22, 0.85)`.
3. **`vintage1920s`:** Preserves 1920s sepia/noir (`#0D0C0B`, `#EFE6CF`, `#9E7B54`) inside `Newsreel1920s` and `SilentFilmCard`.

---

## 2. Optical Liquid Glass System

### `CameraPreviewStage` (`src/components/glass/CameraPreviewStage.tsx`)
Multi-mode backdrop stage:
- `light-editorial`: Default for full-screen editorial cutaways (`#FAF8F3` / `#F2F0EA` milk canvas with soft coordinate grid).
- `transparent`: Pure alpha channel for ProRes 4444 (`yuva444p10le`) and VP9 (`yuva420p`) overlays.
- `simulated-room`: Studio backdrop for testing refraction and overlay framing.
- `camera-video`: Renders presenter footage (`cameraSrc`) or talking-head framing guide.
- `dark-desk`: Deep navy `#0F1923` coordinate desk for nocturnal scenes.

### `LiquidGlassObject` (`src/components/glass/LiquidGlassObject.tsx`)
Silky Apple Liquid Glass implementation (`tint="navy-glass"` default):
- **Optical Glass & Bevel:** Smooth GPU-native `blur(12px) saturate(165%) brightness(0.66)` backdrop with multi-stop curved perimeter bevel ring (flat distortion-free text interior — zero bumpy `feTurbulence` ripples).
- **Edge Highlight & Caustic Rim:** Refined top-edge silk highlight (`rgba(255, 250, 240, 0.10)`), 1px caustic specular rim, and gentle warm sweep.
- **Tints:** `'navy-glass'` / `'navy'` / `'dark'` (smoked-navy crystal glass), `'warning'` (smoked deep navy-crimson glass), `'gold'`, `'light'` / `'neutral'` (slightly airier smoked-navy glass with warmer cream `#FFF6E5`/`#F7E8CE`/`#F3DFBE` text — zero `#1C2B3A` dark text on glass).
- **Audio Sync:** Automatic triggers for `glass-enter`, `glass-dock`, `glass-exit`.

### `ObjectLayerStage` & `ObjectLayer` (`src/components/layers/ObjectLayerStage.tsx`)
Coordinates multiple floating cards, pills, pointers, and stickers across a continuous timeline with independent lifecycle trajectories.

---

## 3. Motion Vocabulary Engine (`src/motion/`)

All motion is deterministic via `useCurrentFrame()`, `spring()`, and `interpolate()`.
- **Entry Actions:** `pop-out`, `elastic-open`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `whip-slide`, `curtain-wipe`, `iris-reveal`, `paper-unfold`, `flip-x`, `flip-y`, `stamp-slam`, `blur-snap`, `zoom-burst`, `shutter-flash` (softened to gentle luminance settle), `bounce-drop`, `skew-wipe`, `accordion-unfold`, `rubber-snap`, `zoom-punch`.
- **Exit Actions:** `fade-out`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `pop-down`, `blur-fade`, `curtain-close`, `iris-close`, `fade-blur-out`, `skew-wipe`, `zoom-punch`.
- **In-Place Actions:** `highlight-sweep`, `underline-draw`, `circle-telestrator`, `lens-zoom`, `tilt-3d`, `float-idle`, `pulse-warning`, `nudge`, `shake-alert`, `focus-dim`, `ken-burns`, `split-compare`, `glow-rim`, `glitch-jitter`, `card-tilt-3d`, `spotlight-vignette`, `split-push-left`, `split-push-right`, `parallax-hover`, `dial-rotate`, `magnifier-pan`, `border-trace`, `orbit-float`, `card-flip-180`.
- **Director Integration (`DirectorBeatRenderer.tsx`):** Enforces `paletteMode` separation (`page` for `fullscreen-cutaway`, `ArchiveLightTable`, and `StainedGlassFrame`; `over-footage` for `talking-head-with-glass`, `talking-head-punch-in`, and `split-screen` overlays), maps 100% of planner `motionAction` tokens, and wraps both floating and full-canvas beats with `ObjectAnimator`.

---

## 4. Typography Engine (`src/typography/`)

- `KineticText`: Supports `word-pop`, `karaoke-highlight`, `typewriter`, `stamp-slam`, `split-lines`, `marker-sweep` (`rgba(255, 213, 79, 0.38)`), and `red-correction` (`#A3402E` strike + `#F8ECE8`/`#E6C3B9` callout).
- `DataTicker`: Animated tabular-numerals counter with prefix, suffix, `darkSurface` option for glass wells, delta pill, and `data-tick` SFX.
- `EditorialHeadline`: `newspaper-cutout`, `broadcast-lower-third`, `spy-title` (`#0F1923`/`#1C2B3A` navy cover + `#8FB4D9`), and `chapter-card`.

---

## 5. Generative Style Modules (`src/styles/`)

- **Document & Broadcast (`docBroadcast.tsx`):** `NewsPackageLowerThird` (`#0F1923`/`#1C2B3A` smoked-navy glass bar with `#FFF6E5`/`#EDD8B4` warmer cream text and `#1C2B3A`/`#A3402E` chips), `CaptionNewsCard`, `VisualInvestigationBoard` (soft 4-frame cross-dissolve on `#FAF8F3` desk with `#F8ECE8`/`#E6C3B9` risk cards), `ArchiveLightTable`, `LiveCountdownSplit`, `TelestratorOverlay` (`#1C2B3A` pill with `#8FB4D9`/`#FAF6EE` label), `KinoMontageStrip`, `CitySymphonyFrame`.
- **Vintage Editorial (`vintageEditorial.tsx`):** Authentic 1920s sepia/noir `Newsreel1920s` and `SilentFilmCard`, plus `CollageCutout`, `SpyTitleSequence` (`#0F1923`/`#1C2B3A` + `#FAF6EE` + `#8FB4D9`), `StainedGlassFrame` (`#FAF8F3`, `#F2F0EA`, `#A9C4DE`, `#F8ECE8`, `#1C2B3A` lead lines).
- **Diagram & Metaphor (`diagramMetaphor.tsx`):** `StickerCutout` (`#FFFFFF` sticker border + `#1C2B3A` ink), `StickFigureStage`, `InstructionManualCard` (configurable `leftLabel` / `rightLabel` schematic boxes), `IsometricScene`.
- **Data & Maps 3D (`dataMaps3D.tsx`):** `MapExplainer` (`#F2F0EA` states, `#E1DED5` borders, `#1C2B3A` primary highlighted region with `#0F1923` strokes, `#2F8F8B` secondary / `#A3402E` alert route), `DataPhysicalCard` (`#1C2B3A` classic dark navy vs `#A3402E` brick red on `#FFFFFF` card), `WhiteModel3D` (`0x1c2b3a` / `0xa3402e`), `BlobSimulation`.

---

## 6. Batch Rendering & Pipeline (`studio/scripts/render-overlays.mjs`, `tools/run_pipeline.mjs`)

- `render-overlays.mjs` pre-bundles `src/index.ts` once into `out/.bundle`, executes `@remotion/cli/remotion-cli.js` directly with `shell: false` (space-safe on Windows), renders fullscreen cutaways as `light-editorial` MP4s, and passes `--pixel-format=yuva444p10le` (ProRes 4444) or `--pixel-format=yuva420p` (VP9) for all transparent overlays.
- `tools/run_pipeline.mjs` accepts `--out-dir <path>` (default `projects/<name>`).
