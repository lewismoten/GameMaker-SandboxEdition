// The Birthday Egg: lilac felt sprinkled with confetti knots, a pink felt birthday cake
// appliqued on its side with three yarn candles, and a collar of gold rickrack round its
// middle with a tiny brass tag that reads "3" (the sequel's egg wore a "2").
import { Pixels } from '../../../kit/pixels';
import { shadeAt } from '../art/draw';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);

/** The egg in a w x h box (about 14 x 17 in a block), drawn over `p` with its top left at (x, y). */
export function drawEgg(p: Pixels, x: number, y: number, w = 14, h = 18): Pixels {
  const cx = x + w / 2;
  const cy = y + h * 0.56;
  const rx = w / 2;
  // an egg: narrower at the top
  const ryTop = h * 0.56;
  const ryBot = h * 0.44;
  const inside = (px: number, py: number) => {
    const ry = py + 0.5 < cy ? ryTop : ryBot;
    const nx = (px + 0.5 - cx) / rx;
    const ny = (py + 0.5 - cy) / ry;
    return nx * nx + ny * ny <= 1;
  };
  const ink = c('ink', 0);
  for (let py = y; py < y + h; py++)
    for (let px = x; px < x + w; px++) {
      if (!inside(px, py)) continue;
      const nx = (px + 0.5 - cx) / rx;
      const ny = (py + 0.5 - cy) / (py + 0.5 < cy ? ryTop : ryBot);
      const light = Math.max(0, Math.min(1, 0.8 - 0.45 * nx - 0.35 * ny));
      // felt: a fuzzy dither, never a flat fill
      const fuzz = ((px * 7 + py * 13) % 5) / 10 - 0.2;
      p.set(px, py, shadeAt(P.r('lilac'), 1, 3, light + fuzz * 0.6, px, py));
    }
  // an ink outline so it reads against anything
  for (let py = y - 1; py <= y + h; py++)
    for (let px = x - 1; px <= x + w; px++) {
      if (inside(px, py)) continue;
      if (inside(px - 1, py) || inside(px + 1, py) || inside(px, py - 1) || inside(px, py + 1)) p.set(px, py, ink);
    }
  const k = Math.max(1, Math.round(w / 14));
  // confetti knots in every color
  const knots = ['yellow', 'red', 'blue', 'green', 'orange', 'pink'];
  [
    [0.28, 0.14],
    [0.62, 0.1],
    [0.16, 0.36],
    [0.82, 0.3],
    [0.5, 0.2],
    [0.3, 0.84],
    [0.66, 0.86],
    [0.84, 0.72],
    [0.14, 0.7],
  ].forEach(([fx, fy], i) => {
    const px = Math.round(x + fx * w);
    const py = Math.round(y + fy * h);
    if (inside(px, py) && inside(px + k - 1, py + k - 1)) p.rect(px, py, k, k, c(knots[i % knots.length], 2));
  });
  // a collar of gold rickrack round the middle, and its tiny brass tag
  const sy = Math.round(y + h * 0.62);
  for (let px = x; px < x + w; px++) if (inside(px, sy)) p.set(px, sy + ((px - x) % 2), c('gold', 2));
  const tx = Math.round(cx - k);
  p.rect(tx, sy + 2, 2 * k, 2 * k, c('gold', 1)).set(tx + 2 * k - 1, sy + 2, c('gold', 2));
  if (k > 1) p.rect(tx + Math.floor(k / 2), sy + 2 + Math.floor(k / 2), k, k, ink);
  // a pink felt birthday cake on the side: a frosted layer, a cream drip, three candles
  const bw = Math.round(w * 0.56);
  const bx = Math.round(cx - bw / 2);
  const by = Math.round(y + h * 0.4);
  p.rect(bx, by, bw, 3 * k, c('pink', 2)).rect(bx, by, bw, k, c('frost', 2));
  for (let px = bx + 1; px < bx + bw; px += 2) p.set(px, by + k, c('frost', 1));
  for (let i = 0; i < 3; i++) {
    const kx = bx + Math.round(((i + 1) * bw) / 4) - Math.floor(k / 2);
    p.rect(kx, by - 2 * k, k, 2 * k, c(['blue', 'yellow', 'red'][i], 2));
    p.set(kx, by - 2 * k - 1, c('glow', 3));
  }
  return p;
}

/** The egg as a block: over a copy of `base` (a 20x20 background block). */
export function eggBlock(base: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  return drawEgg(p, 3, 2, 14, 17);
}
