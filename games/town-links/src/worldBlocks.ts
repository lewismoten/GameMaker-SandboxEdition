// The blocks this game adds to the overhead set: the WORLD MAP's art (a block there stands for a great stretch of land,
// so a whole town is one block and a forest is a few tiny trees), a small key, the town's locked gate, and a tiny Kit.
// Scale is only what a block is drawn to mean: every block is still 20 x 20 pixels.
//
//   world: sea (solid), land (with sandy shores where it meets the sea), hill and forest (solid), trail, the town block, key
//   town:  gate (solid until Kit carries a key)
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, SOLID } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import type { Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { buildTopHero } from '../../kit/starter/topHero';
import { skyOf } from '../../kit/starter/palette';

const N = 20;
/** The counter the keys add to (and the gate takes from). Kit starts with 1: a counter shows one less than it holds. The keys add 2: a map reloads when you come back to it, so the gate is shut again after the house and needs a second key to leave the yard. */
export const KEY_COUNTER = KEYS + 1;

/** Shore bits: which neighbors of a land block are sea. */
export const SEA = { N: 1, E: 2, S: 4, W: 8 } as const;
export const landName = (mask: number): string => `land.${mask}`;

function seaTile(pal: Pal): Pixels {
  const b = pal.r('blue');
  const p = new Pixels(N, N, b[2]);
  const rand = rng(31);
  for (let i = 0; i < 6; i++) {
    const x = 1 + Math.floor(rand() * 14);
    const y = 1 + Math.floor(rand() * 17);
    p.rect(x, y, 4, 1, b[3]).rect(x + 1, y + 1, 2, 1, b[3]);
  }
  return p;
}

/** Land seen from very far: flat, pale green, with a sandy edge on every side the sea touches. */
function landTile(pal: Pal, mask: number): Pixels {
  const g = pal.r('grass');
  const sand = pal.r('parch');
  const p = new Pixels(N, N, g[3]);
  const rand = rng(5);
  for (let i = 0; i < 10; i++) p.set(Math.floor(rand() * N), Math.floor(rand() * N), g[2]);
  if (mask & SEA.N) p.rect(0, 0, N, 3, sand[3]).rect(0, 3, N, 1, sand[1]);
  if (mask & SEA.S) p.rect(0, N - 3, N, 3, sand[3]).rect(0, N - 4, N, 1, sand[1]);
  if (mask & SEA.W) p.rect(0, 0, 3, N, sand[3]).rect(3, 0, 1, N, sand[1]);
  if (mask & SEA.E) p.rect(N - 3, 0, 3, N, sand[3]).rect(N - 4, 0, 1, N, sand[1]);
  return p;
}

/** Hills: three small brown humps with a lighter lit side. */
function hillTile(pal: Pal, land: Pixels): Pixels {
  const d = pal.r('dirt');
  const p = land.crop(0, 0, N, N);
  const hump = (cx: number, base: number, w: number, h: number) => {
    for (let y = 0; y < h; y++) {
      const half = Math.round((w / 2) * ((y + 1) / h));
      p.rect(cx - half, base - h + y, half * 2, 1, d[2]);
      p.set(cx - half, base - h + y, d[4]).set(cx + half - 1, base - h + y, d[1]);
    }
  };
  hump(6, 12, 10, 6);
  hump(14, 15, 10, 7);
  hump(9, 18, 8, 4);
  return p;
}

/** Forest: a patch of tiny dark pines, each a few pixels tall. */
function forestTile(pal: Pal, land: Pixels): Pixels {
  const g = pal.r('green');
  const w = pal.r('wood');
  const p = land.crop(0, 0, N, N);
  for (const [x, y] of [
    [4, 5],
    [12, 3],
    [9, 10],
    [3, 13],
    [15, 12],
    [11, 17],
  ] as const) {
    p.rect(x, y + 5, 1, 2, w[1]);
    for (let i = 0; i < 5; i++) p.rect(x - Math.floor(i / 2), y + i, 1 + 2 * Math.floor(i / 2), 1, i % 2 ? g[1] : g[2]);
    p.set(x, y, g[4]);
  }
  return p;
}

/** A trail: a thin dotted line of tan from the middle to each side it joins (`mask` uses the SEA bits for N, E, S, W). */
function trailTile(pal: Pal, land: Pixels, mask: number): Pixels {
  const d = pal.r('parch');
  const p = land.crop(0, 0, N, N);
  p.rect(8, 8, 4, 4, d[2]).rect(9, 9, 2, 2, d[3]);
  for (let i = 0; i < 9; i += 3) {
    if (mask & SEA.N) p.rect(9, i, 2, 2, d[2]);
    if (mask & SEA.S) p.rect(9, 20 - i - 2, 2, 2, d[2]);
    if (mask & SEA.W) p.rect(i, 9, 2, 2, d[2]);
    if (mask & SEA.E) p.rect(20 - i - 2, 9, 2, 2, d[2]);
  }
  return p;
}

/** The town, as the world map sees it: one block holding a ring of little roofs and a flag. */
function townTile(pal: Pal, land: Pixels): Pixels {
  const ink = pal.c('ink', 0);
  const p = land.crop(0, 0, N, N);
  const roof = [pal.r('brick'), pal.r('blue'), pal.r('orange'), pal.r('purple')];
  const wall = pal.r('parch');
  const homes: [number, number][] = [
    [2, 8],
    [11, 8],
    [2, 14],
    [11, 14],
    [7, 11],
  ];
  homes.forEach(([x, y], i) => {
    p.rect(x, y, 7, 5, ink).rect(x + 1, y + 1, 5, 2, roof[i % 4][3]).rect(x + 1, y + 3, 5, 1, wall[3]);
    p.rect(x + 1, y + 1, 5, 1, roof[i % 4][4]);
  });
  // the flag on a pole
  p.rect(9, 1, 1, 8, ink).rect(10, 1, 5, 3, ink).rect(10, 2, 4, 1, pal.c('red', 3)).rect(10, 3, 3, 1, pal.c('red', 3));
  return p;
}

/** Two keys on a ring, lying on the land, small enough to look like they belong on a map. */
function worldKey(pal: Pal, land: Pixels): Pixels {
  const ink = pal.c('ink', 0);
  const g = pal.r('gold');
  const p = land.crop(0, 0, N, N);
  const key = (dx: number, dy: number, lit: number) => {
    p.disc(4.5 + dx, 5.5 + dy, 3.3, ink).disc(4.5 + dx, 5.5 + dy, 2.4, g[lit]).disc(4.5 + dx, 5.5 + dy, 0.9, ink);
    p.rect(7 + dx, 4 + dy, 9, 3, ink).rect(7 + dx, 5 + dy, 8, 1, g[lit]);
    p.rect(12 + dx, 7 + dy, 2, 3, ink).rect(12 + dx, 7 + dy, 1, 2, g[lit]);
    p.rect(15 + dx, 7 + dy, 2, 2, ink).rect(15 + dx, 7 + dy, 1, 1, g[lit]);
  };
  key(1, 8, 2);
  key(0, 1, 3);
  return p;
}

/** The yard gate in the town: a wooden gate in the fence line, with a padlock; solid until Kit carries a key. */
function gateTile(pal: Pal, under: Pixels): Pixels {
  const ink = pal.c('ink', 0);
  const w = pal.r('wood');
  const g = pal.r('gold');
  const p = under.crop(0, 0, N, N);
  p.rect(0, 4, 3, 13, ink).rect(1, 5, 1, 11, w[2]).rect(17, 4, 3, 13, ink).rect(18, 5, 1, 11, w[2]);
  p.rect(3, 6, 14, 10, ink).rect(4, 7, 12, 8, w[3]);
  for (const x of [7, 10, 13]) p.rect(x, 7, 1, 8, w[1]);
  p.rect(4, 7, 12, 1, w[4]).rect(4, 14, 12, 1, w[1]);
  p.rect(8, 9, 4, 4, ink).rect(9, 10, 2, 2, g[3]).rect(9, 8, 2, 1, ink);
  return p;
}

/** A sign standing on `under`: the Starters' board and posts, with the posts drawn over that ground (so each ground has its own). */
export function addGroundSign(book: Book, pal: Pal, ground: string, under: Pixels, name: string, text: string, w: number, h: number): Sign {
  const scratch = new Book('bbl');
  const sign = addSign(scratch, pal, name, text, w, h);
  const legs = sign.legs.map((n) => `${n}.${ground}`) as [string, string];
  sign.legs.forEach((n, i) => {
    if (!book.has(legs[i])) book.add(legs[i], onto(scratch.pics.get(n)!, pal, under));
  });
  for (const [n, pic] of scratch.pics) if (!sign.legs.includes(n) && !book.has(n)) book.add(n, onto(pic, pal, under));
  return { board: sign.board, legs };
}

const onto = (pic: Pixels, pal: Pal, under: Pixels): Pixels =>
  pic.crop(0, 0, pic.w, pic.h).map((x, y, c) => (c === skyOf(pal) ? under.get(x % N, y % N) : c));

/** Adds the world's blocks and the gate; returns the plain land block's picture (what world signs stand on). */
export function addWorldBlocks(book: Book, pal: Pal, townGround: Pixels): { land: Pixels } {
  const land = landTile(pal, 0);
  book.add('sea', seaTile(pal), { solid: SOLID });
  for (let mask = 0; mask < 16; mask++) book.add(landName(mask), landTile(pal, mask));
  book.add('hill', hillTile(pal, land), { solid: SOLID });
  book.add('forest', forestTile(pal, land), { solid: SOLID });
  for (let mask = 1; mask < 16; mask++) book.add(`trail.${mask}`, trailTile(pal, land, mask));
  book.add('town', townTile(pal, land));
  book.add('wkey', worldKey(pal, land), { score: 25, effect: KEY_COUNTER, eamt: 2, touch: landName(0) });
  book.add('gate', gateTile(pal, townGround), { solid: SOLID, effect: KEY_COUNTER, eamt: -1, touch: 'road' });
  return { land };
}

// ---- tiny Kit: the same four facings, drawn about half the size, standing in the lower middle of the block ----

const FACINGS = ['down', 'up', 'right', 'left'] as const;
const STEPS = ['0', '1', 'stand'] as const;

/** Kit's hero blocks for the world map: each top-down pose shrunk to 10 x 10 (every other pixel) and set low in the block. */
export function buildTinyHeroBlocks(pal: Pal, big: Book): Book {
  const book = new Book('cbl');
  for (const f of FACINGS)
    for (const s of STEPS) {
      const src = big.pics.get(`${f}.${s}`)!;
      const p = new Pixels(N, N, 255);
      for (let y = 0; y < 10; y++)
        for (let x = 0; x < 10; x++) {
          // of each 2 x 2 patch, the pixel that is not background; the darkest outline wins so he stays readable
          let best = 255;
          for (const [dx, dy] of [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ])
            {const c = src.get(x * 2 + dx, y * 2 + dy);
            if (c !== 255 && (best === 255 || c === pal.c('ink', 0))) best = c;}
          p.set(5 + x, 8 + y, best);
        }
      book.add(`${f}.${s}`, p);
    }
  return book;
}

/** The tiny Kit's character: the top-down Kit's keys and walking, with these small pictures. Both characters carry a key counter of 1. */
export function buildTinyHero(cb: Book): Character {
  const ch = buildTopHero(cb);
  ch.meter[KEY_COUNTER] = 1;
  return ch;
}

/** The town Kit's character: the top-down Kit, with a key counter that starts at 1. */
export function buildTownHero(cb: Book): Character {
  const ch = buildTopHero(cb);
  ch.meter[KEY_COUNTER] = 1;
  return ch;
}
