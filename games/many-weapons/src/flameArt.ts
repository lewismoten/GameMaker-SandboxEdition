// The flame: a small friendly orange teardrop, 20 by 20, in two sways (so it flickers as it flies).
// The same flame the hero holds in his flame frames (hero.ts recolors his star), only larger.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** The flame at sway 0 (tip leaning left) or sway 1 (tip leaning right). */
export function drawFlame(pal: Pal, sway: 0 | 1): Pixels {
  const orange = pal.r('orange');
  const gold = pal.r('gold');
  const p = new Pixels(20, 20, T);
  for (let y = 2; y < 18; y++) {
    const t = (y - 2) / 15;
    const half = t < 0.65 ? 6.2 * Math.pow(t / 0.65, 1.3) : 6.2 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.65) / 0.35, 2)));
    const lean = (sway ? 1 : -1) * (1 - t) * 2.2;
    const mid = 10 + lean;
    for (let x = 0; x < 20; x++) {
      const d = Math.abs(x + 0.5 - mid);
      if (d > half) continue;
      const core = d < half * 0.45 && t > 0.35;
      const inner = d < half * 0.72 && t > 0.2;
      p.set(x, y, core ? gold[5] : inner ? gold[4] : t < 0.5 ? orange[4] : orange[3]);
    }
  }
  return outline(p, pal.c('ink', 0), { transparent: T });
}
