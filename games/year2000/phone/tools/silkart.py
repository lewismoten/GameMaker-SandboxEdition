"""Silkscreen QR codes and block art for the phone boards, written as KiCad gr_rect / gr_line items.

QR codes are made with OpenCV's QRCodeEncoder (Apache-2.0; see NOTICE.md), error correction L. The returned matrix
already has a two-module quiet border. The printed plate is silkscreen where a module is LIGHT (the quiet border
included) and bare soldermask where it is dark, so the code reads the usual way (dark on light). The back-side
plates are mirrored so they read correctly when the board is turned over.

Block art is the pixel pictures of the game's sprites (Dex Dynamo, from games/year2000/src/sprites/sprites.ts):
one tone is silkscreen, so tone is shown with diagonal hatching and cross-hatching, and skin stays bare.
"""
import cv2


def qr_matrix(text, version=0):
    p = cv2.QRCodeEncoder_Params()
    p.version = version
    p.correction_level = 0
    m = cv2.QRCodeEncoder.create(p).encode(text)
    return [[bool(v) for v in row] for row in m]      # True = light module


def _rect(layer, x0, y0, x1, y1, uid, f):
    return (f'(gr_rect (start {f(x0)} {f(y0)}) (end {f(x1)} {f(y1)}) (stroke (width 0) (type solid)) (fill yes) '
            f'(layer "{layer}") (uuid "{uid()}"))')


def _line(layer, x0, y0, x1, y1, w, uid, f):
    return (f'(gr_line (start {f(x0)} {f(y0)}) (end {f(x1)} {f(y1)}) (stroke (width {w}) (type solid)) '
            f'(layer "{layer}") (uuid "{uid()}"))')


def qr_plate(layer, x, y, module, text, uid, f, version=0):
    """Silk items for a QR code whose top-left is (x, y); returns (items, size_mm, modules)."""
    m = qr_matrix(text, version)
    n = len(m)
    back = layer.startswith("B.")
    out = []
    for r in range(n):
        c = 0
        while c < n:
            if not m[r][c]:
                c += 1
                continue
            c1 = c
            while c1 + 1 < n and m[r][c1 + 1]:
                c1 += 1
            a, b = (n - 1 - c1, n - 1 - c) if back else (c, c1)
            out.append(_rect(layer, x + a * module, y + r * module, x + (b + 1) * module, y + (r + 1) * module, uid, f))
            c = c1 + 1
    return out, n * module, n


def _hatch(kind, layer, px0, py0, size, ox, oy, step, w, uid, f):
    """Hatch lines clipped to one pixel square; the phase is global (ox, oy) so lines join across pixels."""
    out = []
    for ch in kind:
        s = 1 if ch == "/" else -1          # lines with s*(x-ox) + (y-oy) = c
        k = step * 1.41421356
        vals = [s * (px - ox) + (py - oy) for px in (px0, px0 + size) for py in (py0, py0 + size)]
        c = (int(min(vals) // k) + 1) * k
        while c < max(vals):
            pts = []
            for xx in (px0, px0 + size):
                yy = c - s * (xx - ox) + oy
                if py0 - 1e-9 <= yy <= py0 + size + 1e-9:
                    pts.append((xx, yy))
            for yy in (py0, py0 + size):
                xx = (c - (yy - oy)) / s + ox
                if px0 - 1e-9 < xx < px0 + size + 1e-9:
                    pts.append((xx, yy))
            pts = sorted(set((round(a, 4), round(b, 4)) for a, b in pts))
            if len(pts) >= 2:
                out.append(_line(layer, pts[0][0], pts[0][1], pts[-1][0], pts[-1][1], w, uid, f))
            c += k
    return out


def block_art(layer, rows, tones, x, y, px, uid, f, w=0.15):
    """rows: strings, one char per pixel; tones: char -> ("solid",) or (hatch kinds like "/\\\\", spacing mm).
    On a B layer the picture is mirrored so it reads from the back. Returns (items, width_mm, height_mm)."""
    back = layer.startswith("B.")
    cols = max(len(r) for r in rows)
    out = []
    for r, row in enumerate(rows):
        for c, ch in enumerate(row):
            t = tones.get(ch)
            if not t:
                continue
            cc = (cols - 1 - c) if back else c
            x0, y0 = x + cc * px, y + r * px
            if t[0] == "solid":
                out.append(_rect(layer, x0, y0, x0 + px, y0 + px, uid, f))
            else:
                out += _hatch(t[0], layer, x0, y0, px, x, y, t[1], w, uid, f)
    return out, cols * px, len(rows) * px
