// 150 BLOCKS' two kinds of picture, both cut into 20 x 20 blocks: a stone tower drawn as one big picture
// (every block of it different), and a row of little houses made of a handful of blocks used again and
// again. Both are scenery: Kit walks right through them, because a block is solid only if it is told to be.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { speckle } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book, PULL } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The tower is this many blocks wide and high. */
export const TOWER = { w: 4, h: 5 } as const;
/** A house is this many blocks wide and high. */
export const HOUSE = { w: 2, h: 2 } as const;

const air = { grav: PULL.down };

/** Adds the blocks of `pic` (cut into w x h blocks) named `${name}.${col}${row}`; a piece that is only sky, or the same as a block already in the book, reuses that block. Returns the names, row by row. */
export function addPicture(book: Book, name: string, pic: Pixels, w: number, h: number): string[][] {
  const same = (a: Pixels) => {
    for (const [n, q] of book.pics) if (q.px.length === a.px.length && q.px.every((v, i) => v === a.px[i])) return n;
    return undefined;
  };
  const rows: string[][] = [];
  for (let row = 0; row < h; row++) {
    rows.push([]);
    for (let col = 0; col < w; col++) {
      const tile = pic.crop(col * 20, row * 20, 20, 20);
      const id = same(tile) ?? `${name}.${col}${row}`;
      if (!book.has(id)) book.add(id, tile, air);
      rows[row].push(id);
    }
  }
  return rows;
}

/** The tower: crenellated stone with a pennant, two arrow slits and an arched door, on sky. 80 x 100 pixels. */
export function towerPicture(pal: Pal): Pixels {
  const { c, r } = pal;
  const st = r('stone');
  const p = new Pixels(TOWER.w * 20, TOWER.h * 20, skyOf(pal));
  // the pennant on its pole
  p.rect(39, 0, 2, 22, c('wood', 1)).rect(39, 0, 1, 22, c('wood', 3));
  for (let i = 0; i < 9; i++) p.rect(41, 2 + i, 12 - i, 1, c('red', 2)).set(41, 2 + i, c('red', 3));
  // the walls: a body, three merlons and gaps between them
  p.rect(12, 30, 56, 70, st[2]);
  for (const x of [12, 30, 48, 62]) p.rect(x, 20, x === 62 ? 6 : 12, 10, st[2]);
  p.rect(12, 30, 56, 2, st[3]);
  // stones: rows of blocks with a dark line between, each a little different
  const rand = rng(41);
  for (let y = 32; y < 100; y += 6) {
    for (let x = 12 + ((y / 6) % 2) * 5; x < 68; x += 10) {
      const w = Math.min(9, 68 - x);
      p.rect(x, y, w, 5, st[2 + (rand() < 0.4 ? 1 : 0) - (rand() < 0.25 ? 1 : 0)]);
      p.rect(x, y + 5, w, 1, st[0]);
    }
  }
  for (let y = 20; y < 30; y += 6) p.rect(12, y + 4, 56, 1, st[1]);
  speckle(p, 12, 32, 56, 68, st, 2, 1, 7, 0.1);
  // left edge light, right edge shade
  p.rect(12, 30, 2, 70, st[4]).rect(66, 30, 2, 70, st[0]);
  // two arrow slits (a narrow slot under a round top; no crossbars)
  for (const x of [24, 52]) {
    p.rect(x, 46, 4, 12, c('ink', 0)).rect(x + 1, 44, 2, 2, c('ink', 0));
  }
  // the arched door
  p.rect(30, 76, 20, 24, c('wood', 1)).rect(32, 72, 16, 6, c('wood', 1)).rect(35, 70, 10, 4, c('wood', 1));
  p.rect(32, 78, 16, 22, c('wood', 2)).rect(34, 74, 12, 4, c('wood', 2));
  for (const x of [36, 40, 44]) p.rect(x, 76, 1, 24, c('wood', 1));
  p.set(45, 90, c('gold', 3)).set(45, 91, c('gold', 3));
  return p;
}

/** One house in a roof color (`red` or `blue`): a 40 x 40 picture with a window on the left of its wall and a door on the right. */
function housePicture(pal: Pal, roof: 'red' | 'blue'): Pixels {
  const { c, r } = pal;
  const rf = r(roof);
  const p = new Pixels(40, 40, skyOf(pal));
  // the roof: a hip of rows, wider as it goes down
  for (let y = 0; y < 20; y++) {
    const inset = Math.max(0, 14 - Math.floor(y * 0.7));
    p.rect(inset, y, 40 - 2 * inset, 1, y % 5 === 4 ? rf[1] : rf[2]);
    if (y % 5 === 0) p.rect(inset, y, 40 - 2 * inset, 1, rf[3]);
  }
  p.rect(0, 19, 40, 1, rf[0]);
  // the wall
  p.rect(3, 20, 34, 20, c('parch', 3)).rect(3, 20, 34, 1, c('parch', 2)).rect(3, 39, 34, 1, c('parch', 1));
  // a window with four panes
  p.rect(8, 25, 11, 9, c('wood', 1)).rect(9, 26, 9, 7, c('sky', 2)).rect(13, 26, 1, 7, c('wood', 1)).rect(9, 29, 9, 1, c('wood', 1));
  p.rect(9, 26, 3, 1, c('sky', 4));
  // a door with a knob
  p.rect(24, 27, 9, 13, c('wood', 1)).rect(25, 28, 7, 12, c('wood', 3)).set(30, 34, c('gold', 3));
  return p;
}

/** The names of the village's blocks, cut from a red-roofed and a blue-roofed house. */
export function addHouses(book: Book, pal: Pal): { red: string[][]; blue: string[][] } {
  return {
    red: addPicture(book, 'house.red', housePicture(pal, 'red'), HOUSE.w, HOUSE.h),
    blue: addPicture(book, 'house.blue', housePicture(pal, 'blue'), HOUSE.w, HOUSE.h),
  };
}
