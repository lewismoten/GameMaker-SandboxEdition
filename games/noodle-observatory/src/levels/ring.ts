// Chapter 2, PANTRY ORBIT: three tall pantry shafts Nell rides up in the pasta ring (ring.chr: it rolls uphill by
// itself; the arrows steer). Six rows of cupboard fronts cross each shaft, each with a three-block gap; bumping a
// front only stops the ring until it is steered round. Star washers sit along the way to each gap. At the top, the
// docking shelf (any of its six blocks) leads on.
//   roundway  the first two gaps are easy, the rest swing left and right
//   narrow    the gaps zigzag across the whole shaft
//   uphill    wide swings with stairs painted along the fronts, the window's moon in view
import { ORIGIN } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { castShadows, varyWalls } from '../dress';
import { addSigns, startBook, type Level } from '../level';
import type { LookName } from '../palette';
import { Place } from '../place';
import type { SongName } from '../song';

export const SHAFT = { width: 24, height: 70, start: [11, 67] as [number, number], rows: [58, 49, 40, 31, 22, 13], dock: 5, gap: 3 } as const;

interface Shaft {
  file: string;
  title: string;
  hint: string;
  look: LookName;
  /** The first column of each row's gap, bottom row first. */
  gaps: number[];
  /** How many washers to put on the way (between the rows, on the line from gap to gap). */
  washers: number[];
  signs: Record<string, readonly [string, number, number]>;
  /** Where each sign's board goes (top-left), and the window. */
  signAt: Record<string, [number, number]>;
  window: [number, number];
  /** Where the shaft is (the pantry unless said) and its song. */
  place?: 'pantry' | 'bakery';
  song?: SongName;
}

export const SHAFTS: Shaft[] = [
  {
    file: 'roundway',
    title: 'Uphill. Of Course.',
    hint: 'The ring rolls up. Steer!',
    look: 'pantry',
    gaps: [10, 6, 10, 14, 10, 10],
    washers: [61, 53, 44, 35, 26, 17],
    signs: { up: ['THE RING ROLLS UPHILL BY ITSELF.', 4, 3], steer: ['STEER WITH LEFT AND RIGHT.', 4, 2] },
    signAt: { up: [3, 62], steer: [16, 63] },
    window: [17, 8],
  },
  {
    file: 'narrow',
    title: 'Zigzag Pantry',
    hint: 'Gaps left, gaps right.',
    look: 'pantry',
    gaps: [4, 15, 7, 14, 4, 10],
    washers: [53, 35, 26, 17],
    signs: { zig: ['THE GAPS ZIGZAG. STEER EARLY.', 4, 3] },
    signAt: { zig: [16, 62] },
    window: [17, 26],
  },
  {
    file: 'uphill',
    title: 'Top Shelf',
    hint: 'Dock at the top.',
    look: 'pantry',
    gaps: [14, 5, 14, 5, 10, 10],
    washers: [61, 53, 44, 35, 26, 17],
    signs: { top: ['THE BEST VIEW IS FROM THE TOP SHELF.', 4, 3] },
    signAt: { top: [3, 62] },
    window: [4, 8],
  },
  {
    file: 'larder',
    title: 'The Larder Shelf',
    hint: 'The last shaft. Steer hard.',
    look: 'pantry',
    gaps: [3, 16, 6, 15, 4, 12],
    washers: [51, 42, 33, 24, 15],
    signs: { last: ['THE LAST SHAFT. NOBODY SAYS THIS IS NORMAL.', 4, 4] },
    signAt: { last: [3, 61] },
    window: [17, 20],
  },
  {
    file: 'chute',
    title: 'The Flour Chute',
    hint: 'Up to the drying rack.',
    look: 'bakery',
    place: 'bakery',
    song: 'oven',
    gaps: [4, 15, 9, 3, 16, 10],
    washers: [51, 42, 33, 24, 15],
    signs: { chute: ['THE FLOUR CHUTE. THE RING HAS DONE THIS BEFORE.', 4, 3] },
    signAt: { chute: [3, 62] },
    window: [17, 30],
  },
];

