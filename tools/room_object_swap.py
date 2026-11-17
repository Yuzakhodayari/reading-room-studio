#!/usr/bin/env python3
"""
Room Object Swap toolkit for low-VRAM setups (e.g., GTX 1650 4GB).

Subcommands:
  1. extract-plate     : Extracts the sharpest frame from A-roll as a lossless PNG clean plate.
  2. gemini-plate-edit : Edits an extracted clean plate PNG via Gemini Nano Banana 2.1 (or Gemini 3 Pro Image).
  3. auto-person-mask  : Generates a temporally smoothed, feathered person matte MP4 across full-length
                         tripod A-roll using MediaPipe Selfie Segmentation (or diff fallback), and
                         optionally composites foreground over an edited plate in one pass (--composite-plate).
  4. composite-plate   : Composites an edited background plate onto a locked-off shot via a static mask PNG.
  5. omni-edit         : Builds (and runs with --run) the Gemini Omni 1.2 Flash video-edit workflow
                         for short 3-15s moving-camera clips (alias: omni-command).
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import os
import shlex
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path
from typing import Any

import numpy as np
from scipy.ndimage import laplace

TOOLS_DIR = Path(__file__).resolve().parent
DEFAULT_SEGMENTER_MODEL = TOOLS_DIR / "models" / "selfie_segmenter.tflite"
SELFIE_SEGMENTER_URL = (
    "https://storage.googleapis.com/mediapipe-models/image_segmenter/"
    "selfie_segmenter/float16/latest/selfie_segmenter.tflite"
)

SKILL_GENERATE_VIDEO = Path(
    r"C:\Users\youza\.gemini\config\plugins\gemini-api\skills\gemini-omni-flash-api\scripts\video\generate_video.py"
)

DEFAULT_PLATE_PROMPT = (
    "Replace the fridge on the right with a warm walnut wooden bookshelf filled with "
    "hardcover books. Keep the lighting, shadows, wall color, and rest of the room identical."
)

DEFAULT_OMNI_PROMPT = (
    "Replace the refrigerator in the background with a warm walnut wooden bookshelf "
    "neatly filled with hardcover books. Keep the speaker, face, hands, desk, lighting, "
    "and camera movement identical. Keep everything else the same."
)

SUPPORTED_IMAGE_ASPECT_RATIOS: list[tuple[str, float]] = [
    ("1:1", 1.0),
    ("4:3", 4.0 / 3.0),
    ("3:4", 3.0 / 4.0),
    ("16:9", 16.0 / 9.0),
    ("9:16", 9.0 / 16.0),
    ("3:2", 3.0 / 2.0),
    ("2:3", 2.0 / 3.0),
    ("5:4", 5.0 / 4.0),
    ("4:5", 4.0 / 5.0),
    ("21:9", 21.0 / 9.0),
]


def find_media_bin(name: str) -> str:
    """Locate ffmpeg or ffprobe on PATH or inside WinGet package folders."""
    on_path = shutil.which(name)
    if on_path:
        return on_path

    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        winget_root = Path(local_app_data) / "Microsoft" / "WinGet" / "Packages"
        if winget_root.exists():
            exe_name = f"{name}.exe" if os.name == "nt" else name
            for exe in winget_root.rglob(exe_name):
                return str(exe)

    raise FileNotFoundError(
        f"Could not find '{name}'. Install via WinGet (Gyan.FFmpeg) or add it to PATH."
    )


def probe_video(ffprobe_bin: str, video_path: Path) -> dict[str, Any]:
    """Read video stream resolution, FPS, and total duration using ffprobe."""
    cmd = [
        ffprobe_bin,
        "-v",
        "error",
        "-show_format",
        "-show_streams",
        "-of",
        "json",
        str(video_path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(proc.stdout)
    v_stream = next(
        (s for s in data.get("streams", []) if s.get("codec_type") == "video"), None
    )
    if not v_stream:
        raise ValueError(f"No video stream found in {video_path}")

    a_stream = next(
        (s for s in data.get("streams", []) if s.get("codec_type") == "audio"), None
    )
    duration = float(
        data.get("format", {}).get("duration") or v_stream.get("duration") or 0.0
    )
    r_fps = v_stream.get("r_frame_rate", "30/1")
    num, _, den = r_fps.partition("/")
    fps = float(num) / float(den) if den and float(den) != 0 else 30.0
    nb_frames_raw = v_stream.get("nb_frames")
    nb_frames = int(nb_frames_raw) if nb_frames_raw and str(nb_frames_raw).isdigit() else 0

    return {
        "width": int(v_stream["width"]),
        "height": int(v_stream["height"]),
        "fps": fps,
        "durationSec": duration,
        "nbFrames": nb_frames,
        "hasAudio": a_stream is not None,
    }


def score_frame_sharpness(gray: np.ndarray) -> float:
    """Compute Laplacian variance with mild highlight/shadow clipping penalty."""
    f = gray.astype(np.float32) / 255.0
    lap_var = float(np.var(laplace(f)))
    clipped = float(np.mean((f < 0.02) | (f > 0.98)))
    return lap_var * (1.0 - 0.5 * clipped)


def require_gemini_api_key() -> str:
    """Return GEMINI_API_KEY or raise a clear setup message."""
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY environment variable is not set.\n"
            "Set your Google AI Studio key before running Gemini edits:\n"
            '  PowerShell: $env:GEMINI_API_KEY="your-key-here"\n'
            '  bash:       export GEMINI_API_KEY="your-key-here"'
        )
    return key


def pick_closest_aspect_ratio(width: int, height: int) -> str:
    """Map pixel dimensions to the nearest supported Gemini image aspect ratio."""
    ratio = width / max(1, height)
    best_name, _ = min(
        SUPPORTED_IMAGE_ASPECT_RATIOS, key=lambda item: abs(item[1] - ratio)
    )
    return best_name


def detect_image_mime(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        return "image/jpeg"
    if suffix == ".webp":
        return "image/webp"
    return "image/png"


def cmd_extract_plate(args: argparse.Namespace) -> None:
    video_path = Path(args.input_video).resolve()
    if not video_path.exists():
        raise FileNotFoundError(f"Input video not found: {video_path}")

    ffmpeg_bin = find_media_bin("ffmpeg")
    ffprobe_bin = find_media_bin("ffprobe")
    meta = probe_video(ffprobe_bin, video_path)

    total_dur = meta["durationSec"]
    start_sec = max(0.0, float(args.start))
    if start_sec >= total_dur > 0:
        raise ValueError(f"--start ({start_sec}s) exceeds video duration ({total_dur:.2f}s).")

    span_sec = (
        min(float(args.duration), total_dur - start_sec)
        if args.duration is not None
        else max(0.1, total_dur - start_sec)
    )
    samples = max(1, int(args.samples))
    sample_fps = samples / max(span_sec, 0.1)

    scale_w = min(640, meta["width"])
    scale_h = int(round((meta["height"] * scale_w / meta["width"]) / 2.0) * 2)
    scale_h = max(2, scale_h)

    raw_cmd = [
        ffmpeg_bin,
        "-v",
        "error",
        "-ss",
        f"{start_sec:.3f}",
        "-t",
        f"{span_sec:.3f}",
        "-i",
        str(video_path),
        "-vf",
        f"fps={sample_fps:.6f},scale={scale_w}:{scale_h}:flags=bilinear,format=gray",
        "-frames:v",
        str(samples),
        "-f",
        "rawvideo",
        "-pix_fmt",
        "gray",
        "-",
    ]
    proc = subprocess.run(raw_cmd, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg frame scan failed: {proc.stderr.decode('utf-8', 'ignore')}")

    frame_bytes = scale_w * scale_h
    buf = proc.stdout
    num_frames = len(buf) // frame_bytes
    if num_frames == 0:
        raise RuntimeError("No frames decoded during sharpness scan.")

    best_idx = 0
    best_score = -1.0
    for idx in range(num_frames):
        chunk = buf[idx * frame_bytes : (idx + 1) * frame_bytes]
        gray = np.frombuffer(chunk, dtype=np.uint8).reshape((scale_h, scale_w))
        score = score_frame_sharpness(gray)
        if score > best_score:
            best_score = score
            best_idx = idx

    best_ts = start_sec + (best_idx + 0.5) / sample_fps
    best_ts = min(max(0.0, best_ts), max(0.0, total_dur - 0.04))

    out_png = (
        Path(args.out).resolve()
        if args.out
        else video_path.with_name(f"{video_path.stem}_clean_plate.png")
    )
    out_png.parent.mkdir(parents=True, exist_ok=True)

    pre_seek = max(0.0, best_ts - 0.5)
    post_seek = best_ts - pre_seek
    extract_cmd = [
        ffmpeg_bin,
        "-y",
        "-v",
        "error",
        "-ss",
        f"{pre_seek:.3f}",
        "-i",
        str(video_path),
        "-ss",
        f"{post_seek:.3f}",
        "-frames:v",
        "1",
        "-c:v",
        "png",
        str(out_png),
    ]
    subprocess.run(extract_cmd, check=True)

    print(f"Clean plate extracted: {out_png}")
    print(
        f"  Resolution : {meta['width']}x{meta['height']}\n"
        f"  Timestamp  : {best_ts:.3f}s (scanned {num_frames} frames, sharpness={best_score:.6f})\n"
        f"  Next step  : Run 'room_object_swap.py gemini-plate-edit {out_png.name}' to swap the background prop,\n"
        f"               then run 'room_object_swap.py auto-person-mask {video_path.name} --composite-plate <swapped.png>'\n"
        f"               so your face and foreground stay 100% sharp over the edited background."
    )


def cmd_gemini_plate_edit(args: argparse.Namespace) -> None:
    from PIL import Image

    plate_path = Path(args.input_plate).resolve()
    if not plate_path.exists():
        raise FileNotFoundError(f"Input clean plate not found: {plate_path}")

    with Image.open(plate_path) as im:
        orig_w, orig_h = im.size

    aspect_ratio = args.aspect_ratio or pick_closest_aspect_ratio(orig_w, orig_h)
    prompt = (args.prompt or DEFAULT_PLATE_PROMPT).strip()
    out_png = (
        Path(args.out).resolve()
        if args.out
        else plate_path.with_name(f"{plate_path.stem}_swapped.png")
    )
    out_png.parent.mkdir(parents=True, exist_ok=True)

    ref_paths = [Path(p).resolve() for p in (args.ref_image or [])]
    for rp in ref_paths:
        if not rp.exists():
            raise FileNotFoundError(f"Reference image not found: {rp}")

    if args.dry_run:
        plan = {
            "model": args.model,
            "inputPlate": str(plate_path),
            "plateResolution": f"{orig_w}x{orig_h}",
            "aspectRatio": aspect_ratio,
            "imageSize": args.image_size,
            "referenceImages": [str(rp) for rp in ref_paths],
            "prompt": prompt,
            "outputPlate": str(out_png),
            "matchInputDimensions": not args.no_match_size,
        }
        print("=== Gemini Plate Edit (Dry Run) ===")
        print(json.dumps(plan, indent=2))
        return

    require_gemini_api_key()
    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise RuntimeError(
            "google-genai SDK is missing in this Python environment. "
            "Install with: uv pip install --python tools/.venv/Scripts/python.exe -U google-genai"
        ) from exc

    input_parts: list[dict[str, Any]] = [
        {
            "type": "image",
            "data": base64.b64encode(plate_path.read_bytes()).decode("ascii"),
            "mime_type": detect_image_mime(plate_path),
        }
    ]
    for rp in ref_paths:
        input_parts.append(
            {
                "type": "image",
                "data": base64.b64encode(rp.read_bytes()).decode("ascii"),
                "mime_type": detect_image_mime(rp),
            }
        )
    input_parts.append({"type": "text", "text": prompt})

    client = genai.Client(http_options=types.HttpOptions(timeout=300 * 1000))
    print(f"Editing clean plate via {args.model} ({orig_w}x{orig_h}, ratio={aspect_ratio}, size={args.image_size})...")
    interaction = client.interactions.create(
        model=args.model,
        input=input_parts,
        response_format={
            "type": "image",
            "aspect_ratio": aspect_ratio,
            "image_size": args.image_size,
            "delivery": "inline",
        },
    )

    if getattr(interaction, "output_text", None):
        print(f"Model note: {interaction.output_text}")

    out_img = getattr(interaction, "output_image", None)
    if out_img is None:
        raise RuntimeError("Gemini interaction returned no output_image.")

    raw_bytes: bytes | None = None
    data_val = getattr(out_img, "data", None)
    if data_val:
        if isinstance(data_val, (bytes, bytearray)):
            raw_bytes = bytes(data_val)
        else:
            raw_bytes = base64.b64decode(data_val)
    elif getattr(out_img, "uri", None):
        raw_bytes = client.files.download(file=out_img.uri)

    if not raw_bytes:
        raise RuntimeError("Gemini output_image contained neither inline data nor a downloadable URI.")

    with Image.open(io.BytesIO(raw_bytes)) as generated:
        rgb = generated.convert("RGB")
        if not args.no_match_size and rgb.size != (orig_w, orig_h):
            rgb = rgb.resize((orig_w, orig_h), Image.Resampling.LANCZOS)
        rgb.save(out_png, format="PNG")

    print(f"Edited clean plate saved: {out_png} ({orig_w}x{orig_h} PNG)")


def ensure_segmenter_model(model_path: Path) -> Path:
    """Locate or download MediaPipe's lightweight selfie_segmenter.tflite (~244 KB)."""
    if model_path.exists() and model_path.stat().st_size > 10_000:
        return model_path
    model_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading MediaPipe selfie segmenter model (~244 KB) -> {model_path}...")
    urllib.request.urlretrieve(SELFIE_SEGMENTER_URL, model_path)
    return model_path


