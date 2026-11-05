// RIDE ALONG's own background blocks, added after the Starter set in every level's .BBL.
//
//   space0..2   the night sky of level 2: three tiles with different stars. Gravity is NONE (the Starter sky
//               pulls down; a ship that is meant to rise must not be pulled)
//   wall        moon rock, solid on every side: the shaft's walls and floor
//   rockA/B     two lumps of space rock, solid: the ship stops against them
//   star        a gold star, 10 points, gone when touched
//   bay         the glowing hatch at the top of level 2 (bayTop + bayBottom): the exit
//   water0..2   the river of level 3: three pictures of the same water, each turning into the next after 3
//               ticks, so the ripples slide up the screen the way the river flows (finishRide sets the timing)
//   bank        a grassy bank, solid; reeds, a log (two blocks), a lily pad (10 points) and the dock (exit)
//   rocketTop + rocketBottom   the parked rocket that is level 1's exit
// Plaques (addPlaque) are the signs of the two flying levels: a board with no posts, on the night sky or the water.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import type { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { onGround, rocket } from './shipArt';

const T = 255;
/** The ramp the night sky is drawn from; give it to buildStarterPalette as the game's own ramp. */
const SPACE_RAMP: [number, number, number][] = [
  [8, 10, 44],
  [20, 24, 74],
  [44, 50, 112],
];
export const addSpaceRamp = (b: PaletteBuilder): void => {
  b.ramp('space', 3, SPACE_RAMP[0], SPACE_RAMP[2]);
};

const none = { grav: PULL.none };

/** A tile of night sky with a few stars. */
function night(pal: Pal, seed: number): Pixels {
  const p = new Pixels(20, 20, pal.c('space', 0));
  const rand = rng(seed);
  for (let i = 0; i < 9; i++) p.set(Math.floor(rand() * 20), Math.floor(rand() * 20), pal.c('space', 2));
  for (let i = 0; i < 4; i++) p.set(Math.floor(rand() * 20), Math.floor(rand() * 20), pal.c('white', 2));
  const x = 2 + Math.floor(rand() * 15);
  const y = 2 + Math.floor(rand() * 15);
  p.set(x, y, pal.c('white', 3));
  for (const [dx, dy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ])
    p.set(x + dx, y + dy, pal.c('white', 1));
  return p;
}

function moonWall(pal: Pal): Pixels {
  const s = pal.r('stone');
  const p = new Pixels(20, 20, s[0]);
  const rand = rng(11);
  for (let i = 0; i < 40; i++) p.set(Math.floor(rand() * 20), Math.floor(rand() * 20), s[i % 3 === 0 ? 2 : 1]);
  for (const [x, y, r] of [
    [5, 6, 3],
    [14, 12, 4],
    [8, 16, 2],
  ])
    p.disc(x, y, r, pal.c('ink', 1)).disc(x + 0.6, y + 0.6, r - 1, s[1]);
  p.rect(0, 0, 20, 1, s[2]).rect(0, 0, 1, 20, s[1]).rect(19, 0, 1, 20, pal.c('ink', 1)).rect(0, 19, 20, 1, pal.c('ink', 1));
  return p;
}

/** A lump of space rock on the night sky; `v` picks one of two shapes. Gray-violet, so it is not the wall's gray and not a brown lump. */
function lump(pal: Pal, v: number): Pixels {
  const p = night(pal, 40 + v);
  const rock = new Pixels(20, 20, T);
  const s = pal.r('stone');
  blob(rock, 10, 10, v ? 8.4 : 9, v ? 9 : 7.6, s, 1, 4);
  blob(rock, 6, 6, 4, 4, s, 2, 4);
  for (const [x, y, r] of v
    ? [
        [12, 12, 2.4],
        [7, 13, 1.6],
      ]
    : [
        [13, 8, 2.2],
        [7, 11, 2],
        [11, 14, 1.2],
      ])
    rock.disc(x, y, r, s[0]).disc(x + 0.5, y + 0.5, r - 0.8, s[1]);
  return p.blit(outline(rock, pal.c('ink', 0), { transparent: T }), 0, 0, T);
}

/** The gold star pickup (also on the title). */
export function starSprite(pal: Pal): Pixels {
  const rows = [
    '.....#.....',
    '.....#.....',
    '....###....',
    '....###....',
    '###########',
    '.#########.',
    '..#######..',
    '..#######..',
    '.####.####.',
    '.###...###.',
    '.#.......#.',
  ];
  const s = new Pixels(11, 11, T).draw(0, 0, rows, { '#': pal.c('gold', 4) });
  s.rect(4, 4, 3, 3, pal.c('gold', 5));
  return outline(s, pal.c('gold', 1), { transparent: T });
}

