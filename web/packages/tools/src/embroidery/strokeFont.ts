// A single-line capital-letter font for satin lettering, and a way to bend a word around a circle (a patch's rim text).
// Each glyph is a few center lines on a grid 8 units high; the stitch generator widens them into satin columns, so the
// letters keep their shape at 5 to 7 mm tall where a filled outline font would blur.
import { arc, resample } from './geom';
import type { Pt } from './types';

const P = Math.PI;
/** Strokes of each glyph, in units (x from 0, y up from 0 to 8) and its width in units. */
const GLYPHS: Record<string, { w: number; strokes: Pt[][] }> = {
  A: {
    w: 5.5,
    strokes: [
      [
        [0, 0],
        [2.75, 8],
        [5.5, 0],
      ],
      [
        [1, 2.8],
        [4.5, 2.8],
      ],
    ],
  },
  B: {
    w: 5,
    strokes: [
      [[0, 0], [0, 8], [3, 8], ...arc(3, 6, 1.8, 2, P / 2, -P / 2, 8), [3, 4], [0, 4]],
      [[3, 4], ...arc(3, 2, 2, 2, P / 2, -P / 2, 8), [0, 0]],
    ],
  },
  C: { w: 5.2, strokes: [arc(2.6, 4, 2.6, 4, 0.25 * P, 1.75 * P, 20)] },
  D: { w: 5, strokes: [[[0, 0], [0, 8], [2, 8], ...arc(2, 4, 3, 4, P / 2, -P / 2, 12), [0, 0]]] },
  E: {
    w: 4.5,
    strokes: [
      [
        [4.5, 8],
        [0, 8],
        [0, 0],
        [4.5, 0],
      ],
      [
        [0, 4],
        [3.6, 4],
      ],
    ],
  },
  F: {
    w: 4.5,
    strokes: [
      [
        [4.5, 8],
        [0, 8],
        [0, 0],
      ],
      [
        [0, 4],
        [3.6, 4],
      ],
    ],
  },
  G: { w: 5.2, strokes: [[...arc(2.6, 4, 2.6, 4, 0.25 * P, 1.75 * P, 20), [5.2, 3.6], [2.8, 3.6]]] },
  H: {
    w: 5,
    strokes: [
      [
        [0, 8],
        [0, 0],
      ],
      [
        [5, 8],
        [5, 0],
      ],
      [
        [0, 4],
        [5, 4],
      ],
    ],
  },
  I: {
    w: 1,
    strokes: [
      [
        [0.5, 8],
        [0.5, 0],
      ],
    ],
  },
  J: { w: 4, strokes: [[[4, 8], [4, 2.5], ...arc(2, 2.5, 2, 2.5, 0, -P, 8)]] },
  K: {
    w: 5,
    strokes: [
      [
        [0, 8],
        [0, 0],
      ],
      [
        [5, 8],
        [0, 3.4],
      ],
      [
        [1.6, 4.6],
        [5, 0],
      ],
    ],
  },
  L: {
    w: 4.5,
    strokes: [
      [
        [0, 8],
        [0, 0],
        [4.5, 0],
      ],
    ],
  },
  M: {
    w: 6.5,
    strokes: [
      [
        [0, 0],
        [0, 8],
        [3.25, 2.6],
        [6.5, 8],
        [6.5, 0],
      ],
    ],
  },
  N: {
    w: 5,
    strokes: [
      [
        [0, 0],
        [0, 8],
        [5, 0],
        [5, 8],
      ],
    ],
  },
  O: { w: 5.4, strokes: [arc(2.7, 4, 2.7, 4, P / 2, P / 2 + 2 * P, 28)] },
  P: { w: 5, strokes: [[[0, 0], [0, 8], [2.8, 8], ...arc(2.8, 5.8, 2.2, 2.2, P / 2, -P / 2, 10), [0, 3.6]]] },
  Q: {
    w: 5.4,
    strokes: [
      arc(2.7, 4, 2.7, 4, P / 2, P / 2 + 2 * P, 28),
      [
        [3.2, 2.4],
        [5.4, 0],
      ],
    ],
  },
  R: {
    w: 5,
    strokes: [
      [[0, 0], [0, 8], [2.8, 8], ...arc(2.8, 5.9, 2.2, 2.1, P / 2, -P / 2, 10), [0, 3.8]],
      [
        [2.2, 3.8],
        [5, 0],
      ],
    ],
  },
  S: { w: 5, strokes: [[...arc(2.5, 6, 2.4, 2, 0.2 * P, 1.5 * P, 12), ...arc(2.5, 2, 2.4, 2, 0.5 * P, -0.85 * P, 12).slice(1)]] },
  T: {
    w: 5,
    strokes: [
      [
        [0, 8],
        [5, 8],
      ],
      [
        [2.5, 8],
        [2.5, 0],
      ],
    ],
  },
  U: { w: 5, strokes: [[[0, 8], [0, 2.6], ...arc(2.5, 2.6, 2.5, 2.6, P, 2 * P, 12), [5, 8]]] },
  V: {
    w: 5.5,
    strokes: [
      [
        [0, 8],
        [2.75, 0],
        [5.5, 8],
      ],
    ],
  },
  W: {
    w: 7.5,
    strokes: [
      [
        [0, 8],
        [1.9, 0],
        [3.75, 6],
        [5.6, 0],
        [7.5, 8],
      ],
    ],
  },
  X: {
    w: 5.2,
    strokes: [
      [
        [0, 8],
        [5.2, 0],
      ],
      [
        [0, 0],
        [5.2, 8],
      ],
    ],
  },
  Y: {
    w: 5.2,
    strokes: [
      [
        [0, 8],
        [2.6, 4],
      ],
      [
        [5.2, 8],
        [2.6, 4],
        [2.6, 0],
      ],
    ],
  },
  Z: {
    w: 5,
    strokes: [
      [
        [0, 8],
        [5, 8],
        [0, 0],
        [5, 0],
      ],
    ],
  },
  ' ': { w: 3, strokes: [] },
};

