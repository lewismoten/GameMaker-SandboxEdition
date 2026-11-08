// Frost Lot's ice: a slab of rink ice that lies level with the bank, cracks and then lets go into the water under it, one
// section after another, on the clock of the THAW meter. Each section is its own set of blocks (ice, cracked ice) so the
// sections can melt at their own times; the last step is the creek's own water.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { SOLID } from '../../kit/starter/book';
import type { PBook } from './base';
import { onPaper } from './blocks';
import { halftone, inkLine, type Pal } from './print';

const T = 255;
/** Ticks a slab stays cracked before it lets go. */
export const CRACKED = 70;

function slab(pal: Pal, cracked: boolean): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  p.rect(0, 4, 20, 16, c('white', 3));
  halftone(p, 0, 8, 20, 12, c('teal', 4), 2, [c('white', 3)]);
  p.rect(0, 4, 20, 2, c('teal', 4)).rect(2, 9, 5, 1, c('white', 3)).rect(12, 14, 6, 1, c('white', 3));
  p.rect(0, 17, 20, 3, c('teal', 3));
  if (cracked) {
    // a crack runs through the slab and the top goes teal
    p.rect(0, 4, 20, 2, c('stone', 2));
    p.line(9, 4, 7, 9, c('ink', 1)).line(7, 9, 11, 13, c('ink', 1)).line(11, 13, 9, 19, c('ink', 1));
    p.line(7, 9, 3, 11, c('ink', 1)).line(11, 13, 16, 12, c('ink', 1));
  }
  return onPaper(pal, inkLine(p, c('ink', 0)));
}

/** Blocks `ice<id>` -> `crack<id>` (after `melt` ticks) -> `creekTop` (after `CRACKED` more) for each section's id. */
export function addIce(book: PBook, pal: Pal, sections: { id: string; melt: number }[]): void {
  const ice = slab(pal, false);
  const crack = slab(pal, true);
  for (const { id, melt } of sections) {
    book.add(`ice${id}`, ice, { solid: SOLID });
    book.add(`crack${id}`, crack, { solid: SOLID });
    book.time(`ice${id}`, `crack${id}`, melt).time(`crack${id}`, 'creekTop', CRACKED);
  }
}
