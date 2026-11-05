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
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { SWATCHES, addColorBlocks, swatchBlock, swatchRamps, wallColor } from './colorBlocks';
import { VIEWS } from './views';

export const GROUND = 10;

export type SignName = 'welcome' | 'door0' | 'door1' | 'door2' | 'door3' | 'door4' | 'finish' | 'same' | 'light' | 'fruit' | 'back' | `name${number}`;

// (A background block file holds 150 blocks, so the boards are as small as their words allow.)
const WORDS: Record<string, [string, number, number]> = {
  welcome: ['COLOR LOOKS DIFFERENT TO SOME.', 4, 2],
  door0: ['AS YOU SEE IT', 4, 2],
  door1: ['RED-GREEN ONE KIND', 4, 2],
  door2: ['RED-GREEN THE OTHER', 4, 2],
  door3: ['BLUE AND YELLOW', 4, 2],
  door4: ['NO COLOR', 4, 2],
  finish: ['ALL DONE?', 4, 1],
  same: ['SAME ROOM', 4, 1],
  light: ['RED TOP. GREEN BELOW.', 4, 2],
  fruit: ['SHAPES HELP TOO.', 4, 2],
  back: ['TO HALL', 4, 1],
};

function buildBlocks(pal: Pal): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addColorBlocks(book, pal);
  const signs: Record<string, Sign> = {};
  // the boards that hang on the stone wall are drawn with the wall's color around their frames, not sky (the first sign, on the grass, adds the posts)
  const onWall = { ...pal, c: (n: string, k: number) => (n === 'sky' && k === 3 ? wallColor(pal) : pal.c(n, k)) };
  const grass = ['same', 'light', 'fruit', 'back'];
  for (const [k, [text, w, h]] of Object.entries(WORDS).sort((a, b) => Number(grass.includes(b[0])) - Number(grass.includes(a[0]))))
    signs[k] = addSign(book, grass.includes(k) ? pal : onWall, `${k}.sign`, text, w, h);
  // each swatch's name, on a small board of its own
  for (const s of SWATCHES) signs[`name${s.word}`] = addSign(book, onWall, `${s.word.toLowerCase()}.name`, s.word, 3, 1);
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
  g.put(3, 8, 's').put(3, 9, 'S');
  for (const x of [...HALL_DOORS, HALL_FINISH]) g.put(x, 8, 'e').put(x, 9, 'E');
  const m = new StarterMap(book, g.rows());
  for (let y = 0; y < GROUND; y++) for (let x = 1; x < HALL_W - 1; x++) if (g.rows()[y][x] === ' ') m.set(x, y, 'wall');
  m.set(3, 8, 'doorwayTopW').set(3, 9, 'doorwayBottomW');
  for (const x of [...HALL_DOORS, HALL_FINISH]) m.set(x, 8, 'doorTopW').set(x, 9, 'doorBottomW');
  const board = (s: Sign, x: number, y: number) => s.board.forEach((row, dy) => row.forEach((name, dx) => m.set(x + dx, y + dy, name)));
  board(signs.welcome, 5, 2);
  HALL_DOORS.forEach((x, i) => board(signs[`door${i}`], x - 1, 5));
  board(signs.finish, HALL_FINISH - 1, 6);
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
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(GALLERY_END, 8, 'e').put(GALLERY_END, 9, 'E');
  for (const x of [53, 66]) g.put(x, GROUND - 1, 'b');
  for (const x of [8, 45, 78]) g.put(x, GROUND - 1, 'f');
  for (const [x, y] of [[8, 2], [38, 1], [58, 2], [84, 1]]) g.put(x, y, '(').put(x + 1, y, ')');
  const m = new StarterMap(book, g.rows());
  const onGround = (s: Sign) => GROUND - 1 - s.board.length;
  // the wall the swatches hang on
  for (let y = 2; y < GROUND; y++) for (let x = 12; x < 45; x++) m.set(x, y, 'wall');
  SWATCHES.forEach((s, i) => {
    const x = SWATCH_X + i * SWATCH_STRIDE - 1;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 3; dx++) m.set(x + dx, 4 + dy, swatchBlock(s.word));
    signs[`name${s.word}`].board[0].forEach((name, dx) => m.set(x + dx, 6, name));
  });
  m.sign(5, onGround(signs.same), signs.same);
  // the traffic light, on its pole (the lamps are one block each: red, amber, green from the top)
  m.set(LIGHT_X, 4, 'lampTop').set(LIGHT_X, 5, 'lampMid').set(LIGHT_X, 6, 'lampBottom');
  for (let y = 7; y < GROUND; y++) m.set(LIGHT_X, y, 'pole');
  m.sign(LIGHT_X + 2, onGround(signs.light), signs.light);
  // the table and its fruit
  for (let i = 0; i < 5; i++) m.set(TABLE_X + i, GROUND - 3, 'tableTop');
  m.set(TABLE_X, GROUND - 2, 'tableLeg').set(TABLE_X, GROUND - 1, 'tableLeg').set(TABLE_X + 4, GROUND - 2, 'tableLeg').set(TABLE_X + 4, GROUND - 1, 'tableLeg');
  ['apple', 'banana', 'lime', 'grapes', 'orange'].forEach((f, i) => m.set(TABLE_X + i, GROUND - 4, f));
  m.sign(TABLE_X + 6, onGround(signs.fruit), signs.fruit);
  // the garden bed
  ['rose', 'sun', 'iris', 'bluebell'].forEach((f, i) => m.set(FLOWERS_X + i, GROUND - 1, f));
  m.sign(GALLERY_END - 6, onGround(signs.back), signs.back);
  return { file: 'gallery', title: 'The Gallery', map: m };
}

/** The landing cell (world blocks) beside hall door `i`: where the way back from that door puts Kit. */
export const hallLanding = (i: number): [number, number] => [HALL_DOORS[i] + 1 + ORIGIN, GROUND - 1 + ORIGIN];

export function buildLevels(): { book: Book; pal: Pal; hall: Level; gallery: Level } {
  const pal = buildStarterPalette((b) => swatchRamps(b));
  const { book, signs } = buildBlocks(pal);
  return { book, pal, hall: hall(book, signs), gallery: gallery(book, signs) };
}

export { VIEWS };
