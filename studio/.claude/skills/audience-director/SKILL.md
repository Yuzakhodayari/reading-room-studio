---
name: audience-director
description: Audience-Engineering Director Brain for The Reading Room. Converts Whisper words.json or spoken scripts into deterministic, non-repetitive Remotion edit plans balancing Money & Macro room framing, Good Work / GothamChess wit, Newsthink cutaways, Dual-Palette styling (Page milk canvas + Over Footage smoked-navy Liquid Glass), and all 24 implemented visual styles.
---

# Audience-Engineering Director (`audience-director`)

Deterministic editorial director (`src/director/schema.ts`, `src/director/planner.ts`, `scripts/plan-edit.mjs`) that turns a timestamped transcript or spoken script into a frame-accurate `DirectorPlan` for **The Reading Room**.

---

## Locked Editing Spec (Dual-Palette Editorial Standard)

1. **Zero-Fatigue Watchability ("Watch as a Hobby"):** Calm, unhurried pacing built for viewer curiosity rather than frantic TikTok flashing. Pair relaxed clarity with quiet **"Warning" gravity** and primary-source authority (every major number on screen carries a verified source badge, and dense evidence enters only to test or break a specific claim).
2. **Dual-Palette Scene Rule (`paletteMode: "page" | "over-footage"`):**
   - **`Page` (`paletteMode: "page"`, Full-Screen Cutaways):** Milk canvas `#FAF8F3`, secondary `#F2F0EA`, borders `#E1DED5`, classic dark navy hero bars/map fills/ink `#1C2B3A`, teal secondary `#2F8F8B`, yellow marker sweep `rgba(255, 213, 79, 0.38)`, and `#F8ECE8` / `#E6C3B9` / `#A3402E` risk boxes.
   - **`Over Footage` (`paletteMode: "over-footage"`, Camera Overlays):** Silky smoked-navy Apple Liquid Glass (`tint="navy-glass"`, `12px` blur, `saturate(165%) brightness(0.66)`, multi-stop curved perimeter bevel ring) with warmer cream typography (`#FFF6E5`, `#FAECD4`, `#F7E8CE`), lifted teal (`#4FB3AE`), lifted coral-red deltas (`#E27358`), solid `#A3402E` badges, and tight `0 1px 2px rgba(8, 14, 22, 0.85)` shadow.
3. **Three-Way Editorial Blend:**
   - **Camera Framing (Money & Macro):** Real desk/room phone shot with natural human presence (30-38% of total runtime), split between quiet **`talking-head-full` anchor breaths (~15% of beats)** and **on-camera overlays (~15-20% `talking-head-with-glass` / `talking-head-punch-in`)**.
   - **Personality (Good Work + GothamChess):** Sharp, dry wit and fast punch-in/sticker reactions on absurd economic or tech promises.
   - **Visual Engine (Newsthink):** Crisp documentary cutaways (62-70% of runtime) holding steady long enough for viewers to read charts, maps, and archival plates.
4. **Silky Smoked-Navy Apple Liquid Glass (`tint="navy-glass"` default):** Over Yuza's talking-head camera footage, `LiquidGlassObject` (`card`, `pill`, `dock`, `toast`, `split-modal`) renders smooth smoked-navy glass (`~0.60-0.66` opacity with curved perimeter bevel ring, top-edge silk highlight, and `1px` specular rim) using composable `primitives.ts` tokens (`enterAction -> inPlaceAction -> exitAction`, e.g., `slide-left -> glow-rim -> fade-blur-out`, `slide-up -> highlight-sweep -> fade-out`, `pop-out -> nudge -> pop-down`).
5. **Full 24-Style Non-Repetitive Rotation:** Cycle organically across all 24 implemented styles with zero consecutive `styleFamily` repeats, synced procedural audio (`studio/public/sfx/*.wav`), and `MusicBed` auto-ducking plus `drop-silence` breaths before major reveals.
6. **Clean Rule Boundary:** Rely strictly on this locked spec and the active `studio/src/` rig. Never import old `Archives/` rules or bans against vintage film textures, newsreel grain, or sticker explainers.

