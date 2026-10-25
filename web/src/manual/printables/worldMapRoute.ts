// The World Map's paths (worldMapPlan.ts): each way between two places drawn as straight runs
// across and down, found on a fine grid (a tenth of an inch) that keeps off every other place.
// A path leaves a place from the top or the sides of its round picture (never through its
// ribbon or the names under it). Paths that share a place may run together, like a road that
// forks; any other path is kept a lane apart and crossed only when there's no way round.
import type { Point } from '../../formats/game';
import type { Rect } from './worldMapLayout';
import type { DrawnPath } from './worldMapMeasure';

/** Grid step, in map units. */
const G = 1;
/** Room kept between a path and a place it passes. */
const CLEAR = 1.2;
const COST = { step: 1, bend: 4, nearPlace: 0.8, crossing: 30, along: 60, beside: 2, shared: 0.45 };

interface Place {
  c: Point;
  r: number;
  box: Rect;
}

/** A tiny binary heap of (key, value) pairs, smallest key first. */
class Heap {
  private k: number[] = [];
  private v: number[] = [];
  get size() {
    return this.k.length;
  }
  clear() {
    this.k.length = 0;
    this.v.length = 0;
  }
  /** Every (key, value) pair, in no order. */
  entries(): [number, number][] {
    return this.k.map((k, i) => [k, this.v[i]]);
  }
  push(key: number, val: number) {
    const { k, v } = this;
    let i = k.length;
    k.push(key);
    v.push(val);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (k[p] <= key) break;
      k[i] = k[p];
      v[i] = v[p];
      i = p;
    }
    k[i] = key;
    v[i] = val;
  }
  pop(): number {
    const { k, v } = this;
    const top = v[0];
    const lk = k.pop()!;
    const lv = v.pop()!;
    if (k.length) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        if (l >= k.length) break;
        const c = l + 1 < k.length && k[l + 1] < k[l] ? l + 1 : l;
        if (k[c] >= lk) break;
        k[i] = k[c];
        v[i] = v[c];
        i = c;
      }
      k[i] = lk;
      v[i] = lv;
    }
    return top;
  }
}

const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

/** Points where a line goes straight on dropped, and steps back and forth smoothed away. */
function simplify(pts: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of pts) {
    if (out.length && Math.abs(out[out.length - 1].x - p.x) < 1e-6 && Math.abs(out[out.length - 1].y - p.y) < 1e-6) continue;
    while (out.length >= 2) {
      const a = out[out.length - 2];
      const b = out[out.length - 1];
      const straight = Math.abs((b.x - a.x) * (p.y - b.y) - (b.y - a.y) * (p.x - b.x)) < 1e-6;
      if (!straight) break;
      out.pop();
    }
    out.push(p);
  }
  return out;
}

/**
 * Routes every pair (in the order given) between the places, inside `area`. Returns each
 * path's line: from the edge of one picture to the edge of the other.
 */
