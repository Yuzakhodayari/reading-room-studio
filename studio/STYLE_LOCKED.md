# Yuza Studio — Visual System & Render Standards

This document establishes the motion design rules, Dual-Palette tokens (`Page` and `Over Footage`), optical Liquid Glass standards, and render commands for Yuza's video editing studio.

---

## 1. Visual Design Architecture

The visual identity pairs two coordinated editorial palettes under strict scene separation:
1. **`Page` Palette (`PAGE_PALETTE` — Milk Canvas Cutaways):** Clean milk sheets (`#FAF8F3` / `#F2F0EA`), warm grey-tan rules (`#E1DED5`), classic dark navy (`#1C2B3A`) for primary hero bars, highlighted map regions, badges, and ink, secondary teal (`#2F8F8B`), yellow marker sweeps (`rgba(255, 213, 79, 0.38)`), faint slate hairline glint (`#3E6A94` optional thin border glints only — never a hero fill), and blush risk callouts (`#F8ECE8` fill, `#E6C3B9` border, `#A3402E` brick red). Solid `#0F1923`/`#1C2B3A` navy backdrops appear on chapter covers (`SpyTitleSequence`, `EditorialHeadline` cover cards), while `Newsreel1920s` and `SilentFilmCard` keep 1920s sepia/noir.
2. **`Over Footage` Palette (`OVER_FOOTAGE_PALETTE` — Silky Smoked-Navy Liquid Glass):** Optical smoked-navy crystal glass floating over live camera video (`tint="navy-glass"` default): translucent smoked-navy glass (`rgba(28, 43, 58, 0.64)` to `rgba(15, 25, 35, 0.60)`), inner dark well (`rgba(15, 25, 35, 0.50)`), smooth GPU-native `12px` optical blur + `saturate(165%) brightness(0.66)`, multi-stop curved perimeter glass bevel ring (distortion-free clear interior — zero bumpy `feTurbulence` noise), refined top-edge silk highlight, `1px` specular caustic rim, and rich warmer cream typography (`#FFF6E5`, `#FAECD4`, `#F7E8CE`, `#4FB3AE`, `#E27358`) with tight `0 1px 2px rgba(8, 14, 22, 0.85)` shadow for razor-sharp legibility over both dark and sunlit backgrounds.
3. **Scene Separation Rule:**
   - `fullscreen-cutaway` (`paletteMode: "page"`), `ArchiveLightTable`, and `StainedGlassFrame` cards use `Page` (`#FAF8F3`/`#F2F0EA` surfaces with `#1C2B3A` ink).
   - `talking-head-with-glass`, `talking-head-punch-in`, and `split-screen` overlays (`paletteMode: "over-footage"`) use `Over Footage` (`navy-glass` with `#FFF6E5`/`#F7E8CE`/`#EDD8B4` warmer cream text and zero dark `#1C2B3A` text on glass).

### Color Palettes

#### A. `Page` Palette (`PAGE_PALETTE`)
| Token | Hex / Value | Semantic Role |
|---|---|---|
| `paperLight` | `#FAF8F3` | Main full-screen cutaway milk canvas |
| `paper` | `#F2F0EA` | Secondary card and table ground |
| `paperBorder` | `#E1DED5` | Hairline borders and table rules |
| `navy` / `ink` | `#1C2B3A` | Classic dark navy primary hero bars, highlighted map regions, badges, ink, lead lines |
| `navyDeep` | `#0F1923` | Deepest ink, map strokes, vignettes, dark chapter cover base |
| `muted` | `#6B7783` | Secondary metadata, footnotes, captions |
| `gold` | `#3E6A94` | Faint editorial hairline glint ONLY (never hero fills) |
| `goldWarm` | `#A9C4DE` | Soft blue accent for dark covers and stained-glass panes |
| `highlightSweep` | `rgba(255, 213, 79, 0.38)` | Translucent yellow marker sweep behind `#1C2B3A` ink |
| `chartSecondary` | `#2F8F8B` | Teal secondary metric, route, and comparison accent |
| `brickRed` / `warning` | `#A3402E` | Eyebrow tags, risk headings, drops, critical figures |
| `riskFill` / `riskBorder` | `#F8ECE8` / `#E6C3B9` | Blush fill and border (**only** on risk/warning boxes) |