def parse_swap_box(box_str: str | None, width: int, height: int) -> tuple[int, int, int, int] | None:
    """Parse x,y,w,h (normalized <=1.0 or pixels) into clamped pixel rectangle (x0, y0, x1, y1)."""
    if not box_str:
        return None
    parts = [float(p.strip()) for p in box_str.split(",")]
    if len(parts) != 4:
        raise ValueError("--swap-box must have 4 comma-separated numbers: x,y,w,h")
    x, y, w, h = parts
    is_norm = all(0.0 <= v <= 1.0 for v in parts)
    if is_norm:
        x0 = int(round(x * width))
        y0 = int(round(y * height))
        x1 = int(round((x + w) * width))
        y1 = int(round((y + h) * height))
    else:
        x0 = int(round(x))
        y0 = int(round(y))
        x1 = int(round(x + w))
        y1 = int(round(y + h))
    x0 = max(0, min(width - 1, x0))
    y0 = max(0, min(height - 1, y0))
    x1 = max(x0 + 1, min(width, x1))
    y1 = max(y0 + 1, min(height, y1))
    return (x0, y0, x1, y1)


def soft_sigmoid_mask(prob: np.ndarray, threshold: float, softness: float) -> np.ndarray:
    """Map [0, 1] probability confidence to smooth [0, 1] alpha mask."""
    if softness <= 1e-4:
        return (prob >= threshold).astype(np.float32)
    low = max(0.0, threshold - softness)
    high = min(1.0, threshold + softness)
    if high <= low + 1e-4:
        return (prob >= threshold).astype(np.float32)
    t = np.clip((prob - low) / (high - low), 0.0, 1.0)
    # Smoothstep curve for clean anti-aliased edge falloff
    return (t * t * (3.0 - 2.0 * t)).astype(np.float32)


