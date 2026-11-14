// BIRDS OF A FEATHER's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its birds.
//
//   1. One Shape: a flat meadow with a small brick hill. Five green birds start in a V over
//      it and fly 22 blocks right and back. They hold the V the whole way, because they share
//      one path at one speed.
//   2. Out of Step: the same V, but the two middle birds are gold and fly faster. They pull away
//      and the V comes apart.
// Both rooms are closed in by brick walls you can see, so Lian is never stopped by something he can't.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { BIRD, QUICK } from './monsters';

export type SignName = 'shape' | 'same' | 'quick' | 'apart' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const { blocks, signs } = buildTiledSigns(
    {
      shape: { rows: [['FIVE BIRDS KEEP ONE SHAPE']] },
      same: { rows: [['SAME PATH, SAME SPEED']] },
      quick: { rows: [['GOLD BIRDS FLY FASTER']] },
      apart: { rows: [['NOW THE SHAPE COMES APART']] },
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
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

export const GROUND = 10;
/** The V of five birds: block offsets from its left top corner (left to right). */
export const V: [number, number][] = [
  [0, 0],
  [2, 1],
  [4, 2],
  [6, 1],
  [8, 0],
];
/** The V's left top corner in each level: block column and row. */
export const FLOCK_AT: [number, number] = [12, 6];

/** The ground, brick walls at both ends (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number, entrance = true): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  if (entrance) g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Puts the five birds of the V at the corner, `kinds[i]` being the monster number of the i-th from the left. */
function flock(m: StarterMap, kinds: number[]): void {
  V.forEach(([dx, dy], i) => m.mon(kinds[i], FLOCK_AT[0] + dx, FLOCK_AT[1] + dy));
}

/** Level 1: five green birds keep a V over a small brick hill. 46 blocks wide; the ground is row 10. */
function oneShape(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  // the hill: two steps and a top, with coins over it
  g.row(9, 22, 26, 'B').row(8, 23, 25, 'B');
  g.row(9, 19, 20, 'c').row(7, 23, 24, 'c').row(9, 31, 32, 'c');
  scenery(
    g,
    [
      [8, 6],
      [38, 6],
    ],
    [12, 28, 37],
    [10, 21, 35],
  );
  const m = new StarterMap(book, g.rows());
  const sky = { set: (x: number, y: number, name: string) => m.setOnSky(x, y, name) };
  // Keep the boards above the birds’ flight rows, with posts clear of the scenery.
  stampTiledSign(sky, 1, onGround(GROUND, signs.shape) - 3, signs.shape, 4);
  stampTiledSign(sky, 13, onGround(GROUND, signs.same) - 3, signs.same, 4);
  stampTiledSign(sky, 39, onGround(GROUND, signs.exit) - 1, signs.exit, 2);
  flock(m, [BIRD, BIRD, BIRD, BIRD, BIRD]);
  return m;
}

/** Level 2: the same V, but its two middle birds are the quick, gold kind. 46 blocks wide. */
function outOfStep(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  g.row(9, 19, 20, 'c').row(9, 24, 26, 'c').row(9, 30, 32, 'c');
  scenery(
    g,
    [
      [8, 6],
      [38, 6],
    ],
    [28, 37],
    [10, 22, 35],
  );
  const m = new StarterMap(book, g.rows());
  const sky = { set: (x: number, y: number, name: string) => m.setOnSky(x, y, name) };
  stampTiledSign(sky, 1, onGround(GROUND, signs.quick) - 3, signs.quick, 4);
  stampTiledSign(sky, 11, onGround(GROUND, signs.apart) - 3, signs.apart, 4);
  stampTiledSign(sky, 39, onGround(GROUND, signs.exit) - 1, signs.exit, 2);
  flock(m, [BIRD, QUICK, BIRD, QUICK, BIRD]);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'flock');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'One Shape', hint: 'Same path, same speed.', map: oneShape(book, signs) },
    { file: 'two', title: 'Out of Step', hint: 'One faster bird breaks it.', map: outOfStep(book, signs) },
  ];
  return { book, pal, levels };
}
