// The Lay-an-Egg Egg: three chubby little sausages of chocolate-brown felt piled across each
// other, creased where they touch, with three wavy curls of gray yarn rising
// off the top (the web app draws the same pile turning: web/src/eggs/eggPile.ts).
import { Pixels } from '../../../kit/pixels';
import { shadeAt } from '../art/draw';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);

type V3 = [number, number, number];
/** Each sausage on a 14 x 17 grid: its ends, the bend between them, its radius and z order. */
const LOGS: { a: V3; b: V3; c: V3; r: number }[] = [
  // two on the ground, the back one to the right
  { a: [7.4, 12.6, -3], b: [10, 13.2, -3], c: [12.4, 12.2, -3], r: 2.3 },
  { a: [2, 14.3, 0], b: [5.6, 14.9, 0], c: [9, 14.3, 0], r: 2.4 },
  // and one on top, its end tipped up
  { a: [4.4, 10.8, 1], b: [7.2, 11.4, 1], c: [9.6, 9.2, 1], r: 2 },
];

/** The pile in a w x h box (about 14 x 17 in a block), drawn over `p` with its top left at (x, y). */
export function drawEgg(p: Pixels, x: number, y: number, w = 14, h = 18): Pixels {
  const sx = w / 14;
  const sy = h / 17;
  const balls = LOGS.flatMap((l, log) =>
    Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      const at = (k: number) => (1 - t) ** 2 * l.a[k] + 2 * t * (1 - t) * l.b[k] + t * t * l.c[k];
      return { x: x + at(0) * sx, y: y + at(1) * sy, z: at(2), r: l.r * (1 - 0.2 * (2 * t - 1) ** 4) * Math.min(sx, sy), log };
    }),
  );
  // the nearest sausage at each pixel, and where it is lit
  const hit = (px: number, py: number) => {
    let best: { z: number; light: number; log: number } | undefined;
    for (const b of balls) {
      const dx = (px + 0.5 - b.x) / b.r;
      const dy = (py + 0.5 - b.y) / b.r;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d);
      const z = b.z + nz * b.r;
      if (best && best.z >= z) continue;
      best = { z, light: 0.25 + 0.5 * nz - 0.45 * dx - 0.4 * dy, log: b.log };
    }
    return best;
  };
  const ink = c('ink', 0);
  const inside = (px: number, py: number) => !!hit(px, py);
  const dirt = P.r('dirt');
  for (let py = y; py < y + h; py++)
    for (let px = x; px < x + w; px++) {
      const at = hit(px, py);
      if (!at) continue;
      // a dark crease where one sausage lies against another nearer one
      const crease = [hit(px + 1, py), hit(px - 1, py), hit(px, py + 1), hit(px, py - 1)].some((n) => n && n.log !== at.log && n.z > at.z);
      const fuzz = ((px * 7 + py * 13) % 5) / 10 - 0.2;
      p.set(px, py, crease ? dirt[0] : shadeAt(dirt, 1, 4, at.light + [-0.22, 0.04, 0.2][at.log] + fuzz * 0.5, px, py));
    }
  // an ink outline so it reads against anything
  for (let py = y - 1; py <= y + h; py++)
    for (let px = x - 1; px <= x + w; px++) {
      if (inside(px, py)) continue;
      if (inside(px - 1, py) || inside(px + 1, py) || inside(px, py - 1) || inside(px, py + 1)) p.set(px, py, ink);
    }
  // three wavy curls of gray yarn rising off the top
  const yarn = c('stone', 4);
  const top = y + Math.round(7 * sy);
  for (const [i, fx] of [3, 7, 11].entries()) {
    const len = Math.max(3, Math.round(4 * sy));
    for (let k = 0; k < len; k++) p.set(Math.round(x + fx * sx + [0, 1, 1, 0][(k + i) % 4] * Math.max(1, Math.round(sx))), top - 1 - k - (i % 2), yarn);
  }
  return p;
}

/** The pile as a block: over a copy of `base` (a 20x20 background block). */
export function eggBlock(base: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  return drawEgg(p, 3, 2, 14, 17);
}
