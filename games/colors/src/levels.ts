// COLORS THAT WORK's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and a row of plates.
//
//   1. Red and Green: a row of flat plates, six in a row. The red ones sting a little and the green
//      ones don't, and the two are the same shape, so only the color tells them apart. A player who
//      sees red and green alike can't tell which is which. (The level card's second view shows that.)
//   2. Shape and Brightness: the same stretch with spikes (dark, pointed) in place of the red plates
//      and light striped plates for the safe ones. Nothing depends on color any more.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addColorBlocks, addColorRamps } from './colorBlocks';

export type SignName = 'sting' | 'alike' | 'shape' | 'stripe' | 'any' | 'exit' | 'exit2';

/** The block set the levels share: the Starter blocks, this game's signs, then the plates and spikes. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    sting: addSign(book, pal, 'sting.sign', 'RED PLATES STING. GREEN ONES ARE SAFE', 4, 4),
    alike: addSign(book, pal, 'alike.sign', 'LOOK THE SAME TO YOU? THAT IS THE POINT', 4, 5),
    shape: addSign(book, pal, 'shape.sign', 'SPIKES LOOK LIKE SPIKES, IN ANY COLOR', 4, 4),
    stripe: addSign(book, pal, 'stripe.sign', 'LIGHT AND STRIPED MEANS SAFE', 4, 3),
    any: addSign(book, pal, 'any.sign', 'NOW IT READS IN ANY COLOR', 4, 2),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
    exit2: addSign(book, pal, 'exit2.sign', 'EXIT →', 3),
  };
  addColorBlocks(book, pal);
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
/** Where each level's row of plates starts, and the row itself (s = safe, H = the one that stings). */
export const PLATE_X = 17;
export const ROW = 'sHssHs';

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

/** Lays the row of plates along the ground from PLATE_X. */
function lay(m: StarterMap, safe: string, hot: string): void {
  [...ROW].forEach((ch, i) => m.set(PLATE_X + i, GROUND - 1, ch === 'H' ? hot : safe));
}

/** Level 1: red and green plates. 40 blocks wide. */
function redAndGreen(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(40, 36);
  g.row(9, 27, 29, 'c');
  scenery(
    g,
    [
      [6, 2],
      [19, 1],
      [30, 3],
    ],
    [14, 24, 34],
    [9, 31, 33],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.sting), signs.sting);
  m.sign(10, onGround(GROUND, signs.alike), signs.alike);
  m.sign(32, onGround(GROUND, signs.exit), signs.exit);
  lay(m, 'plateSafe', 'plateHot');
  return m;
}

/** Level 2: pointed spikes and light striped plates. 40 blocks wide. */
function shapeAndBrightness(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(40, 36);
  g.row(9, 27, 29, 'c');
  scenery(
    g,
    [
      [8, 1],
      [20, 3],
      [31, 2],
    ],
    [14, 24, 34],
    [9, 31, 33],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.shape), signs.shape);
  m.sign(10, onGround(GROUND, signs.stripe), signs.stripe);
  m.sign(23, onGround(GROUND, signs.any), signs.any);
  m.sign(32, onGround(GROUND, signs.exit2), signs.exit2);
  lay(m, 'plateStripe', 'spikeRed');
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(addColorRamps);
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Red and Green', hint: 'Which plate stings? Only a little.', map: redAndGreen(book, signs) },
    { file: 'two', title: 'Shape and Brightness', hint: 'Now you can tell.', map: shapeAndBrightness(book, signs) },
  ];
  return { book, pal, levels };
}
