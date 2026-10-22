// The Second Paw Egg: butterscotch felt walked all over with little brown paw prints, a white
// felt bone appliqued on its side with a red bow tied round it, and a collar of blue rickrack
// round its middle with a tiny brass tag that reads "2".
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
      const light = Math.max(0, Math.min(1, 0.8 - 0.45 * nx - 0.35 * ny));
      // felt: a fuzzy dither, never a flat fill
      const fuzz = ((px * 7 + py * 13) % 5) / 10 - 0.2;
      p.set(px, py, shadeAt(r('hay'), 0, 3, light + fuzz * 0.6, px, py));
    }
  // an ink outline so it reads against anything
  for (let py = y - 1; py <= y + h; py++)
    for (let px = x - 1; px <= x + w; px++) {
      if (inside(px, py)) continue;
      if (inside(px - 1, py) || inside(px + 1, py) || inside(px, py - 1) || inside(px, py + 1)) p.set(px, py, ink);
    }
  const k = Math.max(1, Math.round(w / 14));
  // little brown paw prints walking all over it
  const paw = (fx: number, fy: number) => {
    const px = Math.round(x + fx * w);
    const py = Math.round(y + fy * h);
    if (!inside(px, py) || !inside(px + 2 * k, py + k)) return;
    p.rect(px, py, 2 * k, k, c('wood', 1));
    p.rect(px - k, py - k, k, k, c('wood', 1)).rect(px + 2 * k, py - k, k, k, c('wood', 1));
    if (k > 1) p.rect(px + Math.floor(k / 2), py - 2 * k, k, k, c('wood', 1));
  };
  for (const [fx, fy] of [
    [0.3, 0.2],
    [0.6, 0.12],
    [0.18, 0.42],
    [0.72, 0.36],
    [0.5, 0.82],
    [0.22, 0.78],
  ])
    paw(fx, fy);
  // a collar of blue rickrack round the middle, and its tiny brass tag
  const sy = Math.round(y + h * 0.6);
  for (let px = x; px < x + w; px++) if (inside(px, sy)) p.set(px, sy + ((px - x) % 2), c('blue', 2));
  const tx = Math.round(cx - k);
  p.rect(tx, sy + 2, 2 * k, 2 * k, c('gold', 2)).set(tx, sy + 2, c('gold', 1));
  if (k > 1) p.rect(tx + Math.floor(k / 2), sy + 2 + Math.floor(k / 2), k, k, ink);
  // a white felt bone appliqued on the side, a red bow tied round its middle
  const bx = Math.round(cx - w * 0.28);
  const by = Math.round(y + h * 0.36);
  const bw = Math.round(w * 0.56);
  p.rect(bx + k, by, bw - 2 * k, 2 * k, c('fur', 2));
  for (const ex of [bx, bx + bw - 2 * k]) p.rect(ex, by - k, 2 * k, k, c('fur', 2)).rect(ex, by + 2 * k, 2 * k, k, c('fur', 2));
  const mx = Math.round(bx + bw / 2) - k;
  p.rect(mx, by - k, 2 * k, 4 * k, c('red', 2)).rect(mx - k, by - 2 * k, k, k, c('red', 3)).rect(mx + 2 * k, by - 2 * k, k, k, c('red', 3));
  return p;
}

/** The egg as a block: over a copy of `base` (a 20x20 background block). */
export function eggBlock(base: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  return drawEgg(p, 3, 2, 14, 17);
}

/** A tiny egg, 4 x 5, for a glimpse of one. */
export function tinyEgg(p: Pixels, x: number, y: number): Pixels {
  p.rect(x + 1, y, 2, 1, c('hay', 3));
  p.rect(x, y + 1, 4, 3, c('hay', 2)).rect(x + 1, y + 4, 2, 1, c('hay', 1));
  p.set(x + 1, y + 1, c('wood', 1)).set(x + 3, y + 2, c('wood', 1)).set(x + 2, y + 3, c('blue', 2));
  return p;
}
