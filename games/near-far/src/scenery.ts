// NEAR AND FAR's scenery: the same kinds of things drawn twice, once big and clear for the near plane and once
// small for the far plane (the far scene also loads a paler palette, see haze.ts). A block is 20 x 20 pixels,
// so "small" here is a drawing half the size standing on the same ground line. Nothing is blurred: every
// picture is drawn that way.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** A picture half the size: each 2 x 2 patch becomes the first pixel in it that is not `sky`. */
export function half(p: Pixels, sky: number): Pixels {
  const out = new Pixels(p.w >> 1, p.h >> 1, sky);
  for (let y = 0; y < out.h; y++)
    for (let x = 0; x < out.w; x++) {
      const cells = [p.get(2 * x, 2 * y), p.get(2 * x + 1, 2 * y), p.get(2 * x, 2 * y + 1), p.get(2 * x + 1, 2 * y + 1)];
      out.set(x, y, cells.find((c) => c !== sky) ?? sky);
    }
  return out;
}

/** The big tree, 40 x 60 (two blocks wide, three high): a round leafy crown on a thick trunk. */
export function bigTreePicture(pal: Pal): Pixels {
  const g = pal.r('grass');
  const w = pal.r('wood');
  const p = new Pixels(40, 60, skyOf(pal));
  p.rect(16, 34, 8, 26, w[2]).rect(16, 34, 2, 26, w[3]).rect(22, 34, 2, 26, w[1]);
  p.rect(13, 54, 14, 6, w[2]).rect(13, 54, 3, 6, w[3]).rect(24, 54, 3, 6, w[1]);
  p.rect(18, 40, 1, 6, w[1]).rect(20, 46, 1, 5, w[1]);
  const crown: [number, number, number][] = [
    [20, 20, 18],
    [10, 30, 11],
    [30, 30, 11],
    [20, 36, 12],
  ];
  for (const [x, y, r] of crown) p.disc(x, y, r, g[1]);
  for (const [x, y, r] of crown) p.disc(x - 1, y - 2, r - 2, g[2]);
  for (const [x, y, r] of crown) p.disc(x - 3, y - 4, r - 6, g[3]);
  const rand = rng(12);
  for (let i = 0; i < 18; i++) p.disc(8 + Math.floor(rand() * 24), 8 + Math.floor(rand() * 22), 1, g[4]);
  return p;
}

/** The hedge arch with a view through it: a trail running away between low hills (into the distance) or a big bush and flower near the edge (back to the near side). 20 x 40. */
function archPicture(pal: Pal, into: boolean): Pixels {
  const g = pal.r('grass');
  const d = pal.r('parch');
  const sky = skyOf(pal);
  const p = new Pixels(20, 40, sky);
  p.disc(10, 12, 10, g[2]).rect(0, 12, 20, 28, g[2]);
  const rand = rng(into ? 4 : 9);
  for (let i = 0; i < 40; i++) p.set(Math.floor(rand() * 20), 6 + Math.floor(rand() * 34), g[i % 3 === 0 ? 1 : 3]);
  p.rect(0, 12, 2, 28, g[1]).rect(18, 12, 2, 28, g[1]);
  // the opening
  p.rect(5, 12, 10, 28, pal.c('sky', 4)).rect(6, 10, 8, 2, pal.c('sky', 4)).rect(7, 9, 6, 1, pal.c('sky', 4));
  if (into) {
    p.disc(5, 28, 8, g[3]).disc(15, 30, 9, g[3]).rect(5, 28, 10, 12, g[3]);
    p.disc(10, 26, 5, g[4]).rect(5, 30, 10, 10, g[3]);
    p.rect(9, 21, 2, 4, pal.c('wood', 2)).disc(10, 20, 2, g[1]);
    // the trail: a narrow strip at the top that widens to the bottom
    for (let y = 26; y < 40; y++) {
      const half = 1 + Math.floor(((y - 26) * 4) / 13);
      p.rect(10 - half, y, half * 2, 1, d[y % 5 === 0 ? 2 : 3]);
    }
  } else {
    p.rect(5, 26, 10, 14, g[3]);
    p.disc(7, 33, 5, g[1]).disc(7, 32, 4, g[2]).disc(6, 31, 2, g[3]);
    p.rect(12, 28, 1, 12, g[1]).disc(12, 27, 2, pal.c('red', 2)).disc(12, 27, 1, pal.c('gold', 3));
    p.rect(9, 36, 6, 4, d[3]);
  }
  p.rect(5, 12, 1, 28, g[0]).rect(14, 12, 1, 28, g[0]);
  return p;
}

