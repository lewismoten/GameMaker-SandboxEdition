// Extruded, beveled 3D lettering for software rendering, the 1995 "3D logo" kind. Letters
// are drawn as rounded strokes (line segments and arcs along each stroke's center line);
// a grid of distances to those strokes gives the letters' outline in 2D, and pushing that
// outline back into a slab with rounded edges gives solid, beveled 3D letters. A ray finds
// them by sphere tracing (stepping by the distance to the nearest surface).

/** A stroke piece: x0, y0, x1, y1 (center line) and its radius. */
export type Seg = [number, number, number, number, number];

// Each glyph is a list of polylines in a box 1 high, drawn for a stroke radius of 0.12
// (center lines run from y 0.12 to 0.88 so the strokes' outsides just fill 0..1).
type Pt = [number, number];
const B = 0.12;
const T = 0.88;

function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 14): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}

const upperBowl = (x0: number, w: number): Pt[] => [[x0, T], [x0 + w - 0.19, T], ...arc(x0 + w - 0.19, 0.69, 0.19, 0.19, 90, -90, 10), [x0, 0.5]];
const lowerBowl = (x0: number, w: number): Pt[] => [[x0, 0.5], [x0 + w - 0.19, 0.5], ...arc(x0 + w - 0.19, 0.31, 0.19, 0.19, 90, -90, 10), [x0, B]];

const GLYPHS: Record<string, Pt[][]> = {
  S: [[...arc(0.33, 0.69, 0.22, 0.19, 15, 270), ...arc(0.33, 0.31, 0.22, 0.19, 90, -165)]],
  A: [
    [
      [0.1, B],
      [0.36, T],
      [0.62, B],
    ],
    [
      [0.2, 0.38],
      [0.52, 0.38],
    ],
  ],
  N: [
    [
      [0.12, B],
      [0.12, T],
      [0.56, B],
      [0.56, T],
    ],
  ],
  D: [[[0.12, B], [0.12, T], [0.28, T], ...arc(0.28, 0.5, 0.3, 0.38, 90, -90), [0.12, B]]],
  B: [
    [
      [0.12, B],
      [0.12, T],
    ],
    upperBowl(0.12, 0.44),
    lowerBowl(0.12, 0.48),
  ],
  O: [arc(0.38, 0.5, 0.26, 0.38, 0, 360, 28)],
  X: [
    [
      [0.12, B],
      [0.58, T],
    ],
    [
      [0.12, T],
      [0.58, B],
    ],
  ],
  F: [
    [
      [0.12, B],
      [0.12, T],
      [0.54, T],
    ],
    [
      [0.12, 0.52],
      [0.44, 0.52],
    ],
  ],
  T: [
    [
      [0.08, T],
      [0.58, T],
    ],
    [
      [0.33, T],
      [0.33, B],
    ],
  ],
  W: [
    [
      [0.08, T],
      [0.24, B],
      [0.41, 0.62],
      [0.58, B],
      [0.74, T],
    ],
  ],
  R: [
    [
      [0.12, B],
      [0.12, T],
    ],
    upperBowl(0.12, 0.46),
    [
      [0.3, 0.5],
      [0.56, B],
    ],
  ],
  '-': [
    [
      [0.12, 0.5],
      [0.5, 0.5],
    ],
  ],
  '=': [
    [
      [0.12, 0.33],
      [0.56, 0.33],
    ],
    [
      [0.12, 0.67],
      [0.56, 0.67],
    ],
  ],
  E: [
    [
      [0.54, T],
      [0.12, T],
      [0.12, B],
      [0.54, B],
    ],
    [
      [0.12, 0.5],
      [0.44, 0.5],
    ],
  ],
};

/**
 * One line of text as stroke pieces, centered on x = 0 with its baseline at `y`.
 * `height` is the cap height; `gap` the space between letters (in cap heights).
 */