/** The column the ring aims for at each row, bottom to top: the start, then the middle of each gap. */
export function shaftPath(s: Shaft): [number, number][] {
  const pts: [number, number][] = [[SHAFT.start[1], SHAFT.start[0]]];
  SHAFT.rows.forEach((row, i) => {
    const c = s.gaps[i] + 1;
    pts.push([row + 3, c], [row - 1, c]);
  });
  pts.push([SHAFT.dock, 11]);
  return pts;
}

/** The path's column at a row (straight lines between its points). */
export function pathAt(path: [number, number][], y: number): number {
  for (let i = 0; i + 1 < path.length; i++) {
    const [y0, x0] = path[i];
    const [y1, x1] = path[i + 1];
    if (y <= y0 && y >= y1) return y0 === y1 ? x1 : x0 + ((x1 - x0) * (y0 - y)) / (y0 - y1);
  }
  return path[path.length - 1][1];
}

export function buildShaft(pal: Pal, s: Shaft): Level {
  const { book, timed } = startBook(pal, s.place ?? 'pantry', { still: true });
  const signs = addSigns(book, pal, s.signs);
  // signs here hang on the still air too (the ring would be pulled down passing in front of one)
  const blocks = book.finish();
  for (const name of book.index.keys()) if (name.startsWith('sign')) blocks[book.n(name)].grav = 0;
  const { width: W, height: H } = SHAFT;
  const m = new Place(book, W, H, 'wall', 'wall');
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = (x * 7 + y * 13) % 11;
      m.set(x, y, x < 3 || x >= W - 3 || y < SHAFT.dock - 1 || y >= H - 2 ? 'wall' : v === 3 ? 'bg1' : v === 7 ? 'bg2' : v === 9 ? 'bg3' : 'bg');
    }
  // the cupboard fronts across the shaft, each with its gap
  SHAFT.rows.forEach((row, i) => {
    for (let x = 3; x < W - 3; x++) if (x < s.gaps[i] || x >= s.gaps[i] + SHAFT.gap) m.set(x, row, 'wall');
  });
  // the docking shelf at the top: six blocks, any of them leads on
  for (let x = 9; x <= 14; x++) {
    m.set(x, SHAFT.dock - 1, 'outTop');
    m.exit(x, SHAFT.dock, false);
    m.set(x, SHAFT.dock, 'outBot');
  }
  m.set(s.window[0], s.window[1], 'win0')
    .set(s.window[0] + 1, s.window[1], 'win1moon')
    .set(s.window[0], s.window[1] + 1, 'win2')
    .set(s.window[0] + 1, s.window[1] + 1, 'win3');
  for (const [k, [x, y]] of Object.entries(s.signAt)) {
    const sg = signs[k];
    sg.board.forEach((row, dy) => row.forEach((name, dx) => m.set(x + dx, y + dy, name)));
  }
  const path = shaftPath(s);
  for (const y of s.washers) m.set(Math.round(pathAt(path, y)), y, 'washer');
  // cupboard fronts of mixed kinds, each row of fronts casting its shadow
  castShadows(m, ['wall'], 3, W - 4, 1, H - 1);
  varyWalls(m, -ORIGIN, W + ORIGIN, -ORIGIN, H + ORIGIN);
  m.start = [SHAFT.start[0] + ORIGIN, SHAFT.start[1] + ORIGIN];
  m.set(SHAFT.start[0], SHAFT.start[1], 'inBot').set(SHAFT.start[0], SHAFT.start[1] - 1, 'inTop');
  return { file: s.file, title: s.title, hint: s.hint, look: s.look, map: m, book, timed, mon: 'kitchen', song: s.song ?? 'orbit', hero: 'ring' };
}