function star(pal: Pal): Pixels {
  return night(pal, 7).blit(starSprite(pal), 4, 4, T);
}

/** The hatch, 20x40: a lit arch on the night sky, gold and teal. */
function bay(pal: Pal): { top: Pixels; bottom: Pixels } {
  const p = new Pixels(20, 40, pal.c('space', 0));
  const g = pal.r('gold');
  const t = pal.r('teal');
  p.disc(10, 22, 12, g[1]).disc(10, 22, 10, t[1]).disc(10, 22, 8, t[3]).disc(10, 22, 5, t[4]).disc(10, 22, 2.4, pal.c('white', 3));
  p.rect(0, 22, 20, 18, pal.c('space', 0)).rect(0, 22, 20, 18, pal.c('space', 0));
  p.rect(0, 22, 2, 18, g[1]).rect(18, 22, 2, 18, g[1]).rect(2, 22, 2, 18, g[3]).rect(16, 22, 2, 18, g[3]);
  p.rect(4, 22, 12, 18, t[3]).rect(6, 22, 8, 18, t[4]).rect(8, 22, 4, 18, pal.c('white', 2));
  return { top: p.crop(0, 0, 20, 20), bottom: p.crop(0, 20, 20, 20) };
}

/** One of three pictures of the river: ripples at three heights, each three pixels... see `phase`. */
function water(pal: Pal, phase: number): Pixels {
  const b = pal.r('blue');
  const p = new Pixels(20, 20, b[2]);
  const rand = rng(5);
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(rand() * 14) + 1;
    const y = (((Math.floor(rand() * 20) - phase * 6) % 20) + 20) % 20;
    p.rect(x, y, 4, 1, pal.c('sky', 4)).rect(x + 1, (y + 1) % 20, 2, 1, b[3]);
  }
  p.rect(0, (((3 - phase * 6) % 20) + 20) % 20, 20, 1, b[3]);
  return p;
}

function bank(pal: Pal): Pixels {
  const g = pal.r('grass');
  const d = pal.r('dirt');
  const p = new Pixels(20, 20, g[2]);
  const rand = rng(23);
  for (let i = 0; i < 26; i++) p.rect(Math.floor(rand() * 19), Math.floor(rand() * 19), 2, 1, g[i % 2 ? 3 : 1]);
  p.rect(0, 0, 1, 20, d[1]).rect(19, 0, 1, 20, d[1]);
  return p;
}

function reeds(pal: Pal): Pixels {
  const g = pal.r('grass');
  const p = bank(pal);
  for (const x of [4, 8, 12, 16]) {
    p.rect(x, 3, 1, 14, g[1]).rect(x + 1, 3, 1, 14, g[4]);
    p.rect(x - 1, 2, 3, 5, pal.c('wood', 2)).rect(x, 2, 1, 5, pal.c('wood', 3));
  }
  return p;
}

/** A floating log, 40x20: two blocks wide. */
function log(pal: Pal): { left: Pixels; right: Pixels } {
  const p = water(pal, 0);
  const wd = pal.r('wood');
  const big = new Pixels(40, 20, p.get(0, 0));
  big.blit(p, 0, 0).blit(p, 20, 0);
  const l = new Pixels(40, 20, T);
  l.rect(4, 4, 32, 12, wd[2]).disc(4.5, 10, 6, wd[2]).disc(35.5, 10, 6, wd[2]);
  l.rect(4, 4, 32, 3, wd[3]).rect(4, 13, 32, 3, wd[1]).rect(4, 8, 32, 1, wd[3]);
  for (const x of [11, 19, 27]) l.rect(x, 9, 4, 1, wd[1]);
  l.disc(4.5, 10, 4.4, wd[4]).disc(4.5, 10, 2.8, wd[3]).disc(4.5, 10, 1.2, wd[2]);
  big.blit(outline(l, pal.c('ink', 0), { transparent: T }), 0, 0, T);
  return { left: big.crop(0, 0, 20, 20), right: big.crop(20, 0, 20, 20) };
}

