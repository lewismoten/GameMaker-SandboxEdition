// ROAD TILES' three levels, each its own map and scene, seen from above with gravity off:
//
//   1. Round Corners (one.map, 20 x 15): a road of straights and four round corners, a snake from the top left to a finish line.
//   2. Diagonals (two.map, 24 x 13): a straight road, a bend up onto a diagonal, a bend back to straight, a bend down onto
//      the other diagonal and a last bend to the finish. Each diagonal is a band block with a triangle block beside it.
//   3. Roads and Ground (three.map, 20 x 13): a road across grass, sand and water: a crossroads, a T, a blend block where
//      grass runs into sand, a bridge over water with a shore block at each end, and a finish on the far sand.
import { Book } from '../../kit/starter/book';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { Sign } from '../../kit/starter/sign';
import { addRoadBlocks, addRoadSign } from './blocks';
import { RoadMap } from './overMap';
import type { Grounds } from './roadArt';

export type Spot = [number, number];

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: RoadMap;
  /** Where Kit starts and the finish line he walks to (level blocks). */
  start: Spot;
  finish: Spot;
}

/** [name, words, board width, board height, ground it stands on]. */
const SIGNS = {
  straight: ['straight', 'STRAIGHT PIECES: ACROSS, UP, DOWN', 4, 2, 'grass'],
  corner: ['corner', 'ROUND CORNERS CURVE THE ROAD', 4, 2, 'grass'],
  four: ['four', 'FOUR CORNERS, ONE DRAWING', 4, 2, 'grass'],
  line: ['line', 'SQUARES MAKE A FINISH LINE', 4, 2, 'grass'],
  diag: ['diag', 'A DIAGONAL: CORNER TO CORNER', 4, 2, 'grass'],
  tips: ['tips', 'TRIANGLES FILL THE GAPS', 4, 2, 'grass'],
  bend: ['bend', 'A BEND TURNS ONTO A DIAGONAL', 4, 2, 'grass'],
  steps: ['steps', 'KIT WALKS A DIAGONAL IN STEPS', 4, 2, 'grass'],
  cross: ['cross', 'FOUR WAYS', 3, 2, 'grass'],
  tee: ['tee', 'THREE WAYS, A T', 3, 2, 'grass'],
  blend: ['blend', 'GRASS BLENDS INTO SAND', 3, 2, 'sand'],
  bridge: ['bridge', 'A BRIDGE IS ROAD OVER WATER', 3, 3, 'sand'],
} as const;
type SignName = keyof typeof SIGNS;

export const LEVEL_W = [20, 24, 20];
export const LEVEL_H = [15, 13, 13];
export const START: Spot[] = [
  [1, 2],
  [1, 10],
  [1, 6],
];
export const FINISH: Spot[] = [
  [9, 13],
  [22, 10],
  [19, 6],
];

/** The blocks shown on the title's tile sheet, in reading order. */
export const SHEET = ['corner.se', 'road.h', 'bend.w-ne', 'diag.ne', 'road.v', 'cross', 'road.h.blend', 'bridge'];

/** The block set, then every sign in it. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign>; grounds: Grounds } {
  const book = new Book('bbl');
  const grounds = addRoadBlocks(book, pal);
  const signs = {} as Record<SignName, Sign>;
  for (const [key, [name, words, w, h, ground]] of Object.entries(SIGNS))
    signs[key as SignName] = addRoadSign(book, pal, grounds[ground], ground, name, words, w, h);
  return { book, signs, grounds };
}

/** A level's map: grass inside a ring of trees, with flowers dotted about. */
function meadow(book: Book, w: number, h: number, flowers: Spot[]): RoadMap {
  const m = new RoadMap(book, w, h, 'grass', 'tree');
  m.fill(0, 0, w, 1, 'tree')
    .fill(0, h - 1, w, 1, 'tree')
    .fill(0, 0, 1, h, 'tree')
    .fill(w - 1, 0, 1, h, 'tree');
  for (const [x, y] of flowers) m.put(x, y, 'flower');
  return m;
}

/** Level 1: a snake of straights and the four round corners. */
function cornersLevel(book: Book, s: Record<SignName, Sign>): RoadMap {
  const m = meadow(book, 20, 15, [
    [5, 8],
    [12, 4],
    [17, 11],
    [3, 11],
    [16, 7],
    [17, 12],
  ]);
  const across = (x0: number, x1: number, y: number) => m.fill(x0, y, x1 - x0 + 1, 1, 'road.h');
  const down = (x: number, y0: number, y1: number) => m.fill(x, y0, 1, y1 - y0 + 1, 'road.v');
  across(1, 7, 2);
  m.put(8, 2, 'corner.sw');
  down(8, 3, 4);
  m.put(8, 5, 'corner.ne');
  across(9, 13, 5);
  m.put(14, 5, 'corner.sw');
  down(14, 6, 8);
  m.put(14, 9, 'corner.nw');
  across(10, 13, 9);
  m.put(9, 9, 'corner.se');
  down(9, 10, 12);
  m.put(9, 13, 'finish.v');
  m.sign(3, 4, s.straight, 'grass').sign(10, 1, s.corner, 'grass').sign(15, 1, s.four, 'grass').sign(11, 11, s.line, 'grass');
  return m;
}

