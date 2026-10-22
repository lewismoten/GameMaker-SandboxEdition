// Laying out ground on block corners. A 100x100 Game-Maker map has 100x100 block corners
// (the map wraps, so corner 100 is corner 0): each layer (water, forest, road, rock...) is a
// field of values painted at the corners, and a corner is "in" the layer where its value is
// 0.5 or more. A block then takes the transition block for the corners of it that are in
// (terrain.ts). Painting is done with smooth fields (discs, splines, noise), and those same
// fields say which way an edge runs, so a block where the edge runs at 45 degrees gets the
// diagonal cut and a bend gets the rounded one.
import { BL, BR, TL, TR, DIAG_MASKS, type Variant } from './terrain';

export const N = 100;
const wrap = (v: number) => ((v % N) + N) % N;

export class CornerMap {
  readonly layers = new Map<string, Float32Array>();

  constructor(readonly names: string[]) {
    for (const n of names) this.layers.set(n, new Float32Array(N * N));
  }

  field(layer: string): Float32Array {
    const f = this.layers.get(layer);
    if (!f) throw new Error(`No layer ${layer}`);
    return f;
  }

  get(layer: string, x: number, y: number): number {
    return this.field(layer)[wrap(y) * N + wrap(x)];
  }

  setv(layer: string, x: number, y: number, v: number): void {
    this.field(layer)[wrap(y) * N + wrap(x)] = v;
  }

  in(layer: string, x: number, y: number): boolean {
    return this.get(layer, x, y) >= 0.5;
  }

  /** Raises a layer to fn(x, y) wherever that is higher (fn sees corner coordinates). */
  paint(layer: string, fn: (x: number, y: number) => number, box?: [number, number, number, number]): void {
    const f = this.field(layer);
    const [x0, y0, x1, y1] = box ?? [0, 0, N - 1, N - 1];
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const i = wrap(y) * N + wrap(x);
        const v = fn(x, y);
        if (v > f[i]) f[i] = v;
      }
  }

  /** Fills the corners inside a polygon (and on its edge) with `v`. */
  region(layer: string, pts: [number, number][], v = 1): void {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
        let inside = false;
        let onEdge = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i];
          const [xj, yj] = pts[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
          const cross = (xj - xi) * (y - yi) - (yj - yi) * (x - xi);
          if (Math.abs(cross) < 1e-9 && x >= Math.min(xi, xj) && x <= Math.max(xi, xj) && y >= Math.min(yi, yj) && y <= Math.max(yi, yj)) onEdge = true;
        }
        if (inside || onEdge) this.setv(layer, x, y, Math.max(v, this.get(layer, x, y)));
      }
  }

  /** Clears a layer where fn(x, y) is true. */
  clear(layer: string, fn: (x: number, y: number) => boolean): void {
    const f = this.field(layer);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (fn(x, y)) f[y * N + x] = 0;
  }

  /** A soft disc (an ellipse with rx, ry) in corner units. */
  blob(layer: string, cx: number, cy: number, rx: number, ry = rx, wobble?: (a: number) => number): void {
    const r = Math.ceil(Math.max(rx, ry) * 1.6) + 2;
    this.paint(
      layer,
      (x, y) => {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const a = Math.atan2(dy, dx);
        const k = wobble ? wobble(a) : 1;
        return 1 - (Math.hypot(dx, dy) / k - 1) * 0.5 - 0.5 + 0.5;
      },
      [Math.floor(cx - r), Math.floor(cy - r), Math.ceil(cx + r), Math.ceil(cy + r)],
    );
  }

  /** A stroke `width` corners wide along a Catmull-Rom spline through `pts`. */
  stroke(layer: string, pts: [number, number][], width = 1): void {
    const path = spline(pts, 12);
    const half = width / 2;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const [x, y] of path) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    this.paint(
      layer,
      (x, y) => {
        let d = Infinity;
        for (let i = 1; i < path.length; i++) d = Math.min(d, seg(x, y, path[i - 1], path[i]));
        // 0.5 exactly at half the width: corners within it are on the road
        return 1 - (d / Math.max(half, 0.01)) * 0.5;
      },
      [Math.floor(x0 - half - 2), Math.floor(y0 - half - 2), Math.ceil(x1 + half + 2), Math.ceil(y1 + half + 2)],
    );
  }

  /**
   * A line one corner wide through the points, which must be joined by straight or exactly
   * diagonal steps (rivers and roads run at 0, 45 and 90 degrees between bends).
   */
  path(layer: string, pts: [number, number][], v = 1): void {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const dx = Math.sign(x1 - x0);
      const dy = Math.sign(y1 - y0);
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      if (dx && dy && Math.abs(x1 - x0) !== Math.abs(y1 - y0)) throw new Error(`${layer}: path step ${pts[i - 1]} -> ${pts[i]} is not straight or diagonal`);
      for (let k = 0; k <= n; k++) this.setv(layer, x0 + dx * k, y0 + dy * k, Math.max(v, this.get(layer, x0 + dx * k, y0 + dy * k)));
    }
  }

  /** The corner mask of block (bx, by) in a layer: TL TR BR BL bits. */
  mask(layer: string, bx: number, by: number): number {
    return (this.in(layer, bx, by) ? TL : 0) | (this.in(layer, bx + 1, by) ? TR : 0) | (this.in(layer, bx + 1, by + 1) ? BR : 0) | (this.in(layer, bx, by + 1) ? BL : 0);
  }

  /**
   * Round or diagonal for a block whose edge cuts one corner: diagonal where the layer's field
   * runs at about 45 degrees through the block and the next blocks along that diagonal are cut
   * too (a straight diagonal run), round at a bend or a lone corner.
   */
  variant(layer: string, bx: number, by: number): Variant {
    const m = this.mask(layer, bx, by);
    if (!DIAG_MASKS.includes(m)) return 'round';
    // the direction the edge runs: for a TL or BR corner (or their complements) it runs
    // from bottom-left to top-right, so the run continues at (bx+1, by-1) and (bx-1, by+1)
    const single = [TL, TR, BR, BL].includes(m) ? m : 15 & ~m;
    // a saddle's band runs between its two corners; a cut corner's edge runs across them
    const [ax, ay] = m === (TL | BR) ? [1, 1] : m === (TR | BL) ? [1, -1] : single === TL || single === BR ? [1, -1] : [1, 1];
    const cut = (x: number, y: number) => DIAG_MASKS.includes(this.mask(layer, x, y));
    return cut(bx + ax, by + ay) || cut(bx - ax, by - ay) ? 'diag' : 'round';
  }
}

function seg(px: number, py: number, a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l2)) : 0;
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

/** Catmull-Rom through the points, `steps` samples per span. */
export function spline(pts: [number, number][], steps = 10): [number, number][] {
  if (pts.length < 3) return pts;
  const out: [number, number][] = [];
  const P = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
