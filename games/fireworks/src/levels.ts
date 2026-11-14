// FIREWORKS' two levels, painted on a Grid (see games/kit/starter/map.ts for the letters), with one block set
// (fw.bbl) for both: the Starter blocks, the signs and the scenery (town.ts).
//
//   1. Launch!: a night field with two launchers. A launcher is a block that gives birth to a rocket every few
//      seconds, the pink one every 70 ticks and the teal one every 97, so they rarely go up together. A rocket is a
//      monster on a path up; when the path ends it turns into a small burst, which falls a block and is gone. Enter
//      launches a rocket of your own.
//   2. The Big Show: the same field at the edge of a sleeping town, with three big fireworks (a ring, a peony and a
//      willow), each nine monsters in a square that turn from rocket into burst and back for as long as you watch,
//      and two small launchers between them.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { BIGS, CELLS, CLIMB, ROCKET, ROCKET_TEAL, bigMonsters } from './monsters';
import { nightPalette } from './night';
import { addScenery, houseRows } from './town';

/** Ticks between rockets: each launcher keeps its own time. */
export const EVERY = { pink: 70, teal: 97 } as const;

const WORDS = {
  launcher: { rows: [['LAUNCHERS ARE'], ['BLOCKS THAT'], ['MAKE ROCKETS']] },
  top: { rows: [['AT THE TOP THE'], ['ROCKET TURNS'], ['INTO A BURST']] },
  own: { rows: [['EACH LAUNCHER'], ['KEEPS ITS'], ['OWN TIME']] },
  enter: { rows: [['PRESS ENTER'], ['TO LAUNCH ONE']] },
  nine: { rows: [['9 MONSTERS IN'], ['STEP MAKE'], ['1 BIG BURST']] },
  back: { rows: [['THE BURST TURNS'], ['BACK INTO'], ['ITS ROCKET']] },
  shapes: { rows: [['ALL THREE WORK'], ['THE SAME. ONLY'], ['THE PICTURES'], ['DIFFER']] },
} as const;
export type SignName = keyof typeof WORDS;

/** The ground's top row in both levels: signs, launchers and the hero stand on the row above it. */
export const GROUND = 11;
const onGround = (s: Sign) => GROUND - 1 - s.board.length;

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  /** The launchers' columns, for the checks. */
  launchers: { x: number; color: 'pink' | 'teal' }[];
  /** The big fireworks' middle columns (level 2), in BIGS order. */
  bigs: number[];
}

/** The block set both levels share. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addScenery(book, pal);
  const { blocks, signs } = buildTiledSigns(WORDS, {
    colors: {
      background: skyOf(pal),
      paper: pal.c('parch', 3),
      ink: pal.c('ink', 0),
      wood: pal.c('wood', 2),
      highlight: pal.c('wood', 4),
      shadow: pal.c('wood', 0),
    },
    lettersPerBlock: 3,
    maxBlocks: Math.min(100, 150 - book.index.size),
  });
  for (const [name, pic] of blocks) book.add(name, pic, { grav: PULL.down });
  return { book, signs };
}

/**
 * A field `width` blocks wide: ground, hedges at both ends, the exit door at `exitX`, and the entrance on a low mound
 * two blocks up with a step down. The screen starts centered on the hero and only follows them up or down once they are
 * 60 pixels from the middle, so starting two blocks up keeps two more rows of sky in view all the way along.
 */
function field(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 3, 'D');
  g.row(GROUND - 2, 1, 5, 'G')
    .row(GROUND - 1, 1, 5, 'D')
    .put(6, GROUND - 1, 'G');
  g.col(0, 0, GROUND - 1, 'X').col(width - 1, 0, GROUND - 1, 'X');
  g.put(3, GROUND - 4, 's').put(3, GROUND - 3, 'S');
  g.put(exitX, GROUND - 2, 'e').put(exitX, GROUND - 1, 'E');
  return g;
}

/** A few dim stars, high up and away from where the bursts go. */
function stars(m: StarterMap, at: [number, number][]): void {
  at.forEach(([x, y], i) => m.set(x, y, `star.${i % 2}`));
}

