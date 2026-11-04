#!/usr/bin/env python3
"""Writes kicad/phone.kicad_pcb, kicad/phone.pretty/*.kicad_mod, kicad/3d/*.wrl, kicad/placement.json.

Rev C layout rules: the front under the dial and the speaker carries nothing but silkscreen (and the two
dial microswitches): no pads, vias or F.Cu tracks inside those circles. Everything else goes around them.
Placement is fixed for the parts that matter to the shell and the ICs; passives are dropped by a greedy placer.
Routing is router.py. Silkscreen art (orbits, rays, badge) is clipped away from pads.
Designed by Claude Sonnet 5.5 under Lewis Moten's direction, with KiCad.
"""
import json
import math
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(__file__))
from design import parts, GND, V5  # noqa: E402
from footprints import FP  # noqa: E402
from router import Router  # noqa: E402
import models3d  # noqa: E402
import silkart  # noqa: E402
import dex_art  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
KDIR = os.path.join(HERE, "..", "kicad")
W, H = 99.0, 99.0                      # inside JLCPCB's and PCBWay's cheapest tier (100 x 100 mm)
CX = W / 2
TW, WIDE = 0.30, 0.50
DIAL = (30.0, 61.0)
DIAL_R, RING_R = 20.0, 14.5
DIAL_KEEP_F, DIAL_KEEP_PAD = 21.5, 23.5      # F.Cu copper / pad centers stay outside these
SPK = (74.0, 56.0)
SPK_R = 12.0
SPK_KEEP_F, SPK_KEEP_PAD = 13.5, 14.8
BADGE = (89.5, 37.0, 6.8)                    # x, y, radius reserved for the YEAR 2000 badge
_k = [0]


def uid():
    _k[0] += 1
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"potf-pcb-{_k[0]}"))


def f(v):
    return ("%.4f" % v).rstrip("0").rstrip(".") if v else "0"


netlist = json.load(open(os.path.join(KDIR, "netlist.json")))
byref = {p["ref"]: p for p in parts}

def sn(v):
    return round(v / 0.254) * 0.254      # the router's grid: every pad center sits on it


FIXED = {k: (sn(x), sn(y), r) for k, (x, y, r) in {
    "D2": (13.0, 6.35, 0), "D1": (86.0, 6.35, 0),
    "DS1": (33.5, 24.0, 0), "DS2": (65.5, 24.0, 0),
    "LS1": (SPK[0], SPK[1], 0),
    "SW2": (DIAL[0] - 7.62, DIAL[1], 0), "SW3": (DIAL[0] + 7.62, DIAL[1] + 5.08, 0),
    "SW4": (13.0, 92.0, 0), "SW5": (86.0, 92.0, 0), "MK1": (CX, 91.5, 0), "BT1": (31.0, 93.5, 0), "J1": (68.0, 94.0, 0), "RV1": (W - 3.5, 70.0, 90),
}.items()}
NEAR = {"X1": "U2", "C12": "U1", "C13": "U3", "R25": "U3", "C14": "U1", "R1": "U1", "C15": "U2", "C16": "U4", "C17": "U5", "C18": "U5",
        "C19": "U5", "U6": "BT1", "C1": "U6", "C2": "U6", "Q1": "D2", "R10": "Q1", "R11": "D2", "Q2": "U5", "R21": "Q2",
        "R12": "Q1", "R8": "Q1", "R9": "Q1"}
MOUNT = [(3.81, 3.81), (W - 3.81, 3.81), (3.81, H - 3.81), (W - 3.81, H - 3.81)]
TXT = 0.8          # reference and value text height on the silkscreen


def rot(x, y, a):
    return {0: (x, y), 90: (-y, x), 180: (-x, -y), 270: (y, -x)}[a % 360]


def variant(ref):
    if ref in ("C19",):
        return "big"
    if ref in ("D1",):
        return "ir"
    return ""


class Placed:
    def __init__(self, ref, x, y, a):
        self.ref, self.x, self.y, self.a = ref, x, y, a
        p = byref[ref]
        self.side = p["side"]
        self.fp = FP[p["fp"]]
        self.pads = []
        for pad in self.fp.pads:
            rx, ry = rot(pad.x, pad.y, a)
            if self.side == "B":
                rx = -rx
            self.pads.append((pad, rx, ry))

    def rect(self, r, margin=0):
        xs, ys = [], []
        for cx, cy in ((r[0], r[1]), (r[2], r[1]), (r[2], r[3]), (r[0], r[3])):
            rx, ry = rot(cx, cy, self.a)
            if self.side == "B":
                rx = -rx
            xs.append(rx)
            ys.append(ry)
        return (self.x + min(xs) - margin, self.y + min(ys) - margin, self.x + max(xs) + margin, self.y + max(ys) + margin)

    def texts(self):
        """Boxes of the reference (above) and value (below) text."""
        c = self.rect(self.fp.court)
        out = []
        for s, yy in ((self.ref, c[1] - 0.9), (byref[self.ref]["value"], c[3] + 0.9)):
            w = len(s) * TXT * 0.85 + 0.3
            xm = (c[0] + c[2]) / 2
            out.append((xm - w / 2, yy - TXT / 2 - 0.1, xm + w / 2, yy + TXT / 2 + 0.1))
        return out


placed = {r: Placed(r, *v) for r, v in FIXED.items()}


def overlaps(a, b):
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def in_zone(x, y):
    return (math.hypot(x - DIAL[0], y - DIAL[1]) < DIAL_KEEP_PAD or math.hypot(x - SPK[0], y - SPK[1]) < SPK_KEEP_PAD
            or math.hypot(x - BADGE[0], y - BADGE[1]) < BADGE[2] + 1.5)


