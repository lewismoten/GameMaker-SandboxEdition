#!/usr/bin/env python3
"""Rewrites kicad/3d/*.wrl and *.step for every placed part (uses kicad/placement.json), without re-routing the board."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import models3d  # noqa: E402
from footprints import FP  # noqa: E402

pl = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kicad", "placement.json")))
bykind = {v.name: k for k, v in FP.items()}
n = 0
for ref, p in pl.items():
    if ref.startswith("_") or p["fp"] not in bykind:
        continue
    var = "big" if ref == "C21" else "tant" if ref == "C2" else ""
    models3d.write_model(bykind[p["fp"]], var, p["rot"], p["side"])
    n += 1
print("models for", n, "parts")
