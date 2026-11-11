// How close the separate elements of a laser face come to each other (laserSvg.ts): every element (a line of text, an arc, a
// motif, a rim, a hole) is rasterized on its own at 0.1 mm, and any pair nearer than a gap is reported with how near it is.
// One-color engraving can't separate shapes that touch, so a build fails on any pair under the gap.
import { HAIRLINE, type Item, type LaserSheet, type Pt } from './laserSvg';

export interface Element {
  name: string;
  from: number;
  to: number;
}
export interface Close {
  a: string;
  b: string;
  mm: number;
}
const RES = 10; // cells to the millimeter

/** Exact distances between compensated cut paths, including nested holes; avoids sheet-sized raster allocations. */
export function cutSpacingProblems(sheet: LaserSheet, gap: number): Close[] {
  const cuts = sheet.items.filter((it) => it.op === 'cut');
  const pointSegment = (p: Pt, a: Pt, b: Pt) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  };
  const cross = (a: Pt, b: Pt, p: Pt) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const edges = (pts: Pt[]): [Pt, Pt][] => pts.map((p, i) => [p, pts[(i + 1) % pts.length]]);
  const apart = (a: Item, b: Item): number => {
    if (a.k === 'ring' || b.k === 'ring') return Infinity;
    if (a.k === 'circle' && b.k === 'circle') {
      const d = Math.hypot(a.cx - b.cx, a.cy - b.cy);
      return Math.max(0, d - a.r - b.r, Math.abs(a.r - b.r) - d);
    }
    if (a.k === 'poly' && b.k === 'circle') return apart(b, a);
    if (a.k === 'circle' && b.k === 'poly') {
      const p: Pt = [a.cx, a.cy];
      return Math.min(
        ...edges(b.pts).map(([u, v]) => {
          const near = pointSegment(p, u, v);
          const far = Math.max(Math.hypot(u[0] - p[0], u[1] - p[1]), Math.hypot(v[0] - p[0], v[1] - p[1]));
          return Math.max(0, near - a.r, a.r - far);
        }),
      );
    }
    if (a.k !== 'poly' || b.k !== 'poly') return Infinity;
    let best = Infinity;
    for (const [u, v] of edges(a.pts))
      for (const [p, q] of edges(b.pts)) {
        const distance = Math.min(pointSegment(u, p, q), pointSegment(v, p, q), pointSegment(p, u, v), pointSegment(q, u, v));
        const crosses = cross(u, v, p) * cross(u, v, q) < 0 && cross(p, q, u) * cross(p, q, v) < 0;
        best = Math.min(best, crosses ? 0 : distance);
        if (best < 1e-8) return 0;
      }
    return best;
  };
  const bounds = (it: Item) => {
    const pts =
      it.k === 'poly'
        ? it.pts
        : it.k === 'circle'
          ? [
              [it.cx - it.r, it.cy - it.r],
              [it.cx + it.r, it.cy + it.r],
            ]
          : [];
    return {
      x0: Math.min(...pts.map(([x]) => x)),
      y0: Math.min(...pts.map(([, y]) => y)),
      x1: Math.max(...pts.map(([x]) => x)),
      y1: Math.max(...pts.map(([, y]) => y)),
    };
  };
  const boxes = cuts.map(bounds);
  const out: Close[] = [];
  cuts.forEach((a, i) =>
    cuts.slice(i + 1).forEach((b, k) => {
      const j = i + k + 1,
        A = boxes[i],
        B = boxes[j];
      if (Math.max(A.x0 - B.x1, B.x0 - A.x1, A.y0 - B.y1, B.y0 - A.y1) >= gap) return;
      const mm = apart(a, b);
      if (mm < gap - 1e-6) out.push({ a: `cut ${i}`, b: `cut ${j}`, mm });
    }),
  );
  return out;
}

/** Verify complete convex engraving shapes against an unglued circular/annular region (not just their vertices). */
export function engravingRegionProblems(
  sheet: LaserSheet,
  zone: { label: string; from: number; to: number; cx: number; cy: number; r0: number; r1: number },
): string[] {
  const out: string[] = [];
  sheet.items.slice(zone.from, zone.to).forEach((it, i) => {
    if (it.op !== 'engrave') {
      out.push(`${zone.label}: item ${i} is not engraving`);
      return;
    }
    let near: number;
    let far: number;
    if (it.k === 'poly') {
      const pts = it.pts.map(([x, y]) => [x - zone.cx, y - zone.cy]);
      far = Math.max(...pts.map(([x, y]) => Math.hypot(x, y)));
      let pos = false;
      let neg = false;
      near = Infinity;
      pts.forEach(([x, y], j) => {
        const [xx, yy] = pts[(j + 1) % pts.length];
        const cross = x * yy - xx * y;
        if (cross > 0) pos = true;
        if (cross < 0) neg = true;
        const dx = xx - x,
          dy = yy - y;
        const t = Math.max(0, Math.min(1, -(x * dx + y * dy) / (dx * dx + dy * dy || 1)));
        near = Math.min(near, Math.hypot(x + t * dx, y + t * dy));
      });
      if (!(pos && neg)) near = 0;
    } else {
      const d = Math.hypot(it.cx - zone.cx, it.cy - zone.cy);
      const r = it.k === 'ring' ? it.r1 : it.r;
      near = Math.max(0, d - r, it.k === 'ring' ? it.r0 - d : 0);
      far = d + r;
    }
    if (near < zone.r0 - 1e-6 || far > zone.r1 + 1e-6) out.push(`${zone.label}: engraving ${i} leaves its unglued region`);
  });
  return out;
}

