#!/usr/bin/env python3
"""
Hard Benchmark & Exam Suite — Expanded Media, Pixel/Alpha, LUT, Swap, FCPXML, and E2E Exams

Outputs structured metrics to studio/out/benchmark/exam_media_results.json.
"""

from __future__ import annotations

import fractions
import json
import math
import os
import re
import shutil
import subprocess
import time
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image

TOOLS_DIR = Path(__file__).resolve().parent
REPO_ROOT = TOOLS_DIR.parent
STUDIO_DIR = REPO_ROOT / "studio"
OUT_DIR = STUDIO_DIR / "out"
BENCH_DIR = OUT_DIR / "benchmark"
MEDIA_DIR = BENCH_DIR / "media"
E2E_TARGET_DIR = BENCH_DIR / "e2e_project"
LUTS_DIR = STUDIO_DIR / "luts"
VENV_PYTHON = TOOLS_DIR / ".venv" / "Scripts" / "python.exe"


def find_bin(name: str) -> str:
    found = shutil.which(name)
    if found:
        return found
    local_app = os.environ.get("LOCALAPPDATA")
    if local_app:
        winget_root = Path(local_app) / "Microsoft" / "WinGet" / "Packages"
        if winget_root.exists():
            exe = f"{name}.exe" if os.name == "nt" else name
            for p in winget_root.rglob(exe):
                return str(p)
    raise FileNotFoundError(f"Could not locate {name}")


FFMPEG = find_bin("ffmpeg")
FFPROBE = find_bin("ffprobe")


def run_cmd(cmd: list[str], cwd: Path = REPO_ROOT, check: bool = False) -> dict[str, Any]:
    t0 = time.perf_counter()
    proc = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True)
    dt = time.perf_counter() - t0
    if check and proc.returncode != 0:
        raise RuntimeError(f"Command failed ({proc.returncode}): {' '.join(cmd)}\n{proc.stderr}")
    return {
        "returncode": proc.returncode,
        "stdout": proc.stdout,
        "stderr": proc.stderr,
        "wallSec": round(dt, 3),
    }


def probe_media(path: Path) -> dict[str, Any]:
    res = run_cmd(
        [FFPROBE, "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)],
        check=True,
    )
    info = json.loads(res["stdout"])
    v = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), {})
    a = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), None)
    return {
        "durationSec": float(info.get("format", {}).get("duration") or v.get("duration") or 0.0),
        "width": v.get("width"),
        "height": v.get("height"),
        "rFrameRate": v.get("r_frame_rate"),
        "avgFrameRate": v.get("avg_frame_rate"),
        "pixFmt": v.get("pix_fmt"),
        "codec": v.get("codec_name"),
        "nbFrames": int(v["nb_frames"]) if str(v.get("nb_frames", "")).isdigit() else None,
        "hasAudio": a is not None,
        "audioSampleRate": a.get("sample_rate") if a else None,
    }


def measure_lufs(path: Path) -> dict[str, Any]:
    res = run_cmd(
        [
            FFMPEG,
            "-hide_banner",
            "-i",
            str(path),
            "-af",
            "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json",
            "-vn",
            "-f",
            "null",
            "-",
        ],
        check=True,
    )
    m = re.search(r'\{\s*"input_i"\s*:[\s\S]*?\}', res["stderr"])
    if not m:
        raise RuntimeError(f"Could not parse loudnorm JSON for {path}")
    data = json.loads(m.group(0))
    return {
        "input_i": float(data["input_i"]),
        "input_tp": float(data["input_tp"]),
        "input_lra": float(data["input_lra"]),
        "input_thresh": float(data["input_thresh"]),
    }


def check_cfr_timestamps(path: Path, expected_fps: float = 30.0) -> dict[str, Any]:
    res = run_cmd(
        [
            FFPROBE,
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "frame=pts_time",
            "-of",
            "csv=p=0",
            str(path),
        ],
        check=True,
    )
    pts = [
        float(line.strip().rstrip(","))
        for line in res["stdout"].splitlines()
        if line.strip().rstrip(",")
    ]
    if len(pts) < 2:
        return {"frameCount": len(pts), "isCfr": False}
    deltas = np.diff(pts)
    expected_dt = 1.0 / expected_fps
    max_err = float(np.max(np.abs(deltas - expected_dt)))
    return {
        "frameCount": len(pts),
        "meanDelta": round(float(np.mean(deltas)), 6),
        "maxDeltaErr": round(max_err, 6),
        "isCfr": max_err < 0.005,
    }


# ============================================================================
# EXAM 1 PIXEL & ALPHA AUDIT (ALL 28 STILLS)
# ============================================================================
def audit_exam1_stills() -> dict[str, Any]:
    node_json = BENCH_DIR / "exam_node_results.json"
    if not node_json.exists():
        return {"error": f"Missing {node_json}"}
    node_data = json.loads(node_json.read_text(encoding="utf-8"))
    stills = node_data.get("exam1", {}).get("stillsRendered", [])
    results = []
    all_passed = True

    for item in stills:
        png_path = Path(item["pngPath"])
        row: dict[str, Any] = {
            "name": item["name"],
            "componentHint": item["componentHint"],
            "styleFamily": item["styleFamily"],
            "previewMode": item["previewMode"],
            "expectAlpha": item["expectAlpha"],
            "expectGlassSemiAlpha": item["expectGlassSemiAlpha"],
            "pngPath": str(png_path),
            "renderExitCode": item["exitCode"],
        }
        if item["exitCode"] != 0 or not png_path.exists():
            row["passed"] = False
            row["reason"] = item.get("error") or "PNG missing"
            all_passed = False
            results.append(row)
            continue

        with Image.open(png_path) as im:
            mode = im.mode
            w, h = im.size
            arr = np.array(im)

        dim_ok = (w == 1920 and h == 1080)
        if arr.ndim == 3 and arr.shape[2] == 4:
            alpha = arr[:, :, 3]
            corners = [
                int(alpha[0, 0]),
                int(alpha[0, w - 1]),
                int(alpha[h - 1, 0]),
                int(alpha[h - 1, w - 1]),
            ]
            corners_zero = all(c == 0 for c in corners)
            nonzero_mask = alpha > 0
            nonzero_px = int(np.sum(nonzero_mask))
            semi_alpha_px = int(np.sum((alpha > 0) & (alpha < 255)))
            opaque_px = int(np.sum(alpha == 255))
            rgb_for_var = arr[nonzero_mask, :3] if nonzero_px > 0 else arr[:, :, :3]
            rgb_std = float(np.std(rgb_for_var))
        else:
            corners = [255, 255, 255, 255]
            corners_zero = False
            nonzero_px = w * h
            semi_alpha_px = 0
            opaque_px = w * h
            rgb_std = float(np.std(arr))

        non_empty = nonzero_px > 100 and rgb_std > 2.0
        alpha_ok = True
        if item["expectAlpha"]:
            alpha_ok = (mode == "RGBA") and corners_zero
            if item["expectGlassSemiAlpha"]:
                alpha_ok = alpha_ok and (semi_alpha_px > 100)

        passed = dim_ok and non_empty and alpha_ok
        if not passed:
            all_passed = False

        row.update({
            "mode": mode,
            "size": [w, h],
            "dimOk": dim_ok,
            "cornersAlpha": corners,
            "cornersZero": corners_zero,
            "nonZeroAlphaPx": nonzero_px,
            "semiAlphaPx": semi_alpha_px,
            "opaquePx": opaque_px,
            "rgbStdDev": round(rgb_std, 2),
            "nonEmpty": non_empty,
            "alphaOk": alpha_ok,
            "passed": passed,
        })
        results.append(row)

    return {
        "totalStills": len(results),
        "passedCount": sum(1 for r in results if r.get("passed")),
        "allPassed": all_passed and len(results) > 0,
        "stills": results,
    }


