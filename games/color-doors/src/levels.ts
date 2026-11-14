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
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { SWATCHES, addColorBlocks, swatchBlock, swatchRamps } from './colorBlocks';
import { VIEWS } from './views';

export const GROUND = 10;
/**
 * The first map row of anything the player must read. After a jump the view comes to rest with the grass about 76
 * pixels from the top of the picture, so the picture then starts at map row 6.2 (viewShots.ts measures it); a board
 * or a swatch higher up scrolls out of sight. Row 6 loses only its top 4 pixels, which is frame, not words or color.
 */
export const SIGN_ROW = 6;

export type SignName = 'welcome' | 'door0' | 'door1' | 'door2' | 'door3' | 'door4' | 'finish' | 'same' | 'light' | 'fruit' | 'back' | `name${number}`;

/** Complete sign vocabulary, with wall boards sized to the fixed gaps between doors. */
const WORDS = {
  welcome: { rows: [['COLOR LOOKS'], ['DIFFERENT'], ['TO SOME.']], post: false },
  door0: { rows: [['AS YOU SEE IT']], post: false },
  door1: { rows: [['RED-GREEN'], ['ONE KIND']], post: false },
  door2: { rows: [['RED-GREEN'], ['THE OTHER']], post: false },
  door3: { rows: [['BLUE AND YELLOW']], post: false },
  door4: { rows: [['NO COLOR']], post: false },
  finish: { rows: [['ALL DONE?']], post: false },
  same: { rows: [['SAME ROOM']] },
  light: { rows: [['RED TOP. GREEN BELOW.']] },
  fruit: { rows: [['SHAPES HELP TOO.']] },
  back: { rows: [['TO HALL']] },
  ...Object.fromEntries(SWATCHES.map((s) => [`name${s.word}`, { rows: [[s.word]], post: false }])),
};

function buildBlocks(pal: Pal): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addColorBlocks(book, pal);
  const { blocks, signs } = buildTiledSigns(WORDS, {
    colors: {
      background: skyOf(pal),
      paper: pal.c('parch', 3),
      ink: pal.c('ink', 0),
      wood: pal.c('wood', 2),
      highlight: pal.c('wood', 4),
      shadow: pal.c('wood', 0),
    },
    lettersPerBlock: 3,
    maxBlocks: Math.min(100, 150 - book.index.size),
  });
  // A three-pixel sky-blue surround on every side of each wall board. The old
  // boards sat directly on stone; these are decorative surrounds, not color samples.
  // Copy shared tiles before painting: Pixels.map mutates, and grass signs reuse them.
  const pictures = new Map([...book.pics].map(([name, pic]) => [pic.px.join(','), name]));
  for (const [key, sign] of Object.entries(signs)) {
    if (sign.post) {
      for (const name of [...sign.board.flat(), sign.post.block]) if (!book.has(name)) book.add(name, blocks.get(name)!, { grav: PULL.down });
      continue;
    }
    const width = sign.board[0].length * 20;
    const height = sign.board.length * 20;
    sign.board = sign.board.map((row, dy) =>
      Array.from({ length: key.startsWith('name') ? 3 : row.length }, (_, dx) => {
        // The gallery's samples stay three tiles wide; center labels of either
        // tile parity underneath them, including the longer color names.
        const offset = key.startsWith('name') ? (width - 60) / 2 : 0;
        const pic = blocks
          .get(row[0])!
          .crop(0, 0, 20, 20)
          .map((x, y) => {
            const bx = dx * 20 + x + offset;
            const c = blocks.get(row[Math.floor(bx / 20)])!.get(bx % 20, y);
            const by = dy * 20 + y;
            if (bx < 14 || bx >= width - 14) return book.pics.get('wall')!.get(x, y);
            if (bx < 17 || bx >= width - 17 || by < 3 || by >= height - 3) return skyOf(pal);
            if (by === 3) return pal.c('wood', 4);
            if (by === 4) return pal.c('wood', 2);
            if (by === height - 5) return pal.c('wood', 2);
            if (by === height - 4) return pal.c('wood', 0);
            return c;
          });
        const pixels = pic.px.join(',');
        const shared = pictures.get(pixels);
        if (shared) return shared;
        const wallName = `${key}.wall.${dx}.${dy}`;
        book.add(wallName, pic, { grav: PULL.down });
        pictures.set(pixels, wallName);
        return wallName;
      }),
    );
  }
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
    );
  board(signs.welcome, 4, SIGN_ROW);
  HALL_DOORS.forEach((x, i) => board(signs[`door${i}`], x - Math.floor(signs[`door${i}`].board[0].length / 2), SIGN_ROW));
  board(signs.finish, HALL_FINISH - 2, SIGN_ROW + 1);
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
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 5, onGround(signs.same), signs.same);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, LIGHT_X + 3, SIGN_ROW, signs.light, 3);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, TABLE_X + 6, onGround(signs.fruit), signs.fruit);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, GALLERY_END - 6, onGround(signs.back), signs.back);
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
  hall: [['welcome and door signs', SIGN_ROW, GROUND - 1]] as [string, number, number][],
  gallery: [
    ['swatches and names', SIGN_ROW, SIGN_ROW + 2],
    ['traffic light', SIGN_ROW, SIGN_ROW + 2],
    ['fruit', GROUND - 3, GROUND - 2],
  ] as [string, number, number][],
};