---

## Reading Room Dual-Palette Reference

### A. `Page` Palette (Full-Screen Cutaways)
| Token Role | Hex / Value | Usage |
|---|---|---|
| **Milk Canvas / Secondary Ground** | `#FAF8F3` / `#F2F0EA` | Full-screen cutaway canvases, document cards, table grounds |
| **Border Hairline** | `#E1DED5` | Card rules, table dividers, map borders |
| **Classic Dark Navy / Deep** | `#1C2B3A` / `#0F1923` | Hero bars, highlighted map regions, badges, headlines, body ink, chapter covers |
| **Secondary Teal** | `#2F8F8B` | Secondary route, comparison metric, `+2.3%` positive indicator |
| **Yellow Marker Sweep** | `rgba(255, 213, 79, 0.38)` | Translucent highlighter sweep behind `#1C2B3A` ink |
| **Muted Slate** | `#6B7783` | Secondary captions, footnotes, timestamps, source labels |
| **Brick Red & Blush Risk** | `#A3402E` / `#F8ECE8` / `#E6C3B9` | Risk callouts, critical deltas, 60-75% hero peak focal |

### B. `Over Footage` Palette (Crystal Navy Glass Over Video)
| Token Role | Hex / Value | Usage |
|---|---|---|
| **Smoked-Navy Glass / Well** | `rgba(28, 43, 58, 0.64)`–`rgba(15, 25, 35, 0.60)` / `rgba(15, 25, 35, 0.50)` | Silky optical smoked glass + inner metric well |
| **Specular Rim / Hairline** | `rgba(255, 255, 255, 0.58)` / `rgba(255, 255, 255, 0.16)` | Crisp white glass bevel and inner divider |
| **Warmer Cream Text Hierarchy** | `#FFF6E5` / `#FAECD4` / `#F7E8CE` | Headlines, body copy, and subtitles/eyebrows with tight optical shadow |
| **Ice & Warm Cream Glass Accents** | `#BFD6EA` / `#FAECD4` / `#4FB3AE` | Active borders, warm cream tags, positive/secondary metrics |
| **Glass Risk & Red Chips** | `#E27358` / `#A3402E` / `rgba(163, 64, 46, 0.38)` | Lifted coral-red deltas, solid `#A3402E` chips (`#FFF6E5` text), glass risk wash |

---

## Anti-AI Neatness & Motion Rules

Follow these editorial craft constraints on every script, card, label, and plan:

1. **Human Editorial Labels Only:** Never write fake technical slashes or robotic AI badges (`// SYSTEM AUDIT`, `// V2`, `ACTIVE PROTOCOL`). Use plain editorial labels (`Treasury Table 9`, `PJM Grid · 13 States`, `CBO 2036 Projection`).
2. **Strict Palette Separation:** Give full-screen cutaways clean milk whitespace (`#FAF8F3` / `#F2F0EA`) with `#1C2B3A` ink, and keep footage overlays on crystal smoked-navy glass (`tint="navy-glass"`) with `#FAF6EE` / `#F3EAD9` text.
3. **Softer, Unhurried Motion:** Prefer calm `editorial` easing and gentle primitives (`slide-up`, `slide-left`, `pop-out`, `highlight-sweep`, `elastic-open`, `glow-rim`, `fade-blur-out`). Hard white strobe flashes are banned; investigation transitions settle softly over 4 frames.
4. **Quiet Breathing Shots (`talking-head-full`):** Reserve ~15% of beats for bare `talking-head-full` camera breaths on calm connective setup lines (zero overlays, zero overlay SFX) so viewers reset their eyes and Remotion skips redundant overlay renders.
5. **Valid `primitives.ts` Motion Tokens:** Every `motionAction` string uses `enterAction -> inPlaceAction -> exitAction` tokens validated against `src/motion/primitives.ts` (`100%` token resolution).

---

## Director Blend & Retention Architecture