def _srgb_rel_lum(rgb: np.ndarray) -> np.ndarray:
    c = rgb.astype(np.float32) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]


def _wcag(l1: float, l2: float) -> float:
    return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)


def audit_dual_palette_readability() -> dict[str, Any]:
    """Fail if ArchiveLightTable/Page cards lack >=4.5:1 contrast, InstructionManualCard has blank boxes,
    bright-wall glass eyebrows/footers drop below 4.5:1, or Page hero fills use #3E6A94 instead of #1C2B3A."""
    stills_dir = BENCH_DIR / "stills"
    failures: list[str] = []
    checks: dict[str, Any] = {}

    # 1. 08_ArchiveLightTable & light-editorial card contrast check (anti white-on-white regression)
    light_card_targets = [
        ("08_ArchiveLightTable.png", (600, 320, 1320, 760)),
        ("07_VisualInvestigationBoard.png", (200, 180, 1720, 900)),
        ("20_CaptionNewsCard.png", (40, 40, 720, 320)),
        ("24_StainedGlassFrame.png", (520, 220, 1400, 860)),
    ]
    light_results: list[dict[str, Any]] = []
    for fname, (x0, y0, x1, y1) in light_card_targets:
        p = stills_dir / fname
        if not p.exists():
            failures.append(f"missing:{fname}")
            continue
        rgb = np.array(Image.open(p).convert("RGB"))
        crop = rgb[y0:y1, x0:x1]
        lum = _srgb_rel_lum(crop)
        bg_lum = float(np.median(lum))
        dark_ink = lum[lum <= 0.22]
        ink_lum = float(np.percentile(lum, 1.5)) if len(dark_ink) == 0 else float(np.median(dark_ink))
        ratio = _wcag(bg_lum, ink_lum)
        ok = (len(dark_ink) >= 500) and (ratio >= 4.5)
        if not ok:
            failures.append(f"low_contrast:{fname}:wcag={ratio:.2f}:dark_px={len(dark_ink)}")
        light_results.append({
            "file": fname,
            "bgMedianLum": round(bg_lum, 4),
            "inkLum": round(ink_lum, 4),
            "darkInkPixels": int(len(dark_ink)),
            "wcag": round(ratio, 2),
            "passed": ok,
        })
    checks["pageCardContrast"] = light_results

    # 2. 15_InstructionManualCard blank schematic box check
    inst_path = stills_dir / "15_InstructionManualCard_transparent.png"
    if inst_path.exists():
        rgba = np.array(Image.open(inst_path).convert("RGBA"))
        ys, xs = np.where(rgba[..., 3] > 20)
        bx0, by0, bx1, by1 = int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())
        bw, bh = bx1 - bx0, by1 - by0
        card_rgb = rgba[by0:by1, bx0:bx1, :3]
        card_lum = _srgb_rel_lum(card_rgb)
        # Schematic left & right box interiors (well away from outer box strokes)
        left_box = card_lum[int(bh * 0.56):int(bh * 0.76), int(bw * 0.12):int(bw * 0.34)]
        right_box = card_lum[int(bh * 0.56):int(bh * 0.76), int(bw * 0.66):int(bw * 0.88)]
        left_ink = int(np.sum(left_box < 0.20))
        right_ink = int(np.sum(right_box < 0.20))
        inst_ok = left_ink >= 20 and right_ink >= 20
        if not inst_ok:
            failures.append(f"blank_schematic_box:15_InstructionManualCard:left={left_ink},right={right_ink}")
        checks["instructionManualBoxes"] = {
            "leftBoxDarkGlyphPx": left_ink,
            "rightBoxDarkGlyphPx": right_ink,
            "passed": inst_ok,
        }
    else:
        failures.append("missing:15_InstructionManualCard_transparent.png")

    # 3. Bright-wall Over Footage glass contrast & eyebrow/footer check
    bright_path = BENCH_DIR / "test_glass_over_bright.png"
    if bright_path.exists():
        rgb = np.array(Image.open(bright_path).convert("RGB"))
        lum = _srgb_rel_lum(rgb)
        amb_lum = float(np.median(lum[60:360, 60:360]))
        card_lum = lum[175:500, 1225:1835]
        eyebrow_lum = lum[196:228, 1255:1420]
        footer_lum = lum[452:488, 1255:1660]
        glass_med = float(np.median(card_lum))
        eyebrow_txt = float(np.percentile(eyebrow_lum, 99.3))
        footer_txt = float(np.percentile(footer_lum, 99.3))
        card_txt = float(np.percentile(card_lum, 99.0))
        eyebrow_wcag = _wcag(eyebrow_txt, float(np.median(eyebrow_lum)))
        footer_wcag = _wcag(footer_txt, float(np.median(footer_lum)))
        card_wcag = _wcag(card_txt, glass_med)
        bright_ok = (glass_med <= 0.24) and (card_wcag >= 4.5) and (eyebrow_wcag >= 4.5) and (footer_wcag >= 4.5)
        if not bright_ok:
            failures.append(
                f"bright_glass_readability:glassMed={glass_med:.3f}:card={card_wcag:.2f}:eyebrow={eyebrow_wcag:.2f}:footer={footer_wcag:.2f}"
            )
        checks["brightWallGlass"] = {
            "ambientLum": round(amb_lum, 4),
            "glassMedianLum": round(glass_med, 4),
            "cardWcag": round(card_wcag, 2),
            "eyebrowWcag": round(eyebrow_wcag, 2),
            "footerWcag": round(footer_wcag, 2),
            "passed": bright_ok,
        }
    else:
        failures.append("missing:test_glass_over_bright.png")

    # Also test transparent glass presets composited over bright footage wall (#D7D4CE ~84% sunlit plaster)
    # and record raw #FAF8F3 paper metrics for transparency audit
    bright_presets: list[dict[str, Any]] = []
    bg_footage_bright = np.array([215.0, 212.0, 205.0], dtype=np.float32)
    bg_paper = np.array([250.0, 248.0, 243.0], dtype=np.float32)
    for tname in ["01_GlassCard_transparent.png", "05_GlassToastAlert_transparent.png", "06_GlassSplitModal_transparent.png", "19_NewsPackageLowerThird_transparent.png"]:
        tp = stills_dir / tname
        if not tp.exists():
            continue
        rgba = np.array(Image.open(tp).convert("RGBA"), dtype=np.float32)
        ys, xs = np.where(rgba[..., 3] > 20)
        comp = rgba[ys.min():ys.max(), xs.min():xs.max()]
        a = comp[..., 3:4] / 255.0
        # Exclude outer fuzzy boxShadow fringe (alpha < 120) so glass interior + text are measured
        mask = comp[..., 3] >= 120

        comp_footage = comp[..., :3] * a + bg_footage_bright * (1.0 - a)
        clum_f = _srgb_rel_lum(comp_footage.astype(np.uint8))
        vals_f = clum_f[mask] if np.any(mask) else clum_f[comp[..., 3] > 20]
        g_med_f = float(np.median(vals_f))
        g_txt_f = float(np.percentile(vals_f, 99.0))
        wc_footage = _wcag(g_txt_f, g_med_f)

        comp_paper = comp[..., :3] * a + bg_paper * (1.0 - a)
        clum_p = _srgb_rel_lum(comp_paper.astype(np.uint8))
        vals_p = clum_p[mask] if np.any(mask) else clum_p[comp[..., 3] > 20]
        wc_paper = _wcag(float(np.percentile(vals_p, 99.0)), float(np.median(vals_p)))

        ok = (wc_footage >= 4.5) and (wc_paper >= 3.5)
        if not ok:
            failures.append(f"bright_preset_contrast:{tname}:footage_wcag={wc_footage:.2f}:paper_wcag={wc_paper:.2f}")
        bright_presets.append({
            "file": tname,
            "glassLumOverBrightFootage": round(g_med_f, 4),
            "textLum": round(g_txt_f, 4),
            "wcagOverBrightFootage": round(wc_footage, 2),
            "wcagOverRawPaper": round(wc_paper, 2),
            "passed": ok,
        })
    checks["transparentPresetsOverBrightWall"] = bright_presets

    # 4. Classic Dark Navy #1C2B3A vs banned #3E6A94 hero fill check on Page scenes
    navy_checks: list[dict[str, Any]] = []
    navy_target = np.array([28, 43, 58], dtype=np.int16)
    old_blue = np.array([62, 106, 148], dtype=np.int16)
    for cname, min_navy in [
        ("16_MapExplainer_PJM.png", 35000),
        ("26_DataPhysicalCard.png", 10000),
        ("treasury-full-f250.png", 6000),
    ]:
        cp = OUT_DIR / cname if cname == "treasury-full-f250.png" else stills_dir / cname
        if not cp.exists():
            failures.append(f"missing:{cname}")
            continue
        flat = np.array(Image.open(cp).convert("RGB")).reshape(-1, 3).astype(np.int16)
        navy_hits = int(np.sum(np.abs(flat - navy_target).max(axis=1) <= 14))
        old_blue_hits = int(np.sum(np.abs(flat - old_blue).max(axis=1) <= 10))
        ok = navy_hits >= min_navy and old_blue_hits <= 250
        if not ok:
            failures.append(f"navy_hero_check:{cname}:navy={navy_hits},oldBlue={old_blue_hits}")
        navy_checks.append({
            "file": cname,
            "navy1C2B3AHits": navy_hits,
            "oldBlue3E6A94Hits": old_blue_hits,
            "passed": ok,
        })
    checks["classicDarkNavyHero"] = navy_checks

    return {
        "allPassed": len(failures) == 0,
        "failureCount": len(failures),
        "failures": failures,
        "checks": checks,
    }


