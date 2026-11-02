#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import struct
import zlib
from math import lcm
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "dice"

SIZE_1X = 80
SCALES = (1, 2, 3)
RENDER_SCALE = lcm(*SCALES)

PIP_LAYOUT: dict[int, list[tuple[float, float]]] = {
    1: [(0.0, 0.0)],
    2: [(-0.42, 0.42), (0.42, -0.42)],
    3: [(-0.42, 0.42), (0.0, 0.0), (0.42, -0.42)],
    4: [(-0.42, 0.42), (0.42, 0.42), (-0.42, -0.42), (0.42, -0.42)],
    5: [(-0.42, 0.42), (0.42, 0.42), (0.0, 0.0), (-0.42, -0.42), (0.42, -0.42)],
    6: [
        (-0.42, 0.50),
        (0.42, 0.50),
        (-0.42, 0.00),
        (0.42, 0.00),
        (-0.42, -0.50),
        (0.42, -0.50),
    ],
}

PIP_RADIUS = 0.155
BOX = np.array([0.70, 0.70, 0.70], dtype=np.float64)
ROUND = 0.34
UV_INSET = 0.35
AXIS_RIGHT = 0
AXIS_TOP = 1
AXIS_FRONT = 2
SIDE_FACES = {
    1: (3, 2),
    2: (6, 3),
    3: (1, 2),
    4: (5, 1),
    5: (3, 6),
    6: (2, 4),
}


def write_png(path: Path, rgba: np.ndarray) -> None:
    if rgba.dtype != np.uint8:
        raise TypeError(f"PNG pixels must be uint8, got {rgba.dtype}")
    height, width, _ = rgba.shape
    raw = b"".join(b"\x00" + rgba[y].tobytes() for y in range(height))

    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def look_at(eye: np.ndarray, target: np.ndarray, up: np.ndarray) -> np.ndarray:
    z = target - eye
    z = z / np.linalg.norm(z)
    x = np.cross(z, up)
    x = x / np.linalg.norm(x)
    y = np.cross(x, z)
    return np.stack([x, y, z], axis=0)


def sd_round_box(p: np.ndarray) -> np.ndarray:
    q = np.abs(p) - BOX + ROUND
    outside = np.linalg.norm(np.maximum(q, 0.0), axis=-1)
    inside = np.minimum(np.maximum(q[..., 0], np.maximum(q[..., 1], q[..., 2])), 0.0)
    return outside + inside - ROUND


def normal_at(p: np.ndarray) -> np.ndarray:
    e = 0.0015
    dx = np.array([e, 0.0, 0.0])
    dy = np.array([0.0, e, 0.0])
    dz = np.array([0.0, 0.0, e])
    n = np.stack(
        [
            sd_round_box(p + dx) - sd_round_box(p - dx),
            sd_round_box(p + dy) - sd_round_box(p - dy),
            sd_round_box(p + dz) - sd_round_box(p - dz),
        ],
        axis=-1,
    )
    length = np.linalg.norm(n, axis=-1, keepdims=True)
    return n / np.maximum(length, 1e-8)


def face_uv(p: np.ndarray, axis: int) -> tuple[np.ndarray, np.ndarray]:
    span = BOX[0] - ROUND * UV_INSET
    if axis == AXIS_RIGHT:
        u = p[..., AXIS_FRONT] / span
        v = p[..., AXIS_TOP] / span
    elif axis == AXIS_TOP:
        u = p[..., AXIS_RIGHT] / span
        v = -p[..., AXIS_FRONT] / span
    else:
        u = p[..., AXIS_RIGHT] / span
        v = p[..., AXIS_TOP] / span
    return u, v


def pip_mask(u: np.ndarray, v: np.ndarray, layout: list[tuple[float, float]]) -> np.ndarray:
    mask = np.zeros(u.shape, dtype=bool)
    for px, py in layout:
        mask |= (u - px) ** 2 + (v - py) ** 2 <= PIP_RADIUS**2
    return mask


def downsample(rgba: np.ndarray, factor: int) -> np.ndarray:
    if factor == 1:
        return rgba
    h, w, _ = rgba.shape
    nh, nw = h // factor, w // factor
    grouped = rgba[: nh * factor, : nw * factor].reshape(nh, factor, nw, factor, 4)
    return np.clip(np.rint(grouped.mean(axis=(1, 3))), 0, 255).astype(np.uint8)


