// The Beltway's two people, painted into the driver's seat (cab.ts). The view is the back wall and
// roof on the passenger side, looking forward: Doc Leo drives on the left, seen from behind and the
// right (short hair, glasses' arm over his ear, a gray T-shirt, one hand on the wheel's rim), and
// Teddy the corgi sits on the bench seat at the right, looking out of the door window.
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Kit } from '../blocks/common';

/** Where Teddy's head is drawn in the door window. */
export const TEDDY_AT = [262, 72] as const;

/** The steering wheel's center (low and left), its rim's radii and the dash's spoke. */
export const WHEEL = { x: 56, y: 202, inner: 38, outer: 41 } as const;

/** The thin steering wheel, low on the left (its column is behind the driver's arm). */
export function wheel(k: Kit, p: Pixels): void {
  const { c } = k;
  for (let y = 120; y < 200; y++)
    for (let x = 0; x < 120; x++) {
      const d = Math.hypot(x - WHEEL.x, y - WHEEL.y);
      if (d >= WHEEL.inner && d < WHEEL.outer) p.set(x, y, c('mach', d < WHEEL.inner + 1 ? 4 : d < WHEEL.inner + 2 ? 2 : 1));
    }
}

/** Doc Leo at the wheel, from behind and the right. He stays left of x 40: the skyline and trees are rings there. */
export function driver(k: Kit, p: Pixels): void {
  const { c, R } = k;
  // the seat's bolster, then his back and shoulders in a gray T-shirt
  p.rect(0, 96, 8, 104, c('wall', 0));
  blob(p, 16, 100, 24, 14, R('gray'), 1, 3);
  p.rect(12, 85, 16, 3, c('gray', 0));
  p.rect(8, 116, 32, 84, c('gray', 2));
  // his neck, the back of his head (short hair with some gray in it), his cheek and right ear
  p.rect(13, 74, 14, 14, c('skin', 1)).rect(13, 74, 14, 4, c('skin', 0));
  blob(p, 19, 60, 14, 16, R('skin'), 1, 3);
  blob(p, 16, 52, 15, 14, R('mud'), 0, 2);
  p.rect(5, 56, 11, 10, c('mud', 1)).rect(6, 64, 7, 3, c('mud', 0)).rect(25, 54, 4, 7, c('mud', 1));
  for (const [x, y] of [
    [10, 46],
    [15, 42],
    [21, 45],
    [9, 58],
    [26, 57],
  ])
    p.set(x, y, c('hat', 3));
  p.disc(29, 64, 3.5, c('skin', 2)).rect(28, 62, 1, 4, c('skin', 0));
  // the glasses' arm over the ear and the lens's rim past his cheek
  p.line(29, 59, 36, 60, c('steel', 3)).rect(34, 57, 4, 7, c('steel', 3)).rect(35, 58, 2, 5, c('water', 2));
  // his right arm: the sleeve to the elbow below the gauges, the forearm out to the rim's top
  blob(p, 32, 130, 7, 28, R('gray'), 1, 3);
  blob(p, 32, 156, 7, 8, R('gray'), 1, 3);
  for (let i = 0; i < 6; i++) p.line(36, 158 + i, 49, 164 + i, i < 1 || i > 4 ? c('skin', 1) : c('skin', 2));
  p.disc(52, 168, 4, c('skin', 3)).rect(49, 171, 6, 3, c('skin', 1)).rect(51, 164, 3, 2, c('skin', 2));
}

/** Teddy on the bench seat, his head in profile at (x, y) looking out of the door window, his ears alike. */
export function teddy(k: Kit, p: Pixels): void {
  const { c } = k;
  const [x, y] = TEDDY_AT;
  // haunch on the cushion, shoulders and chest, then the head: muzzle toward the glass
  p.disc(x + 6, y + 64, 17, c('corgi', 2))
    .disc(x + 4, y + 66, 12, c('corgi', 3))
    .rect(x + 12, y + 76, 12, 4, c('fur', 2));
  p.disc(x + 10, y + 42, 13, c('corgi', 2)).rect(x + 18, y + 36, 6, 18, c('fur', 2));
  p.disc(x + 12, y + 18, 12, c('corgi', 3))
    .disc(x + 24, y + 22, 6, c('corgi', 3))
    .disc(x + 26, y + 24, 4, c('fur', 2));
  for (const ex of [x + 2, x + 13]) for (let i = 0; i < 14; i++) p.rect(ex + (i >> 2), y + 9 - i, 8 - Math.floor(i * 0.6), 1, c('corgi', i < 2 ? 3 : 2));
  p.rect(x + 5, y + 3, 2, 4, c('pink', 1)).rect(x + 16, y + 3, 2, 4, c('pink', 1));
  p.disc(x + 20, y + 16, 1.5, c('ink', 0))
    .set(x + 30, y + 22, c('ink', 0))
    .set(x + 31, y + 22, c('ink', 0));
  p.rect(x + 18, y + 12, 3, 9, c('fur', 2));
  p.rect(x + 22, y + 28, 6, 1, c('ink', 0));
  p.rect(x + 3, y + 30, 16, 3, c('red', 2)).set(x + 12, y + 33, c('gold', 2));
}

/** Teddy's ring's second frame: a pant, his tongue out where his mouth's line was. */
export function teddyPant(k: Kit, p: Pixels): void {
  const [x, y] = TEDDY_AT;
  p.rect(x + 22, y + 28, 6, 1, k.c('corgi', 3));
  p.rect(x + 24, y + 28, 3, 4, k.c('tongue', 1)).rect(x + 25, y + 31, 2, 1, k.c('tongue', 0));
}
