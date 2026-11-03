#!/usr/bin/env python3
"""Writes kicad/phone.kicad_pcb, kicad/phone.pretty/*.kicad_mod and mechanical/board.json.

Placement is fixed for the parts that matter to the shell (front side) and for the ICs; the
passives are dropped by a small greedy placer near the parts they talk to. Tracks are routed by a
two-layer grid router (0.254 mm grid, Manhattan, vias). Ground is poured on both layers by fill_zones.py.
Designed by Claude Sonnet 5.5 under Lewis Moten's direction, with KiCad.
"""
import heapq
import json
import math
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(__file__))
from design import parts, GND, V5  # noqa: E402
from footprints import FP, NAMES  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
KDIR = os.path.join(HERE, "..", "kicad")
W, H = 68.58, 160.02
TW, CLR, VD, VDR = 0.30, 0.20, 0.8, 0.4      # track, clearance, via pad, via drill
G = 0.254
NX, NY = int(W / G) + 1, int(H / G) + 1
DIAL = (34.29, 92.71)
DIAL_R = 28.5
_k = [0]


def uid():
    _k[0] += 1
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"potf-pcb-{_k[0]}"))


def f(v):
    return ("%.4f" % v).rstrip("0").rstrip(".") if v else "0"


netlist = json.load(open(os.path.join(KDIR, "netlist.json")))
byref = {p["ref"]: p for p in parts}

# ---- placement ------------------------------------------------------------------------------------
# ref: (x, y, rotation degrees)
FIXED = {
    "D2": (15.24, 6.35, 0), "D1": (53.34, 6.35, 0),
    "DS1": (17.78, 27.94, 0), "DS2": (50.8, 27.94, 0),
    "LS1": (34.29, 49.53, 0),
    "SW2": (24.13, 87.63, 0), "SW3": (44.45, 97.79, 0),
    "SW4": (16.51, 141.22, 0), "SW5": (52.07, 141.22, 0), "MK1": (34.29, 151.13, 0),
    "U3": (34.29, 41.91, 90), "U1": (19.05, 58.42, 90), "U2": (50.8, 58.42, 90),
    "U4": (19.05, 72.39, 90), "U5": (31.75, 72.39, 90), "X1": (50.8, 68.58, 0),
    "BT1": (34.29, 134.62, 0), "SW1": (63.5, 87.63, 90), "U6": (48.26, 91.44, 0),
}
NEAR = {"C15": "U3", "C14": "U3", "C26": "U3", "R26": "U3", "C16": "U1", "R1": "U1", "C17": "U2", "C18": "U4",
        "C19": "U5", "C20": "U5", "C21": "U5", "R27": "U5", "C22": "U5", "C1": "U6", "C2": "U6", "Q1": "D2",
        "R10": "Q1", "R11": "D2", "Q2": "U5", "R22": "Q2"}
MOUNT = [(3.81, 3.81), (64.77, 3.81), (3.81, 156.21), (64.77, 156.21)]


def rot(x, y, a):
    a = a % 360
    return {0: (x, y), 90: (-y, x), 180: (-x, -y), 270: (y, -x)}[a]


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


placed = {}
for ref, (x, y, a) in FIXED.items():
    placed[ref] = Placed(ref, x, y, a)


def overlaps(r1, r2):
    return r1[0] < r2[2] and r2[0] < r1[2] and r1[1] < r2[3] and r2[1] < r1[3]


def pad_net(ref, padnum):
    return netlist[ref][padnum]


