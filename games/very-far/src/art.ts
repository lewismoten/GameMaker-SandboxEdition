// WALKING VERY FAR's scenery. Everything that makes a place look far away is drawn here, in 20 x 20 blocks:
//   hills in four layers, each paler and smoother than the one in front, with a road that narrows as it climbs
//   a ridge to walk on (a path along its crest), and a slope below it
//   pine groves at the edges (solid, so no wall is invisible) and a tiny gate at the end of a path
//   big things in front (a fence and flowers, as big as a near scene's) for the last level
//  Nothing is blurred or shrunk while the game runs.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The names of one picture cut into blocks, `rows` of `cols`; a block that matches an earlier one is reused. */
function cut(book: Book, name: string, pic: Pixels, rules: Parameters<Book['add']>[2], seen: Map<string, string>): string[][] {
  const out: string[][] = [];
  for (let row = 0; row < pic.h / 20; row++) {
    out.push([]);
    for (let col = 0; col < pic.w / 20; col++) {
      const tile = pic.crop(col * 20, row * 20, 20, 20);
      const key = tile.px.join(',');
      let id = seen.get(key);
      if (!id) {
        id = `${name}.${col}${row}`;
        seen.set(key, id);
        book.add(id, tile, rules);
      }
      out[row].push(id);
    }
  }
  return out;
}

/** The hills behind the path, 320 x 120: four layers from far (palest, top) to near, and a narrowing road. The picture repeats every 160 pixels (8 blocks), so it costs half the blocks. */
export function landscapePicture(pal: Pal): Pixels {
  const d = pal.r('dist');
  const half = new Pixels(160, 120, skyOf(pal));
  const tau = (k: number, x: number, ph: number) => Math.sin((2 * Math.PI * k * x) / 160 + ph);
  const layers = [
    { color: d[4], base: 64, amp: 9, k: [1, 3], ph: [0.7, 2.1] },
    { color: d[3], base: 78, amp: 8, k: [2, 3], ph: [2.4, 0.4] },
    { color: d[2], base: 91, amp: 7, k: [2, 5], ph: [1.2, 3.3] },
    { color: d[1], base: 100, amp: 0, k: [3, 6], ph: [0.2, 1.6] },
  ];
  const top = (l: (typeof layers)[number], x: number) => Math.round(l.base + l.amp * (0.6 * tau(l.k[0], x, l.ph[0]) + 0.4 * tau(l.k[1], x, l.ph[1])));
  layers.forEach((l, i) => {
    for (let x = 0; x < 160; x++) {
      const y = top(l, x);
      half.rect(x, y, 1, 120 - y, l.color);
      if (l.amp) half.set(x, y, d[Math.min(4, 5 - i)]);
    }
    if (i === 2) {
      // the road: it climbs the hills in a few bends and narrows as it goes, from 5 pixels to 1
      for (let y = 100; y >= 78; y--) {
        const t = (100 - y) / 22;
        const cx = Math.round(60 + 22 * Math.sin(t * 5.2) + t * 20);
        const wide = Math.max(0, Math.round(2.5 * (1 - t)));
        half.rect(cx - wide, y, wide * 2 + 1, 1, pal.c('parch', 3));
      }
    }
  });
  return new Pixels(320, 120, skyOf(pal)).blit(half, 0, 0).blit(half, 160, 0);
}

/** The path along the ridge: a solid block with a tan path on top, grass below. */
function ridgePicture(pal: Pal): Pixels {
  const g = pal.r('grass');
  const p = new Pixels(20, 20, g[2]);
  const rand = rng(14);
  for (let i = 0; i < 30; i++) p.set(Math.floor(rand() * 20), 3 + Math.floor(rand() * 17), g[i % 2 ? 1 : 3]);
  p.rect(0, 0, 20, 2, pal.c('parch', 2)).rect(0, 2, 20, 1, pal.c('parch', 1));
  for (let x = 1; x < 20; x += 5) p.set(x, 0, pal.c('parch', 3));
  return p;
}

/** The slope under the ridge, a band of field for each row: lighter up high, deeper nearer to you. The same pattern in every block of a band. */
function slopePicture(pal: Pal, band: 0 | 1 | 2): Pixels {
  const g = pal.r('grass');
  const p = new Pixels(20, 20, g[[3, 2, 2][band]]);
  const dot = g[[4, 3, 1][band]];
  for (let x = 0; x < 20; x += 4) p.set(x + (band % 2 ? 2 : 0), 3 + ((x * 3) % 7), dot);
  for (let x = 1; x < 20; x += 5) p.set(x, 12 + (x % 3), g[[2, 1, 3][band]]);
  p.rect(0, 0, 20, 1, g[[4, 3, 3][band]]);
  return p;
}

/** A grove of pines at a path's end, solid, so nothing that stops Kit is invisible: `cap` is the tops of two pines over the hills behind, the other block is the dark foliage under them. */
function grovePicture(pal: Pal, cap: boolean, behind: Pixels): Pixels {
  const g = pal.r('green');
  const p = cap ? behind.crop(0, 0, 20, 20) : new Pixels(20, 20, g[1]);
  if (cap) {
    for (const [cx, top] of [
      [6, 2],
      [14, 7],
    ])
      for (let y = top; y < 20; y++) {
        const half = Math.round(((y - top) * 5.5) / (20 - top)) + (y > top ? 1 : 0);
        p.rect(cx - half, y, half * 2 + 1, 1, y % 4 === 3 ? g[0] : g[1]);
      }
    return p;
  }
  const rand = rng(8);
  for (let i = 0; i < 40; i++) p.set(Math.floor(rand() * 20), Math.floor(rand() * 20), i % 3 ? g[0] : g[2]);
  return p;
}