def cmd_auto_person_mask(args: argparse.Namespace) -> None:
    import cv2

    video_path = Path(args.input_video).resolve()
    if not video_path.exists():
        raise FileNotFoundError(f"Input video not found: {video_path}")

    ffmpeg_bin = find_media_bin("ffmpeg")
    ffprobe_bin = find_media_bin("ffprobe")
    meta = probe_video(ffprobe_bin, video_path)
    w, h = meta["width"], meta["height"]
    fps = meta["fps"]

    out_mask = (
        Path(args.out_mask).resolve()
        if args.out_mask
        else video_path.with_name(f"{video_path.stem}_person_mask.mp4")
    )
    out_mask.parent.mkdir(parents=True, exist_ok=True)

    plate_path: Path | None = None
    if args.composite_plate:
        plate_path = Path(args.composite_plate).resolve()
        if not plate_path.exists():
            raise FileNotFoundError(f"Composite plate PNG not found: {plate_path}")

    ref_bg_small: np.ndarray | None = None
    if args.ref_plate:
        ref_path = Path(args.ref_plate).resolve()
        if not ref_path.exists():
            raise FileNotFoundError(f"Reference plate not found: {ref_path}")
        ref_img = cv2.imread(str(ref_path), cv2.IMREAD_COLOR)
        if ref_img is None:
            raise RuntimeError(f"Failed to read reference plate: {ref_path}")
    else:
        ref_img = None

    backend = args.backend
    segmenter = None
    mp = None

    if backend in {"auto", "mediapipe"}:
        try:
            import mediapipe as mp_mod
            from mediapipe.tasks import python as mp_python
            from mediapipe.tasks.python import vision

            model_path = ensure_segmenter_model(Path(args.model_path).resolve())
            opts = vision.ImageSegmenterOptions(
                base_options=mp_python.BaseOptions(model_asset_path=str(model_path)),
                running_mode=vision.RunningMode.VIDEO,
                output_confidence_masks=True,
                output_category_mask=False,
            )
            segmenter = vision.ImageSegmenter.create_from_options(opts)
            mp = mp_mod
            backend = "mediapipe"
        except Exception as exc:
            if backend == "mediapipe":
                raise RuntimeError(f"MediaPipe segmenter initialization failed: {exc}") from exc
            print(f"[warn] MediaPipe unavailable ({exc}); falling back to OpenCV diff segmenter.", file=sys.stderr)
            backend = "diff"

    swap_rect = parse_swap_box(args.swap_box, w, h)
    seg_w = min(w, max(128, int(args.seg_width)))
    seg_h = max(64, int(round((h * seg_w / max(1, w)) / 2.0) * 2))

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Failed to open video stream via OpenCV: {video_path}")

    if backend == "diff" and ref_img is not None:
        ref_bg_small = cv2.resize(ref_img, (seg_w, seg_h), interpolation=cv2.INTER_AREA).astype(np.float32)

    # Estimate static background via temporal median of first few frames if diff mode has no ref_img
    if backend == "diff" and ref_bg_small is None:
        sample_frames: list[np.ndarray] = []
        total_est = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 30
        idxs = np.linspace(0, max(0, total_est - 1), num=min(9, max(1, total_est)), dtype=int)
        for idx in idxs:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
            ok, fr = cap.read()
            if ok:
                sample_frames.append(cv2.resize(fr, (seg_w, seg_h), interpolation=cv2.INTER_AREA))
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        if sample_frames:
            ref_bg_small = np.median(np.stack(sample_frames, axis=0), axis=0).astype(np.float32)

    encode_cmd = [
        ffmpeg_bin,
        "-y",
        "-v",
        "warning",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "gray",
        "-s",
        f"{w}x{h}",
        "-r",
        f"{fps:.6f}",
        "-i",
        "-",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "16",
        "-pix_fmt",
        "yuv420p",
        str(out_mask),
    ]
    ff_proc = subprocess.Popen(encode_cmd, stdin=subprocess.PIPE)
    assert ff_proc.stdin is not None

    ema_alpha = max(0.05, min(1.0, 1.0 - float(args.temporal_smooth)))
    prev_mask_small: np.ndarray | None = None
    morph_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    dilate_px = max(0, int(args.dilate))
    dilate_kernel = (
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilate_px * 2 + 1, dilate_px * 2 + 1))
        if dilate_px > 0
        else None
    )
    feather_sigma = max(0.0, float(args.feather))

    frame_idx = 0
    print(f"Generating person matte ({w}x{h} @ {fps:.2f}fps, backend={backend}, infer={seg_w}x{seg_h})...")
    try:
        while True:
            ok, bgr = cap.read()
            if not ok:
                break

            small_bgr = cv2.resize(bgr, (seg_w, seg_h), interpolation=cv2.INTER_AREA)

            if backend == "mediapipe" and segmenter is not None and mp is not None:
                small_rgb = cv2.cvtColor(small_bgr, cv2.COLOR_BGR2RGB)
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=small_rgb)
                ts_ms = int(round((frame_idx * 1000.0) / max(1.0, fps)))
                res = segmenter.segment_for_video(mp_img, ts_ms)
                conf = res.confidence_masks[0].numpy_view().squeeze().astype(np.float32)
                raw_mask = soft_sigmoid_mask(conf, args.threshold, args.softness)
            else:
                assert ref_bg_small is not None
                diff = np.linalg.norm(small_bgr.astype(np.float32) - ref_bg_small, axis=2)
                raw_mask = np.clip((diff - 18.0) / 28.0, 0.0, 1.0).astype(np.float32)

            # Morphological cleanup + gentle edge safety dilation
            binary_u8 = (raw_mask * 255.0).astype(np.uint8)
            binary_u8 = cv2.morphologyEx(binary_u8, cv2.MORPH_CLOSE, morph_kernel)
            if dilate_kernel is not None:
                binary_u8 = cv2.dilate(binary_u8, dilate_kernel, iterations=1)
            cleaned = np.maximum(raw_mask, binary_u8.astype(np.float32) / 255.0 * 0.85)

            # Temporal EMA smoothing to remove edge chatter
            if prev_mask_small is None:
                smoothed = cleaned
            else:
                smoothed = ema_alpha * cleaned + (1.0 - ema_alpha) * prev_mask_small
            prev_mask_small = smoothed

            full_mask = cv2.resize(smoothed, (w, h), interpolation=cv2.INTER_LINEAR)
            if feather_sigma > 0.0:
                full_mask = cv2.GaussianBlur(full_mask, (0, 0), sigmaX=feather_sigma, sigmaY=feather_sigma)

            # Lock pixels outside --swap-box to 1.0 (100% foreground preserved)
            if swap_rect is not None:
                x0, y0, x1, y1 = swap_rect
                box_protected = np.ones((h, w), dtype=np.float32)
                box_protected[y0:y1, x0:x1] = full_mask[y0:y1, x0:x1]
                full_mask = box_protected

            matte_u8 = np.clip(np.round(full_mask * 255.0), 0, 255).astype(np.uint8)
            if args.invert:
                matte_u8 = 255 - matte_u8

            ff_proc.stdin.write(matte_u8.tobytes())
            frame_idx += 1
    finally:
        cap.release()
        if segmenter is not None:
            segmenter.close()
        if ff_proc.stdin:
            ff_proc.stdin.close()
        ret = ff_proc.wait()
        if ret != 0:
            raise RuntimeError(f"ffmpeg matte encoding failed with exit code {ret}")

    print(f"Person matte saved ({frame_idx} frames): {out_mask}")

    if plate_path is None:
        return

    out_mp4 = (
        Path(args.out).resolve()
        if args.out
        else video_path.with_name(f"{video_path.stem}_swapped.mp4")
    )
    out_mp4.parent.mkdir(parents=True, exist_ok=True)

    matte_neg = ",negate" if args.invert else ""
    filter_complex = (
        f"[0:v]format=rgba[fg_rgb];"
        f"[2:v]scale={w}:{h}:flags=bilinear,format=gray{matte_neg}[matte];"
        f"[fg_rgb][matte]alphamerge[fg];"
        f"[1:v]scale={w}:{h}:flags=lanczos,format=rgba[bg];"
        f"[bg][fg]overlay=0:0:eof_action=pass:shortest=1,format=yuv420p[vout]"
    )

    comp_cmd = [
        ffmpeg_bin,
        "-y",
        "-v",
        "warning",
        "-i",
        str(video_path),
        "-framerate",
        f"{fps:.6f}",
        "-loop",
        "1",
        "-i",
        str(plate_path),
        "-i",
        str(out_mask),
        "-filter_complex",
        filter_complex,
        "-map",
        "[vout]",
        *(["-map", "0:a", "-c:a", "copy"] if meta["hasAudio"] else ["-an"]),
        "-r",
        f"{fps:.6f}",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        "-shortest",
        str(out_mp4),
    ]
    print(f"Compositing real foreground over edited plate -> {out_mp4}...")
    subprocess.run(comp_cmd, check=True)
    print(f"Composited object swap complete -> {out_mp4}")


