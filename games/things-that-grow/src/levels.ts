// SEEDS AND NESTS's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its nests.
//
//   1. A Nest: a nest on a brick shelf over the path hatches a yellow bird every few seconds. Each
//      flutters about and flies off after a while. Lami waits under it and watches.
//   2. Empty Nest: the shelf nest keeps hatching (it has no touch rule). A second nest lies on the
//      path and hatches blue birds; Lami steps on it and it becomes an empty nest. The blue ones go
//      when their time is up and no more come, while the yellow ones keep on.
// Both rooms are closed in by brick walls you can see, so Lami is never stopped by something he can't.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { BIRD, BLUEBIRD } from './monsters';

export type SignName = 'hatch' | 'wait' | 'loop' | 'stop' | 'exit';

/** Ticks between births: the shelf nest hatches a yellow bird every 4 seconds, the one on the path a blue one every 3. */
export const SHELF_EVERY = 73;
export const PATH_EVERY = 55;

/** A twig nest on the sky, with two pale eggs in it (or none): the bird's mother's is the same size as a block. */
function nest(pal: Pal, eggs: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, skyOf(pal));
  const wood = r('wood');
  const rand = rng(77);
  blob(p, 9.5, 14, 9, 5, wood, 0, 4);
  // twigs woven across the bowl
  for (let i = 0; i < 14; i++) {
    const x = 2 + Math.floor(rand() * 15);
    const y = 11 + Math.floor(rand() * 7);
    p.line(x, y, Math.min(18, x + 3), y + (i % 2 ? 1 : -1), wood[i % 3 ? 1 : 4]);
  }
  p.rect(1, 13, 18, 1, wood[1]);
  if (eggs) {
    for (const x of [6, 12]) {
      blob(p, x, 10, 3, 3.4, r('white'), 1, 3);
      p.set(x - 1, 9, c('blue', 4)).set(x + 1, 11, c('blue', 4));
    }
    // the bowl's front edge over the eggs
    blob(p, 9.5, 15, 9, 4, wood, 0, 4);
  }
  return p;
}

/** The block set both levels share: the Starter blocks, then the nests and this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const air = { grav: PULL.down };
  // the shelf nest has no touch rule, so it hatches for as long as the level lasts; the path nest turns into the empty one when touched
  book.add('nestShelf', nest(pal, true), air);
  book.add('nestPath', nest(pal, true), { ...air, touch: 'nestEmpty' });
  book.add('nestEmpty', nest(pal, false), air);
  const signs = {
    hatch: addSign(book, pal, 'hatch.sign', 'THIS NEST HATCHES A BIRD', 4, 4),
    wait: addSign(book, pal, 'wait.sign', 'WAIT AND WATCH THE NEST', 4, 4),
    loop: addSign(book, pal, 'loop.sign', 'IT HATCHES ONE AFTER ANOTHER', 4, 4),
    stop: addSign(book, pal, 'stop.sign', 'TOUCH A NEST AND IT STOPS', 4, 4),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  return { book, signs };
}

/** Gives the nests their births (after finish(), since the block set's own rules have no place for them): the shelf nest hatches BIRD, the path nest BLUEBIRD. */
export function finishNests(book: Book, blocks: ReturnType<Book['finish']>): void {
  blocks[book.n('nestShelf')].birthMon = BIRD;
  blocks[book.n('nestShelf')].birthTime = SHELF_EVERY;
  blocks[book.n('nestPath')].birthMon = BLUEBIRD;
  blocks[book.n('nestPath')].birthTime = PATH_EVERY;
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

/** A brick shelf three blocks wide over the path (row 7), and the nest on it (row 6). */
function shelf(g: Grid, x: number): void {
  g.row(7, x - 1, x + 1, 'B');
}

/** Level 1: a nest on a shelf hatches birds. 46 blocks wide; the ground is row 10. */
function aNest(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  shelf(g, 24);
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
    [13, 31, 40],
  );
  const m = new StarterMap(book, g.rows());
  m.set(24, 6, 'nestShelf');
  m.sign(6, onGround(GROUND, signs.hatch), signs.hatch);
  m.sign(15, onGround(GROUND, signs.wait), signs.wait);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Where the nest Lami empties lies on the path in level 2. */
export const PATH_NEST_X = 31;
export const SHELF_NEST_X = 16;

/** Level 2: a nest that hatches on and on, and one Lami can stop. 46 blocks wide. */
function emptyNest(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  shelf(g, SHELF_NEST_X);
  g.row(9, 12, 13, 'c').row(9, 33, 36, 'c');
  scenery(
    g,
    [
      [5, 2],
      [22, 1],
      [26, 3],
      [40, 2],
    ],
    [11, 20, 44],
    [19, 28, 41],
  );
  const m = new StarterMap(book, g.rows());
  m.set(SHELF_NEST_X, 6, 'nestShelf');
  m.set(PATH_NEST_X, STAND, 'nestPath');
  m.sign(6, onGround(GROUND, signs.loop), signs.loop);
  m.sign(24, onGround(GROUND, signs.stop), signs.stop);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'things-that-grow');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'A Nest', hint: 'A block can hatch a monster.', map: aNest(book, signs) },
    { file: 'two', title: 'Empty Nest', hint: 'And a touch can make it stop.', map: emptyNest(book, signs) },
  ];
  return { book, pal, levels };
}