# ============================================================================
# EXAM 5.1: A-ROLL PREP + ALL 3 .CUBE LUTS
# ============================================================================
def run_exam5_aroll() -> dict[str, Any]:
    aroll_dir = MEDIA_DIR / "aroll"
    aroll_dir.mkdir(parents=True, exist_ok=True)
    prep_script = STUDIO_DIR / "scripts" / "prep-aroll.mjs"

    def build_clip(
        name: str,
        fps: int,
        seg1_dur: float,
        gap_dur: float,
        seg2_dur: float,
        target_lufs: float,
    ) -> Path:
        raw_wav = aroll_dir / f"{name}_raw.wav"
        cal_wav = aroll_dir / f"{name}_cal.wav"
        out_mp4 = aroll_dir / f"{name}.mp4"
        total_dur = seg1_dur + gap_dur + seg2_dur

        speech_expr = (
            "0.25*sin(2*PI*180*t)*sin(2*PI*3.5*t)"
            "+0.18*sin(2*PI*360*t)"
            "+0.12*sin(2*PI*540*t)"
        )
        run_cmd(
            [
                FFMPEG, "-y", "-v", "error",
                "-f", "lavfi", "-i", f"aevalsrc={speech_expr}:s=48000:c=stereo:d={seg1_dur}",
                "-f", "lavfi", "-i", f"aevalsrc=0:s=48000:c=stereo:d={gap_dur}",
                "-f", "lavfi", "-i", f"aevalsrc={speech_expr}:s=48000:c=stereo:d={seg2_dur}",
                "-filter_complex", "[0:a][1:a][2:a]concat=n=3:v=0:a=1[aout]",
                "-map", "[aout]",
                "-c:a", "pcm_s16le",
                str(raw_wav),
            ],
            check=True,
        )
        stats = measure_lufs(raw_wav)
        gain_db = target_lufs - stats["input_i"]
        run_cmd(
            [
                FFMPEG, "-y", "-v", "error",
                "-i", str(raw_wav),
                "-af", f"volume={gain_db:.3f}dB",
                "-c:a", "pcm_s16le",
                str(cal_wav),
            ],
            check=True,
        )
        run_cmd(
            [
                FFMPEG, "-y", "-v", "error",
                "-f", "lavfi", "-i", f"testsrc2=size=1920x1080:rate={fps}:duration={total_dur}",
                "-i", str(cal_wav),
                "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k",
                "-shortest",
                str(out_mp4),
            ],
            check=True,
        )
        return out_mp4

    clip_a_in = build_clip("clipA_quiet_24fps", 24, 2.2, 1.8, 2.2, -32.0)
    clip_a_out = aroll_dir / "clipA_prepped.mp4"
    in_a_meta = probe_media(clip_a_in)
    in_a_lufs = measure_lufs(clip_a_in)

    res_a = run_cmd(
        [
            "node", str(prep_script), str(clip_a_in),
            "--out", str(clip_a_out), "--cut-silence", "--fps", "30", "--lut", "editorial-warm",
        ],
        cwd=STUDIO_DIR,
    )
    out_a_meta = probe_media(clip_a_out) if res_a["returncode"] == 0 else {}
    out_a_lufs = measure_lufs(clip_a_out) if res_a["returncode"] == 0 else {}
    out_a_cfr = check_cfr_timestamps(clip_a_out, 30.0) if res_a["returncode"] == 0 else {}

    a_trimmed_sec = in_a_meta["durationSec"] - out_a_meta.get("durationSec", in_a_meta["durationSec"])
    a_lufs_err = abs(out_a_lufs.get("input_i", -99.0) - (-14.0))
    a_pass = (
        res_a["returncode"] == 0
        and a_lufs_err <= 1.2
        and out_a_meta.get("rFrameRate") == "30/1"
        and out_a_cfr.get("isCfr", False)
        and a_trimmed_sec >= 1.1
    )

    clip_b_in = build_clip("clipB_loud_60fps", 60, 2.4, 0.2, 2.4, -6.0)
    clip_b_out = aroll_dir / "clipB_prepped.mp4"
    in_b_meta = probe_media(clip_b_in)
    in_b_lufs = measure_lufs(clip_b_in)

    res_b = run_cmd(
        [
            "node", str(prep_script), str(clip_b_in),
            "--out", str(clip_b_out), "--cut-silence", "--fps", "30", "--lut", "editorial-warm",
        ],
        cwd=STUDIO_DIR,
    )
    out_b_meta = probe_media(clip_b_out) if res_b["returncode"] == 0 else {}
    out_b_lufs = measure_lufs(clip_b_out) if res_b["returncode"] == 0 else {}
    out_b_cfr = check_cfr_timestamps(clip_b_out, 30.0) if res_b["returncode"] == 0 else {}

    b_dur_diff = abs(in_b_meta["durationSec"] - out_b_meta.get("durationSec", 0.0))
    b_lufs_err = abs(out_b_lufs.get("input_i", -99.0) - (-14.0))
    b_pass = (
        res_b["returncode"] == 0
        and b_lufs_err <= 1.2
        and out_b_meta.get("rFrameRate") == "30/1"
        and out_b_cfr.get("isCfr", False)
        and b_dur_diff <= 0.15
    )

    # Test ALL 3 .cube LUTs in FFmpeg
    lut_src_png = aroll_dir / "lut_src.png"
    run_cmd(
        [
            FFMPEG, "-y", "-v", "error",
            "-f", "lavfi", "-i", "testsrc2=size=640x360:duration=0.1",
            "-frames:v", "1", str(lut_src_png),
        ],
        check=True,
    )
    src_arr = np.array(Image.open(lut_src_png).convert("RGB"), dtype=np.float32)

    lut_results = []
    for lut_name in ("editorial-warm", "documentary-slate", "clean-room-pop"):
        lut_file = LUTS_DIR / f"{lut_name}.cube"
        out_lut_png = aroll_dir / f"lut_{lut_name}.png"
        if not lut_file.exists():
            lut_results.append({"name": lut_name, "passed": False, "error": "LUT file missing"})
            continue
        escaped = str(lut_file).replace("\\", "/").replace(":", "\\:")
        l_res = run_cmd(
            [
                FFMPEG, "-y", "-v", "error",
                "-i", str(lut_src_png),
                "-vf", f"lut3d=file='{escaped}'",
                "-frames:v", "1", str(out_lut_png),
            ]
        )
        if l_res["returncode"] == 0 and out_lut_png.exists():
            dst_arr = np.array(Image.open(out_lut_png).convert("RGB"), dtype=np.float32)
            mean_diff = float(np.mean(np.abs(dst_arr - src_arr)))
            lut_results.append({
                "name": lut_name,
                "exists": True,
                "ffmpegExit": 0,
                "meanRgbDelta": round(mean_diff, 2),
                "passed": mean_diff > 0.5,
            })
        else:
            lut_results.append({
                "name": lut_name,
                "exists": True,
                "ffmpegExit": l_res["returncode"],
                "stderr": l_res["stderr"],
                "passed": False,
            })

    return {
        "passed": a_pass and b_pass and all(l["passed"] for l in lut_results),
        "clipA_quiet_24fps": {
            "passed": a_pass,
            "exitCode": res_a["returncode"],
            "wallSec": res_a["wallSec"],
            "inDurationSec": round(in_a_meta["durationSec"], 3),
            "outDurationSec": round(out_a_meta.get("durationSec", 0), 3),
            "trimmedSec": round(a_trimmed_sec, 3),
            "inLufs": round(in_a_lufs["input_i"], 2),
            "outLufs": round(out_a_lufs.get("input_i", -99), 2),
            "outTruePeak": round(out_a_lufs.get("input_tp", 0), 2),
            "lufsError": round(a_lufs_err, 2),
            "outRFrameRate": out_a_meta.get("rFrameRate"),
            "cfrCheck": out_a_cfr,
        },
        "clipB_loud_60fps": {
            "passed": b_pass,
            "exitCode": res_b["returncode"],
            "wallSec": res_b["wallSec"],
            "inDurationSec": round(in_b_meta["durationSec"], 3),
            "outDurationSec": round(out_b_meta.get("durationSec", 0), 3),
            "durationDiffSec": round(b_dur_diff, 3),
            "inLufs": round(in_b_lufs["input_i"], 2),
            "outLufs": round(out_b_lufs.get("input_i", -99), 2),
            "outTruePeak": round(out_b_lufs.get("input_tp", 0), 2),
            "lufsError": round(b_lufs_err, 2),
            "outRFrameRate": out_b_meta.get("rFrameRate"),
            "cfrCheck": out_b_cfr,
        },
        "cubeLuts": lut_results,
    }