def place_passives():
    # occupied courtyards per side; front-side pads also block the back (leads poke through)
    occ = {"F": [], "B": []}
    for pl in placed.values():
        occ[pl.side].append(pl.rect(pl.fp.court, 0.35))
    keep = []
    for pl in placed.values():
        for pad, rx, ry in pl.pads:
            keep.append((pl.x + rx - 1.3, pl.y + ry - 1.3, pl.x + rx + 1.3, pl.y + ry + 1.3))
    for mx, my in MOUNT:
        keep.append((mx - 3.6, my - 3.6, mx + 3.6, my + 3.6))
    keep.append((0, 0, 0, 0))
    # dial ring clear zone is only for front parts; the back is free there
    todo = [p for p in parts if p["ref"] not in placed]
    # order: those with a NEAR anchor first, then by number of nets shared with placed parts
    todo.sort(key=lambda p: (p["ref"] not in NEAR, p["ref"]))
    region = (4.5, 12.5, W - 4.5, 109.5)
    for p in todo:
        ref = p["ref"]
        best = None
        anchor = None
        pts = []
        for padnum, net in netlist[ref].items():
            if net in (GND, V5, None):
                continue
            for r2, pl in placed.items():
                for pad, rx, ry in pl.pads:
                    if netlist[r2].get(pad.num) == net:
                        pts.append((pl.x + rx, pl.y + ry))
        if ref in NEAR and NEAR[ref] in placed:
            q = placed[NEAR[ref]]
            pts += [(q.x, q.y)] * 3
        if not pts:
            pts = [(W / 2, 60)]
        cx = sum(a for a, b in pts) / len(pts)
        cy = sum(b for a, b in pts) / len(pts)
        for a in (0, 90):
            tmp = Placed(ref, 0, 0, a)
            r0 = tmp.rect(tmp.fp.court, 0.35)
            xi = int(region[0] / 1.27)
            while xi * 1.27 < region[2]:
                x = xi * 1.27
                yi = int(region[1] / 1.27)
                while yi * 1.27 < region[3]:
                    y = yi * 1.27
                    rr = (x + r0[0], y + r0[1], x + r0[2], y + r0[3])
                    yi += 1
                    if rr[0] < region[0] - 1 or rr[2] > region[2] + 1 or rr[1] < region[1] - 1 or rr[3] > region[3] + 1:
                        continue
                    if any(overlaps(rr, o) for o in occ[p["side"]]):
                        continue
                    padbox = [(x + rx - 1.3, y + ry - 1.3, x + rx + 1.3, y + ry + 1.3) for _, rx, ry in tmp.pads]
                    if any(overlaps(pb, k) for pb in padbox for k in keep):
                        continue
                    cost = math.hypot(x - cx, y - cy) + 0.001 * (x + y)
                    if best is None or cost < best[0]:
                        best = (cost, x, y, a)
                xi += 1
        if best is None:
            raise SystemExit(f"no room for {ref}")
        _, x, y, a = best
        pl = Placed(ref, x, y, a)
        placed[ref] = pl
        occ[pl.side].append(pl.rect(pl.fp.court, 0.35))
        for pad, rx, ry in pl.pads:
            keep.append((x + rx - 1.3, y + ry - 1.3, x + rx + 1.3, y + ry + 1.3))


place_passives()

# ---- nets ---------------------------------------------------------------------------------------------
netnames = sorted({n for d in netlist.values() for n in d.values() if n})
nid = {n: i + 1 for i, n in enumerate(netnames)}
padnets = {}   # net -> list of (ref, padnum, x, y, radius)
for ref, pl in placed.items():
    for pad, rx, ry in pl.pads:
        n = netlist[ref].get(pad.num)
        if n:
            padnets.setdefault(n, []).append((ref, pad.num, pl.x + rx, pl.y + ry, pad.d / 2 * (1.42 if pad.square else 1)))

# ---- router ---------------------------------------------------------------------------------------------
owner = [[0] * (NX * NY) for _ in range(2)]   # 0 free, net id, -1 shared (blocked for all)
ctr = [[0] * (NX * NY) for _ in range(2)]
viaban = bytearray(NX * NY)


def disc(r):
    n = int(r / G) + 1
    return [(dx, dy) for dx in range(-n, n + 1) for dy in range(-n, n + 1) if math.hypot(dx, dy) * G < r - 1e-6]


D_TRACK = disc(TW + CLR)            # 0.5
D_VIA = disc(VD / 2 + CLR + TW / 2)  # 0.75
D_VIA_CTR = disc(VD / 2 + CLR + TW / 2 + 0.2)
EDGE = 0.7
cell = lambda v: int(round(v / G))  # noqa: E731


