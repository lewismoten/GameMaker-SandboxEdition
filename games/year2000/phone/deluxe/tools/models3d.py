"""Simple, honest 3D models (boxes and cylinders, right size and color) for every footprint.

Written as VRML 2.0 into kicad/3d/, one file per (part look, rotation), centered on the footprint
origin (the middle of its pad box). Coordinates in a model file are footprint coordinates in mm:
x right, y DOWN the board (the same as the footprint), z up out of the board face the part is
mounted on. KiCad flips the model for parts on the back. Heights are typical for the example parts.
Where KiCad has a stock model (DIP, TO-92 ...) these are deliberately simpler: the stock models
start at pin 1 and would need per-part offsets for the rotated and mirrored copies.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from step_writer import write_step  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kicad", "models")

BLACK, GREY, SILVER = (0.08, 0.08, 0.09), (0.45, 0.45, 0.48), (0.78, 0.78, 0.8)
TAN, BLUE, ORANGE, YELLOW = (0.80, 0.68, 0.48), (0.12, 0.25, 0.6), (0.9, 0.5, 0.12), (0.9, 0.8, 0.2)
RED, DARKRED, GREEN, WHITE = (0.85, 0.12, 0.1), (0.35, 0.05, 0.05), (0.1, 0.5, 0.2), (0.92, 0.92, 0.9)
IRBLACK = (0.15, 0.04, 0.05)


def box(cx, cy, z0, sx, sy, sz, col):
    return ("box", cx, cy, z0, sx, sy, sz, col)


def cyl(cx, cy, z0, d, h, col):
    return ("cyl", cx, cy, z0, d, h, col)


def pins_dip(n, w=7.62):
    out = []
    h = n // 2
    for i in range(h):
        for sx in (-w / 2, w / 2):
            out.append(box(sx, (i - (h - 1) / 2) * 2.54, 0, 0.5, 0.5, 3.0, SILVER))
    return out


def spec(kind, variant=""):
    """List of primitives for a footprint kind, unrotated, in footprint coordinates."""
    if kind.startswith("dip"):
        n = int(kind[3:])
        L = n // 2 * 2.54 - 0.6
        return [box(0, 0, 0.6, 6.4, L, 3.4, BLACK), box(0, -L / 2 + 0.9, 4.0, 1.2, 0.8, 0.1, GREY)] + pins_dip(n)
    if kind == "axial":
        return [box(0, 0, 0.4, 3.2, 1.8, 1.8, TAN if variant != "alt" else BLUE), box(-1.9, 0, 0.9, 0.7, 0.7, 0.7, SILVER), box(1.9, 0, 0.9, 0.7, 0.7, 0.7, SILVER)]
    if kind == "ceramic":
        return [box(0, 0, 0.5, 4.0, 2.6, 4.6, ORANGE)]
    if kind == "elec":
        if variant == "big":
            return [cyl(0, 0, 0, 6.3, 11.0, BLUE)]
        return [cyl(0, 0, 0, 5.0, 8.0, BLUE)]
    if kind in ("to92", "to92r"):
        return [box(0, 0.2, 0.3, 4.8, 3.8, 4.6, BLACK)]
    if kind == "xtal":
        return [box(0, 0, 0.3, 11.0, 4.6, 3.8, SILVER)]
    if kind == "led":      # 5 mm LED lying down, dome toward -y (off the top edge)
        return [box(0, -4.5, 1.0, 5.0, 8.6, 5.0, (0.85, 0.2, 0.2)), box(0, 0, 0.0, 6.0, 1.0, 0.6, (0.85, 0.2, 0.2))]
    if kind == "photo":    # PIN photodiode on its side, window toward -y
        return [box(0, -1.5, 0.8, 5.4, 2.7, 4.3, IRBLACK)]
    if kind == "disp4":
        return [box(0, 0, 0.5, 30.0, 14.0, 7.0, DARKRED), box(0, 0, 7.5, 28.0, 12.0, 0.2, RED)]
    if kind == "mic":
        return [box(-1.27, 3.0, 0.4, 1.0, 6.0, 1.0, RED), box(1.27, 3.0, 0.4, 1.0, 6.0, 1.0, BLACK)]     # the capsule is in the shell; twisted-pair stubs
    if kind == "spk":
        return [cyl(0, 0, 0.5, 24.0, 4.0, BLACK), cyl(0, 0, 4.5, 8.0, 0.4, GREY)]
    if kind == "usw":
        return [box(0, 0, 0.3, 12.8, 6.5, 10.2, BLUE), box(5.0, 0.0, 10.5, 8.0, 0.8, 0.4, SILVER)]
    if kind == "tact":
        return [box(0, 0, 0.3, 6.0, 6.0, 3.6, BLACK), cyl(0, 0, 3.9, 3.5, 0.8, GREY)]
    if kind == "slide":
        return [box(0, 0, 0.3, 10.0, 4.6, 5.0, SILVER), box(0, -1.0, 5.3, 3.0, 2.0, 3.0, BLACK)]
    if kind == "thumb":    # side thumbwheel pot: body on the board, a 10 mm wheel (axis along the pin row) standing 1.5 mm past the board edge
        return [box(0, 0, 0.3, 10.0, 8.0, 4.9, BLUE), box(0, 0, 3.55, 3.2, 10.0, 4.1, SILVER), box(0, 0, 0.6, 3.2, 4.1, 10.0, SILVER), box(0, 0, 1.6, 3.2, 8.0, 8.0, SILVER)]
    if kind == "batt":     # 4 x AAA holder in the shell's battery bay below the board; two wires to the pads (shell.ts continues them)
        return [box(-5.08, 3.5, 0.4, 1.4, 7.0, 1.4, RED), box(5.08, 3.5, 0.4, 1.4, 7.0, 1.4, BLACK)]
    raise KeyError(kind)


def rotate(prims, a):
    out = []
    for p in prims:
        t, cx, cy = p[0], p[1], p[2]
        r = {0: (cx, cy), 90: (-cy, cx), 180: (-cx, -cy), 270: (cy, -cx)}[a % 360]
        if t == "box":
            _, _, _, z0, sx, sy, sz, col = p
            if a % 180:
                sx, sy = sy, sx
            out.append(("box", r[0], r[1], z0, sx, sy, sz, col))
        else:
            out.append((t, r[0], r[1]) + p[3:])
    return out


def wrl(prims):
    s = ["#VRML V2.0 utf8"]
    for p in prims:
        if p[0] == "box":
            _, cx, cy, z0, sx, sy, sz, col = p
            geo = f"Box {{ size {sx:.3f} {sy:.3f} {sz:.3f} }}"
            tr = (cx, -cy, z0 + sz / 2)
        else:
            _, cx, cy, z0, d, h, col = p
            geo = f"Cylinder {{ radius {d / 2:.3f} height {h:.3f} }}"
            tr = (cx, -cy, z0 + h / 2)
        # VRML Cylinder stands along y; rotate it to stand along z (up).
        rotc = "rotation 1 0 0 1.5707963" if p[0] == "cyl" else ""
        s.append(f"Transform {{ translation {tr[0]:.3f} {tr[1]:.3f} {tr[2]:.3f} {rotc} children Shape {{ "
                 f"appearance Appearance {{ material Material {{ diffuseColor {col[0]:.2f} {col[1]:.2f} {col[2]:.2f} }} }} geometry {geo} }} }}")
    return "\n".join(s) + "\n"


def _poly(p):
    """(CCW polygon in model coordinates (y up), z0, z1, color) for one primitive."""
    if p[0] == "box":
        _, cx, cy, z0, sx, sy, sz, col = p
        cy = -cy
        pts = [(cx - sx / 2, cy - sy / 2), (cx + sx / 2, cy - sy / 2), (cx + sx / 2, cy + sy / 2), (cx - sx / 2, cy + sy / 2)]
        return pts, z0, z0 + sz, col
    _, cx, cy, z0, d, h, col = p
    cy = -cy
    pts = [(cx + d / 2 * math.cos(2 * math.pi * i / 24), cy + d / 2 * math.sin(2 * math.pi * i / 24)) for i in range(24)]
    return pts, z0, z0 + h, col


def write_model(kind, variant, rot, side="F"):
    """KiCad flips a back-side model about the x axis; the footprint's pads are already mirrored, so the baked
    geometry for the back is turned 180 degrees extra (checked against the GLB export by glb_check.py)."""
    os.makedirs(OUT, exist_ok=True)
    base = f"{kind}{'_' + variant if variant else ''}_r{rot % 360}{'_back' if side == 'B' else ''}"
    prims = rotate(spec(kind, variant), rot + (180 if side == "B" else 0))
    open(os.path.join(OUT, base + ".wrl"), "w").write(wrl(prims))
    write_step(os.path.join(OUT, base + ".step"), base, [_poly(p) for p in prims])
    return base + ".wrl"
