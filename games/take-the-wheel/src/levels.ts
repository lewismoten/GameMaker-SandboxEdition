// TAKE THE WHEEL's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. Hop In: on foot, Yana jumps a bird in the road, then walks into a parked kart. That is the
//      exit: its link loads the next scene, and that scene names a different character file.
//   2. Take the Wheel: the same Yana is a driver. The kart is quick and cannot jump, so a bird in the
//      road stops it until a honk (Space) pops the bird and it flies off.
// Both rooms are closed in by brick walls you can see, and nothing blocks Yana but the birds.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { parkedKart } from './kart';
import { BIRD } from './monsters';

export type SignName = 'foot' | 'bird' | 'hop' | 'file' | 'nojump' | 'honk' | 'again' | 'exit';

/** The block set both levels share: the Starter blocks, the parked kart, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const kart = parkedKart(pal);
  book.add('kartTop', kart.top, { grav: PULL.down });
  book.add('kartBottom', kart.bottom, { grav: PULL.down });
  const signs = {
    foot: addSign(book, pal, 'foot.sign', 'ON FOOT, YANA WALKS AND JUMPS', 4, 4),
    bird: addSign(book, pal, 'bird.sign', 'A BIRD IN THE ROAD. JUMP IT', 4, 4),
    hop: addSign(book, pal, 'hop.sign', 'WALK INTO THE KART TO DRIVE IT', 4, 4),
    file: addSign(book, pal, 'file.sign', 'THE KART IS A NEW CHARACTER FILE', 4, 4),
    nojump: addSign(book, pal, 'nojump.sign', 'FAST, BUT A KART CANNOT JUMP', 4, 4),
    honk: addSign(book, pal, 'honk.sign', 'SPACE HONKS. THE BIRD FLIES OFF', 4, 4),
    again: addSign(book, pal, 'again.sign', 'ONE HONK CLEARS ONE BIRD', 4, 4),
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
/** Where the monsters stand: the row above the ground. */
export const STAND = GROUND - 1;
/** Where the birds sit in each level (blocks). */
export const L1_BIRD = 21;
export const L2_BIRDS = [22, 32];

/** The ground, brick walls at both ends (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit at `exitX`. */
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

/** Level 1: a bird to jump, then the parked kart as the exit. 46 blocks wide; the ground is row 10. */
function hopIn(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  scenery(
    g,
    [
      [6, 2],
      [16, 1],
      [30, 3],
      [38, 1],
    ],
    [10, 27, 33],
    [14, 25, 39],
  );
  const m = new StarterMap(book, g.rows());
  m.set(42, 8, 'kartTop').set(42, 9, 'kartBottom');
  m.sign(6, onGround(GROUND, signs.foot), signs.foot);
  m.sign(14, onGround(GROUND, signs.bird), signs.bird);
  m.sign(36, onGround(GROUND, signs.hop), signs.hop);
  m.mon(BIRD, L1_BIRD, STAND);
  return m;
}

/** Level 2: the same road, driven. Two birds, a honk each. 46 blocks wide. */
function drive(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  scenery(
    g,
    [
      [8, 1],
      [18, 3],
      [30, 1],
      [40, 3],
    ],
    [12, 26, 36],
    [9, 30, 41],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.file), signs.file);
  m.sign(11, onGround(GROUND, signs.nojump), signs.nojump);
  m.sign(16, onGround(GROUND, signs.honk), signs.honk);
  m.sign(27, onGround(GROUND, signs.again), signs.again);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  for (const x of L2_BIRDS) m.mon(BIRD, x, STAND);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'take-the-wheel');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Hop In', hint: 'Walk into the kart.', map: hopIn(book, signs) },
    { file: 'two', title: 'Take the Wheel', hint: 'A kart can honk, not jump.', map: drive(book, signs) },
  ];
  return { book, pal, levels };
}
