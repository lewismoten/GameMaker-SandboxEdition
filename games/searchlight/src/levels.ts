// DON'T GET SEEN's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, its rail and its lights.
//
//   1. Wait and Go: a light hangs from a rail and walks back and forth over ten blocks of the way. Two
//      trenches are dug in the ground under it. Being seen (touching the light) costs hit points, so
//      Mara waits in a trench until the light has walked over her, then goes on.
//   2. Two Lights: two lights walking at two speeds, each over its own stretch with its own trenches,
//      and a patch of grass between them to rest on.
// The light is a path and nothing more: it does not look. Every room is closed in by brick walls you
// can see, so Mara is never stopped by something she can't.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { speckle } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { CONE } from './lightArt';
import { SWEEP, lampOf } from './monsters';

export type SignName = 'path' | 'seen' | 'hide' | 'two' | 'rest' | 'exit';

/** The block set both levels share: the Starter blocks, the rail and the trench, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const { c, r } = pal;
  {
    // the rail the lamp hangs from: a stone bar along the bottom of its block, with a rivet every few pixels
    const p = new Pixels(20, 20, skyOf(pal));
    p.rect(0, 13, 20, 6, c('stone', 2)).rect(0, 13, 20, 1, c('stone', 4)).rect(0, 18, 20, 1, c('stone', 0)).rect(0, 19, 20, 1, c('ink', 0));
    for (const x of [3, 10, 17]) p.set(x, 15, c('stone', 4)).set(x, 16, c('stone', 0));
    book.add('rail', p, { grav: PULL.down });
  }
  {
    // a trench: the dug-out dirt, darker than the ground, with a little light from above
    const d = r('dirt');
    const p = new Pixels(20, 20, d[1]);
    speckle(p, 0, 0, 20, 20, d, 0, 2, 17, 0.35);
    p.rect(0, 0, 1, 20, d[0]).rect(19, 0, 1, 20, d[0]);
    book.add('trench', p, { grav: PULL.down });
  }
  const signs = {
    path: addSign(book, pal, 'path.sign', 'THE LIGHT JUST WALKS A PATH', 4, 3),
    seen: addSign(book, pal, 'seen.sign', 'BEING SEEN COSTS HIT POINTS', 4, 3),
    hide: addSign(book, pal, 'hide.sign', 'WAIT IN A TRENCH TILL IT PASSES', 4, 3),
    two: addSign(book, pal, 'two.sign', 'TWO LIGHTS, TWO SPEEDS', 4, 3),
    rest: addSign(book, pal, 'rest.sign', 'GRASS HERE IS SAFE TO REST ON', 4, 3),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
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
/** Where Mara stands: the row above the ground. */
export const STAND = GROUND - 1;
/** The row of the rail, and of the lamp under it; the cone fills the rows down to STAND. Low enough that the lamp stays in view
 * when the camera settles after a fall (it keeps the hero about three rows below the top, and PLAYGAME skips a monster in the top row). */
export const RAIL = 6;
export const LAMP_ROW = RAIL + 1;

/** Where each light starts (its leftmost block), its run is monsters.ts SWEEP, and the trenches dug under it (left block of each, two wide). */
export const LIGHTS = [
  { level: 0, sweep: 0, x: 18, trenches: [21, 26] },
  { level: 1, sweep: 1, x: 20, trenches: [23, 27] },
  { level: 1, sweep: 2, x: 34, trenches: [37, 41] },
] as const;

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

/** Digs a trench (two wide, two deep) at `x`: the dirt row below stays as its floor. */
function trench(g: Grid, x: number): void {
  g.fill(x, GROUND, 2, 2, ' ');
}

/** Adds each light's rail, trench background and monsters to the map. */
function hang(m: StarterMap, level: number): void {
  for (const l of LIGHTS.filter((l) => l.level === level)) {
    for (let x = l.x; x <= l.x + SWEEP[l.sweep].run; x++) m.set(x, RAIL, 'rail');
    for (const t of l.trenches) for (const dx of [0, 1]) for (const y of [GROUND, GROUND + 1]) m.set(t + dx, y, 'trench');
    const first = lampOf(l.sweep);
    m.mon(first, l.x, LAMP_ROW);
    for (let i = 0; i < CONE; i++) m.mon(first + 1 + i, l.x, LAMP_ROW + 1 + i);
  }
}

/** Level 1: one light over ten blocks, two trenches. 50 blocks wide; the ground is row 10. */
function waitAndGo(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(50, 46);
  for (const t of LIGHTS[0].trenches) trench(g, t);
  g.row(9, 32, 32, 'c').row(9, 34, 34, 'c').row(9, 36, 36, 'c').row(9, 38, 38, 'c').row(9, 40, 40, 'c');
  scenery(
    g,
    [
      [6, 1],
      [13, 2],
      [31, 1],
      [40, 2],
    ],
    [9, 30, 44],
    [8, 13, 33],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.path), signs.path);
  m.sign(10, onGround(GROUND, signs.seen), signs.seen);
  m.sign(14, onGround(GROUND, signs.hide), signs.hide);
  m.sign(42, onGround(GROUND, signs.exit), signs.exit);
  hang(m, 0);
  return m;
}

/** Level 2: two lights at two speeds, grass between them. 58 blocks wide. */
function twoLights(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(58, 54);
  for (const l of LIGHTS.filter((l) => l.level === 1)) for (const t of l.trenches) trench(g, t);
  g.row(9, 46, 48, 'c').row(9, 31, 32, 'c');
  scenery(
    g,
    [
      [7, 1],
      [15, 2],
      [32, 1],
      [48, 2],
    ],
    [10, 18, 43, 52],
    [8, 14, 30, 45],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.two), signs.two);
  m.sign(30, onGround(GROUND, signs.rest), signs.rest);
  m.sign(50, onGround(GROUND, signs.exit), signs.exit);
  hang(m, 1);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'searchlight');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Wait and Go', hint: 'Let the light pass.', map: waitAndGo(book, signs) },
    { file: 'two', title: 'Two Lights', hint: 'Two speeds, two trenches.', map: twoLights(book, signs) },
  ];
  return { book, pal, levels };
}
