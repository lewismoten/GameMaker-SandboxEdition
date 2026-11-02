// Tune-Up's felt egg as a 20x20 block, the one Sir Reginald III lays: felt sewn to look like a
// rubber egg, glossy hot pink with a bright orange band, a white shine stitched on, and a little
// sewn-in tag (it reads "100% NATURAL RUBBER*", and under it "*felt").
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { P } from './palette';

const c = P.c;

/** The egg over `back` (about 14 x 18, centered low in the block). */
export function rubberEgg(back: Pixels): Pixels {
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
      egg.set(x, y, c('pink', light > 0.95 ? 3 : light > 0.55 ? 2 : light > 0.2 ? 1 : 0));
    }
  // the orange band at the waist, its stitches
  for (let x = 3; x < 17; x++) for (const y of [11, 12]) if (egg.get(x, y) !== 255) egg.set(x, y, c('orange', y === 11 ? 3 : 2));
  for (let x = 4; x < 16; x += 2) if (egg.get(x, 10) !== 255) egg.set(x, 10, c('orange', 1));
  // the shine, stitched on in white felt: a glossy streak
  egg.rect(6, 4, 2, 1, c('paint', 3)).rect(5, 5, 2, 2, c('paint', 3)).set(5, 7, c('paint', 3));
  // the sewn-in tag at the side, with two tiny lines of writing
  egg.rect(11, 14, 5, 4, c('paint', 3)).rect(12, 15, 3, 1, c('ink', 1)).set(12, 16, c('ink', 1));
  const shape = outline(egg, c('ink', 0));
  const p = new Pixels(20, 20).blit(back, 0, 0);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (shape.get(x, y) !== 255) p.set(x, y, shape.get(x, y));
  return p;
}
