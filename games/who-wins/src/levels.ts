// WHO WINS?'s two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. The Big One: two small mint gumdrops sit in a low tunnel through a brick wall and block it.
//      A big red gumdrop (stronger) walks back and forth through the tunnel and pops them by
//      itself. A chart shows the two and their powers (180 and 110), and an arrow sign points at
//      the big one: watch it. Lami waits, then walks through.
//   2. Your Star: the big one stands still in front of the tunnel. A chart lists all four powers
//      (big 180, star 140, grump 130, pip 110). A star thrown at the big one fizzles (180 beats
//      140, as the sign beside it says). Lami steps past the big one, which is friendly, and
//      throws: the star (stronger than a mint pip and a purple grump) pops both, one star each.
// Both rooms are closed in by brick walls you can see, so Lami is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques, stampTiledSign } from '../../kit/starter/microPlaque';
import { addChart } from './chartSign';
import { BIG, BIG_STILL, MID, PIP, POWER, monsterPictures } from './monsters';
import { drawStar } from './starArt';

export type SignName = 'stronger' | 'chart1' | 'watch' | 'chart2' | 'step' | 'exit';
type Signs = Record<Exclude<SignName, 'chart1' | 'chart2'>, Sign> & Record<'chart1' | 'chart2', ReturnType<typeof addChart>>;

const WORDS = {
  stronger: { lines: ['HIGHER', 'WINS'] },
  watch: { lines: ['LOOK', '→'] },
  step: { lines: ['180>140', 'GO PAST'] },
  exit: { lines: ['EXIT', '→'], post: false },
};

/** The block set both levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Signs } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  // the charts show the monsters' own pictures beside their real powers
  const pics = monsterPictures(pal).pics;
  const row = (name: string, power: number) => ({ pic: pics.get(name)!, power });
  const signs = {
    chart1: addChart(book, pal, 'chart1', [row('big0', POWER.big), row('pip0', POWER.pip)]),
    chart2: addChart(book, pal, 'chart2', [
      row('big0', POWER.big),
      { pic: drawStar(pal, 0), power: POWER.star },
      row('mid0', POWER.mid),
      row('pip0', POWER.pip),
    ]),
    ...addMicroPlaques(book, pal, WORDS),
  };
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

export const GROUND = 10;
/** Where the monsters stand: the row above the ground. */
export const STAND = GROUND - 1;

/** The ground, brick walls at both ends (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Where the small ones stand in level 1 (a mint pip each), and level 2's pip and mid. */
export const PIPS_1 = [24, 27] as const;
export const PIP_2 = 27;
export const MID_2 = 30;
/** Where the big one stands in level 2, and the tunnel (a brick wall from x 22 to 29 in level 1, 24 to 33 in level 2). */
export const BIG_X = 19;
export const TUNNEL_1 = [22, 29] as const;
export const TUNNEL_2 = [24, 33] as const;

/** A wall with a two-block-high tunnel through it. */
function wall(g: Grid, [from, to]: readonly [number, number]): void {
  g.fill(from, 0, to - from + 1, 8, 'B');
}

/** Level 1: the big one walks through the tunnel and pops the pips. 46 blocks wide; the ground is row 10. */
function theBigOne(book: Book, signs: Signs): StarterMap {
  const g = base(46, 42);
  wall(g, TUNNEL_1);
  g.row(9, 11, 12, 'c').row(9, 32, 35, 'c');
  scenery(
    g,
    [
      [6, 2],
      [14, 1],
      [33, 2],
      [39, 4],
    ],
    [9, 20, 37],
    [31, 40],
  );
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 5, onGround(GROUND, signs.stronger), signs.stronger);
  m.sign(10, onGround(GROUND, signs.chart1), signs.chart1);
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 15, onGround(GROUND, signs.watch), signs.watch);
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 38, onGround(GROUND, signs.exit), signs.exit);
  for (const x of PIPS_1) m.mon(PIP, x, STAND);
  m.mon(BIG, BIG_X, STAND);
  return m;
}

/** Level 2: a still big one in front of a tunnel with a pip and a mid in it. 46 blocks wide. */
function yourStar(book: Book, signs: Signs): StarterMap {
  const g = base(46, 42);
  wall(g, TUNNEL_2);
  g.row(9, 10, 11, 'c').row(9, 35, 38, 'c');
  scenery(
    g,
    [
      [6, 2],
      [16, 1],
      [20, 3],
      [40, 1],
    ],
    [9, 22, 41],
    [18, 34, 40],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.chart2), signs.chart2);
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 12, onGround(GROUND, signs.step), signs.step);
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 39, onGround(GROUND, signs.exit), signs.exit);
  m.mon(BIG_STILL, BIG_X, STAND);
  m.mon(PIP, PIP_2, STAND);
  m.mon(MID, MID_2, STAND);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'who-wins');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'The Big One', hint: 'Higher power wins. Watch!', map: theBigOne(book, signs) },
    { file: 'two', title: 'Your Star', hint: 'Your star is 140. What can it pop?', map: yourStar(book, signs) },
  ];
  return { book, pal, levels };
}