# ============================================================================
# EXAM 5.2: TRANSCRIPTION ACCURACY (WINDOWS SAPI TTS -> faster-whisper tiny)
# ============================================================================
def synthesize_sapi_wav(text: str, out_wav: Path) -> float:
    ps_cmd = (
        "Add-Type -AssemblyName System.Speech; "
        "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
        "$s.Rate = 0; "
        f"$s.SetOutputToWaveFile('{str(out_wav)}'); "
        f"$s.Speak('{text.replace(chr(39), chr(39)*2)}'); "
        "$s.Dispose();"
    )
    run_cmd(["powershell", "-NoProfile", "-Command", ps_cmd], check=True)
    info = run_cmd(
        [
            FFPROBE, "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(out_wav),
        ],
        check=True,
    )
    return float(info["stdout"].strip())


def run_exam5_transcribe() -> dict[str, Any]:
    tr_dir = MEDIA_DIR / "transcribe"
    tr_dir.mkdir(parents=True, exist_ok=True)
    tts_wav = tr_dir / "tts_speech.wav"
    tts_mp4 = tr_dir / "tts_speech.mp4"
    out_dir = tr_dir / "out"

    gt_text = (
        "Individual paychecks supply eighty four percent of federal revenue. "
        "Corporate taxes fell to seven percent while the national debt crossed forty trillion dollars."
    )
    audio_dur = synthesize_sapi_wav(gt_text, tts_wav)

    run_cmd(
        [
            FFMPEG, "-y", "-v", "error",
            "-f", "lavfi", "-i", f"color=c=#faf6ee:s=1280x720:r=30:d={audio_dur + 0.3}",
            "-i", str(tts_wav),
            "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest",
            str(tts_mp4),
        ],
        check=True,
    )

    res = run_cmd(
        [
            str(VENV_PYTHON),
            str(TOOLS_DIR / "transcribe.py"),
            str(tts_mp4),
            "--model",
            "tiny",
            "--out-dir",
            str(out_dir),
        ],
        cwd=REPO_ROOT,
    )

    words_path = out_dir / "words.json"
    srt_path = out_dir / "captions.srt"
    if res["returncode"] != 0 or not words_path.exists():
        return {"passed": False, "exitCode": res["returncode"], "stderr": res["stderr"]}

    payload = json.loads(words_path.read_text(encoding="utf-8"))
    words = payload.get("words", [])
    transcript_norm = re.sub(r"[^a-z0-9\s%]", " ", payload.get("text", "").lower())

    keyword_groups = [
        ("individual", ["individual"]),
        ("paychecks", ["paycheck", "paychecks"]),
        ("supply", ["supply"]),
        ("84", ["84", "eighty"]),
        ("percent", ["percent", "%"]),
        ("federal", ["federal"]),
        ("revenue", ["revenue"]),
        ("corporate", ["corporate"]),
        ("taxes", ["tax", "taxes"]),
        ("7", ["7", "seven"]),
        ("national", ["national"]),
        ("debt", ["debt"]),
        ("40", ["40", "forty"]),
        ("trillion", ["trillion"]),
        ("dollars", ["dollar", "dollars"]),
    ]
    matched_kw, missed_kw = [], []
    for label, variants in keyword_groups:
        (matched_kw if any(v in transcript_norm for v in variants) else missed_kw).append(label)
    recall = len(matched_kw) / len(keyword_groups)

    monotonic_errors, bounds_errors = [], []
    prev_start = -1.0
    for idx, w in enumerate(words):
        s, e = float(w["startSec"]), float(w["endSec"])
        if e < s:
            monotonic_errors.append(f"word[{idx}] endSec < startSec")
        if s < prev_start - 0.001:
            monotonic_errors.append(f"word[{idx}] non-monotonic start")
        if s < -0.05 or e > audio_dur + 0.5:
            bounds_errors.append(f"word[{idx}] out of bounds")
        prev_start = s

    passed = (
        res["returncode"] == 0
        and len(words) > 0
        and recall >= 0.75
        and len(monotonic_errors) == 0
        and len(bounds_errors) == 0
        and srt_path.exists()
        and srt_path.stat().st_size > 10
    )
    return {
        "passed": passed,
        "exitCode": res["returncode"],
        "wallSec": res["wallSec"],
        "audioDurationSec": round(audio_dur, 3),
        "transcribedText": payload.get("text"),
        "wordCount": len(words),
        "keywordRecall": round(recall, 4),
        "matchedKeywords": matched_kw,
        "missedKeywords": missed_kw,
        "monotonicErrors": monotonic_errors,
        "boundsErrors": bounds_errors,
        "srtBytes": srt_path.stat().st_size if srt_path.exists() else 0,
    }


