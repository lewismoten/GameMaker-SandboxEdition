// COLORS THAT WORK's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and a row of plates.
//
//   1. Red and Green: a row of flat plates, six in a row. The red ones sting a little and the green
//      ones don't, and the two are the same shape, so only the color tells them apart. A player who
//      sees red and green alike can't tell which is which. Both levels use the simulated palette during play.
//   2. Shape and Brightness: the same stretch with spikes (dark, pointed) in place of the red plates
//      and light striped plates for the safe ones. Nothing depends on color any more.
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addColorBlocks, addColorRamps } from './colorBlocks';

export type SignName = 'sting' | 'alike' | 'shape' | 'stripe' | 'any' | 'exit' | 'exit2';

/** The block set the levels share: the Starter blocks, this game's signs, then the plates and spikes. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = addMicroPlaques(book, pal, {
    sting: { lines: ['OUCH'] },
    alike: { lines: ['SAME?', 'EXACTLY'] },
    shape: { lines: ['SHAPES', 'HELP'] },
    stripe: { lines: ['STRIPES', '= SAFE'] },
    any: { lines: ['WELL', 'DONE'] },
    exit: { lines: ['EXIT', '→'], post: false },
    exit2: { lines: ['EXIT', '→'], post: false },
  });
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
  lay(m, 'plateSafe', 'plateHot');
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 4, onGround(GROUND, signs.sting), signs.sting, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 12, onGround(GROUND, signs.alike), signs.alike, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 35, 7, signs.exit, 1, { maxPostHeight: 1 });
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
  lay(m, 'plateStripe', 'spikeRed');
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 4, onGround(GROUND, signs.shape), signs.shape, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 12, onGround(GROUND, signs.stripe), signs.stripe, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 25, onGround(GROUND, signs.any), signs.any, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 35, 7, signs.exit2, 1, { maxPostHeight: 1 });
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(addColorRamps, 'colors');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Red and Green', hint: 'RED AND GREEN LOOK ALIKE HERE', map: redAndGreen(book, signs) },
    { file: 'two', title: 'Shape and Brightness', hint: 'Now you can tell.', map: shapeAndBrightness(book, signs) },
  ];
  return { book, pal, levels };
}
