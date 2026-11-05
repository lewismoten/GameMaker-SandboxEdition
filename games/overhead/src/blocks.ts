// The block set (over.bbl) both levels share: the same grid of 20x20 blocks, drawn as seen from above. Every block has
// Gravity "none" (Book's default), so nothing pulls the hero; a block is solid only where it has a side that stops him.
//
//   inside: floor, rug, wall, bed (head, foot), table (4 blocks), shelf, plant, counter, door, coin
//   outside: grass, flower, tree, fence, water, road, the house (roofs, walls, window, door), gcoin
//
// Everything he can bump into is drawn like what it is (no solid block looks like open ground), and a sign is an
// ordinary block set on whichever floor it stands.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book, SOLID } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { skyOf } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';

const N = 20;

/** The floors the pictures stand on, as 20x20 copies to draw over. */
export interface Ground {
  grass: Pixels;
  floor: Pixels;
}

function grassTile(pal: Pal): Pixels {
  const g = pal.r('grass');
  const p = new Pixels(N, N, g[2]);
  const rand = rng(77);
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(rand() * 19);
    const y = Math.floor(rand() * 18);
    p.set(x, y + 1, g[1]).set(x, y, i % 3 ? g[3] : g[4]);
  }
  return p;
}

/** Boards laid across, with a seam here and there. */
function floorTile(pal: Pal): Pixels {
  const w = pal.r('wood');
  const p = new Pixels(N, N, w[3]);
  for (const y of [0, 5, 10, 15]) p.rect(0, y, N, 1, w[2]);
  for (const [x, y] of [
    [6, 1],
    [14, 6],
    [3, 11],
    [11, 16],
  ] as const)
    p.rect(x, y, 1, 4, w[2]);
  p.set(2, 3, w[4]).set(16, 8, w[4]).set(9, 13, w[4]).set(18, 18, w[4]);
  return p;
}

/** `pic` with its sky colored pixels showing `under` instead (a picture drawn on sky, put on a floor). */
const onto = (pic: Pixels, pal: Pal, under: Pixels): Pixels => pic.crop(0, 0, pic.w, pic.h).map((x, y, c) => (c === skyOf(pal) ? under.get(x % N, y % N) : c));

/** A sign for this game: the Starters' wooden board and posts, standing on `under`. */
export function addOverSign(book: Book, pal: Pal, under: Pixels, name: string, text: string, w: number, h: number): Sign {
  const scratch = new Book('bbl');
  const sign = addSign(scratch, pal, name, text, w, h);
  for (const [n, pic] of scratch.pics) if (!book.has(n)) book.add(n, onto(pic, pal, under));
  return sign;
}

/** Cuts a picture into tiles and adds them as `<name>.<col><row>`; `rules` is for all of them. */
function cut(book: Book, name: string, pic: Pixels, cols: number, rows: number, rules: Parameters<Book['add']>[2] = {}): void {
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) book.add(`${name}.${x}${y}`, pic.crop(x * N, y * N, N, N), rules);
}

