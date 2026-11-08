"""A small two-layer grid router for through-hole boards (Manhattan tracks on a 0.254 mm grid).

Layer 0 is F.Cu, layer 1 is B.Cu. All pads are plated through-holes (copper on both layers).
Nets may have different track widths; wide nets are routed first. A front-copper keep-out
(circles) keeps F.Cu tracks and vias out of areas that must stay clear on the front
(under the dial and the speaker); back copper may cross them.
Written for the Phone of the Future by Claude Sonnet 5.5 under Lewis Moten's direction.
"""
import heapq
import math

G = 0.254


def disc(r):
    n = int(r / G) + 1
    return [(dx, dy) for dx in range(-n, n + 1) for dy in range(-n, n + 1) if math.hypot(dx, dy) * G < r - 1e-6]


class Router:
    def __init__(self, w, h, clr=0.2, via=0.8, edge=0.7):
        self.w, self.h, self.clr, self.via, self.edge = w, h, clr, via, edge
        self.nx, self.ny = int(w / G) + 1, int(h / G) + 1
        n = self.nx * self.ny
        self.n = n
        self.pads = {}        # net id -> [(x, y, r, tag)]
        self.blockers = []    # (x, y, r) no-net pads and holes, block every net and vias
        self.fzones = []      # (x, y, r): no F.Cu copper at all (tracks, vias)
        self.vrects = []      # (x0, y0, x1, y1): no via inside (tracks may cross): the silkscreen QR codes sit on the back there
        self.owner = None

    def cell(self, v):
        return int(round(v / G))

    # ---- setup ------------------------------------------------------------------------
    def add_pad(self, net, x, y, r, tag=""):
        self.pads.setdefault(net, []).append((x, y, r, tag))

    def _reset(self):
        n = self.n
        self.own = [[0] * n, [0] * n]     # narrow-track view (0 free, net, -1 blocked)
        self.ownw = [[0] * n, [0] * n]    # wide-track view (pads and holes a little bigger)
        self.ctr = [[0] * n, [0] * n]
        self.viaban = bytearray(n)
        self.fblock = bytearray(n)

    def _stamp(self, arr, layer, cx, cy, offs, net):
        a = arr[layer]
        nx, ny = self.nx, self.ny
        for dx, dy in offs:
            x, y = cx + dx, cy + dy
            if 0 <= x < nx and 0 <= y < ny:
                i = y * nx + x
                v = a[i]
                if v == 0:
                    a[i] = net
                elif v != net:
                    a[i] = -1

    def _init(self, tw):
        self._reset()
        c = self.cell
        half = tw / 2
        for net, lst in self.pads.items():
            for x, y, r, _ in lst:
                for L in (0, 1):
                    self._stamp(self.own, L, c(x), c(y), disc(r + self.clr + half), net)
                    self._stamp(self.ownw, L, c(x), c(y), disc(r + self.clr + 0.25), net)
                    self._stamp(self.ctr, L, c(x), c(y), disc(r), net)
                for dx, dy in disc(r + 0.8):
                    self._vb(c(x) + dx, c(y) + dy)
        for x, y, r in self.blockers:
            for L in (0, 1):
                self._stamp(self.own, L, c(x), c(y), disc(r + self.clr + half), -1)
                self._stamp(self.ownw, L, c(x), c(y), disc(r + self.clr + 0.25), -1)
            for dx, dy in disc(r + 0.8):
                self._vb(c(x) + dx, c(y) + dy)
        for x, y, r in self.fzones:
            for dx, dy in disc(r):
                xx, yy = c(x) + dx, c(y) + dy
                if 0 <= xx < self.nx and 0 <= yy < self.ny:
                    self.fblock[yy * self.nx + xx] = 1
                    self._vb(xx, yy)
        e = self.edge
        for L in (0, 1):
            for x in range(self.nx):
                for y in range(self.ny):
                    if x * G < e or y * G < e or x * G > self.w - e or y * G > self.h - e:
                        self.own[L][y * self.nx + x] = -1
                        self.ownw[L][y * self.nx + x] = -1

    def _vb(self, x, y):
        if 0 <= x < self.nx and 0 <= y < self.ny:
            self.viaban[y * self.nx + x] = 1

    # ---- routing ------------------------------------------------------------------------
    def route_all(self, order, widths, tw=0.3, verbose=True):
        """order: list of net ids; widths: net id -> track width. Returns (segs, vias, failed)."""
        self._init(tw)
        self.tw = tw
        out_s, out_v, failed = {}, {}, []
        for n in order:
            w = widths.get(n, tw)
            s, v, ok = self._route_net(n, w)
            out_s[n], out_v[n] = s, v
            if not ok:
                failed.append(n)
        return out_s, out_v, failed

    def _route_net(self, n, w):
        pads = self.pads[n]
        if len(pads) < 2:
            return [], [], True
        c = self.cell
        wide = w > self.tw + 1e-6
        own = self.ownw if wide else self.own
        tree = {(0, c(pads[0][0]), c(pads[0][1])), (1, c(pads[0][0]), c(pads[0][1]))}
        todo = list(pads[1:])
        segs, vias = [], []
        ok = True
        while todo:
            tx = [(t[1], t[2]) for t in tree]
            step = max(1, len(tx) // 200)
            todo.sort(key=lambda p: min(abs(c(p[0]) - a) + abs(c(p[1]) - b) for a, b in tx[::step]))
            tgt = todo.pop(0)
            gx, gy = c(tgt[0]), c(tgt[1])
            path = self._astar(tree, gx, gy, n, own)
            if path is None:
                ok = False
                continue
            self._commit(path, n, w)
            tree.update(path)
            s, v = self._geom(path)
            segs += s
            vias += v
        return segs, vias, ok

    def _astar(self, tree, gx, gy, n, own):
        nx, ny = self.nx, self.ny
        fb = self.fblock
        pq, best, prev = [], {}, {}
        for (L, x, y) in tree:
            st = (L, x, y, 4)
            best[st] = 0
            heapq.heappush(pq, (abs(x - gx) + abs(y - gy), 0, st, None))
        D = ((1, 0), (-1, 0), (0, 1), (0, -1))
        goal = None
        cnt = 0
        while pq:
            _, g, st, par = heapq.heappop(pq)
            if best.get(st, 1e18) < g or st in prev:
                continue
            prev[st] = par
            L, x, y, d = st
            if x == gx and y == gy:
                goal = st
                break
            cnt += 1
            if cnt > 600000:
                break
            for k, (dx, dy) in enumerate(D):
                xx, yy = x + dx, y + dy
                if not (0 <= xx < nx and 0 <= yy < ny):
                    continue
                i = yy * nx + xx
                v = own[L][i]
                if v != 0 and v != n:
                    continue
                if L == 0 and fb[i]:
                    continue
                cst = 1.0
                if d != 4 and d != k:
                    cst += 4.0
                if (L == 0) != (dy != 0):
                    cst += 1.0
                ns = (L, xx, yy, k)
                ng = g + cst
                if ng < best.get(ns, 1e18):
                    best[ns] = ng
                    heapq.heappush(pq, (ng + abs(xx - gx) + abs(yy - gy), ng, ns, st))
            o = 1 - L
            vv = own[o][y * nx + x]
            if (vv == 0 or vv == n) and self._via_ok(x, y, n):
                ns = (o, x, y, 4)
                ng = g + 12
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

    def _via_ok(self, x, y, n):
        if self.viaban[y * self.nx + x]:
            return False
        mx, my = x * G, y * G
        for x0, y0, x1, y1 in self.vrects:
            if x0 <= mx <= x1 and y0 <= my <= y1:
                return False
        for dx, dy in self._dv:
            xx, yy = x + dx, y + dy
            if 0 <= xx < self.nx and 0 <= yy < self.ny:
                for L in (0, 1):
                    v = self.ctr[L][yy * self.nx + xx]
                    if v != 0 and v != n:
                        return False
        return True

    @property
    def _dv(self):
        if not hasattr(self, "_dvc"):
            self._dvc = disc(self.via / 2 + self.clr + 0.15 + 0.2)
        return self._dvc

    def _commit(self, path, n, w):
        c_track = disc(w / 2 + self.clr + 0.15 + (0.1 if w > self.tw + 1e-6 else 0))
        c_wide = disc(w / 2 + self.clr + 0.25)
        d_via = disc(self.via / 2 + self.clr + 0.15)
        for i, (L, x, y) in enumerate(path):
            self._stamp(self.own, L, x, y, c_track, n)
            self._stamp(self.ownw, L, x, y, c_wide, n)
            self._stamp(self.ctr, L, x, y, [(0, 0)], n)
            if i > 0 and path[i - 1][0] != L:
                for LL in (0, 1):
                    self._stamp(self.own, LL, x, y, d_via, n)
                    self._stamp(self.ownw, LL, x, y, disc(self.via / 2 + self.clr + 0.25), n)
                    self._stamp(self.ctr, LL, x, y, self._dv, n)

    def _geom(self, path):
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
