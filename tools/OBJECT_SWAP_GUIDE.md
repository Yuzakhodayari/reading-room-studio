# Background Object Swap Guide (GTX 1650 4 GB VRAM)

Swapping a background prop (such as a kitchen fridge) for a walnut bookshelf can wreck A-roll if a generative video model alters the speaker's face. Local video-inpainting weights also stall or run out of memory on a 4 GB GTX 1650 at 1080p.

Pick the workflow below that matches how the shot was filmed.

---

## Workflow A: Locked-Off Tripod Shot + Automatic Person Mask (Recommended for Main A-Roll)

When the camera sits on a tripod, you only need AI on a single still frame. Editing one clean plate via `gemini-nano-banana-2.1` and running local CPU person segmentation across the full video keeps Yuza's real face, skin texture, hair, and mouth 100% sharp—even across a 15-minute video.

### 1. Extract the sharpest frame

```powershell
D:\youtube channel 1\tools\.venv\Scripts\python.exe D:\youtube channel 1\tools\room_object_swap.py extract-plate raw_aroll.mp4 --out plate_raw.png
```

`extract-plate` scans evenly spaced frames with a Laplacian sharpness metric, avoids clipped frames, and writes a lossless PNG at full native resolution.

### 2. Swap the background object in the clean plate (`gemini-nano-banana-2.1`)

Set `GEMINI_API_KEY` from your Google AI Studio account and run `gemini-plate-edit`:

```powershell
$env:GEMINI_API_KEY="your-key-here"
D:\youtube channel 1\tools\.venv\Scripts\python.exe D:\youtube channel 1\tools\room_object_swap.py gemini-plate-edit plate_raw.png --prompt "Replace the fridge on the right with a warm walnut wooden bookshelf filled with books. Keep the lighting and room identical." --out room_swapped.png
```

- Supports `--model gemini-nano-banana-2.1` (default) or `--model gemini-3-pro-image`.
- Automatically matches the input plate's aspect ratio and resamples the returned plate to the exact pixel dimensions of `plate_raw.png`.
- Pass `--dry-run` first to inspect the request parameters without calling the API.

### 3. Generate automatic person mask & composite in one pass

```powershell
D:\youtube channel 1\tools\.venv\Scripts\python.exe D:\youtube channel 1\tools\room_object_swap.py auto-person-mask raw_aroll.mp4 --composite-plate room_swapped.png --swap-box 0.55,0.0,0.45,1.0 --out aroll_bookshelf.mp4
```

What `auto-person-mask` does:
- Runs MediaPipe Selfie Segmentation (`selfie_segmenter.tflite`, ~244 KB, CPU-fast) on every frame with temporal EMA smoothing (`--temporal-smooth 0.65`) and Gaussian edge feathering (`--feather 5.0`) to write `<stem>_person_mask.mp4`.
- Optional `--swap-box x,y,w,h` restricts the swapped region (e.g., `0.55,0.0,0.45,1.0` for the right half of the frame where the fridge sits) so pixels outside that box remain 100% untouched from `raw_aroll.mp4` while Yuza's hand or shoulder can still cross cleanly in front of the new bookshelf.
- With `--composite-plate room_swapped.png`, FFmpeg composites Yuza's real video over `room_swapped.png` with original audio copied losslessly.
- Omit `--composite-plate` if you prefer importing `<stem>_person_mask.mp4` and `room_swapped.png` into DaVinci Resolve as a track matte.

#### Static Mask Alternative (No moving foreground overlap)

If Yuza never crosses in front of the fridge, you can also paint a grayscale `mask.png` (white over the fridge, black elsewhere) and run:

```powershell
D:\youtube channel 1\tools\.venv\Scripts\python.exe D:\youtube channel 1\tools\room_object_swap.py composite-plate raw_aroll.mp4 --plate room_swapped.png --mask mask.png --feather 8 --out aroll_bookshelf.mp4
```

---

## Workflow B: Handheld or Moving Camera (3–15 s Clips via Gemini Omni 1.2 Flash)

If the camera pans or shifts, a static plate will slide against the wall. Use `gemini-omni-1.2-flash` via the `omni-edit` subcommand on short 3–15 s B-roll or intro clips.

### 1. Preview the exact job and prepped clip commands (dry run)

```powershell
D:\youtube channel 1\tools\.venv\Scripts\python.exe D:\youtube channel 1\tools\room_object_swap.py omni-edit moving_clip.mp4 --ref-image room_swapped.png --start 0 --duration 10 --resolution 1080p
```

This writes a `.omni-job.json` manifest and prints two commands:
- An `ffmpeg` trim/scale step capping the source clip to 3–15 s (required by Gemini Omni 1.2 Flash).
- A `generate_video.py` invocation passing `room_swapped.png` as a visual reference image (`--image`) alongside the source clip (`--video`).

### 2. Execute the edit

Set `GEMINI_API_KEY` and re-run with `--run`:

```powershell
$env:GEMINI_API_KEY="your-key-here"
D:\youtube channel 1\tools\.venv\Scripts\python.exe D:\youtube channel 1\tools\room_object_swap.py omni-edit moving_clip.mp4 --ref-image room_swapped.png --start 0 --duration 10 --resolution 1080p --run
```

### Practical constraints for Gemini Omni 1.2 Flash
- **Clip cap**: Source edits max out at **15 seconds** per clip (`10s` default; minimum `3s`). Split long moving shots into `<= 15s` chunks before editing.
- **Keep real audio**: Omit `--strip-audio` to retain the original voice track instead of letting the model regenerate sound.
- **Regional availability**: Uploading source videos for editing, extension, or reference is unavailable in the **EEA, Switzerland, the United Kingdom, and select US states**. If a run completes rapidly with zero output video, regional gating is the likely cause.
- **Face protection**: Whenever the speaker talks directly to camera on a locked tripod, prefer **Workflow A** (`extract-plate` + `gemini-plate-edit` + `auto-person-mask`). Save **Workflow B** for intro walk-ins or handheld camera-pan shots where static masking breaks perspective.
