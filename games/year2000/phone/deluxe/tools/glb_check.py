#!/usr/bin/env python3
"""Checks out/phone.glb against kicad/placement.json: each component's mesh must sit on the right side of the
board, over its footprint, at a sensible height. Prints the axes found and any part that is off.
usage: glb_check.py [file.glb]   (exit 1 if a part is off)"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import glb_tool as g  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "out", "phone.glb")
pl = json.load(open(os.path.join(HERE, "..", "kicad", "placement.json")))
js, b = g.read_glb(path)
verts = {}
for name, m, mesh in g.walk(js):
    for nm, col, vs, idx in g.prims(js, b, name, m, mesh):
        verts.setdefault(nm, []).extend(vs)
print("meshes:", len(verts), " axes: first part", next(iter(verts)))
bad = 0
H = pl["_board"]["h"]
for ref, p in sorted(pl.items()):
    if ref.startswith("_"):
        continue
    vs = verts.get(ref)
    if not vs:
        print("MISSING", ref)
        bad += 1
        continue
    # glTF is y-up, metres: x = board x, z = -board y (assumed; checked below), y = height above the board's mid-plane
    xs = [v[0] * 1000 for v in vs]
    ys = [v[1] * 1000 for v in vs]
    zs = [v[2] * 1000 for v in vs]
    cx, cz = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2
    top, bot = max(ys), min(ys)
    side_ok = (bot < 0 and top < 0.5) if p["side"] == "B" else (top > 0 and bot > -0.5)
    near_x = abs(cx - p["x"]) < 40
    near_y = abs(cz - p["y"]) < (70 if ref == "BT1" else 40)      # BT1's holder body sits behind the dial, 63 mm from its pads
    flag = "" if side_ok and near_x and near_y else "  <-- CHECK"
    if flag:
        bad += 1
    if flag or ref in ("U4", "D2", "DS1", "LS1", "SW4", "BT1", "C21", "U6"):
        print(f"{ref:5s} side {p['side']} want ({p['x']:.1f},{p['y']:.1f}) got x {cx:.1f} z {cz:.1f}  height {bot:.1f}..{top:.1f}{flag}")
print("parts off:", bad)
sys.exit(1 if bad else 0)