def render_die(value: int, size: int) -> np.ndarray:
    eye = np.array([1.35, 1.58, 1.92], dtype=np.float64)
    eye = eye / np.linalg.norm(eye) * 2.78
    target = np.array([0.0, -0.08, 0.0])
    cam = look_at(eye, target, np.array([0.0, 1.0, 0.0]))
    fov = 0.42
    light = np.array([0.18, 0.95, 0.48], dtype=np.float64)
    light = light / np.linalg.norm(light)
    fill = np.array([-0.45, 0.28, 0.55], dtype=np.float64)
    fill = fill / np.linalg.norm(fill)

    ys, xs = np.mgrid[0:size, 0:size]
    ndc_x = (xs + 0.5) / size * 2.0 - 1.0
    ndc_y = 1.0 - (ys + 0.5) / size * 2.0
    dirs = ndc_x[..., None] * cam[0] * fov + ndc_y[..., None] * cam[1] * fov + cam[2]
    dirs = dirs / np.linalg.norm(dirs, axis=-1, keepdims=True)

    t = np.full((size, size), 1.35, dtype=np.float64)
    live = np.ones((size, size), dtype=bool)
    hit_t = np.full((size, size), np.inf)
    for _ in range(48):
        if not live.any():
            break
        p = eye + dirs * t[..., None]
        d = sd_round_box(p)
        hit = live & (d < 0.0018)
        hit_t = np.where(hit, t, hit_t)
        live = live & ~hit & (t < 7.4) & (d < 1.6)
        t = np.where(live, t + np.clip(d, 0.0018, 0.28), t)

    hit = np.isfinite(hit_t)
    p = eye + dirs * np.where(hit, hit_t, 0.0)[..., None]
    n = normal_at(p)
    axis = np.abs(p).argmax(axis=-1)
    sign = np.take_along_axis(p, axis[..., None], axis=-1)[..., 0]

    albedo = np.array([0.97, 0.97, 0.96])
    color = np.zeros((size, size, 3), dtype=np.float64)
    ndotl = np.clip(np.sum(n * light, axis=-1), 0.0, 1.0)
    wrap = np.clip(ndotl * 0.55 + 0.40, 0.0, 1.0)
    fill_amt = np.clip(np.sum(n * fill, axis=-1), 0.0, 1.0) * 0.16
    sky = np.clip(n[..., 1] * 0.10 + 0.10, 0.0, 1.0)
    half = n - 2.0 * np.sum(n * dirs, axis=-1, keepdims=True) * dirs
    spec = np.clip(np.sum(half * light, axis=-1), 0.0, 1.0) ** 48 * 0.08
    shade = np.clip(wrap * 0.66 + fill_amt + sky, 0.0, 0.94)
    color[...] = albedo * shade[..., None] + spec[..., None]

    top, right = SIDE_FACES[value]
    for axis_id, face_value, need_pos in (
        (AXIS_FRONT, value, True),
        (AXIS_TOP, top, True),
        (AXIS_RIGHT, right, True),
    ):
        on_face = hit & (axis == axis_id) & ((sign > 0) if need_pos else (sign < 0))
        if not on_face.any():
            continue
        u, v = face_uv(p, axis_id)
        pips = pip_mask(u, v, PIP_LAYOUT[face_value]) & on_face
        color[pips] = np.array([0.07, 0.07, 0.08])

    rgb = np.clip(color, 0.0, 1.0)
    alpha = hit.astype(np.float64)
    out = np.zeros((size, size, 4), dtype=np.float64)
    out[..., :3] = rgb * alpha[..., None]
    out[..., 3] = alpha
    return np.clip(np.rint(out * 255.0), 0, 255).astype(np.uint8)


def render_shadow(size: int) -> np.ndarray:
    ys, xs = np.mgrid[0:size, 0:size]
    gx = (xs + 0.5) / size * 2.0 - 1.0
    gy = 1.0 - (ys + 0.5) / size * 2.0
    shadow = np.exp(-((gx / 0.52) ** 2 + ((gy + 0.08) / 0.26) ** 2)) * 0.48
    out = np.zeros((size, size, 4), dtype=np.float64)
    out[..., :3] = 0.02
    out[..., 3] = shadow
    return np.clip(np.rint(out * 255.0), 0, 255).astype(np.uint8)


