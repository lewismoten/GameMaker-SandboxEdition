// COLOR DOORS' two rooms, each painted on a Grid (a block a character; see games/kit/starter/map.ts).
//
//   The hall:    five doors in a row, one for each way of seeing, and a sixth at the end that finishes the game.
//                Every door's sign says in plain words what the room beyond will look like.
//   The gallery: ONE map that all five doors open into. Eight color swatches with their names under them,
//                a traffic light, a fruit table and a garden bed, and a door at the far end back to the hall.
//
// The gallery is a single file (GALLERY.MAP). Each door leads to its own SCENE of the game; the scenes list
// the same map and blocks and differ in one slot, the palette (game.ts). So the same blocks are drawn in
// five sets of colors, and the way back from each lands you at the door you came through.
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { SWATCHES, addColorBlocks, swatchBlock, swatchRamps } from './colorBlocks';
import { VIEWS } from './views';

export const GROUND = 10;
/**
 * The first map row of anything the player must read. Both rooms lock vertical scrolling; the raised entrance
 * opens at local row 2, and returns to the hall at ground level open at row 4. All boards fit in either view.
 */
export const SIGN_ROW = 6;

export type SignName = 'door0' | 'door1' | 'door2' | 'door3' | 'door4' | 'finish' | 'same' | 'light' | 'fruit' | 'back' | `name${number}`;

/** Complete sign vocabulary, with wall boards sized to the fixed gaps between doors. */
const WORDS = {
  door0: { lines: ['AS YOU', 'SEE IT'], post: false },
  door1: { lines: ['RED-', 'GREEN 1'], post: false },
  door2: { lines: ['RED-', 'GREEN 2'], post: false },
  door3: { lines: ['BLUE +', 'YELLOW'], post: false },
  door4: { lines: ['NO', 'COLOR'], post: false },
  finish: { lines: ['ALL', 'DONE'] },
  same: { lines: ['SAME', 'ROOM'] },
  light: { lines: ['RED TOP', 'GREEN ↓'] },
  fruit: { lines: ['SHAPES', 'HELP'] },
  back: { lines: ['TO', 'HALL'], post: false },
  ...Object.fromEntries(SWATCHES.map((s) => [`name${s.word}`, { lines: [s.word], post: false }])),
};

function buildBlocks(pal: Pal): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addColorBlocks(book, pal);
  const signs = addMicroPlaques(book, pal, WORDS);
  // The hall's posted hint stands against stone; only its post needs a wall backdrop.
  const post = signs.finish.post!;
  const wall = book.pics.get('wall')!;
  book.add(
    'microPlaque.post.wall',
    book.pics
      .get(post.block)!
      .crop(0, 0, 20, 20)
      .map((x, y, c) => (c === skyOf(pal) ? wall.get(x, y) : c)),
    { grav: PULL.down },
  );
  signs.finish = { ...signs.finish, post: { ...post, block: 'microPlaque.post.wall' } };
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  map: StarterMap;
}

/** Where each hall door's bottom block is (level x), left to right, then the finishing door. */
export const HALL_DOORS = [13, 21, 29, 37, 45];
export const HALL_FINISH = 53;
const HALL_W = 57;

/** The hall: a grass floor, a stone wall behind, five doors and the way out. */
function hall(book: Book, signs: Record<string, Sign>): Level {
  const g = new Grid(HALL_W, 15);
  g.row(GROUND, 0, HALL_W - 1, 'G').fill(0, GROUND + 1, HALL_W, 4, 'D');
  g.col(0, 0, 9, 'B').col(HALL_W - 1, 0, 9, 'B');
  // A narrow turf ledge raises the entrance without covering the signs beside it.
  g.put(3, 8, 'G').put(3, 9, 'D');
  g.put(3, 6, 's').put(3, 7, 'S');
  for (const x of [...HALL_DOORS, HALL_FINISH]) g.put(x, 8, 'e').put(x, 9, 'E');
  const m = new StarterMap(book, g.rows());
  for (let y = 0; y < GROUND; y++) for (let x = 1; x < HALL_W - 1; x++) if (g.rows()[y][x] === ' ') m.set(x, y, 'wall');
  m.set(3, 6, 'doorwayTopW').set(3, 7, 'doorwayBottomW');
  for (const x of [...HALL_DOORS, HALL_FINISH]) m.set(x, 8, 'doorTopW').set(x, 9, 'doorBottomW');
  const board = (s: Sign, x: number, y: number) =>
    stampTiledSign(
      {
        set: (bx, by, name) => {
          if (m.map.blocks[(by + ORIGIN) * 100 + bx + ORIGIN] !== book.n('wall')) throw new Error(`Sign would cover hall art at ${bx},${by}`);
          m.set(bx, by, name);
        },
      },
      x,
      y,
      s,
      1,
      { maxPostHeight: 1 },
    );
  HALL_DOORS.forEach((x, i) => board(signs[`door${i}`], x - Math.floor(signs[`door${i}`].board[0].length / 2), SIGN_ROW));
  board(signs.finish, HALL_FINISH - 2, GROUND - 2);
  return { file: 'hall', title: 'The Hall', map: m };
}

