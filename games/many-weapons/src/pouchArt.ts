// The pouches: a little sack with a star on it (stars) or a flame on it (flames), 20 by 20 and sitting
// (a monster, so it can fill up again a moment after it is taken) and the same sack slumped and empty.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** The emblems, 5 wide: X is the lighter shade, o the darker one. */
const EMBLEM = {
  star: ['..X..', '.XXX.', 'XXXXX', '.XXX.', 'X...X'],
  flame: ['..X..', '.XXo.', 'XXXXo', 'XXXXo', '.XXo.'],
} as const;

/** A full pouch (`full`, brown with the star or the flame on it) or the same sack gone gray and limp with its mouth open (empty). */
export function drawPouch(pal: Pal, kind: 'star' | 'flame', full: boolean): Pixels {
  const wood = pal.r(full ? 'wood' : 'stone');
  const p = new Pixels(20, 20, T);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = (x + 0.5 - 10) / 6.5;
      const dy = (y + 0.5 - 12.5) / 6;
      if (dx * dx + dy * dy <= 1) p.set(x, y, dx + dy < -0.3 ? wood[3] : dx + dy < 0.5 ? wood[2] : wood[1]);
    }
  if (full) {
    // the puckered neck, a cord, and the ruffle above it
    p.rect(8, 5, 4, 3, wood[2]).rect(7, 4, 6, 2, wood[3]).rect(8, 7, 4, 1, pal.c('gold', 4));
    const lit = kind === 'star' ? pal.c('gold', 4) : pal.c('orange', 3);
    const dark = kind === 'star' ? pal.c('gold', 2) : pal.c('red', 2);
    EMBLEM[kind].forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && p.set(8 + i, 10 + j, ch === 'X' ? lit : dark)));
  } else {
    // open mouth, dark inside, and a dent in the side: nothing left in it
    p.rect(7, 4, 6, 2, wood[3]).rect(8, 5, 4, 2, pal.c('ink', 1)).rect(9, 11, 3, 1, wood[0]).rect(8, 12, 5, 1, wood[0]);
  }
  return outline(p, pal.c('ink', 0), { transparent: T });
}