def cmd_composite_plate(args: argparse.Namespace) -> None:
    video_path = Path(args.input_video).resolve()
    plate_path = Path(args.plate).resolve()
    mask_path = Path(args.mask).resolve()
    for p, label in ((video_path, "input video"), (plate_path, "edited plate"), (mask_path, "mask PNG")):
        if not p.exists():
            raise FileNotFoundError(f"Missing {label}: {p}")

    ffmpeg_bin = find_media_bin("ffmpeg")
    ffprobe_bin = find_media_bin("ffprobe")
    meta = probe_video(ffprobe_bin, video_path)

    out_mp4 = (
        Path(args.out).resolve()
        if args.out
        else video_path.with_name(f"{video_path.stem}_swapped.mp4")
    )
    out_mp4.parent.mkdir(parents=True, exist_ok=True)

    sigma = max(0.0, float(args.feather))
    w, h = meta["width"], meta["height"]
    blur_op = f",gblur=sigma={sigma:.2f}" if sigma > 0 else ""

    filter_complex = (
        f"[1:v]scale={w}:{h}:flags=lanczos,format=rgba[plate];"
        f"[2:v]scale={w}:{h}:flags=bilinear,format=gray{blur_op}[mask];"
        f"[plate][mask]alphamerge[patch];"
        f"[0:v][patch]overlay=0:0:shortest=1,format=yuv420p[vout]"
    )

    cmd = [
        ffmpeg_bin,
        "-y",
        "-v",
        "warning",
        "-i",
        str(video_path),
        "-framerate",
        f"{meta['fps']:.6f}",
        "-loop",
        "1",
        "-i",
        str(plate_path),
        "-framerate",
        f"{meta['fps']:.6f}",
        "-loop",
        "1",
        "-i",
        str(mask_path),
        "-filter_complex",
        filter_complex,
        "-map",
        "[vout]",
        *(["-map", "0:a", "-c:a", "copy"] if meta["hasAudio"] else ["-an"]),
        "-r",
        f"{meta['fps']:.6f}",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        "-shortest",
        str(out_mp4),
    ]
    subprocess.run(cmd, check=True)
    print(f"Composited static object swap -> {out_mp4}")


