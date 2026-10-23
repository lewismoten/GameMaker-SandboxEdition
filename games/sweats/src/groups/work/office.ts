// The NINE TO FIVE set's ramps and the office every one of its monologues shares: the beige
// wall with its baseboard, the grey-blue carpet, the drop ceiling with its fluorescent panels,
// the window onto the city.
import { Pixels, rng } from '../../../../kit/pixels';
import { blob, shadeAt } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Pal, Ramp } from '../../art/pal';
import { AIR, BlockBook, SOLID } from '../../common/blocks';
import { addPicture } from '../../common/picture';

export const WORK_RAMPS: Ramp[] = [
  ['beige', 4, [120, 108, 90], [236, 226, 204]],
  ['carpet', 4, [36, 44, 60], [120, 132, 156]],
  ['fluor', 2, [220, 240, 240], [255, 255, 255], undefined, true],
  ['cube', 3, [70, 80, 100], [140, 150, 170]],
  ['daylight', 3, [90, 130, 180], [190, 220, 245]],
  ['blue', 3, [10, 30, 120], [80, 130, 250]],
  ['ink2', 2, [10, 10, 40], [50, 50, 90]],
  // the breakroom's mint tiles
  ['mint', 3, [90, 140, 120], [210, 240, 220]],
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
  book.add('base', officeBase(pal), AIR);
  // carpet (the floor) and under it
  const carpet = (top: boolean) => {
    const p = new Pixels(20, 20);
    const r = rng(top ? 3 : 4);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('carpet', r() < 0.3 ? 1 : 2));
    // the commercial carpet's pattern: little diamonds on a grid, a darker seam between the tiles
    if (top) {
      for (let y = 2; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const dx = Math.abs(((x + 5) % 10) - 5);
          const dy = Math.abs(((y + 5) % 10) - 5);
          if (dx + dy === 2) p.set(x, y, c('carpet', 1));
          else if (dx + dy === 0) p.set(x, y, c('carpet', 3));
        }
      p.rect(0, 0, 20, 2, c('carpet', 3)).rect(0, 2, 20, 1, c('carpet', 0));
    } else for (let x = 0; x < 20; x++) if ((x + 3) % 10 === 0) p.rect(x, 0, 1, 20, c('carpet', 1));
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
  // the same window behind half-drawn blinds, a pull cord down the side
  const blinds = window.crop(0, 0, 20, 20);
  for (let y = 2; y < 12; y++) blinds.rect(2, y, 16, 1, c('white', y % 2 ? 0 : 1));
  blinds.rect(2, 11, 16, 1, c('metal', 1)).rect(1, 1, 18, 1, c('metal', 2)).line(16, 2, 16, 15, c('white', 0)).set(16, 16, c('metal', 2));
  book.add('blinds', blinds, AIR);
  // a motivational poster: a lone peak at sunrise, BELIEVE (he doesn't)
  const poster = officeWall(pal, 6);
  poster.rect(1, 1, 18, 18, c('ink', 0));
  for (let y = 2; y < 13; y++) for (let x = 2; x < 18; x++) poster.set(x, y, shadeAt(R('daylight'), 0, 2, 1 - y / 13, x, y));
  for (let y = 5; y < 13; y++) poster.rect(10 - (y - 5), y, (y - 5) * 2 + 1, 1, c('cube', y < 7 ? 2 : 0));
  poster.rect(9, 5, 3, 1, c('white', 2)).rect(8, 6, 5, 1, c('white', 1));
  poster.line(13, 3, 14, 4, c('ink', 0)).line(14, 4, 15, 3, c('ink', 0));
  micro(poster, 3, 13, 'HOPE', c('gold', 2));
  book.add('poster', poster, AIR);
  // the thermostat nobody may touch, and a light switch
  const thermo = officeWall(pal, 7);
  thermo.rect(6, 6, 8, 6, c('white', 1)).frame(6, 6, 8, 6, c('beige', 0)).rect(8, 8, 4, 2, c('teal', 1)).set(12, 11, c('red', 2));
  thermo.rect(8, 14, 4, 5, c('white', 2)).frame(8, 14, 4, 5, c('beige', 0)).rect(9, 16, 2, 2, c('beige', 1));
  book.add('thermostat', thermo, AIR);
  // a tall potted office plant (two blocks: the leaves, the pot on the baseboard row)
  const plant = new Pixels(20, 40, 255);
  plant.rect(5, 29, 10, 9, c('cube', 1)).rect(4, 28, 12, 2, c('cube', 2)).rect(6, 31, 1, 6, c('cube', 2)).rect(5, 37, 10, 1, c('ink', 1));
  plant.line(10, 28, 9, 8, c('wood', 1)).line(10, 28, 12, 12, c('wood', 1));
  const r = rng(8);
  plant.line(10, 28, 6, 14, c('wood', 1)).line(10, 28, 14, 6, c('wood', 1));
  for (let k = 0; k < 34; k++) {
    const a = r() * Math.PI * 2;
    const d = r() * 8;
    blob(plant, 10 + Math.cos(a) * d * 1.1, 13 + Math.sin(a) * d * 1.3, 3, 1.6, R('green'), 0, 3);
  }
  addPicture(book, 'plant', plant, (_c, row) => (row ? officeBase(pal) : officeWall(pal, 9)), () => AIR);
  // a low credenza along the wall (two blocks, on the baseboard row): drawers, binders, a phone
  const cred = new Pixels(40, 20, 255);
  cred.rect(0, 6, 40, 13, c('wood', 2)).rect(0, 5, 40, 2, c('wood', 4)).rect(0, 18, 40, 2, c('wood', 0));
  for (const x of [1, 14, 27]) cred.frame(x, 8, 12, 9, c('wood', 1)).rect(x + 5, 10, 2, 1, c('metal', 2));
  for (const [x, col] of [[3, 'red'], [6, 'navy'], [9, 'teal'], [12, 'navy']] as const) cred.rect(x, 0, 3, 5, c(col, 1)).rect(x, 1, 3, 1, c('white', 1));
  cred.rect(27, 2, 9, 3, c('grey', 1)).rect(26, 1, 4, 2, c('grey', 0)).rect(33, 1, 4, 2, c('grey', 0)).rect(29, 3, 4, 1, c('grey', 2));
  addPicture(book, 'credenza', cred, officeBase(pal), () => AIR);
}

/** The baseboard row's backdrop (the wall with its baseboard). */
export function officeBase(pal: Pal): Pixels {
  const base = officeWall(pal, 2);
  return base.rect(0, 16, 20, 4, pal.c('cube', 0)).rect(0, 16, 20, 1, pal.c('cube', 1));
}