export function textStrokes(text: string, height: number, y: number, gap = 0.1): Seg[] {
  const r = B * height;
  const placed: Seg[] = [];
  let pen = 0;
  for (const ch of text) {
    const lines = GLYPHS[ch];
    if (!lines) {
      pen += 0.5 * height;
      continue;
    }
    const xs = lines.flat().map((p) => p[0]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    for (const pl of lines)
      for (let i = 1; i < pl.length; i++) {
        const [a, b] = [pl[i - 1], pl[i]];
        placed.push([pen + (a[0] - minX + B) * height, y + a[1] * height, pen + (b[0] - minX + B) * height, y + b[1] * height, r]);
      }
    pen += (maxX - minX + 2 * B + gap) * height;
  }
  const shift = (pen - gap * height) / 2;
  return placed.map(([x0, y0, x1, y1, rr]) => [x0 - shift, y0, x1 - shift, y1, rr]);
}

/** Distances to the strokes' outsides on a grid (negative inside), capped at `cap`. */
export class DistanceGrid {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly nx: number;
  readonly ny: number;
  readonly d: Float32Array;

  constructor(
    segs: Seg[],
    readonly cell = 0.008,
    readonly cap = 0.25,
  ) {
    const m = cap + 0.05;
    this.x0 = Math.min(...segs.map((s) => Math.min(s[0], s[2]) - s[4])) - m;
    this.x1 = Math.max(...segs.map((s) => Math.max(s[0], s[2]) + s[4])) + m;
    this.y0 = Math.min(...segs.map((s) => Math.min(s[1], s[3]) - s[4])) - m;
    this.y1 = Math.max(...segs.map((s) => Math.max(s[1], s[3]) + s[4])) + m;
    this.nx = Math.ceil((this.x1 - this.x0) / cell) + 1;
    this.ny = Math.ceil((this.y1 - this.y0) / cell) + 1;
    this.d = new Float32Array(this.nx * this.ny).fill(cap);
    for (const [ax, ay, bx, by, r] of segs) {
      // only the cells near this stroke; everything farther keeps the cap
      const reach = r + cap;
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - reach - this.x0) / cell));
      const i1 = Math.min(this.nx - 1, Math.ceil((Math.max(ax, bx) + reach - this.x0) / cell));
      const j0 = Math.max(0, Math.floor((Math.min(ay, by) - reach - this.y0) / cell));
      const j1 = Math.min(this.ny - 1, Math.ceil((Math.max(ay, by) + reach - this.y0) / cell));
      const vx = bx - ax;
      const vy = by - ay;
      const len2 = vx * vx + vy * vy || 1e-9;
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          const px = this.x0 + i * cell - ax;
          const py = this.y0 + j * cell - ay;
          const t = Math.max(0, Math.min(1, (px * vx + py * vy) / len2));
          const dist = Math.hypot(px - vx * t, py - vy * t) - r;
          const k = j * this.nx + i;
          if (dist < this.d[k]) this.d[k] = dist;
        }
    }
  }

  /** The distance at (x, y), bilinear between cells; outside the grid, a safe lower bound. */
  at(x: number, y: number): number {
    const fx = (x - this.x0) / this.cell;
    const fy = (y - this.y0) / this.cell;
    if (fx < 0 || fy < 0 || fx >= this.nx - 1 || fy >= this.ny - 1) {
      const dx = Math.max(this.x0 - x, 0, x - this.x1);
      const dy = Math.max(this.y0 - y, 0, y - this.y1);
      return Math.hypot(dx, dy) + this.cap * 0.5;
    }
    const i = fx | 0;
    const j = fy | 0;
    const u = fx - i;
    const v = fy - j;
    const k = j * this.nx + i;
    const d = this.d;
    return (d[k] * (1 - u) + d[k + 1] * u) * (1 - v) + (d[k + this.nx] * (1 - u) + d[k + this.nx + 1] * u) * v;
  }
}

/** The letters as a solid: the 2D outline pushed `depth` deep (z from -depth/2 to depth/2), its edges rounded by `bevel`. */
export class ExtrudedText {
  readonly half: number;
  constructor(
    readonly grid: DistanceGrid,
    depth: number,
    readonly bevel: number,
  ) {
    this.half = depth / 2;
  }

  sdf(x: number, y: number, z: number): number {
    const r = this.bevel;
    const wx = this.grid.at(x, y) + r;
    const wy = Math.abs(z) - this.half + r;
    const ox = Math.max(wx, 0);
    const oy = Math.max(wy, 0);
    return Math.min(Math.max(wx, wy), 0) + Math.sqrt(ox * ox + oy * oy) - r;
  }

  /** Where a ray (object space, unit direction) first meets the letters, or -1. */
  trace(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number): number {
    // clip the ray to the letters' box first
    const g = this.grid;
    let t0 = 0;
    let t1 = 1e9;
    const slab = (o: number, d: number, lo: number, hi: number) => {
      if (Math.abs(d) < 1e-12) return o >= lo && o <= hi;
      let a = (lo - o) / d;
      let b = (hi - o) / d;
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
      return t0 <= t1;
    };
    const m = g.cap * 0.5;
    if (!slab(ox, dx, g.x0 + m, g.x1 - m) || !slab(oy, dy, g.y0 + m, g.y1 - m) || !slab(oz, dz, -this.half - 0.01, this.half + 0.01)) return -1;
    let t = t0;
    for (let i = 0; i < 96 && t <= t1; i++) {
      const d = this.sdf(ox + dx * t, oy + dy * t, oz + dz * t);
      if (d < 0.0015) return t;
      t += d;
    }
    return -1;
  }

  /** The surface normal at a point (object space), from the field's gradient. */
  normal(x: number, y: number, z: number): [number, number, number] {
    const e = 0.004;
    const a = this.sdf(x + e, y - e, z - e);
    const b = this.sdf(x - e, y - e, z + e);
    const c = this.sdf(x - e, y + e, z - e);
    const d = this.sdf(x + e, y + e, z + e);
    const nx = a - b - c + d;
    const ny = -a - b + c + d;
    const nz = -a + b - c + d;
    const l = Math.hypot(nx, ny, nz) || 1;
    return [nx / l, ny / l, nz / l];
  }
}