/** Keep the town, launchers and doors intact beneath and beside the signs. */
function board(m: StarterMap, x: number, y: number, s: Sign, postHeight = 1): void {
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, x, y, s, postHeight);
}

/** Level 1: 44 blocks wide; two launchers with their own times. */
function launch(book: Book, signs: Record<SignName, Sign>): Level {
  const g = field(44, 40);
  for (const x of [21, 31, 38]) g.put(x, GROUND - 1, 'b');
  for (const x of [7, 13, 33]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  const launchers = [
    { x: 14, color: 'pink' as const },
    { x: 24, color: 'teal' as const },
  ];
  for (const l of launchers) m.set(l.x, GROUND - 1, `launch.${l.color}`);
  board(m, 8, onGround(signs.launcher), signs.launcher);
  board(m, 16, onGround(signs.top), signs.top);
  board(m, 26, onGround(signs.own), signs.own);
  board(m, 36, onGround(signs.enter) - 1, signs.enter, 2);
  stars(m, [
    [2, 1],
    [11, 2],
    [20, 1],
    [31, 2],
    [38, 1],
  ]);
  return { file: 'one', title: 'Launch!', hint: 'A block that makes rockets.', map: m, launchers, bigs: [] };
}

/** Level 2: 66 blocks wide; three big fireworks over a town, two small launchers between them. */
function bigShow(book: Book, signs: Record<SignName, Sign>): Level {
  const g = field(66, 62);
  const m = new StarterMap(book, g.rows());
  // the town along the back: houses of different heights, with gaps between some
  const houses: [number, number, number, boolean][] = [
    [12, 2, 3, true],
    [14, 2, 2, false],
    [19, 3, 3, false],
    [22, 2, 2, true],
    [37, 2, 3, true],
    [39, 3, 2, false],
    [54, 3, 3, false],
    [57, 2, 2, true],
  ];
  houses.forEach(([x, w, h, peaked], i) =>
    houseRows(w, h, peaked, i).forEach((row, r) =>
      row.forEach((name, dx) => {
        if (x + dx < 65) m.set(x + dx, GROUND - 1 - r, name);
      }),
    ),
  );
  const bigs = [17, 35, 53];
  for (const x of bigs) m.set(x, GROUND - 1, 'mortar');
  const launchers = [
    { x: 26, color: 'pink' as const },
    { x: 44, color: 'teal' as const },
  ];
  for (const l of launchers) m.set(l.x, GROUND - 1, `launch.${l.color}`);
  // the big fireworks start as their flights, where a burst ends: `fall` blocks under the top of the climb
  BIGS.forEach((big, b) => CELLS.forEach(([dx, dy], cell) => m.mon(bigMonsters(b, cell).flight, bigs[b] + dx, GROUND - 1 - CLIMB + big.fall + dy)));
  board(m, 5, onGround(signs.nine) - 1, signs.nine, 2);
  board(m, 27, onGround(signs.back), signs.back);
  board(m, 45, onGround(signs.shapes), signs.shapes);
  stars(m, [
    [3, 1],
    [10, 2],
    [25, 1],
    [30, 2],
    [44, 1],
    [61, 2],
  ]);
  return { file: 'two', title: 'The Big Show', hint: 'Nine monsters, one burst.', map: m, launchers, bigs };
}

/** The palette, the block set and the levels in order. */
export function buildLevels(): { pal: Pal; book: Book; levels: Level[] } {
  const pal = nightPalette();
  const { book, signs } = buildBlocks(pal);
  return { pal, book, levels: [launch(book, signs), bigShow(book, signs)] };
}

/** The finished block set: each launcher given its rocket and its time. */
export function finishBlocks(book: Book) {
  const blocks = book.finish();
  blocks[book.n('launch.pink')].birthMon = ROCKET;
  blocks[book.n('launch.pink')].birthTime = EVERY.pink;
  blocks[book.n('launch.teal')].birthMon = ROCKET_TEAL;
  blocks[book.n('launch.teal')].birthTime = EVERY.teal;
  return blocks;
}
