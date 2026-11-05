// THREE PHASES' star: a five-point gold star, 20 by 20, in two turns (so it spins as it flies).
// The same star the hero holds in her throw frames (kit/starter/hero.ts), only larger.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** Whether (x, y) is inside a polygon (even-odd rule). */
function inside(poly: [number, number][], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** The star at turn 0 (one point up) or turn 1 (turned half a point, a little narrower). */
export function drawStar(pal: Pal, turn: 0 | 1): Pixels {
  const gold = pal.r('gold');
  const p = new Pixels(20, 20, T);
  const outer = turn ? 8.2 : 8.8;
  const spin = turn ? Math.PI / 10 : 0;
  const poly: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + spin + (i * Math.PI) / 5;
    const r = i % 2 ? 3.9 : outer;
    poly.push([10 + Math.cos(a) * r, 10.5 + Math.sin(a) * r]);
  }
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (!inside(poly, x + 0.5, y + 0.5)) continue;
      // lit from the upper left
      const light = (x + y) / 38;
      p.set(x, y, light < 0.42 ? gold[4] : light < 0.6 ? gold[3] : gold[2]);
    }
  p.set(8, 8, pal.c('white', 3)).set(9, 8, pal.c('white', 3));
  return outline(p, pal.c('ink', 0), { transparent: T });
}
