// The funhouse's toys as monster art: a jack-in-the-box with a smiling puppy on its spring
// (shut, rattling just before it pops, popped up, and latched shut for good once Teddy woofs
// at it).
import type { Pixels } from '../../../kit/pixels';
import { sprite } from '../art/draw';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);
const K: Record<string, number> = {
  o: c('ink', 0),
  l: c('lilac', 1),
  L: c('lilac', 3),
  y: c('yellow', 2),
  Y: c('yellow', 3),
  m: c('metal', 2),
  M: c('metal', 4),
  w: c('fur', 2),
  W: c('fur', 1),
  b: c('corgi', 1),
  B: c('corgi', 3),
  p: c('pink', 2),
  g: c('green', 2),
  r: c('red', 2),
};
const S = (rows: string[], dx?: number, dy?: number) => sprite(rows, K, dx, dy);

/** The box itself: lilac and yellow checks, a crank on the side. */
const BOX = ['ooooooooooooo', 'oLLyyLLyyLLyo', 'oLLyyLLyyLLyoMm', 'oyyLLyyLLyyLomM', 'oyyLLyyLLyyLo', 'oLLyyLLyyLLyo', 'oLLyyLLyyLLyo', 'ooooooooooooo'];
const LID = ['.ooooooooooo.', 'oYYYYYYYYYYYo'];

/** Shut: the lid down, the puppy inside. `rattle` tips it a pixel (it's about to pop). */
export function jackShut(rattle = false): Pixels {
  return S([...LID, ...BOX], rattle ? 4 : 3);
}

/** Popped: the lid flung back, the spring up, a smiling puppy in a party hat. */
export function jackUp(): Pixels {
  return S(
    [
      '.......g.....',
      '......ggg....',
      '.....gYgYg...',
      '..oo.oooo.oo.',
      '.obBowwwwobBo',
      '.oBbwowwowbBo',
      '..owwwppwwwo.',
      '...owwoowwo..',
      '....oooooo...',
      '......mM.....',
      '.....Mm......',
      '......mM.....',
      'oo...Mm......',
      'oYo.ooooooooo',
      ...BOX.slice(1),
    ],
    3,
  );
}

/** Latched: shut for good, a ribbon tied round it. */
export function jackLatched(): Pixels {
  const rows = [...LID, ...BOX].map((row) => row.slice(0, 6) + (row[6] === 'o' ? 'o' : 'r') + row.slice(7));
  return S(rows, 3);
}
