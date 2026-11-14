// SMASH IT's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, crates and gems.
//
//   1. Bump a Crate: two walls of crates across the path. Walk into one and the crates you touch
//      turn to rubble; the ones above Yana's head stay, so only what you touch breaks.
//   2. Coins Pay Once: a coin whose "becomes" is itself pays every tick Yana stands in it and never goes
//      (the mistake), then ordinary coins that become air and pay once, then a crate wall to the exit.
//   3. Spinning Gems: gems that turn in four frames. Every frame has the same touch, so a gem goes
//      whichever frame it is caught in. A crate wall hides a stack of them.
// Every room is closed in by hedges you can see, so Yana is never stopped by something she can't.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { addBreakBlocks } from './breakBlocks';

export type SignName = 'bump' | 'rubble' | 'again' | 'once' | 'wall' | 'spin' | 'frames' | 'hidden' | 'exit';

/** Each map's block set: shared gameplay blocks followed by its selected signs. */
function buildBlocks(pal: Pal, include: readonly SignName[]): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addBreakBlocks(book, pal);
  const { blocks, signs } = buildTiledSigns(
    {
      bump: { rows: [['BUMP A CRATE AND IT BECOMES RUBBLE']] },
      rubble: { rows: [['ONLY WHAT YOU TOUCH BREAKS'], ['RUBBLE IS A BLOCK TOO. WALK ON']] },
      again: { rows: [['A COIN THAT STAYS A COIN'], ['PAYS AGAIN AND AGAIN']] },
      once: { rows: [['A COIN THAT BECOMES AIR PAYS ONCE']] },
      wall: { rows: [['BREAK THE WALL TO THE EXIT']] },
      spin: { rows: [['A SPINNING GEM IS FOUR BLOCKS IN A LOOP']] },
      frames: { rows: [['EACH FRAME BECOMES AIR']] },
      hidden: { rows: [['MORE GEMS BEHIND THE CRATES']] },
      exit: { rows: [['EXIT →']] },
    },
    {
      colors: {
        background: skyOf(pal),
        paper: pal.c('parch', 3),
        ink: pal.c('ink', 0),
        wood: pal.c('wood', 2),
        highlight: pal.c('wood', 4),
        shadow: pal.c('wood', 0),
      },
      glyphs: { ...MICRO_GLYPHS, '→': '100110111110100' },
      lettersPerBlock: 3,
      include,
      maxBlocks: 100 - book.index.size,
    },
  );

  for (const [name, pic] of blocks) book.add(name, pic, { grav: PULL.down });
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  book: Book;
}

export const GROUND = 10;
/** Where each level's crate walls, stuck coins and gems are (columns), for the bot's route and the shots. */
export const L1 = { wallA: 16, wallB: 27, wallBWidth: 2, rows: 4 } as const;
export const L2 = { stuck: [15, 16, 17], wall: 38 } as const;
export const L3 = { gems: [13, 15, 17, 19, 21], wall: 32, stack: [35, 36] } as const;

/** The ground, the side walls, the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Stamps a block of crates, `w` wide and `h` high, standing on the ground at column `x`. */
function crates(m: StarterMap, x: number, w: number, h: number): void {
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) m.setOnSky(x + i, GROUND - 1 - j, 'crate');
}

/** Level 1: a wall of four crates high, then a two-wide one. 48 blocks wide. */
function bumpACrate(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(48, 44);
  g.row(9, 30, 31, 'c').row(9, 33, 38, 'c');
  scenery(
    g,
    [
      [7, 2],
      [20, 1],
      [31, 3],
      [40, 1],
    ],
    [10, 24, 29, 46],
    [8, 14, 39],
  );
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 5, 4, signs.bump, 5);
  // Keep the board in camera rows 4–5, one column beyond the four-high wall; the post stops above the coins.
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 30, 4, signs.rubble, 3);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 40, 7, signs.exit, 2);
  crates(m, L1.wallA, 1, L1.rows);
  crates(m, L1.wallB, L1.wallBWidth, L1.rows);
  return m;
}

/** Level 2: three stuck coins, a sign, ordinary coins, then a crate wall. 52 blocks wide. */
function coinsPayOnce(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 48);
  g.row(9, 26, 32, 'c').row(9, 42, 43, 'c');
  scenery(
    g,
    [
      [7, 2],
      [24, 1],
      [36, 3],
      [44, 1],
    ],
    [11, 24, 33, 40],
    [9, 13, 36],
  );
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 5, 5, signs.again, 3);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 19, 7, signs.once, 2);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 34, 4, signs.wall, 5);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 44, 7, signs.exit, 2);
  for (const x of L2.stuck) m.setOnSky(x, GROUND - 1, 'stuckCoin');
  crates(m, L2.wall, 1, 4);
  return m;
}

/** Level 3: five gems on the path, a crate wall, then a stack of gems behind it. 52 blocks wide. */
function spinningGems(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 48);
  scenery(
    g,
    [
      [7, 2],
      [22, 1],
      [38, 3],
      [44, 1],
    ],
    [11, 28, 40, 46],
    [9, 25, 41],
  );
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 5, 5, signs.spin, 4);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 22, 7, signs.frames, 2);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 27, 4, signs.hidden, 1);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 43, 7, signs.exit, 2);
  for (const x of L3.gems) m.setOnSky(x, GROUND - 1, 'gem0');
  crates(m, L3.wall, 1, 4);
  for (const x of L3.stack) m.setOnSky(x, GROUND - 1, 'gem2').setOnSky(x, GROUND - 2, 'gem1');
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'breakable-walls');
  const level = (file: string, title: string, hint: string, include: SignName[], map: (book: Book, signs: Record<SignName, Sign>) => StarterMap): Level => {
    const { book, signs } = buildBlocks(pal, include);
    return { file, title, hint, book, map: map(book, signs) };
  };
  const levels = [
    level('one', 'Bump a Crate', 'A bump is a touch.', ['bump', 'rubble', 'exit'], bumpACrate),
    level('two', 'Coins Pay Once', 'A coin must become air.', ['again', 'once', 'wall', 'exit'], coinsPayOnce),
    level('three', 'Spinning Gems', 'Every frame says the same.', ['spin', 'frames', 'hidden', 'exit'], spinningGems),
  ];
  return { book: levels[0].book, pal, levels };
}