/** A fence of three pickets: `h` pixels tall, standing on the bottom of a 20 x 20 block. */
function fencePicture(pal: Pal, scale: number): Pixels {
  const w = pal.r('wood');
  const p = new Pixels(20, 20, skyOf(pal));
  const top = scale === 1 ? 4 : 12;
  const bottom = 19;
  const postW = scale === 1 ? 4 : 2;
  const xs = scale === 1 ? [1, 8, 15] : [2, 9, 16];
  for (const x of xs) p.rect(x, top, postW, bottom - top + 1, w[3]).rect(x, top, postW, 1, w[4]).rect(x + postW - 1, top, 1, bottom - top + 1, w[1]);
  const rail = scale === 1 ? 3 : 2;
  p.rect(0, top + 3, 20, rail, w[2]).rect(0, top + 3, 20, 1, w[4]);
  p.rect(0, top + 3 + (scale === 1 ? 7 : 4), 20, rail, w[2]).rect(0, top + 3 + (scale === 1 ? 7 : 4), 20, 1, w[4]);
  return p;
}

/** The far plane's house, 40 x 20: walls, a red roof, a door and two windows, half the size of a near one would be. */
function housePicture(pal: Pal): Pixels {
  const sky = skyOf(pal);
  const p = new Pixels(40, 20, sky);
  const r = pal.r('red');
  const s = pal.r('parch');
  p.rect(5, 9, 30, 11, s[3]).rect(5, 9, 30, 1, s[4]).rect(5, 19, 30, 1, s[1]);
  for (let y = 0; y < 8; y++) p.rect(3 + y * 1, 1 + y, 34 - y * 2, 1, y % 3 === 0 ? r[3] : r[2]);
  p.rect(3, 8, 34, 1, r[1]);
  p.rect(18, 12, 5, 8, pal.c('wood', 2)).rect(18, 12, 5, 1, pal.c('wood', 4)).set(21, 16, pal.c('gold', 3));
  p.rect(8, 12, 5, 4, pal.c('blue', 4)).frame(8, 12, 5, 4, pal.c('wood', 1));
  p.rect(28, 12, 5, 4, pal.c('blue', 4)).frame(28, 12, 5, 4, pal.c('wood', 1));
  return p;
}

/** A low green mound, 20 x 20, standing on the ground. */
function moundPicture(pal: Pal): Pixels {
  const g = pal.r('grass');
  const p = new Pixels(20, 20, skyOf(pal));
  p.disc(10, 22, 11, g[2]).disc(9, 21, 9, g[3]);
  for (let x = 4; x < 16; x += 3) p.set(x, 13 + (x % 2), g[4]);
  return p;
}

/** A far mountain, 40 x 40 (two blocks wide and high): a gray slope with a white cap. */
function peakPicture(pal: Pal): Pixels {
  const s = pal.r('stone');
  const p = new Pixels(40, 40, skyOf(pal));
  for (let y = 0; y < 40; y++) {
    const halfW = 2 + Math.floor((y * 18) / 39);
    for (let x = 20 - halfW; x < 20 + halfW; x++) {
      const cap = y < 11 + Math.abs(x - 20) % 3;
      p.set(x, y, cap ? pal.c('white', 3) : x < 20 ? s[2] : s[1]);
    }
  }
  const rand = rng(7);
  for (let i = 0; i < 20; i++) p.set(12 + Math.floor(rand() * 16), 16 + Math.floor(rand() * 22), s[3]);
  return p;
}

