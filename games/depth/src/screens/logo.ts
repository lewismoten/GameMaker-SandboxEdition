// The DEPTH PERCEPTION logo: extruded, beveled chrome letters, the 1996 kind, traced with the
// kit's distance-field lettering (games/kit/sdftext.ts) from this game's own glyphs.
import { DistanceGrid, ExtrudedText, type Seg } from '../../../kit/sdftext';
import { Moved, rotation, type Material, type Shape, type V } from '../render/tracer';

type Pt = [number, number];
const B = 0.12;
const T = 0.88;
const M = 0.5;

function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 14): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}

const GLYPHS: Record<string, Pt[][]> = {
  D: [[[0.12, B], [0.12, T], [0.28, T], ...arc(0.28, 0.5, 0.3, 0.38, 90, -90), [0.12, B]]],
  E: [
    [
      [0.54, T],
      [0.12, T],
      [0.12, B],
      [0.54, B],
    ],
    [
      [0.12, M],
      [0.44, M],
    ],
  ],
  P: [[[0.12, B], [0.12, T], [0.36, T], ...arc(0.36, 0.69, 0.19, 0.19, 90, -90, 10), [0.12, 0.5]]],
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
  H: [
    [
      [0.12, B],
      [0.12, T],
    ],
    [
      [0.58, B],
      [0.58, T],
    ],
    [
      [0.12, M],
      [0.58, M],
    ],
  ],
  R: [
    [[0.12, B], [0.12, T], [0.36, T], ...arc(0.36, 0.69, 0.19, 0.19, 90, -90, 10), [0.12, 0.5]],
    [
      [0.32, 0.5],
      [0.58, B],
    ],
  ],
  C: [arc(0.42, 0.5, 0.3, 0.38, 45, 315, 22)],
  I: [
    [
      [0.12, B],
      [0.12, T],
    ],
  ],
  O: [arc(0.38, 0.5, 0.26, 0.38, 0, 360, 28)],
  N: [
    [
      [0.12, B],
      [0.12, T],
      [0.56, B],
      [0.56, T],
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
  L: [
    [
      [0.12, T],
      [0.12, B],
      [0.52, B],
    ],
  ],
  G: [[...arc(0.42, 0.5, 0.3, 0.38, 45, 330, 20), [0.72, 0.42], [0.46, 0.42]]],
  U: [[[0.12, T], ...arc(0.37, 0.4, 0.25, 0.28, 180, 360, 14), [0.62, T]]],
  Y: [
    [
      [0.08, T],
      [0.34, M],
      [0.6, T],
    ],
    [
      [0.34, M],
      [0.34, B],
    ],
  ],
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
  S: [[...arc(0.33, 0.69, 0.22, 0.19, 15, 270), ...arc(0.33, 0.31, 0.22, 0.19, 90, -165)]],
};

/** A line of lettering as stroke pieces, centered on x = 0, baseline at y. */
export function strokes(text: string, height: number, y: number, gap = 0.12): Seg[] {
  const r = B * height;
  const placed: Seg[] = [];
  let pen = 0;
  for (const ch of text) {
    const lines = GLYPHS[ch];
    if (!lines) {
      pen += 0.45 * height;
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

/**
 * Lettering as a solid you can put in a scene. The letters stand in the x/z plane (they read
 * from -y), `depth` thick, centered on `at`, turned by yaw/pitch.
 */
export function lettering(
  lines: { text: string; height: number; y: number; gap?: number }[],
  depth: number,
  bevel: number,
  mat: Material,
  at: V,
  yaw = 0,
  pitch = 0,
  scale = 1,
): Shape {
  const segs = lines.flatMap((l) => strokes(l.text, l.height, l.y, l.gap));
  const solid = new ExtrudedText(new DistanceGrid(segs, 0.006, 0.2), depth, bevel);
  const g = solid.grid;
  const shape: Shape = {
    bounds: [
      [g.x0, -solid.half - 0.01, g.y0],
      [g.x1, solid.half + 0.01, g.y1],
    ],
    // the text's own frame is x across, y up, z through; ours is x across, z up, y through
    hit(o, d, h) {
      const t = solid.trace(o[0], o[2], o[1], d[0], d[2], d[1]);
      if (t < 0 || t >= h.t) return false;
      const n = solid.normal(o[0] + d[0] * t, o[2] + d[2] * t, o[1] + d[1] * t);
      h.t = t;
      h.n = [n[0], n[2], n[1]];
      h.mat = mat;
      h.shape = shape;
      h.part = 0;
      return true;
    },
  };
  return new Moved(shape, rotation(yaw, pitch), at, scale);
}