/** A sign post, 4 wide at column `x`, standing on the ground in front of the nearest hill (row 5 of the landscape is that hill's flat color). */
function postPicture(pal: Pal, x: number, land: Pixels): Pixels {
  const w = pal.r('wood');
  const p = land.crop(0, 100, 20, 20);
  p.rect(x, 0, 4, 20, w[2])
    .rect(x, 0, 1, 20, w[4])
    .rect(x + 3, 0, 1, 20, w[1]);
  return p;
}

/** The gate that ends a far path: two little posts, a bar between them and a red flag, standing on the bottom of the block. */
function gatePicture(pal: Pal, land: Pixels): Pixels {
  const w = pal.r('wood');
  const p = land.crop(0, 100, 20, 20);
  p.rect(5, 10, 2, 10, w[3]).rect(13, 10, 2, 10, w[3]).rect(5, 12, 10, 1, w[2]);
  p.rect(7, 4, 1, 6, w[1]).rect(8, 4, 4, 3, pal.c('red', 2));
  return p;
}

/** The big things in front, 160 x 60 (it repeats every 8 blocks): a fence of wide posts along the bottom with two tall flowers growing up behind it. */
export function foregroundPicture(pal: Pal): Pixels {
  const w = pal.r('wood');
  const g = pal.r('green');
  const p = new Pixels(160, 60, pal.c('grass', 2));
  for (let x = 0; x < 160; x += 20) for (let y = 0; y < 60; y += 20) p.blit(slopePicture(pal, (y / 20) as 0 | 1 | 2), x, y);
  const flowers: [number, number, number][] = [
    [44, 15, pal.c('red', 2)],
    [124, 21, pal.c('gold', 3)],
  ];
  for (const [x, y, petal] of flowers) {
    p.rect(x - 1, y + 8, 3, 52 - y, g[2]).rect(x - 1, y + 8, 1, 52 - y, g[3]);
    p.rect(x + 2, y + 30, 8, 2, g[2]).disc(x + 10, y + 29, 3, g[3]);
    for (let a = 0; a < 6; a++) p.disc(Math.round(x + 8 * Math.cos((a * Math.PI) / 3)), Math.round(y + 8 * Math.sin((a * Math.PI) / 3)), 5, petal);
    p.disc(x, y, 5, pal.c('gold', 1))
      .disc(x, y, 4, pal.c('gold', 2))
      .disc(x - 1, y - 1, 2, pal.c('gold', 4));
  }
  // the fence: posts 8 wide, two rails
  for (let x = 6; x < 160; x += 40)
    p.rect(x, 22, 8, 38, w[3])
      .rect(x, 22, 8, 2, w[4])
      .rect(x + 7, 22, 1, 38, w[1]);
  p.rect(0, 30, 160, 5, w[2]).rect(0, 30, 160, 1, w[4]).rect(0, 46, 160, 5, w[2]).rect(0, 46, 160, 1, w[4]);
  return p;
}

/** The block names of each piece of scenery. */
export interface Scenery {
  /** The hills, 6 rows of 16 (the rows above the path); column c of a map uses c mod 8. */
  hills: string[][];
  /** The big things in front, 3 rows of 8 (the rows under the path), repeating. */
  front: string[][];
  ridge: string;
  slope: [string, string, string];
  groveTop: string;
  grove: string;
  /** A sign's two posts, drawn over the hills (the Starter sign's own posts are on sky). */
  posts: [string, string];
  gate: string;
}

/** Adds the blocks to `book`, after the Starter blocks and before the signs. */
export function addScenery(book: Book, pal: Pal): Scenery {
  const air = { grav: PULL.down };
  const seen = new Map<string, string>();
  const hillsPic = new Pixels(320, 120, skyOf(pal));
  const land = landscapePicture(pal);
  hillsPic.blit(land, 0, 0);
  const hills = cut(book, 'hill', hillsPic, air, seen);
  const slope: [string, string, string] = ['slope0', 'slope1', 'slope2'];
  book.add('ridge', ridgePicture(pal), { solid: SOLID });
  slope.forEach((n, i) => book.add(n, slopePicture(pal, i as 0 | 1 | 2), { solid: SOLID }));
  const front = cut(book, 'front', foregroundPicture(pal), { solid: SOLID }, new Map());
  book.add('groveTop', grovePicture(pal, true, land.crop(0, 80, 20, 20)), { ...air, solid: SOLID });
  book.add('grove', grovePicture(pal, false, land), { solid: SOLID });
  book.add('postL', postPicture(pal, 3, land), air);
  book.add('postR', postPicture(pal, 13, land), air);
  book.add('gate', gatePicture(pal, land), air);
  return { hills, front, ridge: 'ridge', slope, groveTop: 'groveTop', grove: 'grove', posts: ['postL', 'postR'], gate: 'gate' };
}
