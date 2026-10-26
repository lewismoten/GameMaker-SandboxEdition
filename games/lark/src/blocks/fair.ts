// fair.bbl: chapter 10, the fair at dusk, seen from the side, where gravity pulls down. The
// evening sky and the string lights, the grass, striped tents and booths, the Ferris wheel
// turning far behind, the carousel (its pole, its striped canopy you can hop up onto from
// below), the Clown Club's banner and its clowns juggling (friendly, all of them), the
// turnstile by the gate (it turns once Reggie is safe) and Doc Leo.
import { SOLTOP } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { bevel, gradient } from '../art/draw';
import { c, r } from '../art/pal';
import { CTR } from '../ids';
import { clown, leo, reggie } from '../sprites/people';
import { addKeepsakes } from './keepsakes';
import { BlockSet, GRAV, SOLID } from './sets';
import { on } from './tiles';

const DOWN = GRAV.s;
const O = () => c('ink', 0);

/** The evening sky (row 0 darkest), a star or two. */
function sky(row: number, seed: number): Pixels {
  const p = new Pixels(20, 20);
  gradient(p, 0, 0, 20, 20, r('dusk'), Math.min(5, row * 0.6), Math.min(5, row * 0.6 + 0.6));
  const R = rng(seed);
  if (row < 4) for (let i = 0; i < 2; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), c('paper', 4));
  return p;
}

/** String lights across the sky: a thin wire, a little bulb every few pixels. */
function lights(seed: number): Pixels {
  const p = sky(1, seed);
  const sag = (x: number) => 4 + Math.round(Math.sin((x / 20) * Math.PI) * 2);
  for (let x = 0; x < 20; x++) p.set(x, sag(x), c('ink', 1));
  ['yellow', 'red', 'window', 'green'].forEach((col, k) => {
    const x = 2 + k * 5;
    p.set(x, sag(x) + 1, c(col, 3)).set(x, sag(x) + 2, c(col, 3));
  });
  return p;
}

function ground(top: boolean): Pixels {
  const p = new Pixels(20, 20, c('wood', 1));
  const R = rng(top ? 3 : 4);
  p.map((_x, _y, v) => (R() < 0.2 ? c('wood', 2) : v));
  if (top) {
    p.rect(0, 0, 20, 5, c('grass', 2));
    for (let x = 0; x < 20; x += 2) p.set(x, R() < 0.5 ? 0 : 1, c('grass', 3));
  }
  return p;
}

/** A striped tent (a booth's back), red and white or blue and yellow. */
function tent(part: 'top' | 'wall', stripe: [string, string], seed: number): Pixels {
  const p = sky(5, seed);
  if (part === 'top') {
    for (let y = 6; y < 20; y++) {
      const half = Math.round((y - 6) * 0.75);
      for (let x = 10 - half; x <= 10 + half; x++) p.set(x, y, c(Math.floor(x / 4) % 2 ? stripe[0] : stripe[1], 3));
    }
    p.rect(9, 2, 2, 4, c('wood', 2)).rect(11, 2, 4, 2, c('red', 3));
    return p;
  }
  for (let x = 0; x < 20; x++) p.rect(x, 0, 1, 20, c(Math.floor(x / 4) % 2 ? stripe[0] : stripe[1], 2));
  p.rect(6, 6, 8, 14, c('ink', 1));
  return p;
}

/** The Ferris wheel far behind, against the sky (3 x 3 blocks), lit spokes. */
function wheel(part: number): Pixels {
  const big = new Pixels(60, 60);
  for (let y = 0; y < 60; y++) for (let x = 0; x < 60; x++) big.set(x, y, sky(3 + Math.floor(y / 20), 7).get(x % 20, y % 20));
  big.ring(30, 30, 26, c('stone', 2)).ring(30, 30, 25, c('stone', 2));
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    big.line(30, 30, Math.round(30 + Math.cos(a) * 25), Math.round(30 + Math.sin(a) * 25), c('stone', 2));
    big.disc(Math.round(30 + Math.cos(a) * 25), Math.round(30 + Math.sin(a) * 25), 2.5, c(['red', 'yellow', 'blue', 'green'][k % 4], 3));
  }
  big.disc(30, 30, 3, c('brass', 3));
  return big.crop((part % 3) * 20, Math.floor(part / 3) * 20, 20, 20);
}

