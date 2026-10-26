// Doc Leo's portrait for the finale's cast.fli: the sequel's portrait (games/teddy/src/screens/
// castLeo.ts, drawn over Lewis's photo as a hobo clown) made up the way this game draws him:
// white greasepaint patches round both eyes, his own nose sunburned pink (a hobo wears no
// clown nose, so the sequel's red nose is never drawn), and a lavender shirt.
import type { Pixels } from '../../../kit/pixels';
import { drawArt } from './castArt';
import { LEO, LEO_BLINK } from '../../../teddy2/src/screens/castLeo';
import { c } from './castKit';

/** The eyes' white patches and the sunburned nose, as ellipses [cx, cy, rx, ry]. */
const PATCHES: [number, number, number, number][] = [
  [104, 85, 21, 14],
  [148, 84, 21, 14],
];
const NOSE: [number, number, number, number] = [127, 99, 9, 8];

const inside = ([cx, cy, rx, ry]: [number, number, number, number], x: number, y: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

/** Draws Doc Leo from the chest up (`dy` down), eyes shut when `blink`. */
export function drawLeo(l: Pixels, dy: number, blink: boolean): void {
  drawArt(l, LEO, c, 0, dy);
  if (blink) drawArt(l, LEO_BLINK, c, 0, dy);
  const skin = [0, 1, 2, 3].map((k) => c('skin', k));
  const purple = [0, 1, 2, 3].map((k) => c('purple', k));
  l.map((x, y, k) => {
    const s = skin.indexOf(k);
    if (s >= 0 && PATCHES.some((e) => inside(e, x, y - dy))) return c('fur', Math.min(2, s));
    if (s >= 0 && inside(NOSE, x, y - dy)) return c('pink', s);
    const v = purple.indexOf(k);
    if (v >= 0) return c('lilac', v);
    return k;
  });
}