def place_rest():
    occ = {"F": [], "B": []}
    padbox, txtbox = [], []
    for pl in placed.values():
        occ[pl.side].append(pl.rect(pl.fp.court, 0.35))
        for pad, rx, ry in pl.pads:
            padbox.append((pl.x + rx - 1.2, pl.y + ry - 1.2, pl.x + rx + 1.2, pl.y + ry + 1.2))
        txtbox += pl.texts()
    for mx, my in MOUNT:
        padbox.append((mx - 3.6, my - 3.6, mx + 3.6, my + 3.6))
    todo = [p for p in parts if p["ref"] not in placed]
    todo.sort(key=lambda p: (p["ref"] not in ("U3", "U1", "U2", "U4", "U5"), p["ref"] not in ("X1", "U6"), p["ref"] not in NEAR, p["ref"]))
    region = (3.0, 3.0, W - 3.0, H - 3.0)
    for p in todo:
        ref = p["ref"]
        pts = []
        for net in netlist[ref].values():
            if net in (GND, V5, None):
                continue
            for r2, pl in placed.items():
                for pad, rx, ry in pl.pads:
                    if netlist[r2].get(pad.num) == net:
                        pts.append((pl.x + rx, pl.y + ry))
        if ref in NEAR and NEAR[ref] in placed:
            q = placed[NEAR[ref]]
            pts += [(q.x, q.y)] * 4
        if not pts:
            pts = [(CX, 130)]
        cx = sum(a for a, b in pts) / len(pts)
        cy = sum(b for a, b in pts) / len(pts)
        best = None
        for a in (0, 90):
            tmp = Placed(ref, 0, 0, a)
            r0 = tmp.rect(tmp.fp.court, 0.35)
            for xi in range(int(region[0] / 0.508), int(region[2] / 0.508) + 1):
                x = xi * 0.508
                for yi in range(int(region[1] / 0.508), int(region[3] / 0.508) + 1):
                    y = yi * 0.508
                    rr = (x + r0[0], y + r0[1], x + r0[2], y + r0[3])
                    if rr[0] < region[0] - 1 or rr[2] > region[2] + 1 or rr[1] < region[1] - 1 or rr[3] > region[3] + 1:
                        continue
                    if any(in_zone(x + rx, y + ry) for _, rx, ry in tmp.pads):
                        continue
                    if any(overlaps(rr, o) for o in occ[p["side"]]):
                        continue
                    pbs = [(x + rx - 1.2, y + ry - 1.2, x + rx + 1.2, y + ry + 1.2) for _, rx, ry in tmp.pads]
                    if any(overlaps(pb, k) for pb in pbs for k in padbox):
                        continue
                    t2 = tmp.texts()
                    t2 = [(t[0] + x, t[1] + y, t[2] + x, t[3] + y) for t in t2]
                    if any(overlaps(t, k) for t in t2 for k in padbox + txtbox):
                        continue
                    if any(overlaps(pb, k) for pb in pbs for k in txtbox):
                        continue
                    cost = math.hypot(x - cx, y - cy) + 0.001 * (x + y)
                    if best is None or cost < best[0]:
                        best = (cost, x, y, a)
        if best is None:
            print({r: (round(q.x, 1), round(q.y, 1), q.a, q.side) for r, q in placed.items()})
            raise SystemExit(f"no room for {ref}")
        _, x, y, a = best
        pl = Placed(ref, x, y, a)
        placed[ref] = pl
        occ[pl.side].append(pl.rect(pl.fp.court, 0.35))
        for pad, rx, ry in pl.pads:
            padbox.append((x + rx - 1.2, y + ry - 1.2, x + rx + 1.2, y + ry + 1.2))
        txtbox += [(t[0], t[1], t[2], t[3]) for t in pl.texts()]


place_rest()

# ---- nets ----------------------------------------------------------------------------------------------
netnames = sorted({n for d in netlist.values() for n in d.values() if n})
nid = {n: i + 1 for i, n in enumerate(netnames)}
rt = Router(W, H, edge=0.95)
for ref, pl in placed.items():
    for pad, rx, ry in pl.pads:
        r = pad.d / 2 * (1.42 if pad.square else 1)
        n = netlist[ref].get(pad.num)
        if n:
            rt.add_pad(nid[n], pl.x + rx, pl.y + ry, r, f"{ref}.{pad.num}")
        else:
            rt.blockers.append((pl.x + rx, pl.y + ry, r))
for mx, my in MOUNT:
    rt.blockers.append((mx, my, 2.1))
for ref, pl in placed.items():             # small pin marks (silkscreen) of the front parts must not sit on copper
    for t, tx, ty in (pl.fp.marks if ref.startswith("MK") else []):
        rx, ry = rot(tx, ty, pl.a)
        rt.blockers.append((pl.x + (-rx if pl.side == "B" else rx), pl.y + ry, 0.9))
rt.fzones += [(DIAL[0], DIAL[1], DIAL_KEEP_F), (SPK[0], SPK[1], SPK_KEEP_F)]
widths = {nid[GND]: WIDE, nid[V5]: WIDE}
base = [nid[GND], nid[V5]]
rest = [nid[n] for n in netnames if n not in (GND, V5)]


def span(n):
    ps = rt.pads[n]
    return (max(p[0] for p in ps) - min(p[0] for p in ps)) + (max(p[1] for p in ps) - min(p[1] for p in ps))


rest.sort(key=span)
order = base + rest
for attempt in range(6):
    segs, vias, failed = rt.route_all(order, widths, TW)
    names = [netnames[n - 1] for n in failed]
    print("attempt", attempt, "failed:", names, flush=True)
    if not failed:
        break
    order = failed + [x for x in order if x not in failed]
