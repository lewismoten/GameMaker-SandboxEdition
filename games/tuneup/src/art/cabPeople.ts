// The Beltway's two people, painted into the driver's seat (cab.ts). The view is the back wall and
// roof on the passenger side, looking forward: Doc Leo drives on the left, seen from behind and the
// right (his chewed gray fedora, the glasses' arm over his ear, a cheek of white greasepaint and
// sunburn, his navy corduroy jacket over the purple shirt, one hand on the wheel's rim), and
// Teddy the corgi sits on the bench seat at the right, looking out of the door window.
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Kit } from '../blocks/common';

/** Where Teddy's head is drawn in the door window. */
export const TEDDY_AT = [271, 72] as const;

/** The steering wheel's center (low and left), its rim's radii and the hub's. */
export const WHEEL = { x: 68, y: 192, inner: 26, outer: 32, hub: 7 } as const;

/** The steering wheel: a 7 px rim (lit on top, dark beneath), the hub and a spoke each side, its column behind the driver's arm. */
export function wheel(k: Kit, p: Pixels): void {
  const { c } = k;
  for (let y = 120; y < 200; y++)
    for (let x = 0; x < 120; x++) {
      const d = Math.hypot(x - WHEEL.x, y - WHEEL.y);
      const t = d - WHEEL.inner;
      if (d >= WHEEL.inner && d < WHEEL.outer) p.set(x, y, c('mach', t < 1 ? 4 : t < 3 ? 3 : t < 6 ? 2 : 1));
    }
  // two spokes from the rim to the hub, the hub's disc with its cap
  p.rect(WHEEL.x - WHEEL.inner, 187, WHEEL.inner - 4, 5, c('mach', 2)).rect(WHEEL.x + 4, 187, WHEEL.inner - 4, 5, c('mach', 2));
  p.rect(WHEEL.x - WHEEL.inner, 187, WHEEL.inner - 4, 1, c('mach', 4)).rect(WHEEL.x + 4, 187, WHEEL.inner - 4, 1, c('mach', 4));
  p.disc(WHEEL.x, WHEEL.y, WHEEL.hub, c('mach', 1))
    .disc(WHEEL.x, WHEEL.y, WHEEL.hub - 2, c('mach', 3))
    .disc(WHEEL.x, WHEEL.y, 4, c('metal', 3));
}

/** Doc Leo at the wheel, from behind and the right. He stays left of x 40: the skyline and trees are rings there. */
export function driver(k: Kit, p: Pixels): void {
  const { c, R } = k;
  // the seat's bolster and his back and shoulders in the navy corduroy jacket, rising straight from the collar
  // (its cords every 4 px, so like cells stay alike)
  blob(p, 19, 104, 25, 16, R('coat'), 1, 3);
  p.rect(0, 104, 40, 100, c('coat', 2));
  for (let x = 0; x < 40; x += 4) p.rect(x, 100, 1, 104, c('coat', 1));
  // his neck, the purple shirt's collar at it, the jacket's collar over that
  p.rect(13, 70, 14, 20, c('skin', 2)).rect(13, 70, 14, 3, c('skin', 0)).rect(13, 78, 2, 10, c('skin', 1));
  p.rect(11, 84, 19, 5, c('purple', 2)).rect(11, 84, 19, 1, c('purple', 3));
  p.rect(9, 88, 23, 5, c('coat', 3)).rect(9, 92, 23, 1, c('coat', 1));
  // the back of his head and his dark brown hair under the hat's brim, a sideburn down to his ear
  blob(p, 19, 62, 13, 13, R('skin'), 1, 3);
  blob(p, 15, 62, 9, 11, R('dirt'), 0, 2);
  p.rect(12, 70, 9, 6, c('dirt', 1)).rect(13, 76, 7, 2, c('dirt', 0));
  p.rect(22, 56, 2, 11, c('dirt', 1)).set(23, 66, c('dirt', 0));
  // his cheek, turned toward the road: white greasepaint round the mouth and eye, painted gray stubble, his sunburned pink nose
  p.disc(31, 71, 4.5, c('paint', 3)).disc(31, 72, 3, c('paint', 4)).rect(29, 74, 5, 1, c('nose', 1));
  p.disc(30, 61, 4, c('paint', 3)).set(31, 61, c('ink', 0));
  p.disc(36, 66, 3.5, c('nose', 2)).disc(35, 65, 1.2, c('nose', 3));
  for (const [x, y] of [
    [24, 74],
    [26, 77],
    [22, 77],
    [28, 78],
    [20, 74],
  ])
    p.set(x, y, c('hat', 2));
  p.disc(24, 63, 3, c('skin', 2)).rect(23, 61, 1, 4, c('skin', 0));
  // the glasses' arm over the ear and the wire rim past his cheek
  p.line(24, 57, 33, 59, c('steel', 3)).rect(31, 57, 4, 6, c('steel', 3)).rect(32, 58, 2, 4, c('water', 2));
  // the chewed gray fedora: its crown, a dark band with two pins in it, and a brim with bites out of its edge
  blob(p, 18, 40, 14, 11, R('hat'), 1, 3);
  p.rect(6, 42, 13, 1, c('hat', 0)).rect(20, 38, 1, 9, c('hat', 0));
  p.rect(5, 47, 27, 4, c('hat', 0)).set(11, 48, c('red', 3)).set(24, 48, c('gold', 3));
  p.rect(0, 51, 38, 4, c('hat', 2)).rect(0, 51, 38, 1, c('hat', 3)).rect(0, 54, 38, 1, c('hat', 1));
  for (const x of [3, 14, 29]) p.rect(x, 54, 3, 1, c('wall', 0));
  p.set(36, 51, c('wall', 0)).set(37, 52, c('wall', 0));
  // his right arm, full: the jacket's sleeve (a shoulder, an upper arm, a bent elbow) to the purple cuff, then his hand around the rim
  blob(p, 29, 112, 12, 12, R('coat'), 1, 3);
  blob(p, 30, 132, 9, 22, R('coat'), 1, 3);
  for (let i = 0; i <= 14; i++) p.disc(30 + i * 1.1, 152 + i * 0.5, 6, c('coat', i < 3 ? 1 : 2));
  for (let i = 0; i < 8; i++) p.line(31 + i, 144 + (i >> 1), 40 + i, 150 + (i >> 1), c('coat', 1));
  p.disc(49, 161, 5, c('purple', 2)).rect(44, 156, 4, 10, c('purple', 3));
  p.disc(57, 163, 5, c('skin', 3)).rect(53, 164, 9, 4, c('skin', 2)).rect(53, 167, 9, 1, c('skin', 0)).rect(55, 159, 4, 3, c('skin', 3));
  for (const x of [55, 58, 61]) p.rect(x, 164, 1, 3, c('skin', 0));
}

/** Teddy on the bench seat, his head in profile at (x, y) looking out of the door window, his ears alike. */
export function teddy(k: Kit, p: Pixels): void {
  const { c } = k;
  const [x, y] = TEDDY_AT;
  // haunch on the cushion, shoulders and chest, then the head: muzzle toward the glass
  p.disc(x + 6, y + 52, 15, c('corgi', 2))
    .disc(x + 4, y + 54, 10, c('corgi', 3))
    .rect(x + 12, y + 64, 12, 4, c('fur', 2));
  p.disc(x + 10, y + 40, 12, c('corgi', 2)).rect(x + 18, y + 34, 6, 16, c('fur', 2));
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