#### B. `Over Footage` Palette (`OVER_FOOTAGE_PALETTE`)
| Token | Hex / Value | Semantic Role |
|---|---|---|
| `glassPrimary` | `linear-gradient(135deg, rgba(28, 43, 58, 0.64) 0%, rgba(15, 25, 35, 0.60) 55%, rgba(28, 43, 58, 0.66) 100%)` | Silky smoked-navy crystal glass body |
| `glassDarkWell` | `rgba(15, 25, 35, 0.50)` | Inner glass well behind key metrics and columns |
| `glassBorder` / `glassInnerHairline` | `rgba(255, 255, 255, 0.58)` / `rgba(255, 255, 255, 0.16)` | Outer specular rim and inner hairline |
| `textHeadline` / `textBody` / `textMuted` | `#FFF6E5` / `#FAECD4` / `#F7E8CE` | Rich warmer cream headlines, body copy, and subtitles/eyebrows on glass |
| `accentPrimary` / `accentWarm` | `#BFD6EA` / `#FAECD4` | Subtle border/icon highlights and warm cream tags |
| `chartSecondary` | `#4FB3AE` | Lifted teal secondary metric and positive delta |
| `brickRedText` / `brickRedFill` | `#E27358` / `#A3402E` | Coral-red deltas on glass; solid red chips with `#FFF6E5` text |
| `riskFill` / `riskBorder` | `rgba(163, 64, 46, 0.38)` / `rgba(255, 200, 185, 0.44)` | Translucent glass risk wash and rim |
| `textShadow` | `0 1px 2px rgba(8, 14, 22, 0.85)` | Tight razor-sharp optical shadow (zero blurry halo) |

### Typography

- **Sans:** `Inter` (UI elements, body narration, labels)
- **Mono:** `IBM Plex Mono` (data readouts, line items, timecodes, percentages)
- **Serif:** `Newsreader` (official document titles, journalistic headlines, historical cards)

---

## 2. Motion Rules

1. **The 0.4s Rule:** Visual entry settles cleanly within 12 frames (0.4s). Avoid dead space or sluggish logo reveals.
2. **Investigative Damping:** Use friction-damped springs (`damping: 20–30`, `mass: 0.8–1.2`) and soft editorial transitions (`slide-up`, `blur-snap`, `highlight-sweep`). Hard white strobe flashes are disabled; `VisualInvestigationBoard` and `shutter-flash` use a gentle 4-frame cross-dissolve / soft luminance dip (`rgba(28, 43, 58, 0.14)`).
3. **Restrained Color Hierarchy:** Brick red (`#A3402E` / `#E27358`) and `#F8ECE8`/`#E6C3B9` risk boxes activate only for critical numbers, eyebrows, pointers, or structural risks.
4. **Final Hold:** Hold concluding summary cards for at least 1.0 second with subtle sinusoidal breathing under 1.5px.

---

## 3. Compositions & Output Modes

### 1. Full-Screen Scene (`TreasuryTable9-Full`)
- **Duration:** 15.0 seconds (450 frames @ 30 fps)
- **Format:** 1920×1080 light-mood editorial parchment scene

### 2. Transparent Picture-in-Picture Card (`TreasuryTable9-Overlay`)
- **Duration:** 10.0 seconds (300 frames @ 30 fps)
- **Format:** 1920×1080 pure alpha canvas with right-third glass card (`right: 72px`)

### 3. Batch Director Beat Renderer (`DirectorBeat` via `scripts/render-overlays.mjs`)
- Pre-bundles `src/index.ts` once into `out/.bundle` per batch run and invokes `@remotion/cli/remotion-cli.js` directly with `shell: false` (safe for Windows spaces in paths).
- Fullscreen cutaways render in `light-editorial` mode as H.264 MP4 (`--crf=14`).
- Transparent overlays (`talking-head-with-glass`, `split-screen`, `talking-head-punch-in`, transparent diagrams/collages) render with explicit alpha pixel formats (`yuva444p10le` for ProRes 4444 `.mov`; `yuva420p` for VP9 `.webm`).

---

## 4. CLI Execution & Commands

All commands run inside `D:\youtube channel 1\studio`:

### Interactive Preview
```bash
npm run dev
```

### Generate Review Stills
```bash
# Full scene at marker highlight
npx remotion still TreasuryTable9-Full out/full-f120.png --frame=120

# Full scene at final summary card
npx remotion still TreasuryTable9-Full out/full-f390.png --frame=390

# Transparent PiP card (PNG format to verify alpha)
npx remotion still TreasuryTable9-Overlay out/overlay-f150.png --frame=150 --image-format=png
```

### Production Renders

#### A. Full-Screen High-Quality MP4
```bash
npx remotion render TreasuryTable9-Full out/TreasuryTable9-Full.mp4 --crf=14
```

#### B. Transparent Video for DaVinci Resolve (Apple ProRes 4444 with Alpha)
```bash
npx remotion render TreasuryTable9-Overlay out/TreasuryTable9-Overlay.mov --codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le
```

#### C. Transparent WebM (VP9 with Alpha)
```bash
npx remotion render TreasuryTable9-Overlay out/TreasuryTable9-Overlay.webm --codec=vp9 --image-format=png --pixel-format=yuva420p
```

#### D. Batch Render Director Plan Overlays
```bash
node scripts/render-overlays.mjs out/sample-director-plan.json --out-dir out/overlays --codec prores
```
