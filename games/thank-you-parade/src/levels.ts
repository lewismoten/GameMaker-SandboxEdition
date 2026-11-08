// The seven levels in order, each printed on its own paper: the same inks on another stock for each hour of the parade
// morning (a dawn pink, a windy gray, the airstrip's butter yellow, the hall's warm buff, a mint for the drum-off,
// plain cream for the route and a gold for ten o'clock).
import { printPalette, swap, type Pal, type Ramp } from './print';
import { type Level } from './lay';
import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';
import { level4 } from './level4';
import { level5 } from './level5';
import { level6 } from './level6';
import { level7 } from './level7';
import { baseBook, type PBook } from './base';
import { addBandArch, addPark } from './park';
import { addCard, addFlags, addNeighbors, addStreet } from './town';

export type { Level } from './lay';

/** Each level's paper: [darkest, lightest, middle] of the sky ramp (shade 3, the lightest, is the paper itself). */
const PAPERS: (Ramp | undefined)[] = [
  [4, [206, 150, 132], [252, 222, 204], [236, 188, 168]], // dawn
  [4, [150, 160, 170], [226, 230, 228], [196, 202, 204]], // windy gray
  [4, [214, 182, 96], [252, 240, 186], [238, 214, 140]], // the airstrip
  [4, [196, 160, 120], [242, 222, 192], [222, 192, 156]], // the fire hall
  [4, [150, 190, 170], [216, 238, 222], [186, 216, 198]], // mint
  undefined, // cream
  [4, [214, 162, 80], [252, 226, 162], [238, 196, 120]], // ten o'clock gold
];

/** The base palette and the levels. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = printPalette();
  const built = [level1, level2, level3, level4, level5, level6, level7].map((make, i) => {
    const paper = PAPERS[i];
    return make(paper ? swap(pal, { sky: paper }) : pal);
  });
  return { pal, levels: built };
}

/** One block set with every picture the title and the cartoons draw from (never on the disk). */
export function galleryBook(pal: Pal): PBook {
  const book = baseBook(pal);
  addStreet(book, pal);
  addFlags(book, pal);
  addCard(book, pal);
  addNeighbors(book, pal);
  addPark(book, pal);
  addBandArch(book, pal);
  return book;
}