function lily(pal: Pal): Pixels {
  const p = water(pal, 0);
  const sea = p.get(0, 0);
  const g = pal.r('green');
  p.disc(10, 11, 7.4, pal.c('ink', 0)).disc(10, 11, 6.4, g[2]).disc(9.4, 10.4, 4, g[3]);
  for (let x = 10; x < 18; x++) for (let y = 10; y <= 12; y++) if (Math.abs(y - 11) <= (x - 9) * 0.35) p.set(x, y, sea);
  p.disc(8, 9, 2.8, pal.c('pink', 1)).disc(8, 9, 2, pal.c('pink', 2)).disc(8, 9, 0.9, pal.c('gold', 4));
  return p;
}

/** The dock, 20x40: a wooden pier on the water with a post on each side and a gold flag. */
function dock(pal: Pal): { top: Pixels; bottom: Pixels } {
  const p = water(pal, 0);
  const big = new Pixels(20, 40, p.get(0, 0));
  big.blit(p, 0, 0).blit(p, 0, 20);
  const w = pal.r('wood');
  for (let y = 4; y < 36; y += 5) big.rect(1, y, 18, 4, w[y % 10 ? 3 : 2]).rect(1, y + 3, 18, 1, w[1]);
  big.rect(1, 2, 3, 36, w[1]).rect(2, 2, 1, 36, w[3]).rect(16, 2, 3, 36, w[1]).rect(17, 2, 1, 36, w[3]);
  big.rect(8, 6, 1, 14, pal.c('ink', 0)).rect(9, 6, 7, 5, pal.c('gold', 4)).frame(9, 6, 7, 5, pal.c('ink', 0));
  return { top: big.crop(0, 0, 20, 20), bottom: big.crop(0, 20, 20, 20) };
}

/** Adds this game's blocks to `book` (after addStarterBlocks). */
export function addRideBlocks(book: Book, pal: Pal): void {
  for (const i of [0, 1, 2]) book.add(`space${i}`, night(pal, 100 + i * 7), none);
  book.add('wall', moonWall(pal), { ...none, solid: SOLID });
  book.add('rockA', lump(pal, 0), { ...none, solid: SOLID });
  book.add('rockB', lump(pal, 1), { ...none, solid: SOLID });
  book.add('star', star(pal), { ...none, score: 10, touch: 'space0' });
  const hatch = bay(pal);
  book.add('bayTop', hatch.top, none);
  book.add('bayBottom', hatch.bottom, none);
  for (const i of [0, 1, 2]) book.add(`water${i}`, water(pal, i), none);
  book.add('bank', bank(pal), { ...none, solid: SOLID });
  book.add('reeds', reeds(pal), { ...none, solid: SOLID });
  const logs = log(pal);
  book.add('logL', logs.left, { ...none, solid: SOLID });
  book.add('logR', logs.right, { ...none, solid: SOLID });
  book.add('lily', lily(pal), { ...none, score: 10, touch: 'water0' });
  const pier = dock(pal);
  book.add('dockTop', pier.top, none);
  book.add('dockBottom', pier.bottom, none);
  // the parked rocket (level 1's exit): the hull on the Starter sky, down on its fins
  const parked = onGround(rocket(pal, false, -1, 5), pal.c('sky', 3));
  book.add('rocketTop', parked.crop(0, 0, 20, 20), { grav: PULL.down });
  book.add('rocketBottom', parked.crop(0, 20, 20, 20), { grav: PULL.down });
}

/** The finished blocks of a level's book, with the three pictures of water chained into a ring. */
export function finishRide(book: Book): Block[] {
  const blocks = book.finish();
  const ring = ['water0', 'water1', 'water2'];
  ring.forEach((name, i) => {
    const b = blocks[book.n(name)];
    b.nextBl = book.n(ring[(i + 1) % 3]);
    b.ntime = 3;
  });
  return blocks;
}

/**
 * A plaque: a sign's board without its posts, standing on `ground` (a 20x20 picture: the night sky or the water),
 * so it floats where the ship or boat flies past. Not solid, and no pull.
 */
export function addPlaque(book: Book, pal: Pal, ground: Pixels, name: string, text: string, w: number, h: number): Sign {
  const scratch = new Book('bbl');
  const sign = addSign(scratch, pal, name, text, w, h);
  const sky = pal.c('sky', 3);
  const wanted = new Set(sign.board.flat());
  for (const [n, pic] of scratch.pics)
    if (wanted.has(n))
      book.add(
        n,
        pic.crop(0, 0, 20, 20).map((x, y, col) => (col === sky ? ground.get(x, y) : col)),
        none,
      );
  return sign;
}