print("FAILED NETS:", [netnames[n - 1] for n in failed])

# ---- text assignment: reference and value go where no pad or other text is -------------------------------
padpts = [(pl.x + rx, pl.y + ry, pad.d / 2 * (1.42 if pad.square else 1)) for pl in placed.values() for pad, rx, ry in pl.pads]
padpts += [(mx, my, 2.0) for mx, my in MOUNT]
TAKEN = []          # text boxes already used (board coordinates)
# Back-side advertising, in the three blank spots of the back (found from the back preview): QR codes and Dex.
PARTS_URL = "https://github.com/lewismoten/GameMaker-SandboxEdition/tree/master/games/year2000/phone"
SITE_URL = "https://lewismoten.github.io/GameMaker-SandboxEdition"
URL_LINES = {      # what is printed beside each QR code (1.0 mm letters); together each is the address the QR code holds, without https://
    SITE_URL: ["lewismoten.github.io/", "GameMaker-SandboxEdition"],
    PARTS_URL: ["github.com/lewismoten/", "GameMaker-SandboxEdition/", "tree/master/games/", "year2000/phone"],
}
QR_PARTS = (27.5, 44.0, 0.44)      # x, y (top-left, board coordinates), module mm: 41 modules = 18.0 mm
QR_SITE = (65.0, 47.0, 0.5)        # 33 modules = 16.5 mm
QR_KEEP = [(QR_PARTS[0], QR_PARTS[1], QR_PARTS[0] + 18.1, QR_PARTS[1] + 18.1), (QR_SITE[0], QR_SITE[1], QR_SITE[0] + 16.6, QR_SITE[1] + 16.6)]


def dex_spot(limit, margin=0.45, max_loss=0.08, px_min=0.8, px_max=2.0):
    """Dex as big as fits on the back: the largest pixel size (then the spot nearest the dial's center) where the 16 x 18 picture
    stays inside the board and 3.3 mm from the QR codes (so the shell's windows stay apart), and where the pixels that would land
    within `margin` mm of a pad, via or mounting hole (those pixels are left out, like the front's art clipped away from pads) are
    at most `max_loss` of the picture and never an eye or the mouth. Tracks are under solder mask, so silkscreen may cross them.
    Works on a 0.25 mm raster with summed-area tables. Returns (x, y, pixel mm, set of (row, col) left out) or None."""
    g = 0.25
    nx, ny = int(W / g) + 1, int(H / g) + 1
    soft = [[0] * nx for _ in range(ny)]
    hard = [[0] * nx for _ in range(ny)]

    def paint(grid, x0, y0, x1, y1, circle=None):
        for j in range(max(0, int(y0 / g)), min(ny, int(y1 / g) + 1)):
            for i in range(max(0, int(x0 / g)), min(nx, int(x1 / g) + 1)):
                if circle is None or math.hypot(i * g - circle[0], j * g - circle[1]) <= circle[2]:
                    grid[j][i] = 1

    for x, y, r in padpts:
        paint(soft, x - r - margin, y - r - margin, x + r + margin, y + r + margin, (x, y, r + margin))
    for v in vias.values():
        for x, y in v:
            paint(soft, x - 0.4 - margin, y - 0.4 - margin, x + 0.4 + margin, y + 0.4 + margin, (x, y, 0.4 + margin))
    for q in QR_KEEP:
        paint(hard, q[0] - 3.3, q[1] - 3.3, q[2] + 3.3, q[3] + 3.3)
    paint(hard, 0, 0, W, 1.0)
    paint(hard, 0, H - 1.0, W, H)
    paint(hard, 0, 0, 1.0, H)
    paint(hard, W - 1.0, 0, W, H)

    def table(grid):
        sat = [[0] * (nx + 1) for _ in range(ny + 1)]
        for j in range(ny):
            run = 0
            for i in range(nx):
                run += grid[j][i]
                sat[j + 1][i + 1] = sat[j][i + 1] + run
        return sat

    ssat, hsat = table(soft), table(hard)

    def count(sat, i0, j0, i1, j1):
        return sat[j1 + 1][i1 + 1] - sat[j0][i1 + 1] - sat[j1 + 1][i0] + sat[j0][i0]

    rows, cols = len(dex_art.ROWS), max(len(r) for r in dex_art.ROWS)
    art = [(r, c, ch) for r, row in enumerate(dex_art.ROWS) for c, ch in enumerate(row) if ch in dex_art.TONES]
    for k in range(int(px_max / 0.05), int(px_min / 0.05) - 1, -1):
        px = k * 0.05
        w, h = int(math.ceil(cols * px / g)), int(math.ceil(rows * px / g))
        found = []
        for j in range(0, ny - h):
            for i in range(0, nx - w):
                d = math.hypot(i * g + cols * px / 2 - DIAL[0], j * g + rows * px / 2 - DIAL[1])
                if d > limit or count(hsat, i, j, i + w - 1, j + h - 1):
                    continue
                x0, y0 = i * g, j * g
                lost = set()
                ok = True
                for r, c, ch in art:
                    cc = cols - 1 - c                       # the back is drawn mirrored
                    pi0, pj0 = int((x0 + cc * px) / g), int((y0 + r * px) / g)
                    pi1, pj1 = int((x0 + (cc + 1) * px - 1e-6) / g), int((y0 + (r + 1) * px - 1e-6) / g)
                    if count(ssat, pi0, pj0, pi1, pj1):
                        if ch in "em":
                            ok = False
                            break
                        lost.add((r, c))
                        if len(lost) > max_loss * len(art):
                            ok = False
                            break
                if ok:
                    found.append((len(lost) * 3 + d, x0, y0, lost))
        if found:
            found.sort(key=lambda t: t[0])
            return (found[0][1], found[0][2], px, found[0][3])
    return None


