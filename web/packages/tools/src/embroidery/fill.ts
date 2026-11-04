// Tatami fill: parallel rows of stitches `spacing` mm apart, needle holes staggered in a brick pattern so they don't line up
// into a visible seam. A shape with notches (a star) breaks into several chains, each sewn from row to row.
import { rotate } from './geom';
import type { Poly, Pt } from './types';

interface Span {
  x0: number;
  x1: number;
  y: number;
  done: boolean;
}

/** The spans of every row inside the outlines, after turning the shape by -angle so rows run along x. */
function rows(polys: Poly[], angle: number, spacing: number): Span[][] {
  const a = (-angle * Math.PI) / 180;
  const turned = polys.map((p) => p.map((q) => rotate(q, a)));
  const ys = turned.flat().map((q) => q[1]);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const out: Span[][] = [];
  for (let y = lo + spacing / 2; y < hi; y += spacing) {
    const xs: number[] = [];
    for (const p of turned) {
      for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
        const A = p[i];
        const B = p[j];
        if (A[1] > y !== B[1] > y) xs.push(A[0] + ((y - A[1]) * (B[0] - A[0])) / (B[1] - A[1]));
      }
    }
    xs.sort((m, n) => m - n);
    const spans: Span[] = [];
    for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] > 0.3) spans.push({ x0: xs[i], x1: xs[i + 1], y, done: false });
    out.push(spans);
  }
  return out;
}

/** The needle points along one span, going right or left, with holes at multiples of `len` shifted by the row's phase. */
function along(s: Span, right: boolean, len: number, phase: number): Pt[] {
  const xs = [s.x0];
  for (let x = (Math.floor(s.x0 / len - phase) + 1 + phase) * len; x < s.x1; x += len) if (x - s.x0 > 0.7 && s.x1 - x > 0.7) xs.push(x);
  xs.push(s.x1);
  if (!right) xs.reverse();
  return xs.map((x) => [x, s.y] as Pt);
}

/**
 * The chains of needle points that fill the outlines with rows at `angle` degrees. Each chain is sewn in order; moving
 * between chains is the caller's job.
 */
export function tatami(polys: Poly[], angle: number, spacing: number, len: number): Pt[][] {
  const grid = rows(polys, angle, spacing);
  const back = (angle * Math.PI) / 180;
  const chains: Pt[][] = [];
  for (let r = 0; r < grid.length; r++) {
    for (const first of grid[r]) {
      if (first.done) continue;
      first.done = true;
      const chain: Pt[] = [];
      let span = first;
      let right = true;
      for (let k = r; ; k++) {
        chain.push(...along(span, right, len, (k % 3) / 3));
        const end = chain[chain.length - 1][0];
        // the next row's span whose entering end is nearest to where this row ended
        let best: Span | undefined;
        let gap = 8;
        for (const c of grid[k + 1] ?? []) {
          if (c.done) continue;
          const d = Math.abs((right ? c.x1 : c.x0) - end);
          if (d < gap) {
            gap = d;
            best = c;
          }
        }
        if (!best) break;
        best.done = true;
        span = best;
        right = !right;
      }
      chains.push(chain.map((q) => rotate(q, back)));
    }
  }
  return chains;
}
