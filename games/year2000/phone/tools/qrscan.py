#!/usr/bin/env python3
"""Decodes the silkscreen QR codes in a variant's rendered back preview (<variant>/out/back.png) with OpenCV's QR
detector and compares them with the URLs gen_pcb.py meant (<variant>/kicad/qr_spots.json). usage: qrscan.py <variant dir>
The preview's page has a margin around the board, so each code is found by looking in a window around where the board's
outline puts it. Exit 1 if one does not decode to its URL. A preview is not a printed board: it shows the layout scans, not that
a phone camera reads 0.44 to 0.5 mm modules at a board house's silkscreen resolution."""
import json
import os
import sys

import cv2

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np  # noqa: E402
from blankspots import board_box  # noqa: E402

d = sys.argv[1]
spots = json.load(open(os.path.join(d, "kicad", "qr_spots.json")))
im = cv2.imread(os.path.join(d, "out", "back.png"))
bw = spots["board_width"]
bh = json.load(open(os.path.join(d, "mechanical", "interface.json")))["board"]["height"]
x0, x1, y0, y1 = board_box(im[..., ::-1].astype(int))
sx, sy = (x1 - x0) / bw, (y1 - y0) / bh
bad = 0
for name, q in spots["codes"].items():
    x, y, w = q["x"], q["y"], q["size"]
    # mirrored: the board's right edge (x = bw) is at the picture's left edge
    a0, a1 = int(x1 - (x + w) * sx) - 25, int(x1 - x * sx) + 25
    b0, b1 = int(y0 + y * sy) - 25, int(y0 + (y + w) * sy) + 25
    g = cv2.cvtColor(im[max(0, b0):b1, max(0, a0):a1], cv2.COLOR_BGR2GRAY)
    val = ""
    for img in (g, cv2.resize(g, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST), 255 - g):
        val, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
        if val:
            break
    ok = val == q["url"]
    print(f"QR {name} ({q['modules']} modules of {q['module_mm']} mm):", "decodes to its URL" if ok else f"FAILED, got {val!r}")
    bad += not ok
sys.exit(1 if bad else 0)
