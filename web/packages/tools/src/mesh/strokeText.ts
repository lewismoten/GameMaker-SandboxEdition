// Lettering for 3D-print trinkets: capital letters, digits and a few marks drawn as strokes (a polyline per stroke), each
// stroke a capsule, so the edges are smooth and the corners round, unlike the stair steps of the 3x5 micro font.
// The glyphs are our own, on a grid 4 wide and 6 tall (y up); the caller chooses the cap height and the pen width in mm.
import { capsule2, type D2 } from './sdfShapes';

type Pt = [number, number];
const G: Record<string, Pt[][]> = {
  A: [
    [
      [0, 0],
      [2, 6],
      [4, 0],
    ],
    [
      [0.7, 2],
      [3.3, 2],
    ],
  ],
  B: [
    [
      [0, 0],
      [0, 6],
      [2.6, 6],
      [3.6, 5.2],
      [3.6, 3.8],
      [2.6, 3],
      [0, 3],
    ],
    [
      [2.6, 3],
      [4, 2.2],
      [4, 0.8],
      [3, 0],
      [0, 0],
    ],
  ],
  C: [
    [
      [4, 5],
      [3, 6],
      [1, 6],
      [0, 5],
      [0, 1],
      [1, 0],
      [3, 0],
      [4, 1],
    ],
  ],
  D: [
    [
      [0, 0],
      [0, 6],
      [2.5, 6],
      [4, 4.5],
      [4, 1.5],
      [2.5, 0],
      [0, 0],
    ],
  ],
  E: [
    [
      [4, 6],
      [0, 6],
      [0, 0],
      [4, 0],
    ],
    [
      [0, 3],
      [3, 3],
    ],
  ],
  F: [
    [
      [4, 6],
      [0, 6],
      [0, 0],
    ],
    [
      [0, 3],
      [3, 3],
    ],
  ],
  G: [
    [
      [4, 5],
      [3, 6],
      [1, 6],
      [0, 5],
      [0, 1],
      [1, 0],
      [3, 0],
      [4, 1],
      [4, 3],
      [2.2, 3],
    ],
  ],
  H: [
    [
      [0, 0],
      [0, 6],
    ],
    [
      [4, 0],
      [4, 6],
    ],
    [
      [0, 3],
      [4, 3],
    ],
  ],
  I: [
    [
      [1, 6],
      [3, 6],
    ],
    [
      [2, 6],
      [2, 0],
    ],
    [
      [1, 0],
      [3, 0],
    ],
  ],
  J: [
    [
      [4, 6],
      [4, 1],
      [3, 0],
      [1, 0],
      [0, 1],
    ],
  ],
  K: [
    [
      [0, 0],
      [0, 6],
    ],
    [
      [4, 6],
      [0, 2.5],
    ],
    [
      [1.3, 3.7],
      [4, 0],
    ],
  ],
  L: [
    [
      [0, 6],
      [0, 0],
      [4, 0],
    ],
  ],
  M: [
    [
      [0, 0],
      [0, 6],
      [2, 3],
      [4, 6],
      [4, 0],
    ],
  ],
  N: [
    [
      [0, 0],
      [0, 6],
      [4, 0],
      [4, 6],
    ],
  ],
  O: [
    [
      [1, 0],
      [0, 1],
      [0, 5],
      [1, 6],
      [3, 6],
      [4, 5],
      [4, 1],
      [3, 0],
      [1, 0],
    ],
  ],
  P: [
    [
      [0, 0],
      [0, 6],
      [3, 6],
      [4, 5],
      [4, 3.8],
      [3, 2.8],
      [0, 2.8],
    ],
  ],
  Q: [
    [
      [1, 0],
      [0, 1],
      [0, 5],
      [1, 6],
      [3, 6],
      [4, 5],
      [4, 1],
      [3, 0],
      [1, 0],
    ],
    [
      [2.5, 1.5],
      [4, -0.3],
    ],
  ],
  R: [
    [
      [0, 0],
      [0, 6],
      [3, 6],
      [4, 5],
      [4, 3.8],
      [3, 2.8],
      [0, 2.8],
    ],
    [
      [2, 2.8],
      [4, 0],
    ],
  ],
  S: [
    [
      [4, 5],
      [3, 6],
      [1, 6],
      [0, 5],
      [0, 4],
      [1, 3],
      [3, 3],
      [4, 2],
      [4, 1],
      [3, 0],
      [1, 0],
      [0, 1],
    ],
  ],
  T: [
    [
      [0, 6],
      [4, 6],
    ],
    [
      [2, 6],
      [2, 0],
    ],
  ],
  U: [
    [
      [0, 6],
      [0, 1],
      [1, 0],
      [3, 0],
      [4, 1],
      [4, 6],
    ],
  ],
  V: [
    [
      [0, 6],
      [2, 0],
      [4, 6],
    ],
  ],
  W: [
    [
      [0, 6],
      [1, 0],
      [2, 4],
      [3, 0],
      [4, 6],
    ],
  ],
  X: [
    [
      [0, 0],
      [4, 6],
    ],
    [
      [0, 6],
      [4, 0],
    ],
  ],
  Y: [
    [
      [0, 6],
      [2, 3],
      [4, 6],
    ],
    [
      [2, 3],
      [2, 0],
    ],
  ],
  Z: [
    [
      [0, 6],
      [4, 6],
      [0, 0],
      [4, 0],
    ],
  ],
  '0': [
    [
      [1, 0],
      [0, 1],
      [0, 5],
      [1, 6],
      [3, 6],
      [4, 5],
      [4, 1],
      [3, 0],
      [1, 0],
    ],
    [
      [0.8, 0.6],
      [3.2, 5.4],
    ],
  ],
  '1': [
    [
      [0.8, 4.6],
      [2, 6],
      [2, 0],
    ],
    [
      [0.8, 0],
      [3.2, 0],
    ],
  ],
  '2': [
    [
      [0, 5],
      [1, 6],
      [3, 6],
      [4, 5],
      [4, 4],
      [0, 0],
      [4, 0],
    ],
  ],
  '3': [
    [
      [0, 5],
      [1, 6],
      [3, 6],
      [4, 5],
      [4, 4],
      [3, 3],
      [1.5, 3],
    ],
    [
      [3, 3],
      [4, 2],
      [4, 1],
      [3, 0],
      [1, 0],
      [0, 1],
    ],
  ],
  '4': [
    [
      [3, 0],
      [3, 6],
      [0, 2],
      [4, 2],
    ],
  ],
  '5': [
    [
      [4, 6],
      [0.4, 6],
      [0, 3.4],
      [2.6, 3.6],
      [4, 2.6],
      [4, 1],
      [3, 0],
      [1, 0],
      [0, 1],
    ],
  ],
  '6': [
    [
      [3.6, 5.6],
      [2.6, 6],
      [1, 6],
      [0, 5],
      [0, 1],
      [1, 0],
      [3, 0],
      [4, 1],
      [4, 2.4],
      [3, 3.4],
      [1, 3.4],
      [0, 2.6],
    ],
  ],
  '7': [
    [
      [0, 6],
      [4, 6],
      [1.6, 0],
    ],
  ],
  '8': [
    [
      [1, 3],
      [0, 4],
      [0, 5],
      [1, 6],
      [3, 6],
      [4, 5],
      [4, 4],
      [3, 3],
      [1, 3],
      [0, 2],
      [0, 1],
      [1, 0],
      [3, 0],
      [4, 1],
      [4, 2],
      [3, 3],
    ],
  ],
  '9': [
    [
      [0.4, 0.4],
      [1.4, 0],
      [3, 0],
      [4, 1],
      [4, 5],
      [3, 6],
      [1, 6],
      [0, 5],
      [0, 3.6],
      [1, 2.6],
      [3, 2.6],
      [4, 3.4],
    ],
  ],
  '.': [
    [
      [2, 0],
      [2.01, 0],
    ],
  ],
  ',': [
    [
      [2.2, 0.4],
      [1.6, -1],
    ],
  ],
  '!': [
    [
      [2, 6],
      [2, 2],
    ],
    [
      [2, 0],
      [2.01, 0],
    ],
  ],
  '?': [
    [
      [0, 5],
      [1, 6],
      [3, 6],
      [4, 5],
      [4, 4],
      [2, 2.8],
      [2, 2],
    ],
    [
      [2, 0],
      [2.01, 0],
    ],
  ],
  "'": [
    [
      [2, 6],
      [2, 4.4],
    ],
  ],
  '-': [
    [
      [0.6, 3],
      [3.4, 3],
    ],
  ],
  ':': [
    [
      [2, 4],
      [2.01, 4],
    ],
    [
      [2, 1],
      [2.01, 1],
    ],
  ],
  $: [
    [
      [3.8, 5],
      [3, 5.6],
      [1, 5.6],
      [0.2, 4.6],
      [0.2, 4],
      [1, 3],
      [3, 3],
      [3.8, 2],
      [3.8, 1.4],
      [3, 0.4],
      [1, 0.4],
      [0.2, 1],
    ],
    [
      [2, 6.6],
      [2, -0.6],
    ],
  ],
  '&': [
    [
      [4, 0],
      [1.2, 3.6],
      [1.2, 5],
      [2, 6],
      [3, 5],
      [3, 4],
      [0.4, 2],
      [0, 1],
      [1, 0],
      [2.4, 0],
      [4, 2.4],
    ],
  ],
  '/': [
    [
      [0, 0],
      [4, 6],
    ],
  ],
  '+': [
    [
      [0.6, 3],
      [3.4, 3],
    ],
    [
      [2, 4.4],
      [2, 1.6],
    ],
  ],
  '#': [
    [
      [1.2, 0],
      [1.6, 6],
    ],
    [
      [2.8, 0],
      [3.2, 6],
    ],
    [
      [0, 2],
      [4, 2],
    ],
    [
      [0, 4],
      [4, 4],
    ],
  ],
  '%': [
    [
      [0, 0],
      [4, 6],
    ],
    [
      [0.6, 5.4],
      [0.61, 5.4],
    ],
    [
      [3.4, 0.6],
      [3.41, 0.6],
    ],
  ],
};
const ADVANCE = 5.4;
const LINE = 8.6;

