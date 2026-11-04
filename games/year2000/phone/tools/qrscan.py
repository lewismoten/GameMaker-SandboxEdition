#!/usr/bin/env python3
"""Decodes the silkscreen QR codes in a variant's rendered back preview (<variant>/out/back.png) with OpenCV's QR
detector and compares them with the URLs gen_pcb.py meant (<variant>/kicad/qr_spots.json). usage: qrscan.py <variant dir>
Exit 1 if one does not decode to its URL. A preview is not a printed board: it shows the layout scans, not that a phone
camera reads 0.44 to 0.5 mm modules at a board house's silkscreen resolution."""
import json
import os
import sys

import cv2

d = sys.argv[1]
spots = json.load(open(os.path.join(d, "kicad", "qr_spots.json")))
im = cv2.imread(os.path.join(d, "out", "back.png"))
bw = spots["board_width"]
s = im.shape[1] / bw
bad = 0
for name, q in spots["codes"].items():
    x, y, w = q["x"], q["y"], q["size"]
    x0, x1 = int((bw - (x + w)) * s) - 25, int((bw - x) * s) + 25
    y0, y1 = int(y * s) - 25, int((y + w) * s) + 25
    g = cv2.cvtColor(im[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
    val = ""
    for img in (g, cv2.resize(g, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST), 255 - g):
        val, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
        if val:
            break
    ok = val == q["url"]
    print(f"QR {name} ({q['modules']} modules of {q['module_mm']} mm):", "decodes to its URL" if ok else f"FAILED, got {val!r}")
    bad += not ok
sys.exit(1 if bad else 0)