/** The carousel's canopy: a striped scalloped roof, solid on top (hop up through it from below). */
function canopy(seed: number): Pixels {
  const p = sky(3, seed);
  for (let x = 0; x < 20; x++) p.rect(x, 0, 1, 8, c(Math.floor(x / 5) % 2 ? 'red' : 'paper', 3));
  for (let x = 0; x < 20; x += 5) p.disc(x + 2.5, 8, 2.5, c(Math.floor(x / 5) % 2 ? 'red' : 'paper', 3));
  p.rect(0, 0, 20, 1, c('brass', 3));
  return p;
}

/** Under the carousel's canopy: a band of little mirrors (or the sky, with the brass center pole). */
function carousel(part: 'band' | 'pole', row: number): Pixels {
  const p = sky(row, 21 + row);
  if (part === 'pole') return p.rect(8, 0, 4, 20, c('brass', 3)).rect(8, 0, 1, 20, c('brass', 4));
  p.rect(0, 0, 20, 10, c('purple', 1));
  for (let x = 2; x < 20; x += 6) p.disc(x + 1, 4, 2.5, c('blue', 3)).set(x, 3, c('paper', 4));
  p.rect(0, 9, 20, 1, c('brass', 3));
  return p;
}

/** The carousel's turning floor, at the ground: boards in a wide curve, solid. */
function carouselFloor(): Pixels {
  const p = ground(false);
  bevel(p, 0, 0, 20, 8, r('purple'), 2);
  for (let x = 0; x < 20; x += 5) p.rect(x, 1, 1, 6, c('purple', 1));
  return p;
}

/** The Clown Club's banner, five blocks across: CLOWN CLUB, the O in CLOWN a red rubber nose. */
export const BANNER_W = 5;
function banner(part: number): Pixels {
  const W = BANNER_W * 20;
  const big = new Pixels(W, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < W; x++) big.set(x, y, sky(5, 9).get(x % 20, y));
  big.rect(1, 3, W - 2, 14, c('paper', 4)).frame(1, 3, W - 2, 14, c('blue', 2));
  big.rect(0, 1, 1, 18, c('wood', 2)).rect(W - 1, 1, 1, 18, c('wood', 2));
  // block letters, 5 rows tall
  const G: Record<string, string[]> = {
    C: ['111', '100', '100', '100', '111'],
    L: ['100', '100', '100', '100', '111'],
    W: ['10001', '10001', '10101', '10101', '01010'],
    N: ['1001', '1101', '1011', '1001', '1001'],
    U: ['101', '101', '101', '101', '111'],
    B: ['110', '101', '110', '101', '110'],
  };
  let x = 7;
  for (const ch of 'CLOWN CLUB') {
    if (ch === ' ') {
      x += 4;
      continue;
    }
    if (ch === 'O') {
      // the red rubber nose
      big.disc(x + 3, 10, 4, c('red', 2)).disc(x + 2, 8, 1.2, c('red', 4));
      x += 9;
      continue;
    }
    const g = G[ch];
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < g[row].length; col++) if (g[row][col] === '1') big.rect(x + col * 2, 6 + row * 2, 2, 2, c('blue', 2));
    x += g[0].length * 2 + 3;
  }
  return big.crop(part * 20, 0, 20, 20);
}

/** The turnstile at the fair's gate: locked (it turns once Reggie is safe) or turned. */
function turnstile(open: boolean): Pixels {
  const p = sky(6, 11);
  p.rect(8, 4, 4, 16, c('stone', 3)).frame(8, 4, 4, 16, O());
  if (open) p.rect(2, 10, 6, 2, c('stone', 4)).rect(12, 4, 2, 6, c('stone', 4));
  else {
    p.rect(1, 9, 18, 2, c('stone', 4)).rect(1, 13, 18, 2, c('stone', 4));
    p.disc(10, 6, 1.5, c('red', 3));
  }
  return p;
}

