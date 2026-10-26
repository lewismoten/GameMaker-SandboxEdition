// THE CHEZ with riders, for the cartoons: the shared side view (games/kit/chez.ts) true to the
// photos, `s` pixels a unit. Whoever sits inside shows only through the door window; a head out
// of the window is drawn on top. Teddy rides in the front passenger seat, looking out the door
// window beside the driver. (The sequel draws its rides with this file too.)
import { Pixels } from '../../../kit/pixels';
import { CHEZ_WINDOW, chezSide, type ChezInk } from '../../../kit/chez';
import { CLEAR } from '../art/draw';

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
 * Parks THE CHEZ facing right (the driver's side) with its box's top left at (ox, oy); what
 * `inside` draws shows only through the door window, and what `out` draws goes on top.
 */
export function chezRide(p: Pixels, ox: number, oy: number, s: number, ink: ChezInk, inside: (q: Pixels) => void, out?: (q: Pixels) => void): void {
  chezSide(p, ox, oy, ink, 'right', s);
  const q = new Pixels(p.w, p.h, CLEAR);
  inside(q);
  const win: Pt[] = CHEZ_WINDOW.map(([x, y]) => [ox + x * s, oy + y * s]);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const k = q.get(x, y);
      if (k !== CLEAR && inPoly(win, x + 0.5, y + 0.5)) p.set(x, y, k);
    }
  if (out) {
    const o = new Pixels(p.w, p.h, CLEAR);
    out(o);
    p.blit(o, 0, 0, CLEAR);
  }
}