/** A cliff face, 20 x 20: layers of rock. It tiles, so a tall wall of it is one drawing. */
function cliffPicture(pal: Pal): Pixels {
  const s = pal.r('stone');
  const p = new Pixels(20, 20, s[2]);
  const rand = rng(21);
  for (let i = 0; i < 40; i++) p.set(Math.floor(rand() * 20), Math.floor(rand() * 20), s[i % 2 ? 1 : 3]);
  for (const y of [4, 10, 16]) p.rect(0, y, 20, 1, s[0]).rect(0, y + 1, 20, 1, s[3]);
  for (const [x, y] of [
    [5, 0],
    [14, 6],
    [9, 12],
    [3, 17],
  ])
    p.rect(x, y, 1, 4, s[0]);
  return p;
}

/** A hedge wall of finer leaves for the far plane (solid, like `edge`). */
function farEdgePicture(pal: Pal): Pixels {
  const g = pal.r('grass');
  const p = new Pixels(20, 20, g[2]);
  const rand = rng(33);
  for (let i = 0; i < 70; i++) p.disc(Math.floor(rand() * 20), Math.floor(rand() * 20), 1, g[i % 3 === 0 ? 1 : 3]);
  p.rect(0, 0, 1, 20, g[0]).rect(19, 0, 1, 20, g[0]);
  return p;
}

/** Grass with finer blades and a thinner top, for the far plane (solid, like `grass`). */
function farGrassPicture(pal: Pal): Pixels {
  const g = pal.r('grass');
  const d = pal.r('dirt');
  const p = new Pixels(20, 20, d[3]);
  const rand = rng(5);
  for (let i = 0; i < 40; i++) p.set(Math.floor(rand() * 20), 5 + Math.floor(rand() * 15), d[i % 2 ? 2 : 4]);
  for (let x = 0; x < 20; x++) {
    const h = 3 + ((x * 5) % 4 === 0 ? 1 : 0);
    for (let y = 0; y < h; y++) p.set(x, y, y === 0 ? g[5] : y < 2 ? g[4] : g[3]);
    p.set(x, h, d[1]);
  }
  return p;
}

/** The names of one picture cut into blocks: `name.<col><row>`. */
function cut(book: Book, name: string, pic: Pixels, rules: Parameters<Book['add']>[2]): string[][] {
  const out: string[][] = [];
  for (let row = 0; row < pic.h / 20; row++) {
    out.push([]);
    for (let col = 0; col < pic.w / 20; col++) {
      const id = `${name}.${col}${row}`;
      out[row].push(id);
      book.add(id, pic.crop(col * 20, row * 20, 20, 20), rules);
    }
  }
  return out;
}

/** The block names of each piece of scenery, rows from the top. */
export interface Scenery {
  bigTree: string[][];
  bigFence: string;
  farTree: string[][];
  farHouse: string[][];
  farFence: string;
  mound: string;
  peak: string[][];
  trailInto: string[][];
  trailBack: string[][];
}

/** Adds the near and far blocks to `book`, after the Starter blocks and before the signs. */
export function addScenery(book: Book, pal: Pal): Scenery {
  const air = { grav: PULL.down };
  const sky = skyOf(pal);
  const bigTree = cut(book, 'bigTree', bigTreePicture(pal), air);
  book.add('bigFence', fencePicture(pal, 1), air);
  const small = half(bigTreePicture(pal), sky);
  const farTreePic = new Pixels(20, 40, sky);
  farTreePic.blit(small, 0, 10, sky);
  const farTree = cut(book, 'farTree', farTreePic, air);
  const farHouse = cut(book, 'farHouse', housePicture(pal), air);
  book.add('farFence', fencePicture(pal, 2), air);
  book.add('mound', moundPicture(pal), air);
  const peak = cut(book, 'peak', peakPicture(pal), air);
  book.add('cliff', cliffPicture(pal), { ...air, solid: SOLID });
  book.add('farEdge', farEdgePicture(pal), { ...air, solid: SOLID });
  book.add('farGrass', farGrassPicture(pal), { solid: SOLID });
  const trailInto = cut(book, 'trailInto', archPicture(pal, true), air);
  const trailBack = cut(book, 'trailBack', archPicture(pal, false), air);
  return { bigTree, bigFence: 'bigFence', farTree, farHouse, farFence: 'farFence', mound: 'mound', peak, trailInto, trailBack };
}