export function routePaths(places: Map<number, Place>, pairs: [number, number][], area: Rect): DrawnPath[] {
  const cols = Math.ceil(area.w / G) + 1;
  const rows = Math.ceil(area.h / G) + 1;
  const n = cols * rows;
  const X = (c: number) => area.x + c * G;
  const Y = (r: number) => area.y + r * G;
  const colOf = (x: number) => Math.max(0, Math.min(cols - 1, Math.round((x - area.x) / G)));
  const rowOf = (y: number) => Math.max(0, Math.min(rows - 1, Math.round((y - area.y) / G)));
  // which place (id + 1) covers each cell, and how near a place each cell is
  const owner = new Int32Array(n);
  const near = new Uint8Array(n);
  for (const [id, p] of places) {
    const b = p.box;
    for (let r = rowOf(b.y - CLEAR - 2); r <= rowOf(b.y + b.h + CLEAR + 2); r++)
      for (let c = colOf(b.x - CLEAR - 2); c <= colOf(b.x + b.w + CLEAR + 2); c++) {
        const x = X(c);
        const y = Y(r);
        const inside = x > b.x - CLEAR && x < b.x + b.w + CLEAR && y > b.y - CLEAR && y < b.y + b.h + CLEAR;
        if (inside) owner[r * cols + c] = id + 1;
        else near[r * cols + c] = 1;
      }
  }
  // which paths run through each cell, and which way (0 across, 1 down)
  const use = new Map<number, { e: number; dir: number }[]>();
  const done: DrawnPath[] = [];
  const dist = new Float64Array(n * 4);
  const from = new Int32Array(n * 4);
  // a search's marks are only good for the search that made them
  const stamp = new Int32Array(n * 4);
  let search = 0;
  for (const [e, [a, b]] of pairs.entries()) {
    const pa = places.get(a)!;
    const pb = places.get(b)!;
    const ports = (p: Place) => [
      { x: p.c.x, y: p.box.y - CLEAR - G, dir: 3, edge: { x: p.c.x, y: p.c.y - p.r } },
      { x: p.box.x - CLEAR - G, y: p.c.y, dir: 2, edge: { x: p.c.x - p.r, y: p.c.y } },
      { x: p.box.x + p.box.w + CLEAR + G, y: p.c.y, dir: 0, edge: { x: p.c.x + p.r, y: p.c.y } },
    ];
    const kin = (k: number) => pairs[k][0] === a || pairs[k][1] === a || pairs[k][0] === b || pairs[k][1] === b;
    const enter = (cell: number, dir: number): number => {
      if (owner[cell]) return Infinity;
      let cost = COST.step + (near[cell] ? COST.nearPlace : 0);
      const here = use.get(cell);
      if (here) {
        // running with a path from the same place is cheaper than a lane of its own (a road that forks)
        let shared = false;
        for (const u of here)
          if (kin(u.e)) shared = true;
          else cost += u.dir === (dir & 1) ? COST.along : COST.crossing;
        if (shared) cost -= COST.step - COST.shared;
      } else {
        // keep a lane between this path and others
        const c = cell % cols;
        for (const nb of [cell - 1, cell + 1, cell - cols, cell + cols]) {
          if (nb < 0 || nb >= n || (Math.abs((nb % cols) - c) > 1 && (nb === cell - 1 || nb === cell + 1))) continue;
          const there = use.get(nb);
          if (there?.some((u) => !kin(u.e))) {
            cost += COST.beside;
            break;
          }
        }
      }
      return Math.max(0.05, cost);
    };
    search++;
    const D = (st: number) => (stamp[st] === search ? dist[st] : Infinity);
    const heap = new Heap();
    const targets = new Map<number, ReturnType<typeof ports>[number]>();
    for (const t of ports(pb)) targets.set(rowOf(t.y) * cols + colOf(t.x), t);
    const tx = pb.c.x;
    const ty = pb.c.y;
    const h = (cell: number) => (Math.abs(X(cell % cols) - tx) + Math.abs(Y((cell / cols) | 0) - ty)) / G;
    const starts = ports(pa);
    for (const [k, s] of starts.entries()) {
      const cell = rowOf(s.y) * cols + colOf(s.x);
      if (owner[cell]) continue;
      const st = cell * 4 + s.dir;
      if (D(st) > 0) {
        stamp[st] = search;
        dist[st] = 0;
        from[st] = -2 - k;
        heap.push(h(cell), st);
      }
    }
    const search1 = (lo: { c: number; r: number }, hi: { c: number; r: number }): number => {
      while (heap.size) {
        const st = heap.pop();
        const cell = st >> 2;
        const dir = st & 3;
        const d = dist[st];
        const t = targets.get(cell);
        // arrive moving toward the place: into its top going down, into a side going across
        if (t && (dir + 2) % 4 === t.dir) return st;
        const c = cell % cols;
        const r = (cell / cols) | 0;
        for (let nd = 0; nd < 4; nd++) {
          if (nd === (dir + 2) % 4) continue;
          const nc = c + DX[nd];
          const nr = r + DY[nd];
          if (nc < lo.c || nr < lo.r || nc > hi.c || nr > hi.r) continue;
          const ncell = nr * cols + nc;
          const step = enter(ncell, nd);
          if (step === Infinity) continue;
          const nst = ncell * 4 + nd;
          const nd2 = d + step + (nd !== dir ? COST.bend : 0);
          if (nd2 < D(nst)) {
            stamp[nst] = search;
            dist[nst] = nd2;
            from[nst] = st;
            heap.push(nd2 + h(ncell), nst);
          }
        }
      }
      return -1;
    };
    // look near the two places first, and further only when there's no way there
    const lo = { c: colOf(Math.min(pa.box.x, pb.box.x) - 60), r: rowOf(Math.min(pa.box.y, pb.box.y) - 60) };
    const hi = { c: colOf(Math.max(pa.box.x + pa.box.w, pb.box.x + pb.box.w) + 60), r: rowOf(Math.max(pa.box.y + pa.box.h, pb.box.y + pb.box.h) + 60) };
    const open = heap.entries();
    let goal = search1(lo, hi);
    if (goal < 0 && (lo.c > 0 || lo.r > 0 || hi.c < cols - 1 || hi.r < rows - 1)) {
      search++;
      heap.clear();
      for (const [k, st] of open) {
        stamp[st] = search;
        dist[st] = 0;
        heap.push(k, st);
      }
      goal = search1({ c: 0, r: 0 }, { c: cols - 1, r: rows - 1 });
    }
    let line: Point[];
    if (goal < 0) {
      // no way round: a straight line, edge to edge
      line = [pa.c, pb.c];
    } else {
      const cells: number[] = [];
      let st = goal;
      while (st >= 0) {
        cells.push(st);
        st = from[st];
      }
      const startPort = starts[-2 - st];
      cells.reverse();
      const pts = cells.map((s) => ({ x: X((s >> 2) % cols), y: Y(((s >> 2) / cols) | 0) }));
      // the runs out of and into each place line up with its middle
      const align = (list: Point[], port: { dir: number }, c: Point) => {
        const key = port.dir === 3 ? 'x' : 'y';
        const v = list[0][key];
        for (const p of list) {
          if (Math.abs(p[key] - v) > 1e-6) break;
          p[key] = c[key];
        }
      };
      const endPort = targets.get(goal >> 2)!;
      align(pts, startPort, pa.c);
      pts.reverse();
      align(pts, endPort, pb.c);
      pts.reverse();
      line = simplify([startPort.edge, ...pts, endPort.edge]);
      for (const s of cells) {
        const cell = s >> 2;
        const list = use.get(cell) ?? [];
        list.push({ e, dir: s & 1 });
        use.set(cell, list);
      }
    }
    done.push({ a, b, line });
  }
  return done;
}
