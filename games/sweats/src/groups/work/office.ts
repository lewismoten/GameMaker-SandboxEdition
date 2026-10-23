// The NINE TO FIVE set's ramps and the office every one of its monologues shares: the beige
// wall with its baseboard, the grey-blue carpet, the drop ceiling with its fluorescent panels,
// the window onto the city.
import { Pixels, rng } from '../../../../kit/pixels';
import { shadeAt } from '../../../../snowbound/src/art/draw';
import type { Pal, Ramp } from '../../art/pal';
import { AIR, BlockBook, SOLID } from '../../common/blocks';

export const WORK_RAMPS: Ramp[] = [
  ['beige', 4, [120, 108, 90], [236, 226, 204]],
  ['carpet', 4, [36, 44, 60], [120, 132, 156]],
  ['fluor', 2, [220, 240, 240], [255, 255, 255], undefined, true],
  ['cube', 3, [70, 80, 100], [140, 150, 170]],
  ['daylight', 3, [90, 130, 180], [190, 220, 245]],
  ['blue', 3, [10, 30, 120], [80, 130, 250]],
  ['ink2', 2, [10, 10, 40], [50, 50, 90]],
];

/** The office wall: beige, a faint texture. */
export function officeWall(pal: Pal, seed: number): Pixels {
  const p = new Pixels(20, 20);
  const r = rng(seed);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, pal.c('beige', r() < 0.06 ? 1 : 2));
  return p;
}

export function buildOffice(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  book.add('officeWall', officeWall(pal, 1), AIR);
  // the baseboard row the poet walks along
  const base = officeWall(pal, 2);
  base.rect(0, 16, 20, 4, c('cube', 0)).rect(0, 16, 20, 1, c('cube', 1));
  book.add('base', base, AIR);
  // carpet (the floor) and under it
  const carpet = (top: boolean) => {
    const p = new Pixels(20, 20);
    const r = rng(top ? 3 : 4);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('carpet', r() < 0.3 ? 1 : 2));
    if (top) p.rect(0, 0, 20, 2, c('carpet', 3));
    return p;
  };
  book.add('carpet', carpet(true), { solid: SOLID });
  book.add('slab', carpet(false), { solid: SOLID });
  // the drop ceiling: tiles, and a fluorescent panel
  const ceiling = (light: boolean) => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, x % 10 === 0 || y % 10 === 0 ? c('beige', 1) : c('white', 1));
    if (light) p.rect(2, 12, 16, 6, c('fluor', 1)).rect(3, 13, 14, 4, c('fluor', 0));
    p.rect(0, 18, 20, 2, c('beige', 0));
    return p;
  };
  book.add('ceiling', ceiling(false), { solid: SOLID });
  book.add('ceilingLit', ceiling(true), { solid: SOLID });
  // the window onto the city (a bridge, the rivers, the hills)
  const window = officeWall(pal, 5);
  window.rect(1, 1, 18, 18, c('metal', 1));
  for (let y = 2; y < 18; y++) for (let x = 2; x < 18; x++) window.set(x, y, shadeAt(R('daylight'), 0, 2, 1 - y / 18, x, y));
  window.rect(2, 12, 16, 6, c('green', 1)).rect(4, 9, 3, 9, c('grey', 1)).rect(8, 7, 2, 11, c('grey', 2)).rect(12, 10, 4, 8, c('grey', 1));
  window.line(2, 14, 17, 13, c('gold', 1));
  book.add('window', window, AIR);
}