/** The whole block set, and the two floors the signs and pictures stand on. */
export function addOverBlocks(book: Book, pal: Pal): Ground {
  const { c, r } = pal;
  const ink = c('ink', 0);
  const grass = grassTile(pal);
  const floor = floorTile(pal);
  book.add('grass', grass);
  book.add('floor', floor);
  {
    // the rug: a woven red mat with a gold zigzag, laid over the boards
    const red = r('red');
    const gold = r('gold');
    const p = new Pixels(N, N, red[2]);
    for (let y = 0; y < N; y += 2) p.rect(0, y, N, 1, red[1]);
    for (let x = 0; x < N; x += 5)
      p.set(x, 9, gold[3])
        .set(x + 1, 10, gold[3])
        .set(x + 2, 11, gold[3])
        .set(x + 3, 10, gold[3])
        .set(x + 4, 9, gold[3]);
    book.add('rug', p);
  }
  {
    // the room's wall seen from above: brick in courses
    const b = r('brick');
    const p = new Pixels(N, N, b[2]);
    for (const y of [0, 5, 10, 15]) p.rect(0, y, N, 1, b[0]);
    for (const [y, xs] of [
      [0, [4, 14]],
      [5, [9, 19]],
      [10, [4, 14]],
      [15, [9, 19]],
    ] as const)
      for (const x of xs) p.rect(x, y, 1, 5, b[0]);
    for (const [x, y] of [
      [1, 1],
      [11, 6],
      [6, 11],
      [16, 16],
    ] as const)
      p.rect(x, y, 2, 1, b[4]);
    p.rect(0, 0, N, 1, b[1]);
    book.add('wall', p, { solid: SOLID });
  }
  {
    // a bed from above: pillow at the head, a green quilt over the rest, two blocks long
    const q = new Pixels(N, 2 * N);
    q.px.set(floor.px);
    q.px.set(floor.px, N * N);
    const w = r('white');
    const gr = r('green');
    const wo = r('wood');
    bevel(q, 1, 1, 18, 38, wo, 1, 1);
    q.rect(3, 3, 14, 8, w[3]).frame(3, 3, 14, 8, w[1]).rect(5, 5, 10, 1, w[2]);
    q.rect(3, 12, 14, 24, gr[2]).frame(3, 12, 14, 24, gr[0]).rect(3, 12, 14, 3, w[3]);
    for (let y = 18; y < 34; y += 4) q.rect(5, y, 10, 1, gr[3]);
    cut(book, 'bed', q, 1, 2, { solid: SOLID });
  }
  {
    // a table 2x2 from above: a wooden top with a cloth and a bowl
    const q = new Pixels(2 * N, 2 * N, c('ink', 0));
    for (let i = 0; i < 4; i++) q.blit(floor, (i % 2) * N, Math.floor(i / 2) * N);
    const wo = r('wood');
    bevel(q, 2, 2, 36, 36, wo, 2, 2);
    q.rect(5, 5, 30, 30, c('white', 3)).frame(5, 5, 30, 30, c('blue', 2));
    for (let i = 7; i < 33; i += 4) q.rect(i, 5, 1, 30, c('blue', 3)).rect(5, i, 30, 1, c('blue', 3));
    q.disc(20, 20, 6.5, ink).disc(20, 20, 6, c('orange', 2)).disc(20, 19, 4.5, c('orange', 3)).disc(18, 17, 1.4, c('gold', 5));
    cut(book, 'table', q, 2, 2, { solid: SOLID });
  }
  {
    // a bookshelf seen from above and a little in front: rows of colored spines
    const p = floor.crop(0, 0, N, N);
    const wo = r('wood');
    p.rect(0, 0, N, 14, wo[1]).rect(0, 0, N, 1, wo[0]);
    const spines = [c('red', 2), c('blue', 2), c('green', 2), c('gold', 3), c('purple', 2), c('orange', 3)];
    for (let i = 0; i < 6; i++) p.rect(1 + i * 3, 2, 2, 5, spines[i]).rect(1 + i * 3, 8, 2, 4, spines[(i + 3) % 6]);
    p.rect(0, 7, N, 1, wo[3]).rect(0, 13, N, 1, wo[3]).rect(0, 14, N, 2, wo[0]);
    book.add('shelf', p, { solid: SOLID });
  }
  {
    // a plant in a pot (solid): leaves round a clay pot
    const p = floor.crop(0, 0, N, N);
    p.disc(10, 10, 8.5, ink).disc(10, 10, 8, c('dirt', 3)).disc(10, 10, 6, c('dirt', 1));
    const g = r('grass');
    for (const [x, y, rad] of [
      [10, 8, 4.2],
      [7, 11, 3.4],
      [13, 11, 3.4],
      [10, 12, 3.2],
    ] as const)
      p.disc(x, y, rad + 0.7, c('green', 0))
        .disc(x, y, rad, g[2])
        .disc(x - 1, y - 1, rad - 1.6, g[3]);
    p.set(10, 8, g[5]);
    book.add('plant', p, { solid: SOLID });
  }
  {
    // the shop's counter: a long wooden top with a lip
    const p = floor.crop(0, 0, N, N);
    const wo = r('wood');
    bevel(p, 0, 2, N, 16, wo, 2, 2);
    p.rect(0, 5, N, 1, wo[4]).rect(0, 14, N, 1, wo[0]);
    book.add('counter', p, { solid: SOLID });
  }
  {
    // the door in a wall seen from above: planks in a frame with a gold knob (passable; the level's link sits on it)
    const wo = r('wood');
    const p = new Pixels(N, N, wo[0]);
    p.rect(2, 1, 16, 18, wo[3]).frame(2, 1, 16, 18, ink);
    for (const x of [6, 10, 14]) p.rect(x, 2, 1, 16, wo[1]);
    p.rect(2, 2, 16, 1, wo[4]);
    p.disc(15, 10, 1.6, c('gold', 5)).set(15, 10, c('gold', 2));
    book.add('door', p);
  }
  book.add('coin', coinOn(pal, floor), { score: 10, touch: 'floor' });
  book.add('gcoin', coinOn(pal, grass), { score: 10, touch: 'grass' });
  // outside
  {
    const p = grass.crop(0, 0, N, N);
    for (const [x, y, col] of [
      [6, 6, c('pink', 2)],
      [13, 8, c('gold', 4)],
      [8, 13, c('white', 3)],
      [14, 14, c('pink', 2)],
    ] as const) {
      p.disc(x, y, 2.4, col).set(x, y, c('gold', 5));
      p.rect(x, y + 3, 1, 2, r('green')[2]);
    }
    book.add('flower', p);
  }
  {
    // a tree from above: a round dark-green crown with a lighter top
    const g = r('grass');
    const p = grass.crop(0, 0, N, N);
    p.disc(10.5, 11.5, 9, ink).disc(10, 11, 8.6, g[0]).disc(10, 10, 8, g[1]).disc(9, 8.5, 6.4, g[2]).disc(8, 7, 3.8, g[3]);
    for (const [x, y] of [
      [5, 12],
      [12, 14],
      [14, 8],
      [9, 4],
    ] as const)
      p.rect(x, y, 2, 1, g[0]);
    book.add('tree', p, { solid: SOLID });
  }
  {
    // a fence: two rails and posts, along the row (solid)
    const wo = r('wood');
    const p = grass.crop(0, 0, N, N);
    p.rect(0, 7, N, 3, wo[3]).rect(0, 7, N, 1, wo[4]).rect(0, 9, N, 1, wo[1]);
    p.rect(0, 13, N, 3, wo[3]).rect(0, 13, N, 1, wo[4]).rect(0, 15, N, 1, wo[1]);
    for (const x of [1, 14])
      p.rect(x, 4, 4, 14, wo[2])
        .frame(x, 4, 4, 14, wo[0])
        .rect(x + 1, 5, 1, 12, wo[4]);
    book.add('fence', p, { solid: SOLID });
  }
  {
    // water: blue with pale ripples
    const bl = r('blue');
    const sk = r('sky');
    const p = new Pixels(N, N, bl[2]);
    for (const [x, y] of [
      [2, 3],
      [11, 7],
      [5, 12],
      [14, 16],
    ] as const)
      p.rect(x, y, 5, 1, sk[3]).rect(x + 1, y + 1, 3, 1, bl[3]);
    for (const [x, y] of [
      [14, 2],
      [1, 8],
      [10, 13],
    ] as const)
      p.rect(x, y, 3, 1, bl[3]);
    book.add('water', p, { solid: SOLID });
  }
  {
    // the road: packed earth with a few pebbles
    const d = r('dirt');
    const p = new Pixels(N, N, d[3]);
    const rand = rng(12);
    for (let i = 0; i < 14; i++) p.set(Math.floor(rand() * N), Math.floor(rand() * N), d[i % 2 ? 2 : 4]);
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(rand() * 15);
      const y = 2 + Math.floor(rand() * 15);
      p.rect(x, y, 3, 2, c('stone', 3)).rect(x, y, 3, 1, c('stone', 4));
    }
    book.add('road', p);
  }
  {
    // the house, 3x2 blocks seen from the front and a little above: a red tiled roof, walls, a window either side of the door
    const q = new Pixels(3 * N, 2 * N);
    for (let i = 0; i < 3; i++) q.blit(grass, i * N, N);
    for (let i = 0; i < 3; i++) q.blit(grass, i * N, 0);
    const rf = r('brick');
    const st = r('parch');
    q.rect(0, 2, 3 * N, N - 2, ink).rect(1, 3, 3 * N - 2, N - 4, rf[2]);
    for (let y = 3; y < N - 1; y += 4) q.rect(1, y, 3 * N - 2, 1, rf[0]);
    for (let y = 5; y < N - 1; y += 4) for (let x = (y % 8 ? 0 : 3) + 1; x < 3 * N - 1; x += 6) q.rect(x, y, 1, 3, rf[1]);
    q.rect(1, 3, 3 * N - 2, 1, rf[4]);
    q.rect(0, N, 3 * N, N - 1, ink).rect(1, N, 3 * N - 2, N - 2, st[3]);
    for (let y = N + 4; y < 2 * N - 2; y += 5) q.rect(1, y, 3 * N - 2, 1, st[2]);
    for (const x of [6, 46]) {
      q.rect(x, N + 5, 9, 9, ink)
        .rect(x + 1, N + 6, 7, 7, c('sky', 3))
        .rect(x + 1, N + 6, 7, 2, c('sky', 5));
      q.rect(x + 4, N + 6, 1, 7, ink).rect(x + 1, N + 9, 7, 1, ink);
    }
    cut(book, 'house', q, 3, 2, { solid: SOLID });
    // the house's door replaces the middle wall block: passable, with the link on it
    const wo = r('wood');
    const door = new Pixels(N, N, ink);
    door.rect(0, 0, N, N, st[3]);
    door.rect(3, 2, 14, 18, ink).rect(4, 3, 12, 17, wo[3]);
    for (const x of [8, 12]) door.rect(x, 3, 1, 17, wo[1]);
    door.rect(4, 3, 12, 1, wo[4]).disc(14, 12, 1.4, c('gold', 5));
    book.add('hdoor', door);
  }
  return { grass, floor };
}

/** A coin lying on `under`: a gold disc with a shine and a shadow. */
function coinOn(pal: Pal, under: Pixels): Pixels {
  const { c } = pal;
  const p = under.crop(0, 0, N, N);
  p.disc(10.5, 12, 6, c('ink', 1)).disc(10, 10, 6.4, c('gold', 1)).disc(10, 10, 5.4, c('gold', 4)).disc(10, 10, 3.4, c('gold', 3));
  p.rect(9, 7, 2, 6, c('gold', 1)).set(7, 7, c('gold', 5)).set(8, 6, c('gold', 5));
  return p;
}