# ============================================================================
# EXAM 5.3: ROOM OBJECT SWAP (extract-plate, auto-person-mask, gemini-plate-edit --dry-run, omni-edit --dry-run)
# ============================================================================
def draw_synthetic_room_and_person(
    w: int, h: int, person_cx: int, include_person: bool, swap_fridge: bool
) -> np.ndarray:
    img = np.zeros((h, w, 3), dtype=np.uint8)
    y_grad = np.linspace(215, 240, h, dtype=np.uint8)[:, None]
    img[:, :, 0] = y_grad - 12  # B (warm cream wall)
    img[:, :, 1] = y_grad - 2   # G
    img[:, :, 2] = y_grad + 8   # R

    cv2.rectangle(img, (0, 820), (w, h), (58, 43, 28), -1)  # Navy desk
    cv2.line(img, (0, 820), (w, 820), (92, 164, 201), 4)    # Gold trim

    if not swap_fridge:
        cv2.rectangle(img, (1320, 140), (1760, 820), (235, 238, 240), -1)
        cv2.rectangle(img, (1320, 140), (1760, 820), (180, 185, 190), 4)
        cv2.line(img, (1320, 380), (1760, 380), (170, 175, 180), 4)
        cv2.rectangle(img, (1350, 220), (1368, 340), (150, 155, 160), -1)
        cv2.rectangle(img, (1350, 430), (1368, 610), (150, 155, 160), -1)
    else:
        cv2.rectangle(img, (1320, 140), (1760, 820), (42, 68, 108), -1)
        cv2.rectangle(img, (1320, 140), (1760, 820), (28, 45, 74), 8)
        for shelf_y in (300, 470, 640):
            cv2.rectangle(img, (1320, shelf_y), (1760, shelf_y + 18), (28, 45, 74), -1)
            for bx in range(1340, 1720, 36):
                color = ((bx * 37) % 140 + 40, (bx * 53) % 120 + 40, (bx * 71) % 140 + 60)
                cv2.rectangle(img, (bx, shelf_y - 110), (bx + 28, shelf_y), color, -1)

    if include_person:
        cv2.ellipse(img, (person_cx, 880), (230, 260), 0, 180, 360, (58, 43, 28), -1)
        pts = np.array([[person_cx - 55, 640], [person_cx + 55, 640], [person_cx, 820]], np.int32)
        cv2.fillPoly(img, [pts], (238, 246, 250))
        cv2.rectangle(img, (person_cx - 42, 540), (person_cx + 42, 665), (145, 178, 214), -1)
        cv2.ellipse(img, (person_cx, 410), (105, 138), 0, 0, 360, (158, 192, 228), -1)
        cv2.ellipse(img, (person_cx, 330), (108, 72), 0, 180, 360, (32, 36, 44), -1)
        cv2.ellipse(img, (person_cx - 40, 395), (14, 7), 0, 0, 360, (245, 245, 245), -1)
        cv2.ellipse(img, (person_cx + 40, 395), (14, 7), 0, 0, 360, (245, 245, 245), -1)
        cv2.circle(img, (person_cx - 40, 395), 6, (35, 40, 50), -1)
        cv2.circle(img, (person_cx + 40, 395), 6, (35, 40, 50), -1)
        cv2.line(img, (person_cx - 58, 372), (person_cx - 22, 370), (35, 38, 45), 5)
        cv2.line(img, (person_cx + 22, 370), (person_cx + 58, 372), (35, 38, 45), 5)
        cv2.line(img, (person_cx, 400), (person_cx - 6, 445), (130, 160, 195), 4)
        cv2.ellipse(img, (person_cx, 480), (28, 10), 0, 0, 180, (110, 122, 168), 4)

    return img


