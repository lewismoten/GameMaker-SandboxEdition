// Tune-Up's felt egg as a 20x20 block: moss-green felt with two white staves stitched round it,
// a black felt eighth note on its side and a gold band at the waist (web/src/eggs/eggs.ts
// describes the same egg for the shadow box).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { P } from './pal';

const c = P.c;

/** The egg over `back` (its top left at x 3, y 1: about 14 x 18). */
export function feltEgg(back: Pixels): Pixels {
  const egg = new Pixels(20, 20, 255);
  const cx = 10;
  const cy = 11;
  for (let y = 1; y < 20; y++)
    for (let x = 3; x < 17; x++) {
      const ry = y < cy ? 9.6 : 8;
      const nx = (x + 0.5 - cx) / 7;
      const ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      const light = 0.75 - 0.5 * nx - 0.35 * ny;
      egg.set(x, y, c('fam-winds', light > 0.85 ? 2 : light > 0.4 ? 1 : 0));
    }
  // two staves of white stitches, and the gold band at the waist
  for (const y of [5, 7, 15, 17]) for (let x = 4; x < 16; x += 2) if (egg.get(x, y) !== 255) egg.set(x, y, c('paint', 3));
  for (let x = 3; x < 17; x++) if (egg.get(x, 11) !== 255) egg.set(x, 11, c('gold', 2));
  // the felt eighth note
  egg.rect(7, 9, 3, 2, c('ink', 0)).rect(9, 4, 1, 6, c('ink', 0)).set(10, 4, c('ink', 0)).set(11, 5, c('ink', 0));
  const shape = outline(egg, c('ink', 0));
  const p = new Pixels(20, 20).blit(back, 0, 0);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (shape.get(x, y) !== 255) p.set(x, y, shape.get(x, y));
  return p;
}