| Layer | Reference Craft | Practical Implementation in `planner.ts` |
|---|---|---|
| **Cold Open (0-15s)** | Claim vs. Receipt collision | Segment 0 automatically splits on natural clause/word boundaries so the **first visual shift lands cleanly within 2.0s - 4.0s**. |
| **Room Presence** | Money & Macro | Maintain 30-38% talking-head share (~15% `talking-head-full` breaths + ~15-20% `talking-head-with-glass` / `punch-in`). Hard-cap every beat at `<= 12-13s` (~28 words) so unpunctuated monologues never stall past `15s`. |
| **Wit & Relief** | Good Work / GothamChess | Trigger `good-work-punchline` on dry sarcasm using tight punch-ins, `StickerCutout` (`sticker-pop`), `CollageCutout`, or `LiquidGlassObject:toast`. |
| **Evidence & Scale** | Newsthink | Hold `receipt-proof`, `map-geopolitics`, and `history-archive` cutaways long enough to read comfortably, always grounded with `sourceCitation`. |
| **Loop & Payoff** | `channel-audience` / `channel-structure` | Plant `open-loop` teases early, deploy human-scale `claire-ledger` checks mid-video, drop music to `drop-silence` before the turn, and reserve `#a3402e` brick-red focal + `warning-thud` for the 60-75% hero peak. |

---

## Retention Cut-Speed & Pacing Table

| Beat Category | Target Duration | Framing Bias | Music Energy | Primary Visual Purpose |
|---|---|---|---|---|
| `hook` | 2.0 - 4.0s (first shift) | Cutaway -> Light Glass | `pulse` | Fast Claim-vs-Receipt shock in first 15 seconds |
| `good-work-punchline` | 1.5 - 3.0s | `talking-head-punch-in` | `pulse` | Snappy dry-wit reaction (`StickerCutout` / `toast`) |
| `thesis-promise` | 4.0 - 6.5s | `talking-head-full` / `dock` | `calm` | Escape-hatch / chapter roadmap via `dock` or room breath |
| `open-loop` | 3.5 - 6.0s | `talking-head-full` / Glass `pill` | `calm` | Plant unresolved curiosity question |
| `claire-ledger` | 4.5 - 7.5s | `split-screen` / Cutaway | `calm` | Human household math (`StickFigureStage` / `split-modal`) |
| `metaphor-story` | 4.0 - 7.5s | `fullscreen-cutaway` / `talking-head-full` | `calm` | Physical analogies (`IsometricScene` / `WhiteModel3D`) |
| `receipt-proof` | 6.0 - 12.0s | `fullscreen-cutaway` | `calm` | Calm documentary hold on primary-source numbers |
| `history-archive` | 6.0 - 11.0s | `fullscreen-cutaway` | `calm` | Period-authentic historical plate (`Newsreel1920s`) |
| `map-geopolitics` | 6.0 - 10.5s | `fullscreen-cutaway` | `calm` | Spatial D3 map & grid focus (`MapExplainer`) |
| `warning-escalation` | 4.0 - 7.0s | Cutaway / Split | `drop-silence` -> `tense` | Quiet breath before peak; `#a3402e` + `warning-thud` in 60-75% hero zone |
| `takeaway` | 5.0 - 8.5s | `talking-head-full` / `with-glass` | `drop-silence` | Grounded room realization without preachy summary framing |

---

## Anti-Repetition Style Rotation (All 24 Implemented Styles)

### Hard Scheduling Rules
1. **Zero Adjacent Family Repeats:** `beats[i].styleFamily !== beats[i - 1].styleFamily` on every cut.
2. **6-Beat Component Cooldown:** Penalize reusing any `componentHint` within 6 beats and prioritize unvisited styles until all 24 styles rotate through long-form edits.
3. **Hero Peak Reservation:** `VisualInvestigationBoard` (`#a3402e` brick-red decisive pointer) and `warning-thud` SFX fire exclusively in the 60-75% hero peak window (minimum 20s cooldown), immediately preceded by a `drop-silence` breath.
4. **Source Audit Rule:** Every `receipt-proof` beat requires a populated `sourceCitation`; `validateDirectorPlan` flags any missing citation or static gap exceeding 18 seconds.

