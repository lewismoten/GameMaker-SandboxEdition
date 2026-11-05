// The flame: a small friendly orange flame with two tongues, 20 by 20, drawn from a pattern in two
// sways (the second is the first turned left to right, so it flickers as it flies).
// The same flame the hero holds in her flame frames (hero.ts recolors her star), only larger.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** The flame, a row a string: O orange, I gold, C pale yellow, R red at the base. */
const FLAME = [
  '.........O..........',
  '........OO..........',
  '.......OOO..........',
  '.......OOOO....O....',
  '......OOOOO...OO....',
  '......OOIOOO..OOO...',
  '.....OOOIIOO.OOOO...',
  '.....OOOIIOOOOOOO...',
  '....OOOIIIOOOOOOO...',
  '....OOIIIIIOOOOOO...',
  '...OOOIIIIIIOOOOO...',
  '...OOIIICCIIIOOO....',
  '...OOIIICCCIIOOO....',
  '...OOIIICCCIIOOO....',
  '...ROIIICCCIIORR....',
  '....RROIIIIIORR.....',
  '.....RRRRRRRRR......',
  '....................',
  '....................',
  '....................',
];

/** The flame at sway 0 or sway 1 (turned left to right). */
export function drawFlame(pal: Pal, sway: 0 | 1): Pixels {
  const color = { O: pal.c('orange', 3), I: pal.c('gold', 3), C: pal.c('gold', 5), R: pal.c('red', 3) } as const;
  const p = new Pixels(20, 20, T);
  FLAME.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch !== '.') p.set(sway ? 19 - x : x, y + 2, color[ch as keyof typeof color]);
    }),
  );
  return outline(p, pal.c('ink', 0), { transparent: T });
}