def cmd_omni_edit(args: argparse.Namespace) -> None:
    video_path = Path(args.input_video).resolve()
    if not video_path.exists():
        raise FileNotFoundError(f"Input video not found: {video_path}")

    duration = int(args.duration)
    if duration < 3 or duration > 15:
        raise ValueError(
            f"Gemini Omni 1.2 Flash video editing supports 3 to 15 seconds (got {duration}s)."
        )

    ffmpeg_bin = find_media_bin("ffmpeg")
    ffprobe_bin = find_media_bin("ffprobe")
    meta = probe_video(ffprobe_bin, video_path)

    start_sec = max(0.0, float(args.start))
    if meta["durationSec"] > 0 and start_sec >= meta["durationSec"]:
        raise ValueError(
            f"--start ({start_sec}s) exceeds input duration ({meta['durationSec']:.2f}s)."
        )

    out_mp4 = (
        Path(args.out).resolve()
        if args.out
        else video_path.with_name(f"{video_path.stem}_omni_swapped.mp4")
    )
    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    prepped_clip = out_mp4.with_name(f"{video_path.stem}_omni_src_{duration}s.mp4")

    max_w = 1920 if args.resolution in {"1080p", "4k"} else 1280
    scale_filter = f"scale='min({max_w},iw)':-2:flags=lanczos,format=yuv420p"

    prep_cmd = [
        ffmpeg_bin,
        "-y",
        "-v",
        "warning",
        "-ss",
        f"{start_sec:.3f}",
        "-t",
        str(duration),
        "-i",
        str(video_path),
        "-vf",
        scale_filter,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "18",
        *(["-an"] if (args.strip_audio or not meta["hasAudio"]) else ["-c:a", "aac", "-b:a", "192k"]),
        str(prepped_clip),
    ]

    prompt = (args.prompt or DEFAULT_OMNI_PROMPT).strip()
    if "keep everything else the same" not in prompt.lower():
        prompt = f"{prompt.rstrip('.')} Keep everything else the same."

    gen_cmd = [
        sys.executable,
        str(SKILL_GENERATE_VIDEO),
        prompt,
        "--video",
        str(prepped_clip),
        "--duration",
        str(duration),
        "--resolution",
        args.resolution,
        "--aspect-ratio",
        args.aspect_ratio,
        "--output",
        str(out_mp4),
    ]
    if args.ref_image:
        ref_path = Path(args.ref_image).resolve()
        if not ref_path.exists():
            raise FileNotFoundError(f"Reference image not found: {ref_path}")
        gen_cmd.extend(["--image", str(ref_path)])
    if args.strip_audio:
        gen_cmd.append("--strip-audio")

    manifest_path = out_mp4.with_suffix(".omni-job.json")
    manifest = {
        "model": "gemini-omni-1.2-flash",
        "sourceVideo": str(video_path),
        "preppedClip": str(prepped_clip),
        "outputVideo": str(out_mp4),
        "startSec": start_sec,
        "durationSec": duration,
        "resolution": args.resolution,
        "aspectRatio": args.aspect_ratio,
        "stripAudio": bool(args.strip_audio),
        "referenceImage": str(Path(args.ref_image).resolve()) if args.ref_image else None,
        "prompt": prompt,
        "limits": {
            "maxClipSec": 15,
            "regionalRestriction": "Video upload editing is unavailable in EEA, Switzerland, UK, and select US states.",
        },
        "prepFfmpegCommand": prep_cmd,
        "omniSkillCommand": gen_cmd,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    def format_cmd(cmd_parts: list[str]) -> str:
        if os.name == "nt":
            return subprocess.list2cmdline(cmd_parts)
        return " ".join(shlex.quote(x) for x in cmd_parts)

    print("=== Gemini Omni 1.2 Flash Video Object-Swap Workflow ===")
    print("Note: Supports 3-15s clips; unavailable in EEA/Switzerland/UK/select US states.")
    print(f"Manifest saved: {manifest_path}")
    print("\n1) Prepare 3-15s clip:")
    print("  " + format_cmd(prep_cmd))
    print("\n2) Run Gemini Omni 1.2 Flash edit (requires GEMINI_API_KEY & google-genai >= 2.30.1):")
    print("  " + format_cmd(gen_cmd))

    if not args.run:
        print("\nDry run complete. Re-run with --run to execute both commands.")
        return

    require_gemini_api_key()
    if not SKILL_GENERATE_VIDEO.exists():
        raise FileNotFoundError(
            f"gemini-omni-flash-api script not found: {SKILL_GENERATE_VIDEO}"
        )

    try:
        import google.genai  # noqa: F401
    except ImportError as exc:
        raise RuntimeError(
            "google-genai SDK is missing in this Python environment. "
            "Install it with: uv pip install --python tools/.venv/Scripts/python.exe -U google-genai"
        ) from exc

    print("\nRunning clip prep with ffmpeg...")
    subprocess.run(prep_cmd, check=True)

    env = os.environ.copy()
    ffmpeg_dir = str(Path(ffmpeg_bin).parent)
    env["PATH"] = f"{ffmpeg_dir}{os.pathsep}{env.get('PATH', '')}"

    print("Running gemini-omni-1.2-flash video edit...")
    subprocess.run(gen_cmd, check=True, env=env)
    print(f"Completed Omni swap -> {out_mp4}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Background object-swap workflow for Yuza's studio A-roll (GTX 1650 safe)."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # 1. extract-plate
    p_extract = sub.add_parser(
        "extract-plate",
        help="Extract the sharpest frame from a video as a lossless PNG clean plate.",
    )
    p_extract.add_argument("input_video", help="Source A-roll video path.")
    p_extract.add_argument(
        "--out", default=None, help="Output PNG path (default: <stem>_clean_plate.png)."
    )
    p_extract.add_argument(
        "--samples",
        type=int,
        default=24,
        help="Number of frames to scan for sharpness (default: 24).",
    )
    p_extract.add_argument(
        "--start", type=float, default=0.0, help="Window start in seconds (default: 0)."
    )
    p_extract.add_argument(
        "--duration",
        type=float,
        default=None,
        help="Window duration in seconds (default: full video).",
    )
    p_extract.set_defaults(func=cmd_extract_plate)

    # 2. gemini-plate-edit
    p_plate = sub.add_parser(
        "gemini-plate-edit",
        help="Edit an extracted clean plate PNG using Gemini Nano Banana 2.1 or Gemini 3 Pro Image.",
    )
    p_plate.add_argument("input_plate", help="Clean plate PNG/JPG path.")
    p_plate.add_argument(
        "--prompt",
        default=None,
        help="Background swap instruction (default: replace fridge with walnut bookshelf).",
    )
    p_plate.add_argument(
        "--model",
        choices=["gemini-nano-banana-2.1", "gemini-3-pro-image", "gemini-3.1-flash-lite-image"],
        default="gemini-nano-banana-2.1",
        help="Gemini image editing model (default: gemini-nano-banana-2.1).",
    )
    p_plate.add_argument(
        "--aspect-ratio",
        default=None,
        help="Output aspect ratio (default: matched automatically from plate dimensions).",
    )
    p_plate.add_argument(
        "--image-size",
        choices=["1K", "2K", "4K"],
        default="2K",
        help="Gemini output size tier (default: 2K).",
    )
    p_plate.add_argument(
        "--ref-image",
        action="append",
        default=[],
        help="Optional style/object reference image path (can repeat).",
    )
    p_plate.add_argument(
        "--out",
        default=None,
        help="Output edited PNG path (default: <stem>_swapped.png).",
    )
    p_plate.add_argument(
        "--no-match-size",
        action="store_true",
        help="Keep model's raw pixel dimensions instead of resizing to match input plate.",
    )
    p_plate.add_argument(
        "--dry-run",
        action="store_true",
        help="Print planned Gemini Interactions API request without calling the API.",
    )
    p_plate.set_defaults(func=cmd_gemini_plate_edit)

    # 3. auto-person-mask
    p_mask = sub.add_parser(
        "auto-person-mask",
        help="Generate a temporally smoothed person matte MP4 across full-length tripod A-roll (and optionally composite over an edited plate).",
    )
    p_mask.add_argument("input_video", help="Source locked-off tripod A-roll video.")
    p_mask.add_argument(
        "--out-mask",
        default=None,
        help="Output grayscale matte MP4 path (default: <stem>_person_mask.mp4).",
    )
    p_mask.add_argument(
        "--composite-plate",
        default=None,
        help="Optional edited plate PNG (e.g. room_swapped.png) to composite behind the person in one pass.",
    )
    p_mask.add_argument(
        "--out",
        default=None,
        help="Output composited MP4 path when --composite-plate is used (default: <stem>_swapped.mp4).",
    )
    p_mask.add_argument(
        "--backend",
        choices=["auto", "mediapipe", "diff"],
        default="auto",
        help="Segmentation backend: mediapipe selfie segmenter, OpenCV diff, or auto (default: auto).",
    )
    p_mask.add_argument(
        "--model-path",
        default=str(DEFAULT_SEGMENTER_MODEL),
        help="Path to MediaPipe .tflite segmenter model (auto-downloaded if missing).",
    )
    p_mask.add_argument(
        "--ref-plate",
        default=None,
        help="Optional clean background plate PNG for diff backend reference.",
    )
    p_mask.add_argument(
        "--seg-width",
        type=int,
        default=512,
        help="Internal segmentation width in pixels for fast CPU inference (default: 512).",
    )
    p_mask.add_argument(
        "--threshold",
        type=float,
        default=0.45,
        help="Foreground confidence midpoint in [0, 1] (default: 0.45).",
    )
    p_mask.add_argument(
        "--softness",
        type=float,
        default=0.18,
        help="Smoothstep transition band around threshold (default: 0.18).",
    )
    p_mask.add_argument(
        "--temporal-smooth",
        type=float,
        default=0.65,
        help="Temporal EMA smoothing factor in [0, 0.95] (default: 0.65).",
    )
    p_mask.add_argument(
        "--feather",
        type=float,
        default=5.0,
        help="Spatial Gaussian feather sigma in pixels (default: 5.0).",
    )
    p_mask.add_argument(
        "--dilate",
        type=int,
        default=2,
        help="Foreground dilation radius in inference pixels to protect hair/edges (default: 2).",
    )
    p_mask.add_argument(
        "--swap-box",
        default=None,
        help="Optional x,y,w,h region (0..1 normalized or pixels) restricting background reveal to the swapped prop zone.",
    )
    p_mask.add_argument(
        "--invert",
        action="store_true",
        help="Write inverted matte (white = background, black = person).",
    )
    p_mask.set_defaults(func=cmd_auto_person_mask)

    # 4. composite-plate
    p_comp = sub.add_parser(
        "composite-plate",
        help="Composite an edited plate onto a locked-off tripod clip using a static black/white mask PNG.",
    )
    p_comp.add_argument("input_video", help="Source locked-off tripod video.")
    p_comp.add_argument("--plate", required=True, help="Edited clean plate PNG.")
    p_comp.add_argument(
        "--mask",
        required=True,
        help="Grayscale mask PNG (white = edited plate region, black = original video).",
    )
    p_comp.add_argument("--out", default=None, help="Output MP4 path.")
    p_comp.add_argument(
        "--feather",
        type=float,
        default=6.0,
        help="Gaussian blur radius in pixels for mask edge feathering (default: 6.0).",
    )
    p_comp.set_defaults(func=cmd_composite_plate)

    # 5. omni-edit (with omni-command alias)
    p_omni = sub.add_parser(
        "omni-edit",
        aliases=["omni-command"],
        help="Build or run a Gemini Omni 1.2 Flash video edit for 3-15s moving-camera clips.",
    )
    p_omni.add_argument("input_video", help="Source video path.")
    p_omni.add_argument("--prompt", default=None, help="Object-swap edit prompt.")
    p_omni.add_argument(
        "--ref-image",
        default=None,
        help="Optional edited plate or bookshelf reference PNG.",
    )
    p_omni.add_argument(
        "--start", type=float, default=0.0, help="Clip start time in seconds (default: 0)."
    )
    p_omni.add_argument(
        "--duration",
        type=int,
        default=10,
        help="Target clip duration in seconds, 3-15s (default: 10).",
    )
    p_omni.add_argument(
        "--resolution",
        choices=["360p", "720p", "1080p", "4k"],
        default="720p",
        help="Gemini Omni output resolution (default: 720p).",
    )
    p_omni.add_argument(
        "--aspect-ratio",
        choices=["16:9", "9:16"],
        default="16:9",
        help="Output aspect ratio (default: 16:9).",
    )
    p_omni.add_argument(
        "--strip-audio",
        action="store_true",
        help="Strip original audio before upload (otherwise Gemini Omni preserves it).",
    )
    p_omni.add_argument("--out", default=None, help="Output MP4 path.")
    p_omni.add_argument(
        "--run",
        action="store_true",
        help="Execute ffmpeg clip prep and Gemini Omni 1.2 Flash edit immediately.",
    )
    p_omni.set_defaults(func=cmd_omni_edit)

    args = parser.parse_args()
    try:
        args.func(args)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