def rotate_rgba(src: np.ndarray, degrees: float) -> np.ndarray:
    rad = np.deg2rad(degrees)
    c, s = np.cos(rad), np.sin(rad)
    h, w, _ = src.shape
    cy, cx = (h - 1) / 2.0, (w - 1) / 2.0
    ys, xs = np.mgrid[0:h, 0:w]
    dx, dy = xs - cx, ys - cy
    sx = (c * dx + s * dy + cx).astype(np.int32)
    sy = (-s * dx + c * dy + cy).astype(np.int32)
    valid = (sx >= 0) & (sx < w) & (sy >= 0) & (sy < h)
    out = np.zeros_like(src)
    out[valid] = src[sy[valid], sx[valid]]
    return out


def blit(dst: np.ndarray, src: np.ndarray, x: int, y: int) -> None:
    h, w, _ = src.shape
    x0, y0 = max(x, 0), max(y, 0)
    x1, y1 = min(x + w, dst.shape[1]), min(y + h, dst.shape[0])
    sx0, sy0 = x0 - x, y0 - y
    patch = src[sy0 : sy0 + (y1 - y0), sx0 : sx0 + (x1 - x0)]
    a = patch[..., 3:4].astype(np.float64) / 255.0
    region = dst[y0:y1, x0:x1].astype(np.float64)
    dst[y0:y1, x0:x1] = np.clip(region * (1.0 - a) + patch.astype(np.float64) * a, 0, 255).astype(np.uint8)


def render_roll_strip(die: np.ndarray, shadow: np.ndarray) -> np.ndarray:
    cell = die.shape[0]
    frames = [
        (-38, 54.0, 0.45),
        (-12, 180.0, 0.62),
        (0, 252.0, 1.0),
        (-14, 317.0, 1.0),
        (0, 346.0, 1.0),
        (0, 0.0, 1.0),
    ]
    strip = np.zeros((cell + 24, cell * len(frames), 4), dtype=np.uint8)
    for i, (dy, rot, grow) in enumerate(frames):
        ox = i * cell
        sh = shadow.astype(np.float64)
        sh[..., 3] = np.clip(sh[..., 3] * grow, 0, 255)
        blit(strip, sh.astype(np.uint8), ox, 18)
        blit(strip, rotate_rgba(die, rot), ox, 8 + dy)
    return strip


def main(preview: Path | None = None) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    hi = SIZE_1X * RENDER_SCALE
    strip = np.zeros((SIZE_1X * 3, SIZE_1X * 3 * 6, 4), dtype=np.uint8)
    for value in range(1, 7):
        rgba_hi = render_die(value, hi)
        strip[:, (value - 1) * SIZE_1X * 3 : value * SIZE_1X * 3] = downsample(rgba_hi, 2)
        for scale in SCALES:
            factor = RENDER_SCALE // scale
            rgba = downsample(rgba_hi, factor)
            name = f"face-{value}.png" if scale == 1 else f"face-{value}@{scale}x.png"
            write_png(OUT / name, rgba)
            print(f"wrote {name} {rgba.shape[1]}x{rgba.shape[0]}")
    shadow_hi = render_shadow(hi)
    for scale in SCALES:
        factor = RENDER_SCALE // scale
        rgba = downsample(shadow_hi, factor)
        name = "shadow.png" if scale == 1 else f"shadow@{scale}x.png"
        write_png(OUT / name, rgba)
    layout = {
        str(face): {"count": len(pips), "pips": pips}
        for face, pips in PIP_LAYOUT.items()
    }
    (OUT / "pip-layout.json").write_text(json.dumps(layout, indent=2) + "\n")
    print(f"wrote {OUT / 'pip-layout.json'}")
    if preview is not None:
        preview.mkdir(parents=True, exist_ok=True)
        write_png(preview / "faces-strip.png", strip)
        write_png(
            preview / "roll-strip.png",
            render_roll_strip(downsample(render_die(5, hi), 2), downsample(shadow_hi, 2)),
        )
        print(f"wrote previews in {preview}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", type=Path, default=None)
    args = parser.parse_args()
    main(preview=args.preview)