export interface ArcTextOptions {
  /** Center of the circle. */
  cx: number;
  cy: number;
  /** Radius of the letters' baselines (their feet), mm; the stroke centers run from here out (top) or in (bottom). */
  baseline: number;
  /** Height of the letters in mm (stroke center to stroke center). */
  height: number;
  /** Gap between letters, mm. */
  gap: number;
  /** 'top' reads left to right over the top with feet toward the center; 'bottom' reads left to right under the bottom with heads toward the center. */
  side: 'top' | 'bottom';
  /** Stretches the letters sideways (1 = as drawn). */
  stretch?: number;
  /** Where the middle of the word sits, radians (default: straight up for top, straight down for bottom). */
  center?: number;
}

/** The strokes (as paths of points, mm) that spell `text` bent around the circle. */
export function arcText(text: string, o: ArcTextOptions): Pt[][] {
  const k = o.height / 8;
  const kx = k * (o.stretch ?? 1);
  const glyphs = [...text.toUpperCase()].map((c) => {
    const g = GLYPHS[c];
    if (!g) throw new Error(`no stroke glyph for "${c}"`);
    return g;
  });
  const total = glyphs.reduce((n, g) => n + g.w * kx, 0) + o.gap * (glyphs.length - 1);
  const mid = o.baseline + (o.side === 'top' ? o.height / 2 : -o.height / 2);
  const top = o.side === 'top';
  const center = o.center ?? (top ? P / 2 : -P / 2);
  const out: Pt[][] = [];
  let x = -total / 2;
  for (const g of glyphs) {
    for (const stroke of g.strokes) {
      out.push(
        resample(stroke, 0.8).map(([u, v]) => {
          const s = x + u * kx; // distance along the word from its middle
          const r = top ? o.baseline + v * k : o.baseline - v * k;
          const a = top ? center - s / mid : center + s / mid;
          return [o.cx + r * Math.cos(a), o.cy + r * Math.sin(a)] as Pt;
        }),
      );
    }
    x += g.w * kx + o.gap;
  }
  return out;
}
