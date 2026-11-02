// Teddy in THE CHEZ's door window: the trilogy's corgi head, front on, his chin on the sill of a
// left-facing car's window (toward its upright back edge) and clipped to the glass, so nothing of
// him lands on the windshield, the roof or the door.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { CHEZ_WINDOW } from '../../../kit/chez';
import { POSES } from '../../../teddy2/src/sprites/teddy';

/** Is (x, y) inside the polygon? (even-odd rule) */
function inside(poly: readonly (readonly [number, number])[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/**
 * Teddy's head in the door window of THE CHEZ drawn facing left with its box's top left at
 * (ox, oy), `s` pixels a unit across and `t` up and down (chezSide's scale and scale x tall).
 */
export function teddyInWindow(p: Pixels, ox: number, oy: number, s: number, t = s): void {
  const k = Math.max(1, Math.floor(s / 4));
  const head = POSES.front.crop(2, 4, 16, 11);
  const W = Math.round(40 * s);
  const x0 = Math.round(23 * s - (head.w * k) / 2);
  const y0 = Math.round(8.3 * t) - head.h * k;
  for (let y = 0; y < head.h * k; y++)
    for (let x = 0; x < head.w * k; x++) {
      const v = head.get(Math.floor(x / k), Math.floor(y / k));
      if (v === 255) continue;
      const px = x0 + x;
      const py = y0 + y;
      // the window is drawn mirrored: this pixel's centre in the right-facing car's units
      if (inside(CHEZ_WINDOW, (W - 1 - px + 0.5) / s, (py + 0.5) / t)) p.set(ox + px, oy + py, v);
    }
}
