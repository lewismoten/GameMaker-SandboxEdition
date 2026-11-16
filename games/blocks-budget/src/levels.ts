// 150 BLOCKS' two levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts for
// what the letters mean), then given its pictures and signs.
//
//   1. One Big Picture: a stone tower drawn as one picture and cut into blocks, every piece its own block.
//      Lena walks through it, because a picture is not solid unless its blocks are told to be.
//   2. Use It Again: a village row of eight houses made of six blocks, and a brick wall whose every copy
//      is solid. The last sign counts the whole game's blocks against the 150 an editor allows.
// Every room is closed in by brick walls you can see, so Lena is never stopped by something she can't.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { BACKBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { HOUSE, TOWER, addHouses, addPicture, towerPicture } from './pictures';

export type SignName = 'many' | 'count' | 'walk' | 'again' | 'houses' | 'same' | 'total' | 'exit';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

export const GROUND = 10;
/** Where each level's pieces stand: the tower's left block, the village's left block, the wall's column. */
export const TOWER_X = 20;
export const VILLAGE_X = 16;
export const HOUSES = 8;
export const WALL_X = 38;
export const WALL_HEIGHT = 2;

/** The block set both levels share: the Starter blocks, the tower, the houses, then this game's signs. */
function buildBlocks(pal: Pal) {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const tower = addPicture(book, 'tower', towerPicture(pal), TOWER.w, TOWER.h);
  const houses = addHouses(book, pal);
  const towerBlocks = new Set(tower.flat().filter((n) => n.startsWith('tower.'))).size;
  const houseBlocks = new Set([...houses.red.flat(), ...houses.blue.flat()]).size;
  // The count board includes its own tiles. Requalify this number whenever the art changes.
  const used = 130;
  const { blocks, signs } = buildTiledSigns(
    {
      many: { rows: [['ONE BIG'], ['PICTURE IS'], ['MANY BLOCKS']] },
      count: { rows: [['THIS TOWER TOOK'], [`${towerBlocks} BLOCKS`]] },
      walk: { rows: [['A PICTURE IS NOT'], ['SOLID. WALK IN']] },
      again: { rows: [['ONE BLOCK CAN'], ['BE USED AGAIN']] },
      houses: { rows: [[`${HOUSES} HOUSES,`], [`ONLY ${houseBlocks} BLOCKS`]] },
      same: { rows: [['EVERY COPY'], ['ACTS THE SAME']] },
      total: { rows: [['THIS GAME USES'], [`${used} OF ${BACKBL} BLOCKS`]] },
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
      maxBlocks: Math.min(100, BACKBL - book.index.size),
    },
  );
  for (const [name, pic] of blocks) book.add(name, pic, { grav: PULL.down });
  if (book.index.size !== used) throw new Error(`Count sign says ${used} blocks, but the game builds ${book.index.size}`);
  return { book, signs, tower, houses, counts: { tower: towerBlocks, houses: houseBlocks, used } };
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** Signs may replace only sky; later scenery is also checked against their final cells. */
function sign(m: StarterMap, x: number, y: number, s: Sign): void {
  stampTiledSign({ set: (col, row, name) => m.setOnSky(col, row, name) }, x, y, s, GROUND - y - s.board.length);
}

/** The ground, brick walls at both ends (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  // A two-row turf plinth opens the fixed view higher; walk right to step down.
  g.row(8, 2, 3, 'G').row(9, 2, 3, 'D');
  g.put(3, 6, 's').put(3, 7, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Level 1: the tower. 46 blocks wide; the ground is row 10. */
function oneBigPicture(b: ReturnType<typeof buildBlocks>): StarterMap {
  const g = base(46, 42);
  g.row(9, 26, 29, 'c').row(7, 31, 32, 'c');
  scenery(
    g,
    [
      [6, 1],
      [13, 2],
      [29, 1],
      [37, 2],
    ],
    [33, 40],
    [31, 35],
  );
  const m = new StarterMap(b.book, g.rows());
  sign(m, 2, 3, b.signs.many);
  sign(m, 8, onGround(GROUND, b.signs.count), b.signs.count);
  sign(m, 15, 3, b.signs.walk);
  b.tower.forEach((row, dy) => row.forEach((n, dx) => m.set(TOWER_X + dx, GROUND - TOWER.h + dy, n)));
  sign(m, 36, onGround(GROUND, b.signs.exit), b.signs.exit);
  return m;
}

/** Level 2: the village and the wall. 60 blocks wide. */
function useItAgain(b: ReturnType<typeof buildBlocks>): StarterMap {
  const g = base(60, 56);
  g.row(7, 18, 21, 'c').row(9, 40, 42, 'c').row(7, 49, 50, 'c');
  g.fill(WALL_X, GROUND - WALL_HEIGHT, 1, WALL_HEIGHT, 'B');
  scenery(
    g,
    [
      [6, 1],
      [18, 1],
      [30, 2],
      [46, 1],
    ],
    [34, 54],
    [33, 55],
  );
  const m = new StarterMap(b.book, g.rows());
  sign(m, 1, 4, b.signs.again);
  for (let i = 0; i < HOUSES; i++) {
    const house = i % 2 === 0 ? b.houses.red : b.houses.blue;
    house.forEach((row, dy) => row.forEach((n, dx) => m.set(VILLAGE_X + i * HOUSE.w + dx, GROUND - HOUSE.h + dy, n)));
  }
  sign(m, 8, onGround(GROUND, b.signs.houses), b.signs.houses);
  sign(m, WALL_X - 6, 5, b.signs.same);
  sign(m, WALL_X + 2, 5, b.signs.total);
  sign(m, 50, onGround(GROUND, b.signs.exit), b.signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[]; counts: ReturnType<typeof buildBlocks>['counts'] } {
  const pal = buildStarterPalette(undefined, 'blocks-budget');
  const b = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'One Big Picture', hint: 'A tower made of blocks.', map: oneBigPicture(b) },
    { file: 'two', title: 'Use It Again', hint: 'Few blocks, many places.', map: useItAgain(b) },
  ];
  return { book: b.book, pal, levels, counts: b.counts };
}