/** The gallery's landmarks (level x), left to right. */
export const SWATCH_X = 13;
export const SWATCH_STRIDE = 4;
export const LIGHT_X = 47;
export const TABLE_X = 56;
export const FLOWERS_X = 69;
export const GALLERY_END = 87;
const GALLERY_W = 90;

/** The gallery: grass outside, a stone wall for the swatches, then the light, the table and the garden. */
function gallery(book: Book, signs: Record<string, Sign>): Level {
  const g = new Grid(GALLERY_W, 15);
  g.row(GROUND, 0, GALLERY_W - 1, 'G').fill(0, GROUND + 1, GALLERY_W, 4, 'D');
  g.col(0, 0, 9, 'B').col(GALLERY_W - 1, 0, 9, 'B');
  // A narrow turf ledge raises the entrance without covering the signs beside it.
  g.put(3, 8, 'G').put(3, 9, 'D');
  g.put(3, 6, 's').put(3, 7, 'S');
  g.put(GALLERY_END, 8, 'e').put(GALLERY_END, 9, 'E');
  for (const x of [53, 67]) g.put(x, GROUND - 1, 'b');
  for (const x of [9, 45, 78]) g.put(x, GROUND - 1, 'f');
  for (const [x, y] of [
    [8, 2],
    [38, 1],
    [58, 2],
    [84, 1],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  const m = new StarterMap(book, g.rows());
  const onGround = (s: Sign) => GROUND - 1 - s.board.length;
  // the wall the swatches hang on
  for (let y = 2; y < GROUND; y++) for (let x = 12; x < 45; x++) m.set(x, y, 'wall');
  SWATCHES.forEach((s, i) => {
    const x = SWATCH_X + i * SWATCH_STRIDE - 1;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 3; dx++) m.set(x + dx, SIGN_ROW + dy, swatchBlock(s.word));
    stampTiledSign(
      {
        set: (bx, by, name) => {
          if (m.map.blocks[(by + ORIGIN) * 100 + bx + ORIGIN] !== book.n('wall')) throw new Error(`Label would cover gallery art at ${bx},${by}`);
          m.set(bx, by, name);
        },
      },
      x,
      SIGN_ROW + 2,
      signs[`name${s.word}`],
      1,
      { maxPostHeight: 1 },
    );
  });
  // the traffic light, on its pole (the lamps are one block each: red, amber, green from the top)
  m.set(LIGHT_X, SIGN_ROW, 'lampTop')
    .set(LIGHT_X, SIGN_ROW + 1, 'lampMid')
    .set(LIGHT_X, SIGN_ROW + 2, 'lampBottom');
  for (let y = SIGN_ROW + 3; y < GROUND; y++) m.set(LIGHT_X, y, 'pole');
  // the table and its fruit
  for (let i = 0; i < 5; i++) m.set(TABLE_X + i, GROUND - 2, 'tableTop');
  m.set(TABLE_X, GROUND - 1, 'tableLeg').set(TABLE_X + 4, GROUND - 1, 'tableLeg');
  ['apple', 'banana', 'lime', 'grapes', 'orange'].forEach((f, i) => m.set(TABLE_X + i, GROUND - 3, f));
  // the garden bed
  ['rose', 'sun', 'iris', 'bluebell'].forEach((f, i) => m.set(FLOWERS_X + i, GROUND - 1, f));
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 5, onGround(signs.same), signs.same, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, LIGHT_X - 2, GROUND - 3, signs.light, 2, { maxPostHeight: 1 });
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, TABLE_X - 2, onGround(signs.fruit), signs.fruit, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, GALLERY_END - 1, GROUND - 3, signs.back, 1, { maxPostHeight: 1 });
  return { file: 'gallery', title: 'The Gallery', map: m };
}

/** The landing cell (world blocks) beside hall door `i`: where the way back from that door puts Lena. */
export const hallLanding = (i: number): [number, number] => [HALL_DOORS[i] + 1 + ORIGIN, GROUND - 1 + ORIGIN];

export function buildLevels(): { book: Book; pal: Pal; hall: Level; gallery: Level } {
  const pal = buildStarterPalette((b) => swatchRamps(b), 'color-doors');
  const { book, signs } = buildBlocks(pal);
  return { book, pal, hall: hall(book, signs), gallery: gallery(book, signs) };
}

export { VIEWS };

/** Rows (map rows, first and last) that must stay on screen. */
export const LANDMARK_ROWS = {
  hall: [['door signs', SIGN_ROW, GROUND - 1]] as [string, number, number][],
  gallery: [
    ['swatches and names', SIGN_ROW, SIGN_ROW + 2],
    ['traffic light', SIGN_ROW, SIGN_ROW + 2],
    ['fruit', GROUND - 3, GROUND - 2],
  ] as [string, number, number][],
};
