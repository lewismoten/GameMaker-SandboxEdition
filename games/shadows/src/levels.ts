// LITTLE SHADOWS' three rooms, each a courtyard: a stone wall at the back, a strip of ground in front of it (the "lane") that
// Kit and the critters stand in, and solid ground below. Standing in the lane's bottom edge puts a character's feet low in
// the picture, which leaves room under them for a shadow.
//
//   1  The Yard    three kinds of ground (sand, grass, dark soil), a walking pip on each. It is ONE map file (yard.map),
//                  used by two scenes: one with solid shadows (its own character and monster pictures and signs), one with
//                  dithered shadows. The map is the same; only the pictures differ.
//   2  The Hop     three pips hop on the spot: no shadow, a shadow that never changes, a shadow that shrinks and grows.
//   3  The Hover   two bees: a shadow in a block of its own right under the bee, and one a good way down.
import { MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { CRITTER } from './critters';
import { addYardBlocks, wallColor, type Ground } from './blocks';
import { SIGNS, type Look } from './text';

/** The lane row (where feet are) and the first solid row. */
export const LANE = 9;
export const FLOOR = 10;
const H = 15;
export const WALL_TOP = 3;

export interface Level {
  file: string;
  title: string;
  map: StarterMap;
  book: Book;
  /** The x of the entrance's door and of the exit's door (level blocks). */
  from: number;
  exit: number;
  /** The grounds, left to right, with the x each begins at. */
  grounds: { ground: Ground; x: number }[];
}

/** The yard's landmarks (level blocks): where each ground begins, the pips' starting blocks and the exit. */
export const YARD = {
  width: 42,
  grounds: [
    { ground: 'sand', x: 1 },
    { ground: 'grass', x: 14 },
    { ground: 'soil', x: 28 },
  ] as { ground: Ground; x: number }[],
  pips: [6, 18, 31],
  run: 4,
  exit: 38,
};
export const HOP = { width: 40, hoppers: [12, 20, 28] as const, exit: 36 };
export const HOVER = { width: 38, low: 11, high: 24, run: 4, exit: 34 };

function bookFor(pal: Pal, signs: Record<string, [string, number, number]>): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addYardBlocks(book, pal);
  const onWall = { ...pal, c: (n: string, k: number) => (n === 'sky' && k === 3 ? wallColor(pal) : pal.c(n, k)) };
  const out: Record<string, Sign> = {};
  for (const [k, [text, w, h]] of Object.entries(signs)) out[k] = addSign(book, onWall, `${k}.sign`, text, w, h);
  return { book, signs: out };
}

/** A StarterMap whose end walls carry on past the room's edges, so the screen never shows sky beside them. */
class Courtyard extends StarterMap {
  constructor(
    private readonly bricks: Book,
    rows: string[],
  ) {
    super(bricks, rows);
  }
  done(): GameMap {
    const map = super.done();
    const brick = this.bricks.n('brick');
    for (let y = ORIGIN + WALL_TOP; y < MLEN; y++) for (let x = 0; x < MLEN; x++) if (x < ORIGIN || x >= ORIGIN + this.width) map.blocks[y * MLEN + x] = brick;
    return map;
  }
}