def stamp(layer, cx, cy, offs, net, arr=None):
    a = owner[layer] if arr is None else arr[layer]
    for dx, dy in offs:
        x, y = cx + dx, cy + dy
        if 0 <= x < NX and 0 <= y < NY:
            i = y * NX + x
            v = a[i]
            if v == 0:
                a[i] = net
            elif v != net:
                a[i] = -1


def init_obstacles():
    for n, lst in padnets.items():
        for ref, num, x, y, r in lst:
            for L in (0, 1):
                stamp(L, cell(x), cell(y), disc(r + CLR + TW / 2), nid[n])
                stamp(L, cell(x), cell(y), disc(r), nid[n], ctr)
            for dx, dy in disc(r + 0.8):
                xx, yy = cell(x) + dx, cell(y) + dy
                if 0 <= xx < NX and 0 <= yy < NY:
                    viaban[yy * NX + xx] = 1
    for pl in placed.values():     # pads with no net
        for pad, rx, ry in pl.pads:
            if not netlist[pl.ref].get(pad.num):
                for L in (0, 1):
                    stamp(L, cell(pl.x + rx), cell(pl.y + ry), disc(pad.d / 2 * (1.42 if pad.square else 1) + CLR + TW / 2), -1)
                for dx, dy in disc(pad.d / 2 * (1.42 if pad.square else 1) + 0.8):
                    viaban[(cell(pl.y + ry) + dy) * NX + cell(pl.x + rx) + dx] = 1
    for mx, my in MOUNT:
        for L in (0, 1):
            stamp(L, cell(mx), cell(my), disc(1.6 + 0.5 + CLR + TW / 2), -1)
    # board edge keep-out
    for L in (0, 1):
        for x in range(NX):
            for y in range(NY):
                if x * G < EDGE or y * G < EDGE or x * G > W - EDGE or y * G > H - EDGE:
                    owner[L][y * NX + x] = -1