def run_exam5_swap() -> dict[str, Any]:
    swap_dir = MEDIA_DIR / "swap"
    swap_dir.mkdir(parents=True, exist_ok=True)
    src_video = swap_dir / "aroll_fridge.mp4"
    edited_plate = swap_dir / "edited_bookshelf_plate.png"
    extracted_plate = swap_dir / "extracted_clean_plate.png"
    mask_mp4 = swap_dir / "person_mask.mp4"
    comp_mp4 = swap_dir / "comp_out.mp4"
    omni_out = swap_dir / "omni_out.mp4"

    w, h, fps, n_frames = 1920, 1080, 30, 90
    cv2.imwrite(str(edited_plate), draw_synthetic_room_and_person(w, h, 720, False, True))

    proc = subprocess.Popen(
        [
            FFMPEG, "-y", "-v", "error",
            "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}", "-r", str(fps),
            "-i", "-",
            "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
            str(src_video),
        ],
        stdin=subprocess.PIPE,
    )
    assert proc.stdin is not None
    for i in range(n_frames):
        cx = int(720 + math.sin(i * 0.12) * 55)
        frame = draw_synthetic_room_and_person(w, h, cx, True, False)
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    if proc.wait() != 0:
        raise RuntimeError("Failed to generate synthetic swap video")

    swap_py = str(TOOLS_DIR / "room_object_swap.py")

    # 1. extract-plate
    ext_res = run_cmd(
        [str(VENV_PYTHON), swap_py, "extract-plate", str(src_video), "--out", str(extracted_plate), "--samples", "12"],
        cwd=REPO_ROOT,
    )
    ext_ok = False
    if ext_res["returncode"] == 0 and extracted_plate.exists():
        with Image.open(extracted_plate) as im:
            ext_ok = im.size == (1920, 1080)

    # 2. gemini-plate-edit --dry-run
    gem_res = run_cmd(
        [str(VENV_PYTHON), swap_py, "gemini-plate-edit", str(extracted_plate), "--dry-run"],
        cwd=REPO_ROOT,
    )
    gem_ok = gem_res["returncode"] == 0 and '"model":' in gem_res["stdout"]

    # 3. omni-edit (dry-run default)
    omni_res = run_cmd(
        [str(VENV_PYTHON), swap_py, "omni-edit", str(src_video), "--duration", "3", "--out", str(omni_out)],
        cwd=REPO_ROOT,
    )
    omni_manifest = omni_out.with_name(f"{src_video.stem}_omni_manifest.json")
    omni_ok = omni_res["returncode"] == 0 and omni_manifest.exists()

    # 4. auto-person-mask --composite-plate
    res = run_cmd(
        [
            str(VENV_PYTHON), swap_py, "auto-person-mask", str(src_video),
            "--composite-plate", str(edited_plate),
            "--out-mask", str(mask_mp4),
            "--out", str(comp_mp4),
        ],
        cwd=REPO_ROOT,
    )

    if res["returncode"] != 0 or not comp_mp4.exists() or not mask_mp4.exists():
        return {"passed": False, "exitCode": res["returncode"], "stderr": res["stderr"]}

    comp_meta = probe_media(comp_mp4)
    mask_cap = cv2.VideoCapture(str(mask_mp4))
    fg_fracs, soft_counts, bg_dark_fracs = [], [], []
    frame_cnt = 0
    while True:
        ok, m_bgr = mask_cap.read()
        if not ok:
            break
        gray = cv2.cvtColor(m_bgr, cv2.COLOR_BGR2GRAY)
        fg_fracs.append(float(np.mean(gray > 200)))
        bg_dark_fracs.append(float(np.mean(gray < 40)))
        soft_counts.append(int(np.sum((gray >= 15) & (gray <= 240))))
        frame_cnt += 1
    mask_cap.release()

    fps_throughput = round(n_frames / max(0.01, res["wallSec"]), 2)
    mean_fg = float(np.mean(fg_fracs)) if fg_fracs else 0.0
    mean_bg = float(np.mean(bg_dark_fracs)) if bg_dark_fracs else 0.0
    mean_soft = float(np.mean(soft_counts)) if soft_counts else 0.0
    backend_used = "mediapipe" if "backend=mediapipe" in res["stdout"] else "diff/other"
    res_ok = comp_meta.get("width") == 1920 and comp_meta.get("height") == 1080
    matte_valid = mean_fg > 0.02 and mean_bg > 0.40 and mean_soft > 500
    mask_passed = res["returncode"] == 0 and res_ok and matte_valid

    return {
        "passed": ext_ok and gem_ok and omni_ok and mask_passed,
        "extractPlate": {"passed": ext_ok, "exitCode": ext_res["returncode"], "wallSec": ext_res["wallSec"]},
        "geminiPlateEditDryRun": {"passed": gem_ok, "exitCode": gem_res["returncode"]},
        "omniEditDryRun": {"passed": omni_ok, "exitCode": omni_res["returncode"], "manifestExists": omni_manifest.exists()},
        "autoPersonMask": {
            "passed": mask_passed,
            "exitCode": res["returncode"],
            "wallSec": res["wallSec"],
            "fpsThroughput": fps_throughput,
            "backendUsed": backend_used,
            "compResolution": [comp_meta.get("width"), comp_meta.get("height")],
            "compFps": comp_meta.get("rFrameRate"),
            "maskFrameCount": frame_cnt,
            "meanForegroundRatio": round(mean_fg, 4),
            "meanBackgroundRatio": round(mean_bg, 4),
            "meanSoftEdgePixels": round(mean_soft, 1),
        },
    }


# ============================================================================
# EXAM 5.4: DAVINCI .FCPXML INTEGRITY VALIDATOR & SAMPLE REGENERATION
# ============================================================================
def parse_rational_frames(time_str: str, fps: int = 30) -> tuple[bool, int | None, float]:
    s = (time_str or "").strip()
    if s == "0s":
        return True, 0, 0.0
    m = re.fullmatch(r"(\d+)(?:/(\d+))?s", s)
    if not m:
        return False, None, -1.0
    num = int(m.group(1))
    den = int(m.group(2)) if m.group(2) else 1
    exact_frames = fractions.Fraction(num * fps, den)
    is_exact_int = exact_frames.denominator == 1
    return is_exact_int, (int(exact_frames) if is_exact_int else None), float(exact_frames)