/** The courtyard: sky and clouds above the wall, doors in the end walls, the lane and the floor, in these grounds. */
function courtyard(book: Book, width: number, grounds: { ground: Ground; x: number }[], exit: number): StarterMap {
  const g = new Grid(width, H);
  g.col(0, WALL_TOP, H - 1, 'B').col(width - 1, WALL_TOP, H - 1, 'B');
  g.put(3, LANE - 1, 's').put(3, LANE, 'S');
  g.put(exit, LANE - 1, 'e').put(exit, LANE, 'E');
  for (const [x, y] of [
    [6, 0],
    [20, 1],
    [33, 0],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  const m = new Courtyard(book, g.rows());
  for (let x = 1; x < width - 1; x++) {
    m.set(x, WALL_TOP, 'wallCap');
    for (let y = WALL_TOP + 1; y < LANE; y++) m.set(x, y, 'wall');
    const ground = [...grounds].reverse().find((s) => x >= s.x)?.ground ?? grounds[0].ground;
    m.set(x, LANE, `lane.${ground}`);
    for (let y = FLOOR; y < H; y++) m.set(x, y, `floor.${ground}`);
  }
  m.set(3, LANE - 1, 'doorwayTopW').set(3, LANE, `doorwayBottom.${grounds[0].ground}`);
  m.set(exit, LANE - 1, 'doorTopW').set(exit, LANE, `doorBottom.${grounds[grounds.length - 1].ground}`);
  return m;
}

const board = (m: StarterMap, s: Sign, x: number, y: number) => s.board.forEach((row, dy) => row.forEach((name, dx) => m.set(x + dx, y + dy, name)));

/** The yard, with the signs that say how its shadows are painted (`look` is 'solid' or 'dither'). */
export function yard(pal: Pal, look: Look): Level {
  const { book, signs } = bookFor(pal, SIGNS.yard[look]);
  const m = courtyard(book, YARD.width, YARD.grounds, YARD.exit);
  board(m, signs.start, 4, 4);
  board(m, signs.sand, 9, 4);
  board(m, signs.grass, 19, 4);
  board(m, signs.soil, 31, 4);
  board(m, signs.next, YARD.exit - 1, 4);
  for (const x of YARD.pips) m.mon(CRITTER.pip, x, LANE);
  return { file: 'yard', title: 'The Yard', map: m, book, from: 3, exit: YARD.exit, grounds: YARD.grounds };
}

/** The hop: three pips on the spot. */
export function hop(pal: Pal): Level {
  const { book, signs } = bookFor(pal, SIGNS.hop);
  const grounds: { ground: Ground; x: number }[] = [{ ground: 'grass', x: 1 }];
  const m = courtyard(book, HOP.width, grounds, HOP.exit);
  board(m, signs.start, 5, 4);
  [signs.none, signs.same, signs.shrink].forEach((s, i) => board(m, s, HOP.hoppers[i] - 1, 4));
  board(m, signs.next, HOP.exit - 1, 4);
  [CRITTER.hopNone, CRITTER.hopSame, CRITTER.hopShrink].forEach((n, i) => m.mon(n, HOP.hoppers[i], LANE));
  return { file: 'hop', title: 'The Hop', map: m, book, from: 3, exit: HOP.exit, grounds };
}

/** The hover: two bees, each with a shadow block below. */
export function hover(pal: Pal): Level {
  const { book, signs } = bookFor(pal, SIGNS.hover);
  const grounds: { ground: Ground; x: number }[] = [{ ground: 'sand', x: 1 }];
  const m = courtyard(book, HOVER.width, grounds, HOVER.exit);
  board(m, signs.start, 5, 4);
  board(m, signs.low, HOVER.low, 4);
  board(m, signs.high, HOVER.high, 4);
  board(m, signs.next, HOVER.exit - 1, 4);
  // the low bee is the block right above its shadow's; the high one is three blocks up
  m.mon(CRITTER.bee, HOVER.low, LANE - 1).mon(CRITTER.shade, HOVER.low, LANE);
  m.mon(CRITTER.bee, HOVER.high, LANE - 3).mon(CRITTER.shade, HOVER.high, LANE);
  return { file: 'hover', title: 'The Hover', map: m, book, from: 3, exit: HOVER.exit, grounds };
}

/** The whole game's rooms (the yard in both looks). */
export function buildLevels(): { pal: Pal; yardSolid: Level; yardDither: Level; hop: Level; hover: Level } {
  const pal = buildStarterPalette();
  return { pal, yardSolid: yard(pal, 'solid'), yardDither: yard(pal, 'dither'), hop: hop(pal), hover: hover(pal) };
}

/** Where the wall's blocks end and the lane begins, in pixels from a block's top: feet sit on the lane's bottom edge. */
export const WORLD = ORIGIN;