/** Lines of capitals, digits and marks, `cap` mm tall, drawn with a pen `pen` mm wide, the block centered on (cx, cy). */
export function strokeText2(lines: string[], cap: number, pen: number, cx = 0, cy = 0): D2 {
  const s = cap / 6;
  const glyphs: { segs: [number, number, number, number][]; box: [number, number, number, number] }[] = [];
  lines.forEach((line, li) => {
    const w = (line.length - 1) * ADVANCE + 4;
    [...line].forEach((ch, ci) => {
      if (ch === ' ') return;
      const strokes = G[ch];
      if (!strokes) throw new RangeError(`No stroke glyph for ${ch}`);
      const ox = cx + (ci * ADVANCE - w / 2) * s;
      const oy = cy + (((lines.length - 1) * LINE + 6) / 2 - 6 - li * LINE) * s;
      const segs: [number, number, number, number][] = [];
      for (const st of strokes)
        for (let i = 0; i + 1 < st.length; i++) segs.push([ox + st[i][0] * s, oy + st[i][1] * s, ox + st[i + 1][0] * s, oy + st[i + 1][1] * s]);
      glyphs.push({ segs, box: [ox - pen, oy - pen - s, ox + 4 * s + pen, oy + 6 * s + pen + s] });
    });
  });
  const r = pen / 2;
  const caps = glyphs.map((g) => ({ box: g.box, fs: g.segs.map(([ax, ay, bx, by]) => capsule2(ax, ay, bx, by, r)) }));
  return (x, y) => {
    let d = 1e9;
    for (const g of caps) {
      const [x0, y0, x1, y1] = g.box;
      const bd = Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1));
      if (bd > d || bd > 3 * cap) continue;
      for (const f of g.fs) d = Math.min(d, f(x, y));
    }
    return Math.min(d, 3 * cap);
  };
}

/**
 * Characters set round a circle of `radius` mm (their feet toward the middle), clockwise from `startDeg` (90 is the top),
 * `stepDeg` apart: a decoder coin's ring of digits, or a coin's legend. Each is `cap` mm tall, drawn with a pen `pen` mm wide.
 */
export function ringText2(text: string, radius: number, cap: number, pen: number, stepDeg: number, startDeg = 90): D2 {
  const parts = [...text].flatMap((ch, i) => {
    if (ch === ' ') return [];
    const a = ((startDeg - i * stepDeg) * Math.PI) / 180;
    return [{ f: strokeText2([ch], cap, pen), cos: Math.cos(a), sin: Math.sin(a) }];
  });
  const reach = radius + cap;
  return (x, y) => {
    if (Math.hypot(x, y) > reach + pen || Math.hypot(x, y) < radius - cap - pen) return cap;
    let d = cap;
    for (const { f, cos, sin } of parts) {
      const along = x * sin - y * cos;
      const out = x * cos + y * sin - radius - cap / 2;
      if (Math.abs(along) < cap && Math.abs(out) < cap) d = Math.min(d, f(along, out));
    }
    return d;
  };
}
