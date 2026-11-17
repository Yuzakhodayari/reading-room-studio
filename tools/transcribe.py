#!/usr/bin/env python3
"""
Transcribe speech from audio or video using faster-whisper with word-level timestamps.
Outputs:
  - words.json: { text, language, durationSec, words: [{ word, startSec, endSec, startFrame, endFrame }], segments: [...] }
  - captions.srt: cleanly chunked SubRip subtitles
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel, download_model


def find_ffmpeg() -> str | None:
    """Locate ffmpeg executable in PATH or WinGet package directories."""
    on_path = shutil.which("ffmpeg")
    if on_path:
        return on_path

    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        winget_root = Path(local_app_data) / "Microsoft" / "WinGet" / "Packages"
        if winget_root.exists():
            for exe in winget_root.rglob("ffmpeg.exe"):
                return str(exe)
    return None


def extract_mono_wav_16k(input_path: Path, temp_dir: Path, ffmpeg_bin: str) -> Path:
    """Extract clean 16 kHz mono PCM WAV for consistent decoding across phone/VFR media."""
    out_wav = temp_dir / "audio_16k.wav"
    cmd = [
        ffmpeg_bin,
        "-y",
        "-v",
        "error",
        "-i",
        str(input_path),
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "pcm_s16le",
        str(out_wav),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0 or not out_wav.exists():
        raise RuntimeError(
            f"ffmpeg audio extraction failed ({proc.returncode}): {proc.stderr.strip()}"
        )
    return out_wav


def format_srt_timestamp(seconds: float) -> str:
    """Format seconds as HH:MM:SS,mmm for SRT subtitles."""
    ms_total = max(0, int(round(seconds * 1000)))
    hours, rem = divmod(ms_total, 3_600_000)
    minutes, rem = divmod(rem, 60_000)
    secs, ms = divmod(rem, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def build_srt_cues(
    segments: list[dict[str, Any]],
    words: list[dict[str, Any]],
    max_chars: int = 42,
    max_words: int = 7,
    max_pause_sec: float = 0.65,
) -> str:
    """Build readable SRT cues from word timestamps, falling back to segments."""
    cues: list[tuple[float, float, str]] = []

    if words:
        buf: list[dict[str, Any]] = []
        buf_len = 0

        def flush() -> None:
            nonlocal buf, buf_len
            if not buf:
                return
            text = " ".join(item["word"].strip() for item in buf).strip()
            if text:
                cues.append((buf[0]["startSec"], buf[-1]["endSec"], text))
            buf = []
            buf_len = 0

        for item in words:
            token = item["word"].strip()
            if not token:
                continue
            if buf:
                pause = item["startSec"] - buf[-1]["endSec"]
                projected = buf_len + 1 + len(token)
                prev_ended_sentence = buf[-1]["word"].strip().endswith((".", "!", "?"))
                if (
                    pause > max_pause_sec
                    or len(buf) >= max_words
                    or projected > max_chars
                    or prev_ended_sentence
                ):
                    flush()
            buf.append(item)
            buf_len += (1 if buf_len > 0 else 0) + len(token)
        flush()
    else:
        for seg in segments:
            text = seg["text"].strip()
            if text:
                cues.append((seg["startSec"], seg["endSec"], text))

    blocks = []
    for idx, (start_sec, end_sec, text) in enumerate(cues, start=1):
        end_clamped = max(start_sec + 0.05, end_sec)
        blocks.append(
            f"{idx}\n{format_srt_timestamp(start_sec)} --> {format_srt_timestamp(end_clamped)}\n{text}"
        )
    return "\n\n".join(blocks) + ("\n" if blocks else "")


def resolve_model_path(model_size_or_path: str) -> str:
    """Resolve local model directory or download from Hugging Face Hub once."""
    candidate = Path(model_size_or_path)
    if candidate.exists():
        return str(candidate)
    return download_model(model_size_or_path)


def load_model_with_fallback(
    model_size: str, device: str, compute_type: str
) -> tuple[WhisperModel, str, str]:
    """Load WhisperModel, falling back cleanly to CPU int8 if CUDA runtime libs are missing."""
    model_path = resolve_model_path(model_size)

    if device == "cpu":
        resolved_compute = "int8" if compute_type == "auto" else compute_type
        return WhisperModel(model_path, device="cpu", compute_type=resolved_compute), "cpu", resolved_compute

    candidates: list[tuple[str, str]] = []
    if device == "cuda":
        candidates.append(("cuda", "float16" if compute_type == "auto" else compute_type))
    else:
        # auto: try CUDA first if ctranslate2 reports a GPU, always keep CPU int8 fallback
        try:
            import ctranslate2

            if ctranslate2.get_cuda_device_count() > 0:
                candidates.append(("cuda", "float16" if compute_type == "auto" else compute_type))
        except Exception:
            pass
        candidates.append(("cpu", "int8" if compute_type == "auto" else compute_type))

    last_err: Exception | None = None
    for dev, ctype in candidates:
        try:
            model = WhisperModel(model_path, device=dev, compute_type=ctype)
            return model, dev, ctype
        except Exception as exc:
            last_err = exc
            if dev == "cuda":
                print(
                    f"[warn] CUDA init failed ({exc}); falling back to CPU int8.",
                    file=sys.stderr,
                )
    raise RuntimeError(f"Failed to initialize WhisperModel: {last_err}")


def load_audio_16k_mono(input_path: Path, temp_dir: Path, ffmpeg_bin: str | None) -> tuple[np.ndarray, float]:
    """Load input media as a 16 kHz mono float32 numpy array (bypassing PyAV metadata_errors bugs)."""
    wav_path = input_path
    if ffmpeg_bin:
        wav_path = extract_mono_wav_16k(input_path, temp_dir, ffmpeg_bin)
    elif input_path.suffix.lower() != ".wav":
        raise RuntimeError(
            "ffmpeg is required to decode non-WAV media files cleanly."
        )

    audio, sr = sf.read(str(wav_path), dtype="float32", always_2d=False)
    if audio.ndim == 2:
        audio = np.mean(audio, axis=1, dtype=np.float32)
    if sr != 16000:
        from math import gcd
        from scipy.signal import resample_poly

        g = gcd(sr, 16000)
        audio = resample_poly(audio, 16000 // g, sr // g).astype(np.float32)
        sr = 16000
    duration_sec = len(audio) / float(sr)
    return np.ascontiguousarray(audio, dtype=np.float32), duration_sec


def transcribe_media(args: argparse.Namespace) -> None:
    input_path = Path(args.input_media).resolve()
    if not input_path.exists():
        raise FileNotFoundError(f"Input media not found: {input_path}")

    out_dir = Path(args.out_dir).resolve() if args.out_dir else input_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    ffmpeg_bin = find_ffmpeg()
    fps = args.fps

    with tempfile.TemporaryDirectory(prefix="transcribe_") as tmp:
        tmp_dir = Path(tmp)
        waveform, wav_duration_sec = load_audio_16k_mono(input_path, tmp_dir, ffmpeg_bin)

        model, used_device, used_compute = load_model_with_fallback(
            args.model, args.device, args.compute_type
        )
        print(
            f"Transcribing '{input_path.name}' ({wav_duration_sec:.2f}s) with model={args.model} "
            f"device={used_device} compute={used_compute}..."
        )

        def run_decode(use_cuda: bool) -> tuple[list[Any], Any]:
            nonlocal model, used_device, used_compute
            if not use_cuda and used_device != "cpu":
                model, used_device, used_compute = load_model_with_fallback(
                    args.model, "cpu", "int8"
                )
            seg_iter, info = model.transcribe(
                waveform,
                language=args.language,
                word_timestamps=True,
                vad_filter=not args.no_vad_filter,
                beam_size=args.beam_size,
            )
            return list(seg_iter), info

        try:
            raw_segments, info = run_decode(used_device == "cuda")
        except Exception as exc:
            err_lower = str(exc).lower()
            is_cuda_runtime_err = any(
                tok in err_lower for tok in ("cuda", "cublas", "cudnn", "ctranslate2", "dll", "gpu")
            )
            if used_device == "cuda" and args.device == "auto" and is_cuda_runtime_err:
                print(
                    f"[warn] CUDA inference failed ({exc}); retrying on CPU int8.",
                    file=sys.stderr,
                )
                raw_segments, info = run_decode(False)
            else:
                raise

    all_words: list[dict[str, Any]] = []
    segments_out: list[dict[str, Any]] = []
    text_parts: list[str] = []

    for idx, seg in enumerate(raw_segments):
        seg_text = (seg.text or "").strip()
        if seg_text:
            text_parts.append(seg_text)

        seg_words: list[dict[str, Any]] = []
        for w in seg.words or []:
            w_text = (w.word or "").strip()
            if not w_text:
                continue
            start_sec = round(float(w.start), 3)
            end_sec = round(max(float(w.start), float(w.end)), 3)
            start_frame = int(round(start_sec * fps))
            end_frame = max(start_frame, int(round(end_sec * fps)))
            word_entry = {
                "word": w_text,
                "startSec": start_sec,
                "endSec": end_sec,
                "startFrame": start_frame,
                "endFrame": end_frame,
                "probability": round(float(getattr(w, "probability", 1.0)), 4),
            }
            seg_words.append(word_entry)
            all_words.append(word_entry)

        seg_start = round(float(seg.start), 3)
        seg_end = round(max(float(seg.start), float(seg.end)), 3)
        seg_start_frame = int(round(seg_start * fps))
        seg_end_frame = max(seg_start_frame, int(round(seg_end * fps)))

        segments_out.append(
            {
                "id": idx,
                "text": seg_text,
                "startSec": seg_start,
                "endSec": seg_end,
                "startFrame": seg_start_frame,
                "endFrame": seg_end_frame,
                "words": seg_words,
            }
        )

    duration_sec = round(float(getattr(info, "duration", 0.0) or 0.0), 3)
    payload = {
        "text": " ".join(text_parts).strip(),
        "language": getattr(info, "language", args.language or "unknown"),
        "languageProbability": round(
            float(getattr(info, "language_probability", 0.0) or 0.0), 4
        ),
        "fps": fps,
        "durationSec": duration_sec,
        "words": all_words,
        "segments": segments_out,
    }

    words_json_path = out_dir / "words.json"
    captions_srt_path = out_dir / "captions.srt"

    words_json_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    captions_srt_path.write_text(
        build_srt_cues(segments_out, all_words), encoding="utf-8"
    )

    print(
        f"Done: {len(all_words)} words, {len(segments_out)} segments, "
        f"duration={duration_sec:.2f}s"
    )
    print(f"  -> {words_json_path}")
    print(f"  -> {captions_srt_path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Transcribe media with faster-whisper word timestamps (30fps JSON + SRT)."
    )
    parser.add_argument("input_media", help="Path to input audio or video file.")
    parser.add_argument(
        "--model",
        default="small",
        help="Whisper model size or path (default: small).",
    )
    parser.add_argument(
        "--out-dir",
        default=None,
        help="Directory to write words.json and captions.srt (default: input file folder).",
    )
    parser.add_argument(
        "--fps",
        type=int,
        default=30,
        help="Timeline FPS for startFrame/endFrame calculation (default: 30).",
    )
    parser.add_argument(
        "--language",
        default=None,
        help="Optional ISO language code (e.g. en). Auto-detected if omitted.",
    )
    parser.add_argument(
        "--device",
        choices=["auto", "cpu", "cuda"],
        default="auto",
        help="Inference device (default: auto with CPU int8 fallback).",
    )
    parser.add_argument(
        "--compute-type",
        default="auto",
        help="CTranslate2 compute type (default: auto).",
    )
    parser.add_argument(
        "--beam-size",
        type=int,
        default=5,
        help="Beam size for decoding (default: 5).",
    )
    parser.add_argument(
        "--no-vad-filter",
        action="store_true",
        help="Disable Silero VAD filter (useful for very short synthetic clips).",
    )
    args = parser.parse_args()
    transcribe_media(args)


if __name__ == "__main__":
    main()