def validate_fcpxml(
    xml_path: Path, plan_path: Path, require_media_on_disk: bool = False
) -> dict[str, Any]:
    if not xml_path.exists():
        return {"passed": False, "error": f"Missing {xml_path}"}
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    fps = int(plan.get("fps") or 30)
    expected_v2_beats = [b for b in plan.get("beats", []) if b.get("framing") != "talking-head-full"]

    try:
        tree = ET.parse(xml_path)
    except ET.ParseError as exc:
        return {"passed": False, "xmlValid": False, "error": str(exc)}

    root = tree.getroot()
    assets: dict[str, dict[str, Any]] = {}
    for asset_el in root.findall("./resources/asset"):
        aid = asset_el.attrib.get("id", "")
        rep = asset_el.find("media-rep")
        src = rep.attrib.get("src", "") if rep is not None else ""
        local_path = None
        if src.startswith("file://"):
            parsed = urllib.parse.urlparse(src)
            local_path = Path(
                urllib.parse.unquote(
                    parsed.path.lstrip("/") if os.name == "nt" and re.match(r"^/[A-Za-z]:", parsed.path) else parsed.path
                )
            )
        assets[aid] = {
            "id": aid,
            "name": asset_el.attrib.get("name"),
            "src": src,
            "existsOnDisk": local_path.exists() if local_path else False,
            "localPath": str(local_path) if local_path else None,
        }

    v2_clips, a2_clips, rational_math_errors = [], [], []
    for clip in root.findall(".//spine//asset-clip"):
        lane = clip.attrib.get("lane")
        if lane not in {"1", "-1"}:
            continue
        off_str = clip.attrib.get("offset", "")
        dur_str = clip.attrib.get("duration", "")
        off_ok, off_f, off_float = parse_rational_frames(off_str, fps)
        dur_ok, dur_f, dur_float = parse_rational_frames(dur_str, fps)
        if not off_ok or not dur_ok:
            rational_math_errors.append({"name": clip.attrib.get("name"), "offset": off_str, "duration": dur_str})
        item = {
            "ref": clip.attrib.get("ref"),
            "name": clip.attrib.get("name"),
            "offsetFrames": off_f if off_ok else off_float,
            "durationFrames": dur_f if dur_ok else dur_float,
            "endFrames": (off_f + dur_f) if (off_ok and dur_ok) else (off_float + dur_float),
        }
        (v2_clips if lane == "1" else a2_clips).append(item)

    v2_sorted = sorted(v2_clips, key=lambda c: c["offsetFrames"])
    v2_overlaps = []
    for i in range(1, len(v2_sorted)):
        if v2_sorted[i]["offsetFrames"] < v2_sorted[i - 1]["endFrames"]:
            v2_overlaps.append({
                "prev": v2_sorted[i - 1]["name"],
                "prevEnd": v2_sorted[i - 1]["endFrames"],
                "curr": v2_sorted[i]["name"],
                "currStart": v2_sorted[i]["offsetFrames"],
            })

    sfx_assets = [a for a in assets.values() if a["id"].startswith("r_sfx_")]
    missing_sfx_files = [a["localPath"] for a in sfx_assets if not a["existsOnDisk"]]
    aroll_asset = assets.get("r_aroll")
    aroll_exists = aroll_asset["existsOnDisk"] if aroll_asset else False
    ov_assets = [a for a in assets.values() if a["id"].startswith("r_ov_")]
    existing_ov_files = [a["localPath"] for a in ov_assets if a["existsOnDisk"]]

    beat_count_matches = len(v2_clips) == len(expected_v2_beats)
    passed = (
        len(rational_math_errors) == 0
        and len(v2_overlaps) == 0
        and len(missing_sfx_files) == 0
        and beat_count_matches
        and len(sfx_assets) > 0
        and (not require_media_on_disk or aroll_exists)
    )

    return {
        "xmlPath": str(xml_path),
        "xmlValid": True,
        "v2ClipCount": len(v2_clips),
        "expectedNonFullV2Count": len(expected_v2_beats),
        "beatCountMatchesPlan": beat_count_matches,
        "a2SfxClipCount": len(a2_clips),
        "uniqueSfxAssets": len(sfx_assets),
        "missingSfxFiles": missing_sfx_files,
        "arollExistsOnDisk": aroll_exists,
        "existingOverlayAssetCount": len(existing_ov_files),
        "rationalMathErrors": rational_math_errors,
        "v2Overlaps": v2_overlaps,
        "passed": passed,
    }


def run_exam5_fcpxml() -> dict[str, Any]:
    sample_xml = OUT_DIR / "sample-timeline.fcpxml"
    sample_plan = OUT_DIR / "sample-director-plan.json"
    before_regen = validate_fcpxml(sample_xml, sample_plan)

    # Regenerate studio/out/sample-timeline.fcpxml if stale
    regen_res = None
    if not before_regen.get("beatCountMatchesPlan"):
        regen_res = run_cmd(
            [
                "node",
                str(STUDIO_DIR / "scripts" / "export-fcpxml.mjs"),
                str(sample_plan),
                "--out",
                str(sample_xml),
            ],
            cwd=STUDIO_DIR,
        )
    after_regen = validate_fcpxml(sample_xml, sample_plan)

    sfx_dir = STUDIO_DIR / "public" / "sfx"
    wavs = sorted(sfx_dir.glob("*.wav")) if sfx_dir.exists() else []
    non_empty_wavs = [w.name for w in wavs if w.stat().st_size > 44]

    return {
        "wasStaleBeforeExam": not before_regen.get("beatCountMatchesPlan"),
        "beforeRegen": before_regen,
        "regenerated": regen_res is not None,
        "regenExitCode": regen_res["returncode"] if regen_res else 0,
        "afterRegen": after_regen,
        "publicSfxWavTotal": len(wavs),
        "publicSfxWavNonEmpty": len(non_empty_wavs),
    }


# ============================================================================
# EXAM 6 ALPHA VERIFICATION
# ============================================================================
def verify_rgba_frame(video_path: Path, out_png: Path, is_vp9: bool = False, frame_num: int = 45) -> dict[str, Any]:
    decode_codec = ["-c:v", "libvpx-vp9"] if is_vp9 else []
    cmd = [
        FFMPEG, "-y", "-v", "error",
        *decode_codec, "-i", str(video_path),
        "-vf", f"select=eq(n\\,{frame_num})",
        "-frames:v", "1", "-pix_fmt", "rgba", str(out_png),
    ]
    res = run_cmd(cmd)
    if res["returncode"] == 0 and out_png.exists():
        with Image.open(out_png) as im:
            arr = np.array(im.convert("RGBA"))
        a = arr[:, :, 3]
        return {
            "exists": True,
            "cornerAlpha": int(a[0, 0]),
            "semiTransparentPx": int(np.sum((a > 0) & (a < 255))),
            "opaquePx": int(np.sum(a == 255)),
            "alphaVerified": int(a[0, 0]) == 0 and int(np.sum((a > 0) & (a < 255))) > 100,
        }
    return {"exists": True, "alphaVerified": False, "stderr": res["stderr"]}


def verify_exam6_alpha() -> dict[str, Any]:
    speed_dir = BENCH_DIR / "speed"
    out = {}
    for label, fname, is_vp9 in [
        ("vp9_webm_yuva420p_bundled", "beat90_vp9_yuva420p_bundled.webm", True),
        ("prores_4444_yuva444p10le_bundled", "beat90_prores4444_yuva_bundled.mov", False),
    ]:
        fpath = speed_dir / fname
        if not fpath.exists():
            out[label] = {"exists": False}
            continue
        out[label] = verify_rgba_frame(fpath, speed_dir / f"{label}_f45.png", is_vp9=is_vp9, frame_num=45)
    return out


