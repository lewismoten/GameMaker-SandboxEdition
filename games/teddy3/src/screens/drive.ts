// drive.fli, between Teddy's stops: THE CHEZ hums on to the next errand (it is electric: no
// exhaust, just a whirr), Doc Leo at the wheel behind the door window and Teddy's head out of
// the front of it, ears flapping. Also THE CHEZ with whoever is inside it, for the other screens.
import { Pixels } from '../../../kit/pixels';
import { CHEZ_WINDOW, chezSide } from '../../../kit/chez';
import { CLEAR, outlined, scaleBlit } from '../art/draw';
import { CHEZ_INK } from '../sprites/chezHero';
import { LEO } from '../sprites/leo';
import { POSES } from '../sprites/teddy';
import { H, Reel, W, c, caption } from './reel';
import { landscape } from './screens';

type Pt = [number, number];

function inPoly(poly: Pt[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Parks THE CHEZ (the shared side view, `s` pixels a unit) with its box's top left at
 * (ox, oy); whatever `inside` draws shows only through the door window, and whatever `out`
 * draws goes on top (a head out of the window). Returns where the charge port is.
 */
export function chezWith(
  p: Pixels,
  ox: number,
  oy: number,
  s: number,
  facing: 'left' | 'right',
  inside: (q: Pixels) => void,
  out?: (q: Pixels) => void,
): { portX: number; portY: number } {
  const port = chezSide(p, ox, oy, CHEZ_INK, facing, s);
  const q = new Pixels(W, H, CLEAR);
  inside(q);
  const win: Pt[] = CHEZ_WINDOW.map(([x, y]) => [facing === 'left' ? ox + (40 - x) * s : ox + x * s, oy + y * s]);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const k = q.get(x, y);
      if (k !== CLEAR && inPoly(win, x + 0.5, y + 0.5)) p.set(x, y, k);
    }
  if (out) {
    const o = new Pixels(W, H, CLEAR);
    out(o);
    p.blit(o, 0, 0, CLEAR);
  }
  return port;
}

/** Doc Leo's head and shoulders (the finale's look: no clown nose), from his sprite. */
export const leoHead = (pose = 'front') => LEO[pose].crop(0, 0, 20, 22);

export function driveFli(): Uint8Array {
  const bg = landscape(11);
  bg.rect(0, 168, W, 32, c('asphalt', 1));
  for (let x = 0; x < W; x += 40) bg.rect(x + 8, 184, 20, 3, c('yellow', 3));
  const r = new Reel(bg);
  for (let f = 0; f < 48; f++)
    r.frame((p) => {
      const x = -200 + f * 11;
      const y = 72 + (f % 2);
      chezWith(
        p,
        x,
        y,
        5,
        'right',
        (q) => scaleBlit(q, leoHead(f === 20 || f === 21 ? 'frontBlink' : 'front'), x + 62, y + 13, 2),
        // Teddy's head out of the front of the window, ears flapping in the wind
        (q) => scaleBlit(q, POSES[f % 4 < 2 ? 'front' : 'frontTilt'].crop(0, 2, 20, 12), x + 94, y + 18, 2),
      );
      // the electric whirr
      for (let k = 0; k < 3; k++) p.rect(x - 8 - k * 10 - (f % 2) * 3, 150 + k * 7, 8 - k * 2, 1, c('paint', 3));
      if (f > 16 && f < 30) outlined(p, x + 206, 110, 'HONK!', c('yellow', 3), c('ink', 0), 2);
      caption(p, f < 26 ? 'ON TO THE NEXT ERRAND!' : 'THE CHEZ: 100% ELECTRIC');
      if (f >= 8 && f < 26) caption(p, '(TEDDY THINKS IT IS ALL ERRANDS.)', 22);
      if (f >= 26) caption(p, '(ABOUT A MILE AN HOUR OF CHARGE)', 22);
    });
  return r.fli(4);
}
