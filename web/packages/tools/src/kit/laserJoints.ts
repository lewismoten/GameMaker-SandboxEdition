// Generic helpers for laser-cut wooden boxes (laserSvg.ts): flat panel outlines with finger (box) joints, rectilinear
// outlines from rectangles, and kerf offsets. Sizes are millimeters, y grows downward like the sheet.
//
// Finger joints: along an edge of length E the two panels that meet share one row of cells (an odd number, so both ends
// match). One panel is flush on the even cells and set in by the material thickness `t` on the odd ones, the other panel
// is the opposite. The panel that owns the corner cubes (a lid or base) is flush there and its neighbors are set in.
import type { Pt } from './laserSvg';

/** x0, y0, x1, y1 */
export type Rect = readonly [number, number, number, number];

const EPS = 1e-6;
const key = (i: number, j: number) => `${i},${j}`;

/** The single outer boundary of (union of `base`) minus (union of `minus`), as a polygon with no collinear points. */
export function outlineFromRects(base: readonly Rect[], minus: readonly Rect[] = []): Pt[] {
  const all = [...base, ...minus];
  const uniq = (v: number[]) => [...new Set(v.map((n) => Math.round(n / EPS) * EPS))].sort((a, b) => a - b);
  const xs = uniq(all.flatMap((r) => [r[0], r[2]]));
  const ys = uniq(all.flatMap((r) => [r[1], r[3]]));
  const inAny = (rs: readonly Rect[], x: number, y: number) => rs.some((r) => x > r[0] && x < r[2] && y > r[1] && y < r[3]);
  const fill = (i: number, j: number) =>
    i >= 0 &&
    j >= 0 &&
    i < xs.length - 1 &&
    j < ys.length - 1 &&
    inAny(base, (xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2) &&
    !inAny(minus, (xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2);
  const next = new Map<string, [number, number]>();
  const edge = (a: [number, number], b: [number, number]) => {
    if (next.has(key(...a))) throw new Error('outline touches itself at a corner');
    next.set(key(...a), b);
  };
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < ys.length - 1; j++) {
      if (!fill(i, j)) continue;
      if (!fill(i, j - 1)) edge([i, j], [i + 1, j]);
      if (!fill(i + 1, j)) edge([i + 1, j], [i + 1, j + 1]);
      if (!fill(i, j + 1)) edge([i + 1, j + 1], [i, j + 1]);
      if (!fill(i - 1, j)) edge([i, j + 1], [i, j]);
    }
  const first = next.keys().next().value as string;
  const loop: [number, number][] = [];
  let cur = first.split(',').map(Number) as [number, number];
  do {
    loop.push(cur);
    cur = next.get(key(...cur))!;
  } while (key(...cur) !== first && loop.length <= next.size);
  if (loop.length !== next.size) throw new Error('outline has more than one loop');
  const pts: Pt[] = loop.map(([i, j]) => [xs[i], ys[j]]);
  return pts.filter((p, k) => {
    const a = pts[(k + pts.length - 1) % pts.length];
    const b = pts[(k + 1) % pts.length];
    return Math.abs((p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0])) > 1e-9;
  });
}

/** The polygon grown by `d` mm all round (negative shrinks it): mitered, any winding. Use +kerf/2 for a part, -kerf/2 for a hole. */
export function offsetPoly(pts: readonly Pt[], d: number): Pt[] {
  const area = pts.reduce((s, p, i) => s + (p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1]), 0);
  const sgn = area > 0 ? 1 : -1;
  return pts.map((p, i) => {
    const a = pts[(i + pts.length - 1) % pts.length];
    const b = pts[(i + 1) % pts.length];
    const unit = (u: Pt, v: Pt): Pt => {
      const l = Math.hypot(v[0] - u[0], v[1] - u[1]);
      return [(v[0] - u[0]) / l, (v[1] - u[1]) / l];
    };
    const e1 = unit(a, p);
    const e2 = unit(p, b);
    const n1: Pt = [sgn * e1[1], -sgn * e1[0]];
    const n2: Pt = [sgn * e2[1], -sgn * e2[0]];
    const k = d / (1 + n1[0] * n2[0] + n1[1] * n2[1]);
    return [p[0] + (n1[0] + n2[0]) * k, p[1] + (n1[1] + n2[1]) * k] as Pt;
  });
}

export interface EdgeSpec {
  /** Which cells are set in: 'odd' leaves this panel flush on the even cells. */
  parity: 'even' | 'odd';
  /** Also set in the corner cubes at the ends (a panel that does not own them). */
  ends?: boolean;
  /** A corner cube of size t sits at the start / end of the edge, outside the cell row. */
  cubeStart?: boolean;
  cubeEnd?: boolean;
  /** Wanted cell width in mm (default 9). */
  target?: number;
}

/** The cell row of an edge of length E: where it starts, how wide each cell is, and how many (odd). */
export function cellRow(E: number, t: number, s: Pick<EdgeSpec, 'cubeStart' | 'cubeEnd' | 'target'>) {
  const a0 = s.cubeStart ? t : 0;
  const a1 = E - (s.cubeEnd ? t : 0);
  let m = Math.max(1, Math.round((a1 - a0) / (s.target ?? 9)));
  if (m % 2 === 0) m += 1;
  return { a0, a1, m, cw: (a1 - a0) / m };
}

/** The stretches [a, b] along an edge where the panel is set in by t, each widened by `fit` so the joint has a little play. */
export function notchSpans(E: number, t: number, s: EdgeSpec, fit = 0): [number, number][] {
  const { a0, a1, m, cw } = cellRow(E, t, s);
  const out: [number, number][] = [];
  if (s.ends && s.cubeStart) out.push([0, a0]);
  for (let c = 0; c < m; c++) if ((c % 2 === 0) === (s.parity === 'even')) out.push([a0 + c * cw, a0 + (c + 1) * cw]);
  if (s.ends && s.cubeEnd) out.push([a1, E]);
  return out.map(([a, b]) => [Math.max(0, a - fit), Math.min(E, b + fit)] as [number, number]);
}

export interface Edges {
  top?: EdgeSpec;
  bottom?: EdgeSpec;
  left?: EdgeSpec;
  right?: EdgeSpec;
}

/** A w x h panel with joint notches on the edges given, minus `cuts` and plus `adds` (tabs for slots, etc.). */
export function jointOutline(w: number, h: number, t: number, edges: Edges, fit = 0, cuts: readonly Rect[] = [], adds: readonly Rect[] = []): Pt[] {
  const minus: Rect[] = [...cuts];
  const span = (s: EdgeSpec | undefined, E: number) => (s ? notchSpans(E, t, s, fit) : []);
  for (const [a, b] of span(edges.top, w)) minus.push([a, 0, b, t]);
  for (const [a, b] of span(edges.bottom, w)) minus.push([a, h - t, b, h]);
  for (const [a, b] of span(edges.left, h)) minus.push([0, a, t, b]);
  for (const [a, b] of span(edges.right, h)) minus.push([w - t, a, w, b]);
  return outlineFromRects([[0, 0, w, h], ...adds], minus);
}

/** A rectangle as a polygon. */
export const rectPoly = (r: Rect): Pt[] => [
  [r[0], r[1]],
  [r[2], r[1]],
  [r[2], r[3]],
  [r[0], r[3]],
];

/** A point turned about `c` by `deg` degrees (clockwise on the sheet, y down) . */
export const rotate = (p: Pt, c: Pt, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};