def find_dex(reach=30.0):
    best = dex_spot(reach)
    print("Dex search (behind the dial):", None if best is None else best[:3], "left out:", None if best is None else len(best[3]), "pixels")
    anywhere = dex_spot(1e9)
    print("Dex search (anywhere on the back):", None if anywhere is None else anywhere[:3])
    return best


_dex = find_dex() or (17.5, 65.5, 0.8, set())
DEX_AT, DEX_SKIP = _dex[:3], _dex[3]
DEX_W, DEX_H = 16 * DEX_AT[2], 18 * DEX_AT[2]
print("Dex: pixel %.2f mm, %.1f x %.1f mm at (%.1f, %.1f)" % (DEX_AT[2], DEX_W, DEX_H, DEX_AT[0], DEX_AT[1]))
TAKEN.append((DEX_AT[0] - 0.3, DEX_AT[1] - 0.3, DEX_AT[0] + DEX_W + 0.3, DEX_AT[1] + DEX_H + 0.3))   # reference and value text keep out of it
TAKEN += [(q[0] - 0.3, q[1] - 0.3, q[2] + 0.3, q[3] + 0.3) for q in QR_KEEP]   # and the QR codes (their labels are placed later)
for _dk in range(1, 11):       # the dial's big digits are placed later, but reference and value text keep out of their spots
    _a = math.radians((120 - 30 * (_dk + 1)) % 360)
    _x, _y = DIAL[0] + RING_R * math.sin(_a), DIAL[1] - RING_R * math.cos(_a)
    TAKEN.append((_x - 2.0, _y - 2.4, _x + 2.0, _y + 2.4))


def box_ok(b, margin=0.45):
    if b[0] < 1.0 or b[1] < 1.0 or b[2] > W - 1.0 or b[3] > H - 1.0:
        return False
    for px, py, pr in padpts:
        qx = min(max(px, b[0]), b[2])
        qy = min(max(py, b[1]), b[3])
        if math.hypot(px - qx, py - qy) < pr + margin:
            return False
    return not any(overlaps(b, t) for t in TAKEN)


def _place_urls():
    """Each QR code's address in 1.0 mm letters, reserved before any reference or value text so it sits right beside its code:
    a stack of lines below the code, else above it, shifted sideways until clear of pads and other text."""
    spots = {}
    for qr, qtext in ((QR_PARTS, PARTS_URL), (QR_SITE, SITE_URL)):
        qx, qy, qm = qr
        qs = 18.1 if qr is QR_PARTS else 16.6
        lines = URL_LINES[qtext]
        for dy0, step in ((qy + qs + 1.0, 1.25), (qy - 1.0 - 1.25 * (len(lines) - 1), 1.25)):
            done = False
            for dx in (0, 2, -2, 4, -4, 6, -6, 8, -8, 10, -10):
                cx = qx + qs / 2 + dx
                boxes = []
                for i, ln in enumerate(lines):
                    cy = dy0 + i * step
                    w = len(ln) * 0.85 + 0.3
                    boxes.append((ln, cx, cy, (cx - w / 2, cy - 0.6, cx + w / 2, cy + 0.6)))
                if all(box_ok(b[3]) for b in boxes) and not any(overlaps(boxes[i][3], boxes[j][3]) for i in range(len(boxes)) for j in range(i + 1, len(boxes))):
                    for b in boxes:
                        TAKEN.append(b[3])
                    spots[qtext] = [(b[0], b[1], b[2]) for b in boxes]
                    done = True
                    break
            if done:
                break
        if qtext not in spots:
            print("  no room for the address beside", qtext)
    return spots


URL_SPOTS = _place_urls()


def tbox(cx, cy, s):
    w = len(s) * TXT * 0.85 + 0.3
    return (cx - w / 2, cy - TXT / 2 - 0.35, cx + w / 2, cy + TXT / 2 + 0.35)


TP = {}
for ref, pl in placed.items():
    if pl.fp.name.startswith("DIP"):
        bb = pl.rect(pl.fp.body)
        for e in ((bb[0] - .2, bb[1] - .2, bb[2] + .2, bb[1] + .2), (bb[0] - .2, bb[3] - .2, bb[2] + .2, bb[3] + .2),
                  (bb[0] - .2, bb[1], bb[0] + .2, bb[3]), (bb[2] - .2, bb[1], bb[2] + .2, bb[3])):
            TAKEN.append(e)
    for t, tx, ty in pl.fp.marks:
        rx, ry = rot(tx, ty, pl.a)
        TAKEN.append(tbox(pl.x + (-rx if pl.side == "B" else rx), pl.y + ry, t))
