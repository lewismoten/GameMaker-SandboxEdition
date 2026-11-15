// SCROLL OR STAY's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and coins.
//
//   1. One Screen: a room 16 blocks wide and 10 high, exactly what the screen shows. The scene's
//      scrolling is off, so the picture never moves. The view starts with Kit in the middle of the
//      screen, which is why his entrance is in the middle of the room. Hedges close the room in.
//   2. The View Follows: a level 60 blocks wide, with scrolling on. The screen shows 16 blocks, and
//      the view slides along as Kit walks.
// Every room is closed in by hedges you can see, so Kit is never stopped by something he can't.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';

export type SignName = 'one' | 'hedge' | 'follows' | 'wide' | 'switch' | 'exit';

/** The block set the levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const texts = {
    one: { rows: [['THIS ROOM IS'], ['ONE SCREEN, SO IT'], ['DOES NOT SCROLL']] },
    hedge: { rows: [['THE HEDGE KEEPS'], ['KIT ON THE SCREEN']] },
    follows: { rows: [['THE VIEW FOLLOWS KIT'], ['WHEN THEY WALK']] },
    wide: { rows: [['THIS LEVEL IS 60'], ['BLOCKS WIDE.'], ['THE SCREEN SHOWS 16']] },
    switch: { rows: [['SCROLLING IS A SWITCH'], ['ON EACH SCENE']] },
    exit: { rows: [['EXIT →']] },
  };
  const colors = {
    background: skyOf(pal),
    paper: pal.c('parch', 3),
    ink: pal.c('ink', 0),
    wood: pal.c('wood', 2),
    highlight: pal.c('wood', 4),
    shadow: pal.c('wood', 0),
  };
  // Only the fixed-screen lesson needs compact letters; the long path has room for larger ones.
  const small = buildTiledSigns(texts, {
    include: ['one', 'hedge'],
    colors,
    compact: true,
    prefix: 'smallSign',
    maxBlocks: Math.min(100, 150 - book.index.size),
  });
  for (const [name, pic] of small.blocks) book.add(name, pic, { grav: PULL.down });
  const large = buildTiledSigns(texts, {
    include: ['follows', 'wide', 'switch', 'exit'],
    colors,
    lettersPerBlock: 3,
    glyphs: { ...MICRO_GLYPHS, '→': '100110111110100' },
    maxBlocks: Math.min(100 - small.blocks.size, 150 - book.index.size),
  });
  for (const [name, pic] of large.blocks) book.add(name, pic, { grav: PULL.down });
  const signs = { ...small.signs, ...large.signs };
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  /** Whether the scene's scrolling is on. */
  scroll: boolean;
  map: StarterMap;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** The screen in blocks: the engine shows 16 across and 10 down, with the hero's start block in the middle. */
export const SCREEN = { w: 16, h: 10 } as const;
/** Level 1: the room is one screen; the ground row, the entrance column and the exit column. */
export const L1 = { ground: 6, start: 8, exit: 14, coins: [6, 7, 13] } as const;
/** Level 2: the ground row, the width, the exit column and the coins along the path. */
export const L2 = { ground: 10, width: 60, exit: 56, coins: [14, 16, 18, 31, 33, 35, 47, 49, 51] } as const;

function scenery(g: Grid, ground: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** Level 1: one screen, closed in by hedges on three sides and the ground below. */
function oneScreen(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(SCREEN.w, SCREEN.h);
  g.row(0, 0, SCREEN.w - 1, 'X')
    .col(0, 0, L1.ground - 1, 'X')
    .col(SCREEN.w - 1, 0, L1.ground - 1, 'X');
  g.row(L1.ground, 0, SCREEN.w - 1, 'G').fill(0, L1.ground + 1, SCREEN.w, 3, 'D');
  g.put(L1.start, L1.ground - 2, 's').put(L1.start, L1.ground - 1, 'S');
  g.put(L1.exit, L1.ground - 2, 'e').put(L1.exit, L1.ground - 1, 'E');
  for (const x of L1.coins) g.put(x, L1.ground - 1, 'c');
  scenery(g, L1.ground, [[6, 1]], [9], [1]);
  const m = new StarterMap(book, g.rows());
  const sky = { set: (x: number, y: number, name: string) => m.setOnSky(x, y, name) };
  stampTiledSign(sky, 1, onGround(L1.ground, signs.one), signs.one);
  // Above the entrance and exit, with a post in the clear space between them.
  stampTiledSign(sky, 8, 2, signs.hedge, 2);
  return m;
}

/** Level 2: a long level, with the sky and the ground carrying on past both ends. */
function theViewFollows(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L2.ground;
  const g = new Grid(L2.width, 15);
  g.row(G, 0, L2.width - 1, 'G').fill(0, G + 1, L2.width, 4, 'D');
  g.col(0, 0, 9, 'X').col(L2.width - 1, 0, 9, 'X');
  // The long path starts on a two-row turf step; the one-screen room stays exact.
  g.put(3, G - 2, 'G').put(3, G - 1, 'D');
  g.put(3, G - 4, 's').put(3, G - 3, 'S');
  g.put(L2.exit, G - 2, 'e').put(L2.exit, G - 1, 'E');
  for (const x of L2.coins) g.put(x, G - 1, 'c');
  scenery(
    g,
    G,
    [
      [8, 2],
      [22, 1],
      [30, 3],
      [42, 1],
      [52, 2],
    ],
    [11, 21, 38, 44],
    [9, 27, 40, 54],
  );
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 6, onGround(G, signs.follows), signs.follows);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 24, onGround(G, signs.wide), signs.wide);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 39, onGround(G, signs.switch), signs.switch);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 51, onGround(G, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'scroll');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'One Screen', hint: 'The picture stays still.', scroll: false, map: oneScreen(book, signs) },
    { file: 'two', title: 'The View Follows', hint: 'A long way to walk.', scroll: true, map: theViewFollows(book, signs) },
  ];
  return { book, pal, levels };
}
