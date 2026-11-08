#!/usr/bin/env python3
"""Lists the biggest blank squares on a variant's rendered board preview (out/front.png or out/back.png): where a QR code or
a picture can go on the silkscreen without covering a pad, a via's mask opening, white text or a hole. usage:
  blankspots.py <variant dir> [front|back ...]      writes <variant>/out/blank-spots.txt and prints it
The preview's page is a little bigger than the board (KiCad adds a margin), so the board is found from its Edge.Cuts outline.
Squares are board mm, top-left corner as the board is drawn (x as seen from the FRONT for both sides), greedy and disjoint.
Only pads, holes and silk text count as obstacles: tracks are covered by solder mask, silkscreen may cross them."""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion


def board_box(im):
    gr = (np.abs(im[..., 0] - im[..., 1]) < 25) & (np.abs(im[..., 1] - im[..., 2]) < 25) & (im.sum(2) > 300) & (im.sum(2) < 700)
    cols = np.where(gr.sum(0) > 0.25 * gr.shape[0])[0]
    rows = np.where(gr.sum(1) > 0.25 * gr.shape[1])[0]
    return cols.min(), cols.max(), rows.min(), rows.max()


def squares(path, back, bw, bh, count=6):
    im = np.asarray(Image.open(path).convert("RGB")).astype(int)
    x0, x1, y0, y1 = board_box(im)
    sx = (x1 - x0) / bw
    sy = (y1 - y0) / bh
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    if back:
        pad = (g > 150) & (r < 110) & (b > 190)
    else:
        pad = (r > 170) & (b > 100) & (g < 120) & (b < 170)
    txt = (r > 200) & (g > 180) & (b < 200) & (abs(r - g) < 80)
    white = (r > 235) & (g > 235) & (b > 235)
    bad = pad | txt | white
    nx, ny = int(bw * 2), int(bh * 2)
    cell = np.zeros((ny, nx), bool)
    for i in range(ny):
        for j in range(nx):
            blk = bad[int(y0 + i * sy / 2): int(y0 + (i + 1) * sy / 2), int(x0 + j * sx / 2): int(x0 + (j + 1) * sx / 2)]
            cell[i, j] = not blk.any()
    cell = binary_erosion(cell, iterations=1)
    cell[:6] = 0
    cell[-6:] = 0
    cell[:, :6] = 0
    cell[:, -6:] = 0
    out = []
    for _ in range(count):
        d = np.zeros(cell.shape, int)
        best = (0, 0, 0)
        for i in range(ny):
            for j in range(nx):
                if cell[i, j]:
                    d[i, j] = 1 + (min(d[i - 1, j], d[i, j - 1], d[i - 1, j - 1]) if i and j else 0)
                    if d[i, j] > best[0]:
                        best = (d[i, j], i, j)
        k, i, j = best
        if k < 8:
            break
        left = (j - k + 1) / 2
        xfront = bw - (j + 1) / 2 if back else left   # the back view is mirrored
        out.append((k / 2, round(xfront, 2), (i - k + 1) / 2))
        cell[max(0, i - k - 2): i + 3, max(0, j - k - 2): j + 3] = False
    return out


if __name__ == "__main__":
    d = sys.argv[1]
    sides = sys.argv[2:] or ["front", "back"]
    mech = json.load(open(os.path.join(d, "mechanical", "interface.json")))["board"]
    lines = []
    for s in sides:
        for size, x, y in squares(os.path.join(d, "out", f"{s}.png"), s == "back", mech["width"], mech["height"]):
            lines.append(f"{s}: blank square {size} mm at x {x}, y {y} (board mm, seen from the front)")
    open(os.path.join(d, "out", "blank-spots.txt"), "w").write("\n".join(lines) + "\n")
    print("\n".join(lines))
