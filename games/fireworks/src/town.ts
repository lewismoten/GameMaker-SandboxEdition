// FIREWORKS' scenery, drawn on the night sky and set in the air (the hero walks in front of all of it):
//   launch.pink, launch.teal  a launcher: a short tube on a wooden crate, with a band of its rocket's color. It is a
//                             block that gives birth to a rocket every few seconds (levels.ts sets which and how often).
//   mortar                    the big fireworks' tube, a wider one on its crate. Only a picture: those rockets are
//                             monsters that never stop (monsters.ts), so this block makes nothing.
//   house.*                   a sleeping town against the sky: rooftops and walls in dark blue-gray, a few warm windows.
//   star.0, star.1            a dim star in the sky; it does not blink, so it never pulls the eye from the bursts.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

const air = { grav: PULL.down };

/** A wooden crate with a tube standing in it, `wide` for the big fireworks; `band` is the ramp of its color band. */
function launcher(pal: Pal, band: string, wide: boolean): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, skyOf(pal));
  // the crate: planks with a dark outline
  p.rect(3, 13, 14, 7, c('wood', 1)).rect(4, 14, 12, 5, c('wood', 2));
  p.rect(4, 16, 12, 1, c('wood', 1)).rect(3, 13, 14, 1, c('wood', 3));
  // the tube, a little tilted light down its left side, open at the top
  const w = wide ? 8 : 6;
  const x = 10 - w / 2;
  p.rect(x, 4, w, 10, c('ink', 0))
    .rect(x + 1, 5, w - 2, 9, c('stone', 1))
    .rect(x + 1, 5, 1, 9, c('stone', 3));
  p.rect(x, 4, w, 1, c('ink', 1)).rect(x + 1, 4, w - 2, 1, c('ink', 0));
  p.rect(x + 1, 8, w - 2, 2, c(band, 2)).rect(x + 1, 8, 1, 2, c(band, 4));
  return p;
}

/** The town's pieces: a wall with windows (some lit), a flat roof line and a peaked roof, all one block each. */
function house(pal: Pal, part: 'wall' | 'wallLit' | 'roof' | 'peakL' | 'peakR' | 'chimney'): Pixels {
  const { c } = pal;
  const sky = skyOf(pal);
  const wall = c('sky', 1);
  const edge = c('sky', 2);
  const p = new Pixels(20, 20, wall);
  const window = (x: number, y: number, lit: boolean) => {
    p.rect(x, y, 4, 5, c('sky', 0));
    if (lit)
      p.rect(x, y, 4, 5, c('gold', 2))
        .rect(x, y, 4, 2, c('gold', 3))
        .set(x + 3, y + 4, c('orange', 2));
  };
  if (part === 'wall' || part === 'wallLit') {
    window(3, 6, part === 'wallLit');
    window(13, 6, false);
  } else if (part === 'roof') {
    p.rect(0, 0, 20, 6, sky).rect(0, 6, 20, 2, edge);
    window(8, 11, false);
  } else if (part === 'chimney') {
    p.rect(0, 0, 20, 6, sky).rect(0, 6, 20, 2, edge).rect(12, 1, 4, 5, wall).rect(11, 0, 6, 2, edge);
    window(4, 11, true);
  } else {
    // half a peaked roof: the slope rises toward the middle of the house (left half: rising to the right)
    p.map((x, y) => {
      const xx = part === 'peakL' ? x : 19 - x;
      const top = 19 - xx;
      return y < top ? sky : y < top + 2 ? edge : wall;
    });
    if (part === 'peakL') window(12, 13, true);
  }
  return p;
}

/** A dim star, a dot and a softer dot, at one of two places in its block. */
function star(pal: Pal, k: number): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const [x, y] = k ? [14, 6] : [5, 12];
  return p.set(x, y, pal.c('white', 1)).set(x + 1, y, pal.c('sky', 5));
}

/** Adds the scenery to a level's block set. */
export function addScenery(book: Book, pal: Pal): void {
  book.add('launch.pink', launcher(pal, 'pink', false), air);
  book.add('launch.teal', launcher(pal, 'teal', false), air);
  book.add('mortar', launcher(pal, 'gold', true), air);
  for (const part of ['wall', 'wallLit', 'roof', 'peakL', 'peakR', 'chimney'] as const) book.add(`house.${part}`, house(pal, part), air);
  book.add('star.0', star(pal, 0), air);
  book.add('star.1', star(pal, 1), air);
}

/** One house's blocks, bottom row first, `w` wide and `h` high (the top row is its roof). */
export function houseRows(w: number, h: number, peaked: boolean, lit: number): string[][] {
  const rows: string[][] = [];
  for (let r = 0; r < h - 1; r++) rows.push(Array.from({ length: w }, (_v, i) => ((i + r * 2 + lit) % 3 === 0 ? 'house.wallLit' : 'house.wall')));
  if (peaked && w === 2) rows.push(['house.peakL', 'house.peakR']);
  else rows.push(Array.from({ length: w }, (_v, i) => (i === w - 1 && lit % 2 ? 'house.chimney' : 'house.roof')));
  return rows;
}