def route(net_name):
    n = nid[net_name]
    pads = padnets[net_name]
    if len(pads) < 2:
        return [], [], True
    segs, vias = [], []
    tree = {(0, cell(pads[0][2]), cell(pads[0][3])), (1, cell(pads[0][2]), cell(pads[0][3]))}
    todo = list(pads[1:])
    ok = True
    while todo:
        # nearest remaining pad to the tree (manhattan to the closest tree cell, sampled)
        tx = [(c[1], c[2]) for c in tree]
        todo.sort(key=lambda p: min(abs(cell(p[2]) - a) + abs(cell(p[3]) - b) for a, b in tx[::max(1, len(tx) // 200)]))
        tgt = todo.pop(0)
        gx, gy = cell(tgt[2]), cell(tgt[3])
        path = astar(tree, gx, gy, n)
        if path is None:
            ok = False
            print("  unrouted:", net_name, "->", tgt[0], tgt[1], flush=True)
            continue
        commit(path, n)
        for c in path:
            tree.add(c)
        s, v = path_to_geom(path)
        segs += s
        vias += v
    return segs, vias, ok


def astar(tree, gx, gy, n):
    # state (layer, x, y, dir) ; dir 0..3 or 4 = none (start / after via)
    own0, own1 = owner[0], owner[1]
    own = (own0, own1)
    pq = []
    best = {}
    for (L, x, y) in tree:
        st = (L, x, y, 4)
        best[st] = 0
        heapq.heappush(pq, (abs(x - gx) + abs(y - gy), 0, st, None))
    prev = {}
    D = ((1, 0), (-1, 0), (0, 1), (0, -1))
    goal = None
    cnt = 0
    while pq:
        fcost, g, st, par = heapq.heappop(pq)
        if best.get(st, 1e18) < g:
            continue
        if st in prev:
            continue
        prev[st] = par
        L, x, y, d = st
        if x == gx and y == gy:
            goal = st
            break
        cnt += 1
        if cnt > 400000:
            break
        for k, (dx, dy) in enumerate(D):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < NX and 0 <= ny < NY):
                continue
            v = own[L][ny * NX + nx]
            if v != 0 and v != n:
                continue
            c = 1.0
            if d != 4 and d != k:
                c += 3.0
            # prefer vertical on F, horizontal on B
            if (L == 0) != (dy != 0):
                c += 0.6
            ns = (L, nx, ny, k)
            ng = g + c
            if ng < best.get(ns, 1e18):
                best[ns] = ng
                heapq.heappush(pq, (ng + abs(nx - gx) + abs(ny - gy), ng, ns, st))
        # via
        o = 1 - L
        if d != 4 or True:
            vv = own[o][y * NX + x]
            if (vv == 0 or vv == n) and via_ok(x, y, n):
                ns = (o, x, y, 4)
                ng = g + 10
                if ng < best.get(ns, 1e18):
                    best[ns] = ng
                    heapq.heappush(pq, (ng + abs(x - gx) + abs(y - gy), ng, ns, st))
    if goal is None:
        return None
    path = []
    s = goal
    while s is not None:
        path.append((s[0], s[1], s[2]))
        s = prev[s]
    path.reverse()
    return path


def via_ok(x, y, n):
    if viaban[y * NX + x]:
        return False
    for dx, dy in D_VIA_CTR:
        xx, yy = x + dx, y + dy
        if 0 <= xx < NX and 0 <= yy < NY:
            for L in (0, 1):
                c = ctr[L][yy * NX + xx]
                if c != 0 and c != n:
                    return False
    return True


def commit(path, n):
    for i, (L, x, y) in enumerate(path):
        stamp(L, x, y, D_TRACK, n)
        stamp(L, x, y, [(0, 0)], n, ctr)
        if i > 0 and path[i - 1][0] != L:
            for LL in (0, 1):
                stamp(LL, x, y, D_VIA, n)
                stamp(LL, x, y, D_VIA_CTR, n, ctr)


def path_to_geom(path):
    segs, vias = [], []
    i = 0
    while i < len(path) - 1:
        L, x, y = path[i]
        L2, x2, y2 = path[i + 1]
        if L2 != L:
            vias.append((x * G, y * G))
            i += 1
            continue
        j = i + 1
        dx, dy = x2 - x, y2 - y
        while j + 1 < len(path) and path[j + 1][0] == L and (path[j + 1][1] - path[j][1], path[j + 1][2] - path[j][2]) == (dx, dy):
            j += 1
        segs.append((L, x * G, y * G, path[j][1] * G, path[j][2] * G))
        i = j
    return segs, vias


base_order = sorted([n for n in padnets if n != GND],
                    key=lambda n: (n == V5, (max(p[2] for p in padnets[n]) - min(p[2] for p in padnets[n])) + (max(p[3] for p in padnets[n]) - min(p[3] for p in padnets[n]))))
base_order.insert(len(base_order) - 1, GND)
order = list(base_order)
for attempt in range(5):     # rip-up and retry: nets that failed go first next time
    for L in (0, 1):
        owner[L][:] = [0] * (NX * NY)
        ctr[L][:] = [0] * (NX * NY)
    viaban[:] = bytes(NX * NY)
    init_obstacles()
    all_segs, all_vias, failed = {}, {}, []
    for n in order:
        s_, v_, ok = route(n)
        all_segs[n], all_vias[n] = s_, v_
        if not ok:
            failed.append(n)
    print("attempt", attempt, "failed:", failed, flush=True)
    if not failed:
        break
    order = failed + [x for x in order if x not in failed]
print("FAILED NETS:", failed)

# ---- output --------------------------------------------------------------------------------------------
LAY = ("F.Cu", "B.Cu")


def txt(layer, s, x, y, size=0.8, mirror=False, ang=0, bold=False):
    return (f'(gr_text "{s}" (at {f(x)} {f(y)} {ang}) (layer "{layer}") (uuid "{uid()}") '
            f'(effects (font (size {size} {size}) (thickness {0.15 if size < 1.2 else 0.3})) {"(justify mirror)" if mirror else ""}))')


def line(layer, x1, y1, x2, y2, w=0.12):
    return f'(fp_line (start {f(x1)} {f(y1)}) (end {f(x2)} {f(y2)}) (stroke (width {w}) (type solid)) (layer "{layer}") (uuid "{uid()}"))'


def fp_text_prop(kind, val, x, y, layer, mirror, hide=False):
    return (f'(property "{kind}" "{val}" (at {f(x)} {f(y)} 0) (layer "{layer}") {"(hide yes) " if hide else ""}(uuid "{uid()}") '
            f'(effects (font (size 0.8 0.8) (thickness 0.12)){" (justify mirror)" if False else ""}))')


def footprint(fp, ref, value, side, x, y, a, nets, lib=False):
    """KiCad footprint text. Pads already rotated/mirrored for placement (pl) when not lib."""
    S = "B" if side == "B" else "F"
    silk, fab, crt = f"{S}.SilkS", f"{S}.Fab", f"{S}.CrtYd"
    m = (lambda v: -v) if (S == "B" and not lib) else (lambda v: v)

    def R(px, py):
        rx, ry = rot(px, py, a)
        return m(rx), ry

    out = []
    b = fp.body
    c = fp.court
    cs = [R(b[0], b[1]), R(b[2], b[1]), R(b[2], b[3]), R(b[0], b[3])]
    for i in range(4):
        out.append(line(silk, cs[i][0], cs[i][1], cs[(i + 1) % 4][0], cs[(i + 1) % 4][1]))
    cc = [R(c[0], c[1]), R(c[2], c[1]), R(c[2], c[3]), R(c[0], c[3])]
    for i in range(4):
        out.append(line(crt, cc[i][0], cc[i][1], cc[(i + 1) % 4][0], cc[(i + 1) % 4][1], 0.05))
    for cx, cy, r in fp.extra:
        px, py = R(cx, cy)
        out.append(f'(fp_circle (center {f(px)} {f(py)}) (end {f(px + r)} {f(py)}) (stroke (width 0.1) (type solid)) (fill no) (layer "{fab}") (uuid "{uid()}"))')
    for t, tx, ty in fp.marks:
        px, py = R(tx, ty)
        out.append(f'(fp_text user "{t}" (at {f(px)} {f(py)} 0) (layer "{silk}") (uuid "{uid()}") (effects (font (size 0.8 0.8) (thickness 0.12)){" (justify mirror)" if S == "B" else ""}))')
    top = min(p[1] for p in cc) - 0.9
    bot = max(p[1] for p in cc) + 0.9
    mir = S == "B"
    eff = lambda: f'(effects (font (size 0.8 0.8) (thickness 0.12)){" (justify mirror)" if mir else ""})'  # noqa: E731
    props = [
        f'(property "Reference" "{ref}" (at 0 {f(top)} 0) (layer "{silk}") (uuid "{uid()}") {eff()})',
        f'(property "Value" "{value}" (at 0 {f(bot)} 0) (layer "{silk}") (uuid "{uid()}") {eff()})',
        f'(property "Footprint" "phone:{fp.name}" (at 0 0 0) (layer "{fab}") (hide yes) (uuid "{uid()}") (effects (font (size 1 1) (thickness 0.15))))',
        f'(property "Datasheet" "" (at 0 0 0) (layer "{fab}") (hide yes) (uuid "{uid()}") (effects (font (size 1 1) (thickness 0.15))))',
        f'(property "Description" "{fp.desc}" (at 0 0 0) (layer "{fab}") (hide yes) (uuid "{uid()}") (effects (font (size 1 1) (thickness 0.15))))',
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
    return props, out, pads


def board_footprint(pl):
    p = byref[pl.ref]
    props, gfx, pads = footprint(pl.fp, pl.ref, p["value"], p["side"], pl.x, pl.y, pl.a, netlist[pl.ref])
    layer = "B.Cu" if p["side"] == "B" else "F.Cu"
    body = "\n    ".join(props + ["(attr through_hole)"] + gfx + pads)
    return f'(footprint "phone:{pl.fp.name}" (layer "{layer}") (uuid "{uid()}") (at {f(pl.x)} {f(pl.y)})\n    {body}\n  )'


items = []
for ref in sorted(placed):
    items.append(board_footprint(placed[ref]))
for i, (mx, my) in enumerate(MOUNT):
    items.append(f'''(footprint "phone:MountingHole_3.2mm_M3" (layer "F.Cu") (uuid "{uid()}") (at {mx} {my})
    (property "Reference" "H{i + 1}" (at 0 -4.2 0) (layer "F.Fab") (uuid "{uid()}") (effects (font (size 0.8 0.8) (thickness 0.12))))
    (property "Value" "M3" (at 0 4.2 0) (layer "F.Fab") (hide yes) (uuid "{uid()}") (effects (font (size 0.8 0.8) (thickness 0.12))))
    (attr exclude_from_pos_files exclude_from_bom)
    (fp_circle (center 0 0) (end 3.3 0) (stroke (width 0.05) (type solid)) (fill no) (layer "F.CrtYd") (uuid "{uid()}"))
    (pad "" np_thru_hole circle (at 0 0) (size 3.2 3.2) (drill 3.2) (layers "*.Cu" "*.Mask") (uuid "{uid()}"))
  )''')
for n in order:
    for (L, x1, y1, x2, y2) in all_segs[n]:
        items.append(f'(segment (start {f(x1)} {f(y1)}) (end {f(x2)} {f(y2)}) (width {TW}) (layer "{LAY[L]}") (net {nid[n]}) (uuid "{uid()}"))')
    for (x, y) in all_vias[n]:
        items.append(f'(via (at {f(x)} {f(y)}) (size {VD}) (drill {VDR}) (layers "F.Cu" "B.Cu") (net {nid[n]}) (uuid "{uid()}"))')

# outline: rounded corners (r = 3 mm)
r = 3.0
def arc(cx, cy, a0, a1):
    m = (a0 + a1) / 2
    pt = lambda a: (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))  # noqa: E731
    s, mid, e = pt(a0), pt(m), pt(a1)
    return f'(gr_arc (start {f(s[0])} {f(s[1])}) (mid {f(mid[0])} {f(mid[1])}) (end {f(e[0])} {f(e[1])}) (stroke (width 0.1) (type solid)) (layer "Edge.Cuts") (uuid "{uid()}"))'
def eline(x1, y1, x2, y2):
    return f'(gr_line (start {f(x1)} {f(y1)}) (end {f(x2)} {f(y2)}) (stroke (width 0.1) (type solid)) (layer "Edge.Cuts") (uuid "{uid()}"))'
edge = [eline(r, 0, W - r, 0), eline(W, r, W, H - r), eline(W - r, H, r, H), eline(0, H - r, 0, r),
        arc(r, r, 180, 270), arc(W - r, r, 270, 360), arc(W - r, H - r, 0, 90), arc(r, H - r, 90, 180)]
items += edge

# lettering and the number ring
silk = []
silk.append(txt("F.SilkS", "THE PHONE OF THE FUTURE", W / 2, 14.6, 1.9))
cx, cy = DIAL
DIGITS = []
for k in range(1, 11):
    ang = 120 - 30 * (k + 1)       # degrees clockwise from the top; 1 at 60, 0 at 150; finger stop at 120
    ang %= 360
    rad = math.radians(ang)
    x, y = cx + 20.32 * math.sin(rad), cy - 20.32 * math.cos(rad)
    d = str(k % 10)
    DIGITS.append(dict(digit=d, angle_cw_from_top_deg=ang, x=round(x, 2), y=round(y, 2)))
    silk.append(txt("F.SilkS", d, x, y, 3.6))
silk.append(f'(gr_circle (center {f(cx)} {f(cy)}) (end {f(cx + DIAL_R)} {f(cy)}) (stroke (width 0.2) (type solid)) (fill no) (layer "F.SilkS") (uuid "{uid()}"))')
silk.append(f'(gr_circle (center {f(cx)} {f(cy)}) (end {f(cx + 3)} {f(cy)}) (stroke (width 0.2) (type solid)) (fill no) (layer "F.SilkS") (uuid "{uid()}"))')
a = math.radians(120)
silk.append(f'(gr_line (start {f(cx + 25 * math.sin(a))} {f(cy - 25 * math.cos(a))}) (end {f(cx + 28 * math.sin(a))} {f(cy - 28 * math.cos(a))}) (stroke (width 0.3) (type solid)) (layer "F.SilkS") (uuid "{uid()}"))')
for s, x, y in (("IR LED", 15.24, 11.2), ("IR EYE", 53.34, 11.2)):
    pass
silk.append(txt("F.SilkS", "TALK", 16.51, 136.56, 1.0))
silk.append(txt("F.SilkS", "CLEAR", 52.07, 136.56, 1.0))
silk.append(txt("F.SilkS", "MIC", 34.29, 145.8, 1.0))
silk.append(txt("B.SilkS", "THE PHONE OF THE FUTURE", W / 2, 17.0, 1.9, True))
silk.append(txt("B.SilkS", "rev A  untested design", W / 2, 20.4, 1.0, True))
silk.append(txt("B.SilkS", "Claude Sonnet 5.5 + KiCad", W / 2, 22.4, 1.0, True))
silk.append(txt("B.SilkS", "+ BATTERY SIDE", W / 2, 158.2, 0.9, True))
items += silk

nets_txt = '(net 0 "")\n  ' + "\n  ".join(f'(net {i} "{n}")' for n, i in nid.items())
pcb = f'''(kicad_pcb (version 20241229) (generator "pcbnew") (generator_version "9.0")
  (general (thickness 1.6) (legacy_teardrops no))
  (paper "A3")
  (title_block (title "THE PHONE OF THE FUTURE") (date "2026-11-03") (rev "A")
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
  (setup (pad_to_mask_clearance 0) (allow_soldermask_bridges_in_footprints no))
    {nets_txt}
  {chr(10).join("  " + i for i in items)}
)
'''
open(os.path.join(KDIR, "phone.kicad_pcb"), "w").write(pcb)

# footprint library
lib = os.path.join(KDIR, "phone.pretty")
os.makedirs(lib, exist_ok=True)
for k, fp in FP.items():
    props, gfx, pads = footprint(fp, "REF**", fp.name, "F", 0, 0, 0, None, lib=True)
    body = "\n  ".join(props + ["(attr through_hole)"] + gfx + pads)
    open(os.path.join(lib, fp.name + ".kicad_mod"), "w").write(
        f'(footprint "{fp.name}" (version 20241229) (generator "pcbnew") (generator_version "9.0") (layer "F.Cu") (descr "{fp.desc}")\n  {body}\n)\n')
mh = os.path.join(lib, "MountingHole_3.2mm_M3.kicad_mod")
open(mh, "w").write(f'''(footprint "MountingHole_3.2mm_M3" (version 20241229) (generator "pcbnew") (generator_version "9.0") (layer "F.Cu") (descr "M3 hole, no pad copper")
  (property "Reference" "REF**" (at 0 -4.2 0) (layer "F.SilkS") (uuid "{uid()}") (effects (font (size 0.8 0.8) (thickness 0.12))))
  (property "Value" "M3" (at 0 4.2 0) (layer "F.Fab") (uuid "{uid()}") (effects (font (size 0.8 0.8) (thickness 0.12))))
  (attr exclude_from_pos_files exclude_from_bom)
  (pad "" np_thru_hole circle (at 0 0) (size 3.2 3.2) (drill 3.2) (layers "*.Cu" "*.Mask") (uuid "{uid()}"))
)
''')

# placement dump for the mechanical interface
json.dump({r: dict(x=round(p.x, 3), y=round(p.y, 3), rot=p.a, side=p.side, fp=p.fp.name,
                   pads={pad.num: [round(p.x + rx, 3), round(p.y + ry, 3)] for pad, rx, ry in p.pads})
           for r, p in placed.items()} | {"_digits": DIGITS, "_failed": failed},
          open(os.path.join(KDIR, "placement.json"), "w"), indent=1)
print("wrote board", len(placed), "parts", sum(len(v) for v in all_segs.values()), "tracks", sum(len(v) for v in all_vias.values()), "vias")