### Style Engine Catalog (5 Families, 24 Styles)

| Family (`StyleEngineFamily`) | Styles (`componentHint`) | Default Framing | Signature SFX |
|---|---|---|---|
| `liquid-glass` (3) | `LiquidGlassObject:card`, `LiquidGlassObject:dock`, `LiquidGlassObject:toast` *(also drives `pill` & `split-modal` presets; `tint="light"` default)* | `talking-head-with-glass` / `punch-in` | `glass-enter`, `glass-dock`, `alert-ping` |
| `doc-broadcast` (8) | `NewsPackageLowerThird`, `CaptionNewsCard`, `VisualInvestigationBoard`, `ArchiveLightTable`, `LiveCountdownSplit`, `TelestratorOverlay`, `KinoMontageStrip`, `CitySymphonyFrame` | `fullscreen-cutaway` / `split-screen` | `paper-slide`, `flash-cut`, `telestrator-draw`, `data-tick` |
| `vintage-editorial` (5) | `Newsreel1920s`, `SilentFilmCard`, `CollageCutout`, `SpyTitleSequence`, `StainedGlassFrame` | `fullscreen-cutaway` / `split-screen` | `newsreel-click`, `chapter-chime`, `paper-flip-fast` |
| `diagram-metaphor` (4) | `StickerCutout`, `StickFigureStage`, `InstructionManualCard`, `IsometricScene` | `fullscreen-cutaway` / `punch-in` | `sticker-pop`, `paper-slide`, `data-tick` |
| `data-maps-3d` (4) | `MapExplainer`, `DataPhysicalCard`, `WhiteModel3D`, `BlobSimulation` | `fullscreen-cutaway` | `map-whoosh`, `data-tick`, `riser-subtle`, `ambient-tension-drone` |

---

## End-to-End Production CLI Workflow

Run every step from `studio/` (paths relative to `D:\youtube channel 1\studio`):

```powershell
# 1. Normalize A-roll (CFR 30fps, optional LUT + silence trim, -14 LUFS)
node scripts/prep-aroll.mjs input/raw-aroll.mp4 --out out/aroll-prepped.mp4 --lut editorial-warm --cut-silence --fps 30

# 2. Extract word-level Whisper timestamps (words.json + captions.srt)
..\tools\.venv\Scripts\python.exe ..\tools\transcribe.py out/aroll-prepped.mp4 --out-dir out

# 3. Generate & audit the Audience-Engineering Director Plan (works on words.json OR script.md)
node scripts/plan-edit.mjs out/words.json --out out/director-plan.json --title "The Reading Room" --fps 30

# 4. Render transparent ProRes 4444 overlays for DaVinci Resolve / FCP composite
npx remotion render TreasuryTable9-Overlay out/overlay.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png

# 5. Export FCPXML timeline markers & overlay tracks for NLE assembly
node scripts/export-fcpxml.mjs out/director-plan.json --out out/timeline.fcpxml
```

### Quick Script Audit (`150 WPM` Estimate Before Shooting)
Before filming A-roll, run `plan-edit.mjs` directly against a Markdown or plain-text script to check runtime, pacing, talking-head balance, and missing `receipt-proof` citations:

```powershell
node scripts/plan-edit.mjs "..\scripts\1\19.4.md" --out out/sample-director-plan.json --title "The Reading Room — When AI Wipes Out Paychecks" --fps 30
```

Verify the printed audit targets:
- **First Visual Shift:** `2.0s - 4.0s` (hook beat 1)
- **Avg Shot Duration:** `4.5s - 7.5s` (hard beat cap `<= 13s`, zero static gaps `> 18s`)
- **Style Diversity:** `>= 85/100` (zero consecutive `styleFamily` warnings, 100% valid `motionAction` tokens)
- **Talking Head Share:** `30% - 38%` (~15% `talking-head-full` breaths + ~15-20% glass/punch-in)
- **Hero Peak Position:** `60% - 75%`
- **Warnings:** `0`
