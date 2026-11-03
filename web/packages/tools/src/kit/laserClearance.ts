// How close the separate elements of a laser face come to each other (laserSvg.ts): every element (a line of text, an arc, a
// motif, a rim, a hole) is rasterized on its own at 0.1 mm, and any pair nearer than a gap is reported with how near it is.
// One-color engraving can't separate shapes that touch, so a build fails on any pair under the gap.
import { HAIRLINE, type Item, type LaserSheet } from './laserSvg';

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