/** The element's shapes as a mask over the sheet: engraving filled, cut and score lines as thin strokes. */
function mask(items: Item[], w: number, h: number): Uint8Array {
  const W = Math.ceil(w * RES);
  const H = Math.ceil(h * RES);
  const m = new Uint8Array(W * H);
  const test = (it: Item): ((x: number, y: number) => boolean) => {
    const half = Math.max(HAIRLINE, 1 / RES) / 2;
    if (it.k === 'ring') return (x, y) => ((d) => d >= it.r0 && d <= it.r1)(Math.hypot(x - it.cx, y - it.cy));
    if (it.k === 'circle') {
      const line = it.op !== 'engrave';
      return (x, y) => {
        const d = Math.hypot(x - it.cx, y - it.cy);
        return line ? Math.abs(d - it.r) <= half : d <= it.r;
      };
    }
    const p = it.pts;
    if (it.op !== 'engrave')
      return (x, y) => {
        for (let i = 0; i < p.length; i++) {
          const [ax, ay] = p[i];
          const [bx, by] = p[(i + 1) % p.length];
          const L = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
          const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / L));
          if (Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)) <= half) return true;
        }
        return false;
      };
    return (x, y) => {
      let pos = false;
      let neg = false;
      for (let i = 0; i < p.length; i++) {
        const [ax, ay] = p[i];
        const [bx, by] = p[(i + 1) % p.length];
        const c = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
        if (c > 0) pos = true;
        else if (c < 0) neg = true;
      }
      return !(pos && neg);
    };
  };
  for (const it of items) {
    const inside = test(it);
    const [x0, y0, x1, y1] =
      it.k === 'poly'
        ? [
            Math.min(...it.pts.map((q) => q[0])),
            Math.min(...it.pts.map((q) => q[1])),
            Math.max(...it.pts.map((q) => q[0])),
            Math.max(...it.pts.map((q) => q[1])),
          ]
        : it.k === 'ring'
          ? [it.cx - it.r1, it.cy - it.r1, it.cx + it.r1, it.cy + it.r1]
          : [it.cx - it.r - 0.1, it.cy - it.r - 0.1, it.cx + it.r + 0.1, it.cy + it.r + 0.1];
    for (let y = Math.max(0, Math.floor(y0 * RES)); y < Math.min(H, Math.ceil(y1 * RES)); y++)
      for (let x = Math.max(0, Math.floor(x0 * RES)); x < Math.min(W, Math.ceil(x1 * RES)); x++) if (inside((x + 0.5) / RES, (y + 0.5) / RES)) m[y * W + x] = 1;
  }
  return m;
}

/** Distance (in cells, a 5-7-11 chamfer: within about 2%) from every cell to the nearest lit cell of `m`. */
function distance(m: Uint8Array, W: number, H: number): Float32Array {
  const d = new Float32Array(W * H).fill(1e9);
  for (let i = 0; i < m.length; i++) if (m[i]) d[i] = 0;
  const at = (x: number, y: number, dx: number, dy: number, c: number) => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < W && ny < H) d[y * W + x] = Math.min(d[y * W + x], d[ny * W + nx] + c);
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      at(x, y, -1, 0, 5);
      at(x, y, 0, -1, 5);
      at(x, y, -1, -1, 7);
      at(x, y, 1, -1, 7);
      at(x, y, -2, -1, 11);
      at(x, y, -1, -2, 11);
      at(x, y, 1, -2, 11);
      at(x, y, 2, -1, 11);
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      at(x, y, 1, 0, 5);
      at(x, y, 0, 1, 5);
      at(x, y, 1, 1, 7);
      at(x, y, -1, 1, 7);
      at(x, y, 2, 1, 11);
      at(x, y, 1, 2, 11);
      at(x, y, -1, 2, 11);
      at(x, y, -2, 1, 11);
    }
  return d;
}

/**
 * Every pair of elements closer than the gap: `gap` mm, or `holeGap` when either is a hole (its name starts "hole").
 * The coin's own outline cut is not an element; pass it as part of a "hole" if it should count.
 */
export function tooClose(sheet: LaserSheet, elements: Element[], gap = 0.6, holeGap = 1): Close[] {
  const W = Math.ceil(sheet.w * RES);
  const H = Math.ceil(sheet.h * RES);
  const live = elements.filter((e) => e.to > e.from).map((e) => ({ e, m: mask(sheet.items.slice(e.from, e.to), sheet.w, sheet.h) }));
  const out: Close[] = [];
  for (const A of live) {
    const d = distance(A.m, W, H);
    for (const B of live) {
      if (B.e.from <= A.e.from) continue;
      let best = 1e9;
      for (let i = 0; i < B.m.length; i++) if (B.m[i] && d[i] < best) best = d[i];
      const mm = (best / 5 - 1) / RES; // chamfer steps of 5 per cell, less the one cell a lit pixel itself spans
      const need = A.e.name.startsWith('hole') || B.e.name.startsWith('hole') ? holeGap : gap;
      if (mm < need) out.push({ a: A.e.name, b: B.e.name, mm: Math.max(0, +mm.toFixed(2)) });
    }
  }
  return out;
}