for ref, pl in placed.items():
    c = pl.rect(pl.fp.court)
    xm, ym = (c[0] + c[2]) / 2, (c[1] + c[3]) / 2
    TP[ref] = {}
    for key, s in (("ref", ref), ("val", byref[ref]["value"])):
        w = len(s) * TXT * 0.85 + 0.3
        cands = [(xm, c[1] - 0.9), (xm, c[3] + 0.9), (xm, c[1] - 1.9), (xm, c[3] + 1.9), (c[0] - w / 2 - 0.6, ym), (c[2] + w / 2 + 0.6, ym),
                 (c[0] - w / 2 - 0.6, c[1]), (c[2] + w / 2 + 0.6, c[3])]
        if key == "val":
            cands = cands[1:2] + cands[0:1] + cands[3:4] + cands[2:3] + cands[4:]
        for dy_ in (0.9, 1.9, 2.9, 3.9):
            for dx_ in (1.5, -1.5, 3.0, -3.0, 4.5, -4.5):
                cands += [(xm + dx_, c[3] + dy_), (xm + dx_, c[1] - dy_)] if key == "val" else [(xm + dx_, c[1] - dy_), (xm + dx_, c[3] + dy_)]
        chosen = None
        for cx_, cy_ in cands:
            b = tbox(cx_, cy_, s)
            if box_ok(b):
                chosen = (cx_, cy_, b)
                break
        if chosen is None:
            print("  no clear spot for", ref, key, s, "(value moved to the fab layer)" if key == "val" else "")
            if key == "val":
                TP[ref][key] = None
                continue
            chosen = (cands[0][0], cands[0][1], tbox(*cands[0], s))
        TAKEN.append(chosen[2])
        TP[ref][key] = (chosen[0] - pl.x, chosen[1] - pl.y)

# ---- footprints ----------------------------------------------------------------------------------------
LAY = ("F.Cu", "B.Cu")


def txt(layer, s, x, y, size=0.8, mirror=False, thick=None):
    t = thick or (0.15 if size < 1.2 else 0.25)
    return (f'(gr_text "{s}" (at {f(x)} {f(y)} 0) (layer "{layer}") (uuid "{uid()}") '
            f'(effects (font (size {size} {size}) (thickness {t})){" (justify mirror)" if mirror else ""}))')


def line(layer, x1, y1, x2, y2, w=0.12):
    return f'(fp_line (start {f(x1)} {f(y1)}) (end {f(x2)} {f(y2)}) (stroke (width {w}) (type solid)) (layer "{layer}") (uuid "{uid()}"))'


def footprint(fp, ref, value, side, a, nets, lib=False, kind=None, tp=None):
    S = "B" if side == "B" else "F"
    silk, fab, crt = f"{S}.SilkS", f"{S}.Fab", f"{S}.CrtYd"
    m = (lambda v: -v) if (S == "B" and not lib) else (lambda v: v)

    def R(px, py):
        rx, ry = rot(px, py, a)
        return m(rx), ry

    out = []
    b, c = fp.body, fp.court
    cs = [R(b[0], b[1]), R(b[2], b[1]), R(b[2], b[3]), R(b[0], b[3])]
    bl = fab
    for i in range(4):
        out.append(line(bl, cs[i][0], cs[i][1], cs[(i + 1) % 4][0], cs[(i + 1) % 4][1]))
    cc = [R(c[0], c[1]), R(c[2], c[1]), R(c[2], c[3]), R(c[0], c[3])]
    for i in range(4):
        out.append(line(crt, cc[i][0], cc[i][1], cc[(i + 1) % 4][0], cc[(i + 1) % 4][1], 0.05))
    for cx, cy, r in fp.extra:
        px, py = R(cx, cy)
        out.append(f'(fp_circle (center {f(px)} {f(py)}) (end {f(px + r)} {f(py)}) (stroke (width 0.1) (type solid)) (fill no) (layer "{fab}") (uuid "{uid()}"))')
    mir = ' (justify mirror)' if S == "B" else ""
    for t, tx, ty in fp.marks:
        px, py = R(tx, ty)
        out.append(f'(fp_text user "{t}" (at {f(px)} {f(py)} 0) (layer "{silk}") (uuid "{uid()}") (effects (font (size 0.8 0.8) (thickness 0.12)){mir}))')
    top = min(p[1] for p in cc) - 0.9
    bot = max(p[1] for p in cc) + 0.9
    xm = (min(p[0] for p in cc) + max(p[0] for p in cc)) / 2
    rp, vp = (xm, top), (xm, bot)
    vlayer = silk
    if tp:
        rp = tp["ref"]
        if tp["val"] is None:
            vlayer = fab
        else:
            vp = tp["val"]
    eff = f'(effects (font (size {TXT} {TXT}) (thickness 0.12)){mir})'
    hid = '(layer "%s") (hide yes) ' % fab
    props = [
        f'(property "Reference" "{ref}" (at {f(rp[0])} {f(rp[1])} 0) (layer "{silk}") (uuid "{uid()}") {eff})',
        f'(property "Value" "{value}" (at {f(vp[0])} {f(vp[1])} 0) (layer "{vlayer}") (uuid "{uid()}") {eff})',
        f'(property "Footprint" "phone:{fp.name}" (at 0 0 0) {hid}(uuid "{uid()}") (effects (font (size 1 1) (thickness 0.15))))',
        f'(property "Datasheet" "" (at 0 0 0) {hid}(uuid "{uid()}") (effects (font (size 1 1) (thickness 0.15))))',
        f'(property "Description" "{fp.desc}" (at 0 0 0) {hid}(uuid "{uid()}") (effects (font (size 1 1) (thickness 0.15))))',
    ]
    pads = []
    for pad in fp.pads:
        px, py = R(pad.x, pad.y)
        shape = "rect" if pad.square else "circle"
        net = ""
        if nets is not None:
            nn = nets.get(pad.num)
            if nn:
                net = f' (net {nid[nn]} "{nn}")'
        pads.append(f'(pad "{pad.num}" thru_hole {shape} (at {f(px)} {f(py)}) (size {pad.d} {pad.d}) (drill {pad.drill}) (layers "*.Cu" "*.Mask") (remove_unused_layers no){net} (uuid "{uid()}"))')
    model = ""
    if kind and not lib:
        mn = models3d.write_model(kind, variant(ref), a, side)
        model = f'(model "${{KIPRJMOD}}/models/{mn}" (offset (xyz 0 0 0)) (scale (xyz 1 1 1)) (rotate (xyz 0 0 0)))'
    return props, out, pads, model


