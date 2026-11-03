// The Beltway's two people, painted into the driver's seat (cab.ts). The view is the back wall and
// roof on the passenger side, looking forward: Doc Leo drives on the left, seen from behind and the
// right (his chewed gray fedora, the glasses' arm over his ear, a cheek of white greasepaint and
// sunburn, his navy corduroy jacket over the purple shirt, one hand on the wheel's rim), and
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
  // the seat's bolster, then his back and shoulders in the navy corduroy jacket (its cords every 4 px, so like cells stay alike)
  p.rect(0, 96, 8, 104, c('wall', 0));
  blob(p, 16, 100, 24, 14, R('coat'), 1, 3);
  p.rect(8, 116, 32, 84, c('coat', 2));
  for (let x = 8; x < 40; x += 4) p.rect(x, 104, 1, 96, c('coat', 1));
  // the purple shirt's collar at his neck, the jacket's collar over it
  p.rect(12, 84, 17, 5, c('purple', 2)).rect(12, 84, 17, 1, c('purple', 3));
  p.rect(10, 88, 22, 4, c('coat', 3)).rect(10, 91, 22, 1, c('coat', 1));
  // his neck, his cheek and right ear: white greasepaint round the mouth, a sunburned pink cheek, painted gray stubble
  p.rect(13, 70, 14, 15, c('skin', 2)).rect(13, 70, 14, 3, c('skin', 0));
  blob(p, 20, 62, 13, 13, R('skin'), 1, 3);
  p.disc(30, 70, 4, c('paint', 3)).disc(31, 71, 2.5, c('paint', 4));
  p.disc(28, 63, 3, c('nose', 2));
  for (const [x, y] of [
    [22, 72],
    [25, 74],
    [19, 75],
    [24, 77],
    [27, 71],
  ])
    p.set(x, y, c('hat', 2));
  p.disc(27, 60, 3.5, c('skin', 2)).rect(26, 58, 1, 4, c('skin', 0));
  // the glasses' arm over the ear and the wire rim past his cheek
  p.line(26, 56, 36, 58, c('steel', 3)).rect(34, 55, 4, 6, c('steel', 3)).rect(35, 56, 2, 4, c('water', 2));
  // the chewed gray fedora: its crown, a dark band with two pins in it, and a brim with bites out of its edge
  blob(p, 18, 40, 14, 11, R('hat'), 1, 3);
  p.rect(6, 42, 13, 1, c('hat', 0)).rect(20, 38, 1, 9, c('hat', 0));
  p.rect(5, 47, 27, 4, c('hat', 0)).set(11, 48, c('red', 3)).set(24, 48, c('gold', 3));
  p.rect(0, 51, 38, 4, c('hat', 2)).rect(0, 51, 38, 1, c('hat', 3)).rect(0, 54, 38, 1, c('hat', 1));
  for (const x of [3, 14, 29]) p.rect(x, 54, 3, 1, c('wall', 0));
  p.set(36, 51, c('wall', 0)).set(37, 52, c('wall', 0));
  // his right arm: the jacket's sleeve to the elbow below the gauges, the purple cuff, his hand on the rim's top
  blob(p, 32, 130, 7, 28, R('coat'), 1, 3);
  blob(p, 32, 156, 7, 8, R('coat'), 1, 3);
  for (let i = 0; i < 6; i++) p.line(36, 158 + i, 46, 163 + i, c('coat', i < 1 || i > 4 ? 1 : 2));
  p.rect(45, 162, 3, 7, c('purple', 2));
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