/** Level 2: a diagonal up, a diagonal down, and the bends and triangles that make them join. */
function diagonalsLevel(book: Book, s: Record<SignName, Sign>): RoadMap {
  const m = meadow(book, 24, 13, [
    [3, 8],
    [12, 11],
    [21, 3],
    [20, 8],
    [12, 4],
  ]);
  m.fill(1, 10, 4, 1, 'road.h');
  m.put(5, 10, 'bend.w-ne').put(5, 9, 'tip.br').put(6, 10, 'tip.tl');
  // up and right: each step is a band block, a triangle to its right and one above it
  for (let i = 0; i < 3; i++) {
    const x = 6 + i;
    const y = 9 - i;
    m.put(x, y, 'diag.ne')
      .put(x + 1, y, 'tip.tl')
      .put(x, y - 1, 'tip.br');
  }
  m.put(9, 6, 'bend.e-sw');
  m.fill(10, 6, 4, 1, 'road.h');
  m.put(14, 6, 'bend.w-se').put(15, 6, 'tip.bl').put(14, 7, 'tip.tr');
  // down and right: a triangle to the right and one below
  for (let i = 0; i < 3; i++) {
    const x = 15 + i;
    const y = 7 + i;
    m.put(x, y, 'diag.se')
      .put(x + 1, y, 'tip.bl')
      .put(x, y + 1, 'tip.tr');
  }
  m.put(18, 10, 'bend.e-nw');
  m.fill(19, 10, 3, 1, 'road.h');
  m.put(22, 10, 'finish.h');
  m.sign(2, 3, s.diag, 'grass').sign(10, 8, s.tips, 'grass').sign(11, 1, s.bend, 'grass').sign(19, 5, s.steps, 'grass');
  return m;
}

/** Level 3: one road across grass, sand and water, with a crossroads and a T. */
function groundLevel(book: Book, s: Record<SignName, Sign>): RoadMap {
  const m = new RoadMap(book, 20, 13, 'grass', 'tree');
  const cols: [number, number, string][] = [
    [7, 7, 'blend.gs'],
    [8, 11, 'sand'],
    [12, 12, 'shore.sw'],
    [13, 16, 'water'],
    [17, 17, 'shore.ws'],
    [18, 19, 'sand'],
  ];
  for (const [a, b, name] of cols) m.fill(a, 0, b - a + 1, 13, name);
  // the edge: trees on the grass, boulders on the sand (water walls itself)
  for (let x = 0; x < 20; x++) {
    const edge = x <= 7 ? 'tree' : m.at(x, 0) === 'sand' ? 'boulder' : m.at(x, 0);
    m.put(x, 0, edge).put(x, 12, edge);
  }
  for (let y = 0; y < 13; y++) m.put(0, y, 'tree').put(19, y, 'boulder');
  for (const [x, y] of [
    [2, 3],
    [2, 9],
    [6, 11],
  ] as Spot[])
    m.put(x, y, 'flower');
  // the road across, row 6
  m.fill(1, 6, 2, 1, 'road.h').put(3, 6, 'cross').fill(4, 6, 3, 1, 'road.h').put(7, 6, 'road.h.blend');
  m.fill(8, 6, 2, 1, 'road.h.sand').put(10, 6, 'road.h.sand').put(11, 6, 'tee').put(12, 6, 'bridge.sw');
  m.fill(13, 6, 4, 1, 'bridge').put(17, 6, 'bridge.ws').put(18, 6, 'road.h.sand').put(19, 6, 'finish.sand');
  // the road up and down at the crossroads, and the T's way south
  m.fill(3, 1, 1, 5, 'road.v').fill(3, 7, 1, 5, 'road.v');
  m.fill(11, 7, 1, 5, 'road.v.sand');
  m.sign(4, 2, s.cross, 'grass').sign(4, 8, s.tee, 'grass').sign(8, 1, s.blend, 'sand').sign(8, 8, s.bridge, 'sand');
  return m;
}

/** The block set, the palette and the three levels. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const maps = [cornersLevel(book, signs), diagonalsLevel(book, signs), groundLevel(book, signs)];
  const meta = [
    ['one', 'Round Corners', 'Straights and curves.'],
    ['two', 'Diagonals', 'Corner to corner.'],
    ['three', 'Road and Ground', 'Grass, sand and water.'],
  ];
  const levels: Level[] = meta.map(([file, title, hint], i) => ({ file, title, hint, map: maps[i], start: START[i], finish: FINISH[i] }));
  return { book, pal, levels };
}