items = []
for ref in sorted(placed):
    pl = placed[ref]
    p = byref[ref]
    props, gfx, pads, model = footprint(pl.fp, ref, p["value"], p["side"], pl.a, netlist[ref], kind=p["fp"], tp=TP[ref])
    layer = "B.Cu" if p["side"] == "B" else "F.Cu"
    body = "\n    ".join(props + ["(attr through_hole)"] + gfx + pads + [model])
    items.append(f'(footprint "phone:{pl.fp.name}" (layer "{layer}") (uuid "{uid()}") (at {f(pl.x)} {f(pl.y)})\n    {body}\n  )')
for i, (mx, my) in enumerate(MOUNT):
    items.append(f'''(footprint "phone:MountingHole_3.2mm_M3" (layer "F.Cu") (uuid "{uid()}") (at {f(mx)} {f(my)})
    (property "Reference" "H{i + 1}" (at 0 -4.2 0) (layer "F.Fab") (uuid "{uid()}") (effects (font (size 0.8 0.8) (thickness 0.12))))
    (property "Value" "M3" (at 0 4.2 0) (layer "F.Fab") (hide yes) (uuid "{uid()}") (effects (font (size 0.8 0.8) (thickness 0.12))))
    (attr exclude_from_pos_files exclude_from_bom)
    (fp_circle (center 0 0) (end 3.3 0) (stroke (width 0.05) (type solid)) (fill no) (layer "F.CrtYd") (uuid "{uid()}"))
    (pad "" np_thru_hole circle (at 0 0) (size 3.2 3.2) (drill 3.2) (layers "*.Cu" "*.Mask") (uuid "{uid()}"))
  )''')
for n in order:
    w = widths.get(n, TW)
    for (L, x1, y1, x2, y2) in segs[n]:
        items.append(f'(segment (start {f(x1)} {f(y1)}) (end {f(x2)} {f(y2)}) (width {w}) (layer "{LAY[L]}") (net {n}) (uuid "{uid()}"))')
    for (x, y) in vias[n]:
        items.append(f'(via (at {f(x)} {f(y)}) (size 0.8) (drill 0.4) (layers "F.Cu" "B.Cu") (net {n}) (uuid "{uid()}"))')

# ---- outline -------------------------------------------------------------------------------------------
r = 4.0


def arc(cx, cy, a0, a1):
    pt = lambda ang: (cx + r * math.cos(math.radians(ang)), cy + r * math.sin(math.radians(ang)))  # noqa: E731
    s, mid, e = pt(a0), pt((a0 + a1) / 2), pt(a1)
    return f'(gr_arc (start {f(s[0])} {f(s[1])}) (mid {f(mid[0])} {f(mid[1])}) (end {f(e[0])} {f(e[1])}) (stroke (width 0.1) (type solid)) (layer "Edge.Cuts") (uuid "{uid()}"))'


def eline(x1, y1, x2, y2):
    return f'(gr_line (start {f(x1)} {f(y1)}) (end {f(x2)} {f(y2)}) (stroke (width 0.1) (type solid)) (layer "Edge.Cuts") (uuid "{uid()}"))'


items += [eline(r, 0, W - r, 0), eline(W, r, W, H - r), eline(W - r, H, r, H), eline(0, H - r, 0, r),
          arc(r, r, 180, 270), arc(W - r, r, 270, 360), arc(W - r, H - r, 0, 90), arc(r, H - r, 90, 180)]

TAKEN += [(QR_PARTS[0] - 0.3, QR_PARTS[1] - 0.3, QR_PARTS[0] + 18.3, QR_PARTS[1] + 18.3),
          (QR_SITE[0] - 0.3, QR_SITE[1] - 0.3, QR_SITE[0] + 18.3, QR_SITE[1] + 18.3),
          (DEX_AT[0] - 0.3, DEX_AT[1] - 0.3, DEX_AT[0] + DEX_W + 0.3, DEX_AT[1] + DEX_H + 0.3)]   # kept clear of silk text (after the reference text is placed: the back is blank here)
# ---- silkscreen: lettering, number ring, retro-future art (clipped away from pads) -----------------------
def clear(x, y, margin=0.55):
    if x < 1.0 or y < 1.0 or x > W - 1.0 or y > H - 1.0:
        return False
    if any(t[0] - 0.9 < x < t[2] + 0.9 and t[1] - 0.9 < y < t[3] + 0.9 for t in TAKEN):
        return False
    return all(math.hypot(x - px, y - py) > pr + margin for px, py, pr in padpts)


def label(layer, s, x, y, size, mirror=False, thick=None):
    """Silk text near (x, y), moved to the nearest spot clear of pads and other silk."""
    w = len(s) * size * 0.85 + 0.3
    for d in [0] + [k * 1.0 for k in range(1, 40)]:
        for dx, dy in ((0, 0),) if d == 0 else ((d, 0), (-d, 0), (0, d), (0, -d), (d, d), (-d, d), (d, -d), (-d, -d)):
            b = (x + dx - w / 2, y + dy - size / 2 - 0.1, x + dx + w / 2, y + dy + size / 2 + 0.1)
            if box_ok(b):
                TAKEN.append(b)
                return txt(layer, s, x + dx, y + dy, size, mirror, thick)
    print("  no spot for label", s)
    return ""


def seg(layer, x1, y1, x2, y2, w=0.2):
    n = max(2, int(math.hypot(x2 - x1, y2 - y1) / 0.4))
    if all(clear(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n) for i in range(n + 1)):
        return [f'(gr_line (start {f(x1)} {f(y1)}) (end {f(x2)} {f(y2)}) (stroke (width {w}) (type solid)) (layer "{layer}") (uuid "{uid()}"))']
    return []


