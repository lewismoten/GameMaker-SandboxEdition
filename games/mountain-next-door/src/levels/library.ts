// Level 5, THE LIBRARY (late morning, indoors): the footprints pass the library, where the mountain's step knocked
// the book drop flat in the night and scattered the overdue books all through the building. Mrs. Lin waves Tess in.
// Four floors of tall shelves, joined by rolling ladders at alternate ends. Take each book (one or several) to a
// gap on a shelf and it goes back. The top floor has the old almanac, open on stands: three pages on mountains and
// their clouds, the first hint of what Old Mossback is missing. The book return chute drops Tess back to the ground
// floor, where the last three gaps wait.

import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';
import { TRAIL } from '../monsters';

/** The four floors, bottom to top (the ground floor is solid boards; the others are planks). */
export const LFLOORS = [30, 23, 16, 9] as const;

export const LIBRARY_AT = {
  /** The ladder up from floor k to floor k + 1. */
  ladders: [80, 6, 80],
  /** The book return chute: a hole in each upper floor down to the ground. */
  chute: 83,
  /** Books: [floor, column]; gaps on the shelves: [floor, column]. */
  books: [
    [1, 62],
    [1, 24],
    [2, 42],
    [3, 72],
    [3, 50],
    [3, 14],
  ],
  gaps: [
    [1, 34],
    [2, 25],
    [2, 64],
    [0, 66],
    [0, 48],
    [0, 30],
  ],
  desk: 7,
  lin: 11,
  exit: 1,
  windows: [
    [0, 38],
    [1, 44],
    [2, 52],
    [3, 26],
  ],
  signs: { lin: [0, 13], overdue: [1, 66], page1: [3, 58], page2: [3, 36], page3: [3, 17], chute: [3, 76] },
} as const;

const SIGNS = {
  lin: ['MRS. LIN: IT DOES NOT EVEN HAVE A LIBRARY CARD.', 4, 4],
  page1: ['ALMANAC: EVERY MOUNTAIN KEEPS A CLOUD ON TOP.', 4, 4],
  page2: ['A CLOUDLESS MOUNTAIN CANNOT SIT STILL.', 4, 3],
} as const;

/** Columns on each floor kept clear of shelves (wall shows there): for the ladders, the window, the signs, the books. */
const OPEN: readonly (readonly [number, number])[][] = [
  [
    [1, 17],
    [36, 41],
    [77, 84],
  ],
  [
    [3, 9],
    [22, 26],
    [42, 47],
    [60, 70],
    [78, 84],
  ],
  [
    [3, 9],
    [40, 44],
    [50, 55],
    [77, 84],
  ],
  [
    [12, 22],
    [24, 29],
    [34, 40],
    [48, 52],
    [56, 63],
    [70, 84],
  ],
];

export function levelLibrary(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'library']);
  const s = addSigns(book, pal, SIGNS);
  const W = 86;
  const L = LIBRARY_AT;
  const [f0] = LFLOORS;
  const g = new Grid(W, f0 + 4);
  g.row(f0, 0, W - 1, 'G').fill(0, f0 + 1, W, 3, 'D');
  g.col(0, 0, f0 - 1, 'B').col(W - 1, 0, f0 - 1, 'B');
  for (const f of LFLOORS.slice(1)) g.row(f, 1, W - 2, '=');
  g.put(3, f0 - 2, 's').put(3, f0 - 1, 'S');
  g.put(L.exit, f0 - 2, 'e').put(L.exit, f0 - 1, 'E');
  L.ladders.forEach((x, k) => g.col(x, LFLOORS[k + 1] - 1, LFLOORS[k] - 1, 'H'));
  for (const f of LFLOORS.slice(1)) g.put(L.chute, f, ' ').put(L.chute + 1, f, ' ');
  const m = new MountainMap(book, g.rows());
  // the floorboards, and the ceiling above the top floor
  for (let x = 1; x < W - 1; x++) m.set(x, f0, x % 3 ? 'floor' : 'floor2');
  // the shelves: five rows of books over each floor, but for its open stretches
  LFLOORS.forEach((f, k) => {
    for (let x = 1; x < W - 1; x++) {
      if (OPEN[k].some(([a, b]) => x >= a && x <= b) || x === L.chute || x === L.chute + 1) continue;
      for (let y = f - 5; y < f; y++) if (g.rows()[y][x] === ' ') m.set(x, y, `shelf${(x * 5 + y * 3 + ((x * y) % 7)) % 6}`);
    }
  });
  for (const [k, x] of L.windows) for (let i = 0; i < 6; i++) m.set(x + (i % 2), LFLOORS[k] - 6 + Math.floor(i / 2), `win${i}`);
  for (const [k, x] of L.books) m.set(x, LFLOORS[k] - 1, 'book');
  for (const [k, x] of L.gaps) m.set(x, LFLOORS[k] - 2, 'gap');
  m.set(L.desk, f0 - 1, 'deskL')
    .set(L.desk + 1, f0 - 1, 'deskM')
    .set(L.desk + 2, f0 - 1, 'deskR');
  m.mon(TRAIL.lin, L.lin, f0 - 2).mon(TRAIL.lin + 1, L.lin, f0 - 1);
  m.mon(TRAIL.nutShort, 46, LFLOORS[2] - 1);
  for (const k of Object.keys(s) as (keyof typeof s)[]) {
    const [floor, x] = L.signs[k];
    m.sign(x, onGround(LFLOORS[floor], s[k]), s[k]);
  }
  return {
    file: 'books',
    title: 'The Library',
    hint: 'Put every book back. Read the almanac.',
    look: 'library',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'theme',
  };
}