function fence(): Pixels {
  const p = sky(6, 12);
  p.rect(0, 8, 20, 2, c('paper', 3)).rect(0, 14, 20, 2, c('paper', 3));
  for (const x of [2, 15]) p.rect(x, 4, 3, 16, c('paper', 4)).frame(x, 4, 3, 16, c('paper', 2));
  return p;
}

/** A lemonade stand's counter: a striped front, a pitcher and two paper cups on top. */
function booth(seed: number): Pixels {
  const p = sky(6, seed);
  bevel(p, 0, 9, 20, 11, r('wood'), 3);
  for (let x = 1; x < 20; x += 4) p.rect(x, 12, 2, 8, c('paper', 3));
  p.rect(3, 2, 6, 7, c('blue', 4)).frame(3, 2, 6, 7, c('stone', 3)).rect(4, 5, 4, 3, c('yellow', 2));
  p.rect(9, 3, 1, 3, c('stone', 3));
  for (const x of [12, 16]) p.rect(x, 5, 3, 4, c('paper', 4)).rect(x, 5, 3, 1, c('red', 2));
  return p;
}

export function fairSet(): BlockSet {
  const s = new BlockSet(150, false);
  for (let row = 0; row < 8; row++) s.add(`sky${row}`, sky(row, row + 1), { grav: DOWN });
  s.add('lights', lights(5), { grav: DOWN });
  s.add('grass', ground(true), { solid: SOLID });
  s.add('dirt', ground(false), { solid: SOLID });
  s.add('tentTop', tent('top', ['red', 'paper'], 2), { grav: DOWN });
  s.add('tentWall', tent('wall', ['red', 'paper'], 2), { grav: DOWN });
  s.add('tentTop2', tent('top', ['blue', 'yellow'], 3), { grav: DOWN });
  s.add('tentWall2', tent('wall', ['blue', 'yellow'], 3), { grav: DOWN });
  for (let k = 0; k < 9; k++) s.add(`wheel${k}`, wheel(k), { grav: DOWN });
  s.add('canopy', canopy(4), { solid: SOLTOP, grav: DOWN });
  s.add('carouselBand', carousel('band', 3), { grav: DOWN });
  for (let row = 3; row < 8; row++) s.add(`carouselPole${row}`, carousel('pole', row), { grav: DOWN });
  s.add('carouselFloor', carouselFloor(), { solid: SOLID });
  for (let k = 0; k < BANNER_W; k++) s.add(`banner${k}`, banner(k), { grav: DOWN });
  s.add('turnstileOpen', turnstile(true), { grav: DOWN });
  s.add('turnstile', turnstile(false), { solid: SOLID, grav: DOWN, effect: CTR.task, eamt: -1, touch: 'turnstileOpen' });
  s.add('fence', fence(), { solid: SOLID });
  s.add('booth', booth(8), { grav: DOWN });
  // the Clown Club, juggling and waving (scenery, friendly: every copy keeps one clock)
  s.add('clownA', on(sky(6, 13), clown('blue', 'red', 0)), { grav: DOWN, next: 'clownA2', ntime: 14 });
  s.add('clownA2', on(sky(6, 13), clown('blue', 'red', 1)), { grav: DOWN, next: 'clownA', ntime: 9 });
  s.add('clownB', on(sky(6, 14), clown('green', 'yellow', 1)), { grav: DOWN, next: 'clownB2', ntime: 11 });
  s.add('clownB2', on(sky(6, 14), clown('green', 'yellow', 0)), { grav: DOWN, next: 'clownB', ntime: 17 });
  s.add('leo', on(sky(6, 15), leo(true, false)), { grav: DOWN });
  s.add('leoGlad', on(sky(6, 15), leo(true, true)), { grav: DOWN });
  s.add('reggieSafe', on(sky(6, 16), reggie(0)), { grav: DOWN });
  addKeepsakes(s, sky(6, 15), 'sky6');
  return s;
}
