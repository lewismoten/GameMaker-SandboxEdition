// The Big Top Egg: felted like Doc Leo's own clown egg. Cream felt with red big-top stripes
// that meet at the top like a circus tent, rainbow polka dots, a corgi-orange paw print on
// its side, a ring of blue running stitch around its middle and a tiny red pom-pom nose.
import { Pixels } from '../../../kit/pixels';
import { shadeAt } from '../art/draw';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);
const r = (n: string) => P.r(n);

/** The egg in a w x h box (about 14 x 18 in a block), drawn over `p` with its top left at (x, y). */
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
      const light = Math.max(0, Math.min(1, 0.75 - 0.45 * nx - 0.35 * ny));
      // big-top stripes: bands that pinch together at the top of the egg like a tent
      const t = Math.max(0.12, (py - y + 0.5) / h);
      const band = Math.floor(((px + 0.5 - cx) / (rx * Math.sqrt(t))) * 1.5 + 10.5);
      const striped = band % 2 === 0;
      // felt: a fuzzy dither, never a flat fill
      const fuzz = ((px * 7 + py * 13) % 5) / 10 - 0.2;
      p.set(px, py, striped ? shadeAt(r('red'), 0, 3, light + fuzz * 0.6, px, py) : shadeAt(r('fur'), 0, 2, light + 0.2 + fuzz, px, py));
    }
  // an ink outline so it reads against anything
  for (let py = y - 1; py <= y + h; py++)
    for (let px = x - 1; px <= x + w; px++) {
      if (inside(px, py)) continue;
      if (inside(px - 1, py) || inside(px + 1, py) || inside(px, py - 1) || inside(px, py + 1)) p.set(px, py, ink);
    }
  // rainbow polka dots, on the cream and the red alike
  const d = Math.max(1, Math.round(w / 14));
  const dots: [number, number, string][] = [
    [0.22, 0.3, 'yellow'],
    [0.72, 0.26, 'blue'],
    [0.14, 0.58, 'green'],
    [0.86, 0.5, 'purple'],
    [0.5, 0.12, 'green'],
    [0.7, 0.86, 'yellow'],
    [0.3, 0.84, 'blue'],
    [0.46, 0.42, 'purple'],
  ];
  for (const [fx, fy, ramp] of dots) {
    const px = Math.round(x + fx * w);
    const py = Math.round(y + fy * h);
    if (inside(px, py) && inside(px + d - 1, py + d - 1)) p.rect(px, py, d, d, c(ramp, 3));
  }
  // a ring of blue running stitch around the middle
  const sy = Math.round(y + h * 0.6);
  for (let px = x; px < x + w; px++) if (inside(px, sy) && (px - x) % 3 !== 2) p.set(px, sy, c('blue', 2));
  // a corgi-orange paw print on the side, appliqued on a round cream patch
  const k = Math.max(1, Math.round(w / 14));
  const pawX = Math.round(cx + w * 0.12);
  const pawY = Math.round(y + h * 0.74);
  const pr = 3 * k;
  for (let py = pawY - pr - k; py <= pawY + pr - k; py++)
    for (let px = pawX - pr; px <= pawX + pr; px++) if ((px - pawX) ** 2 + (py - pawY + k) ** 2 <= pr * pr + 1 && inside(px, py)) p.set(px, py, c('fur', 2));
  p.rect(pawX - k, pawY, 3 * k, 2 * k, c('corgi', 3));
  for (const [tx, ty] of [
    [-2, -2],
    [0, -3],
    [2, -2],
  ])
    p.rect(pawX + tx * k, pawY + ty * k, k, k, c('corgi', 3));
  // the tiny red pom-pom nose on top
  const nx0 = Math.round(cx) - 1 - k;
  const ny0 = y - 2 * k;
  p.rect(nx0, ny0, 2 + k * 2, 2 + k, ink);
  p.rect(nx0 + 1, ny0 - 1, k * 2, 1, ink);
  p.rect(nx0 + 1, ny0, k * 2, 1 + k, c('red', 3)).set(nx0 + 1, ny0, c('fur', 2));
  return p;
}

/** The egg as a block: over a copy of `base` (a 20x20 background block). */
export function eggBlock(base: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  return drawEgg(p, 3, 2, 14, 17);
}

/** A tiny egg, 4 x 5, for a glimpse of one on a shelf. */
export function tinyEgg(p: Pixels, x: number, y: number): Pixels {
  p.rect(x + 1, y, 2, 1, c('fur', 2));
  p.rect(x, y + 1, 4, 3, c('fur', 2)).rect(x + 1, y + 4, 2, 1, c('fur', 1));
  p.set(x + 1, y + 1, c('red', 2))
    .set(x + 1, y + 2, c('red', 2))
    .set(x + 3, y + 2, c('red', 1))
    .set(x + 2, y + 3, c('blue', 2));
  return p;
}