# ============================================================================
# LIVE END-TO-END run_pipeline.mjs (FULL STEPS 1-5 WITH --out-dir)
# ============================================================================
def run_live_e2e() -> dict[str, Any]:
    e2e_src_wav = MEDIA_DIR / "e2e_tts.wav"
    e2e_src_mp4 = BENCH_DIR / "e2e_input_5s.mp4"
    e2e_text = (
        "Individual paychecks now supply over eighty four percent of federal tax revenue. "
        "Corporate taxes fell to seven percent while the national debt crossed forty trillion dollars."
    )
    dur = synthesize_sapi_wav(e2e_text, e2e_src_wav)
    n_frames = max(120, int(round(dur * 30)))
    w, h, fps = 1280, 720, 30
    temp_vid = MEDIA_DIR / "e2e_vid_only.mp4"
    proc = subprocess.Popen(
        [
            FFMPEG, "-y", "-v", "error",
            "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}", "-r", str(fps),
            "-i", "-",
            "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
            str(temp_vid),
        ],
        stdin=subprocess.PIPE,
    )
    assert proc.stdin is not None
    for i in range(n_frames):
        cx = int(460 + math.sin(i * 0.1) * 25)
        fr = draw_synthetic_room_and_person(1920, 1080, cx, True, False)
        fr_small = cv2.resize(fr, (w, h), interpolation=cv2.INTER_AREA)
        proc.stdin.write(fr_small.tobytes())
    proc.stdin.close()
    proc.wait()

    run_cmd(
        [
            FFMPEG, "-y", "-v", "error",
            "-i", str(temp_vid),
            "-i", str(e2e_src_wav),
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
            str(e2e_src_mp4),
        ],
        check=True,
    )

    if E2E_TARGET_DIR.exists():
        shutil.rmtree(E2E_TARGET_DIR)

    res = run_cmd(
        [
            "node",
            str(TOOLS_DIR / "run_pipeline.mjs"),
            str(e2e_src_mp4),
            "--name",
            "e2e_project",
            "--out-dir",
            str(E2E_TARGET_DIR),
            "--lut",
            "editorial-warm",
            "--cut-silence",
            "--whisper-model",
            "tiny",
            "--render",
            "--codec",
            "prores",
            "--limit",
            "2",
        ],
        cwd=REPO_ROOT,
    )

    plan_file = E2E_TARGET_DIR / "director-plan.json"
    xml_file = E2E_TARGET_DIR / "timeline.fcpxml"
    manifest_file = E2E_TARGET_DIR / "overlays" / "overlay-manifest.json"
    aroll_prepped = E2E_TARGET_DIR / "aroll_prepped.mp4"
    words_file = E2E_TARGET_DIR / "transcript" / "words.json"
    srt_file = E2E_TARGET_DIR / "transcript" / "captions.srt"

    rendered_clips = []
    if manifest_file.exists():
        manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
        for c in manifest.get("clips", []):
            cp = Path(c["path"])
            clip_info: dict[str, Any] = {
                "beatId": c["beatId"],
                "framing": c.get("framing"),
                "codec": c.get("codec"),
                "exists": cp.exists(),
                "bytes": cp.stat().st_size if cp.exists() else 0,
                "path": str(cp),
            }
            if cp.exists():
                pm = probe_media(cp)
                clip_info["pixFmt"] = pm.get("pixFmt")
                clip_info["resolution"] = [pm.get("width"), pm.get("height")]
                if cp.suffix.lower() == ".mov":
                    alpha_info = verify_rgba_frame(
                        cp, E2E_TARGET_DIR / f"{c['beatId']}_f30.png", is_vp9=False, frame_num=30
                    )
                    clip_info["alphaCheck"] = alpha_info
            rendered_clips.append(clip_info)

    fcpxml_check = (
        validate_fcpxml(xml_file, plan_file, require_media_on_disk=True)
        if xml_file.exists() and plan_file.exists()
        else None
    )

    # Also test render-overlays --codec vp9 --limit 1 --dry-run to verify vp9 --pixel-format=yuva420p
    vp9_dry = run_cmd(
        [
            "node",
            str(STUDIO_DIR / "scripts" / "render-overlays.mjs"),
            str(plan_file),
            "--codec",
            "vp9",
            "--limit",
            "1",
            "--dry-run",
        ],
        cwd=STUDIO_DIR,
    ) if plan_file.exists() else {"returncode": 1, "stdout": ""}

    passed = (
        res["returncode"] == 0
        and aroll_prepped.exists()
        and words_file.exists()
        and srt_file.exists()
        and plan_file.exists()
        and manifest_file.exists()
        and len(rendered_clips) >= 1
        and all(c["exists"] and c["bytes"] > 1000 for c in rendered_clips)
        and all(
            c.get("alphaCheck", {}).get("alphaVerified", True)
            for c in rendered_clips
            if c.get("codec") == "prores"
        )
        and xml_file.exists()
        and (fcpxml_check is not None and fcpxml_check.get("passed", False))
        and "--pixel-format=yuva420p" in vp9_dry["stdout"]
    )

    return {
        "passed": passed,
        "exitCode": res["returncode"],
        "wallSec": res["wallSec"],
        "outDir": str(E2E_TARGET_DIR),
        "artifacts": {
            "arollPreppedExists": aroll_prepped.exists(),
            "arollPreppedBytes": aroll_prepped.stat().st_size if aroll_prepped.exists() else 0,
            "wordsJsonExists": words_file.exists(),
            "captionsSrtExists": srt_file.exists(),
            "directorPlanExists": plan_file.exists(),
            "overlayManifestExists": manifest_file.exists(),
            "renderedClips": rendered_clips,
            "timelineFcpxmlExists": xml_file.exists(),
        },
        "fcpxmlCheck": fcpxml_check,
        "vp9DryRunHasPixelFormat": "--pixel-format=yuva420p" in vp9_dry["stdout"],
        "stderrTail": res["stderr"].splitlines()[-10:] if res["stderr"] else [],
    }


def main() -> None:
    import sys

    BENCH_DIR.mkdir(parents=True, exist_ok=True)
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    stills_only = "--stills-only" in sys.argv

    print("=== Auditing Exam 1 Stills + Dual-Palette Readability (PIL + NumPy) ===")
    exam1_pixels = audit_exam1_stills()
    readability_audit = audit_dual_palette_readability()

    if stills_only:
        out_path = BENCH_DIR / "exam_stills_readability.json"
        out = {"exam1Pixels": exam1_pixels, "readabilityAudit": readability_audit}
        out_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
        print(f"Saved Stills & Readability audit -> {out_path}")
        if not exam1_pixels.get("allPassed") or not readability_audit.get("allPassed"):
            print("FAILURES:", json.dumps(readability_audit.get("failures", []), indent=2))
            sys.exit(1)
        return

    print("=== Running Exam 5.1: A-Roll Prep + All 3 .cube LUTs ===")
    exam5_aroll = run_exam5_aroll()

    print("=== Running Exam 5.2: Whisper Transcription ===")
    exam5_transcribe = run_exam5_transcribe()

    print("=== Running Exam 5.3: Room Object Swap (4 Subcommands) ===")
    exam5_swap = run_exam5_swap()

    print("=== Running Exam 5.4: DaVinci FCPXML Integrity + Sample Regen ===")
    exam5_fcpxml = run_exam5_fcpxml()

    print("=== Verifying Exam 6 Alpha Channels ===")
    exam6_alpha = verify_exam6_alpha()

    print("=== Running Live E2E run_pipeline.mjs (Full Steps 1-5) ===")
    e2e = run_live_e2e()

    out = {
        "exam1Pixels": exam1_pixels,
        "readabilityAudit": readability_audit,
        "exam5": {
            "arollPrep": exam5_aroll,
            "transcribe": exam5_transcribe,
            "roomObjectSwap": exam5_swap,
            "fcpxml": exam5_fcpxml,
        },
        "exam6AlphaVerify": exam6_alpha,
        "liveE2E": e2e,
    }
    out_path = BENCH_DIR / "exam_media_results.json"
    out_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"\nSaved Media benchmark results -> {out_path}")


if __name__ == "__main__":
    main()