def ring(cx, cy, rad, a0=0, a1=360, w=0.2, step=3, dash=0):
    out = []
    k = 0
    a = a0
    while a < a1:
        p = (cx + rad * math.cos(math.radians(a)), cy + rad * math.sin(math.radians(a)))
        q = (cx + rad * math.cos(math.radians(a + step)), cy + rad * math.sin(math.radians(a + step)))
        if not dash or (k // dash) % 2 == 0:
            out += seg("F.SilkS", p[0], p[1], q[0], q[1], w)
        a += step
        k += 1
    return out


def near_label(layer, s, x, y, w, h, size=0.9):
    """Back-side text hugging a picture: below, above, then beside it (mirrored text), else the nearest free spot."""
    tw = len(s) * size * 0.85 + 0.3
    for cx, cy in ((x + w / 2, y + h + 1.0), (x + w / 2, y - 1.0), (x + w / 2, y + h + 2.0), (x + w / 2, y - 2.0)):
        b = (cx - tw / 2, cy - size / 2 - 0.1, cx + tw / 2, cy + size / 2 + 0.1)
        if box_ok(b):
            TAKEN.append(b)
            return txt(layer, s, cx, cy, size, True)
    return label(layer, s, x + w / 2, y + h + 1.0, size, True)


silk = []
silk.append(label("F.SilkS", "THE PHONE OF THE FUTURE", CX, 11.6, 1.6))
# the project name and advertising lines go in before the orbits and rays, so those keep clear of them
silk.append(label("F.SilkS", "SCIENCE PROJECT NO. 2", CX, 4.2, 1.2))
silk.append(label("F.SilkS", "JUNIOR LAB EDITION", CX, 7.0, 1.0))
silk.append(label("F.SilkS", "IN THE YEAR 2000!", 50.0, 15.5, 1.1))
silk.append(label("F.SilkS", "SANDBOX SOFTWARE", 50.0, 18.0, 1.0))
silk.append(label("F.SilkS", "MADE WITH GAME-MAKER", 50.0, 20.5, 1.0))
cx, cy = DIAL
DIGITS = []
for k in range(1, 11):
    ang = (120 - 30 * (k + 1)) % 360      # degrees clockwise from the top; 1 at 60, 0 at 150; finger stop at 120
    rad = math.radians(ang)
    x, y = cx + RING_R * math.sin(rad), cy - RING_R * math.cos(rad)
    d = str(k % 10)
    DIGITS.append(dict(digit=d, angle_cw_from_top_deg=ang, x=round(x, 2), y=round(y, 2)))
    silk.append(txt("F.SilkS", d, x, y, 3.0, thick=0.4))
# orbits and rays around the dial: space-age atom motif
silk += ring(cx, cy, DIAL_R + 0.8, w=0.25)
silk += ring(cx, cy, DIAL_R + 1.8, w=0.2, dash=3)
for i in range(72):
    a = math.radians(i * 5)
    r0, r1 = DIAL_R + 3.2, DIAL_R + (6.5 if i % 3 == 0 else 4.8)
    silk += seg("F.SilkS", cx + r0 * math.cos(a), cy + r0 * math.sin(a), cx + r1 * math.cos(a), cy + r1 * math.sin(a), 0.2)
a = math.radians(120 - 90)                # finger stop mark
sx, sy = cx + (DIAL_R - 4) * math.sin(math.radians(120)), cy - (DIAL_R - 4) * math.cos(math.radians(120))
silk += seg("F.SilkS", sx, sy, cx + (DIAL_R + 0.4) * math.sin(math.radians(120)), cy - (DIAL_R + 0.4) * math.cos(math.radians(120)), 0.4)
# speaker orbit
silk += ring(SPK[0], SPK[1], SPK_R + 0.8, w=0.2)
silk += ring(SPK[0], SPK[1], SPK_R + 1.6, w=0.15, dash=2)
# badge
bx, by, br = BADGE
silk += ring(bx, by, br, w=0.25, step=6)
silk += ring(bx, by, br - 1.0, w=0.12, step=6)
silk.append(txt("F.SilkS", "YEAR", bx, by - 1.5, 1.4, thick=0.22))
silk.append(txt("F.SilkS", "2000", bx, by + 0.7, 1.6, thick=0.25))
for k in range(8):                          # twinkles
    a = math.radians(k * 45 + 22)
    silk += seg("F.SilkS", bx + (br + 0.8) * math.cos(a), by + (br + 0.8) * math.sin(a), bx + (br + 2.2) * math.cos(a), by + (br + 2.2) * math.sin(a), 0.18)
silk.append(label("F.SilkS", "TALK", 13.0, 86.6, 1.0))
silk.append(label("F.SilkS", "CLEAR", 86.0, 86.6, 1.0))
silk.append(label("F.SilkS", "MIC", CX, 85.6, 1.0))
silk.append(label("F.SilkS", "IR", 13.0, 13.2, 0.9))
silk.append(label("F.SilkS", "EYE", 86.0, 13.2, 0.9))
silk.append(label("B.SilkS", "THE PHONE OF THE FUTURE", CX, 12.0, 1.9, True))
silk.append(label("B.SilkS", "rev C  untested design", CX, 15.0, 0.9, True))
silk.append(label("B.SilkS", "Claude Sonnet 5.5 + KiCad", CX, 17.0, 0.9, True))
silk.append(label("B.SilkS", "PROGRAM: U2 OUT", 68.0, 88.5, 0.8, True))
# name and advertising: the front lines go to the nearest free spot (label); the QR codes and Dex are on the back
silk.append(label("B.SilkS", "THE POCKET TELEPHONE", CX, 7.0, 1.1, True))
QR_INFO = {}
for (qx, qy, qm), qtext, lab in ((QR_PARTS, PARTS_URL, "PARTS + HOW TO"), (QR_SITE, SITE_URL, "PLAY THE GAME")):
    items_, size_, n_ = silkart.qr_plate("B.SilkS", qx, qy, qm, qtext, uid, f)
    QR_INFO["parts" if qtext == PARTS_URL else "site"] = dict(x=qx, y=qy, size=round(size_, 2), modules=n_, module_mm=qm, url=qtext)
    silk += items_
    silk.append(near_label("B.SilkS", lab, qx, qy, size_, size_))
    for ln, lx, ly in URL_SPOTS.get(qtext, []):       # the address in words, split at the slashes, never shortened
        silk.append(txt("B.SilkS", ln, lx, ly, 1.0, True))
silk += silkart.block_art("B.SilkS", dex_art.ROWS, dex_art.TONES, DEX_AT[0], DEX_AT[1], DEX_AT[2], uid, f, skip=DEX_SKIP, outline=0.25)[0]
silk.append(near_label("B.SilkS", "DEX DYNAMO", DEX_AT[0], DEX_AT[1], DEX_W, DEX_H))
items += silk

json.dump(dict(board_width=W, codes=QR_INFO, dex=dict(x=DEX_AT[0], y=DEX_AT[1], width=round(DEX_W, 2), height=round(DEX_H, 2))), open(os.path.join(KDIR, "qr_spots.json"), "w"), indent=1)
nets_txt = '(net 0 "")\n  ' + "\n  ".join(f'(net {i} "{n}")' for n, i in nid.items())
pcb = f'''(kicad_pcb (version 20241229) (generator "pcbnew") (generator_version "9.0")
  (general (thickness 1.6) (legacy_teardrops no))
  (paper "A3")
  (title_block (title "THE PHONE OF THE FUTURE") (date "2026-11-03") (rev "C")
    (company "Untested design; Claude Sonnet 5.5 under Lewis Moten's direction, with KiCad"))
  (layers
    (0 "F.Cu" signal) (2 "B.Cu" signal)
    (9 "F.Adhes" user "F.Adhesive") (11 "B.Adhes" user "B.Adhesive")
    (13 "F.Paste" user) (15 "B.Paste" user)
    (5 "F.SilkS" user "F.Silkscreen") (7 "B.SilkS" user "B.Silkscreen")
    (1 "F.Mask" user) (3 "B.Mask" user)
    (17 "Dwgs.User" user "User.Drawings") (19 "Cmts.User" user "User.Comments")
    (21 "Eco1.User" user "User.Eco1") (23 "Eco2.User" user "User.Eco2")
    (25 "Edge.Cuts" user) (27 "Margin" user)
    (31 "F.CrtYd" user "F.Courtyard") (29 "B.CrtYd" user "B.Courtyard")
    (35 "F.Fab" user "F.Fabrication") (33 "B.Fab" user "B.Fabrication"))
  (setup (pad_to_mask_clearance 0) (allow_soldermask_bridges_in_footprints no) (tenting front back))
  {nets_txt}
  {chr(10).join("  " + i for i in items)}
)
'''
open(os.path.join(KDIR, "phone.kicad_pcb"), "w").write(pcb)

lib = os.path.join(KDIR, "phone.pretty")
os.makedirs(lib, exist_ok=True)
for k, fp in FP.items():
    props, gfx, pads, _ = footprint(fp, "REF**", fp.name, "F", 0, None, lib=True)
    body = "\n  ".join(props + ["(attr through_hole)"] + gfx + pads)
    open(os.path.join(lib, fp.name + ".kicad_mod"), "w").write(
        f'(footprint "{fp.name}" (version 20241229) (generator "pcbnew") (generator_version "9.0") (layer "F.Cu") (descr "{fp.desc}")\n  {body}\n)\n')
open(os.path.join(lib, "MountingHole_3.2mm_M3.kicad_mod"), "w").write(f'''(footprint "MountingHole_3.2mm_M3" (version 20241229) (generator "pcbnew") (generator_version "9.0") (layer "F.Cu") (descr "M3 hole, no pad copper")
  (property "Reference" "REF**" (at 0 -4.2 0) (layer "F.SilkS") (uuid "{uid()}") (effects (font (size 0.8 0.8) (thickness 0.12))))
  (property "Value" "M3" (at 0 4.2 0) (layer "F.Fab") (uuid "{uid()}") (effects (font (size 0.8 0.8) (thickness 0.12))))
  (attr exclude_from_pos_files exclude_from_bom)
  (pad "" np_thru_hole circle (at 0 0) (size 3.2 3.2) (drill 3.2) (layers "*.Cu" "*.Mask") (uuid "{uid()}"))
)
''')
json.dump({r: dict(x=round(p.x, 3), y=round(p.y, 3), rot=p.a, side=p.side, fp=p.fp.name,
                   pads={pad.num: [round(p.x + rx, 3), round(p.y + ry, 3)] for pad, rx, ry in p.pads})
           for r, p in placed.items()} | {"_digits": DIGITS, "_failed": [netnames[n - 1] for n in failed],
                                          "_board": dict(w=W, h=H), "_dial": dict(c=DIAL, r=DIAL_R, ring=RING_R), "_speaker": dict(c=SPK, r=SPK_R)},
          open(os.path.join(KDIR, "placement.json"), "w"), indent=1)
print("wrote board", len(placed), "parts", sum(len(v) for v in segs.values()), "tracks", sum(len(v) for v in vias.values()), "vias")
