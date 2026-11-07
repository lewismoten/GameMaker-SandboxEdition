// The dark and the way home as 20x20 blocks: the old tunnel (its stones, its floor dark or lit, a lantern unlit
// or lit, and the light it throws), stars and the moon, signposts with arrows that a squirrel keeps turning, a
// rain puddle the little cloud left behind, the picnic blanket and the doormat.
// Game-Maker has no lights: a lit block is only a picture painted brighter, and a lantern's glow is rings of
// lighter blocks laid round it (the Lights Out Starter's trick).
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { speckle } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { type Pal } from '../../../kit/starter/palette';
import { clear, inked } from './land';

/** The tunnel's stones: `lit` 0 dark, 1 in a lantern's outer glow, 2 close by. */
export function tunnelStone(pal: Pal, lit: 0 | 1 | 2): Pixels {
  const p = clear(pal);
  const s = pal.r('stone');
  const g = pal.r('gold');
  const base = lit === 2 ? g[1] : lit === 1 ? s[2] : s[0];
  const line = lit === 2 ? g[0] : lit === 1 ? s[1] : pal.c('ink', 0);
  p.rect(0, 0, 20, 20, base);
  for (const y of [0, 10]) p.rect(0, y, 20, 1, line);
  for (const [x, y] of [
    [6, 0],
    [16, 10],
  ])
    p.rect(x, y, 1, 10, line);
  if (lit) p.rect(1, 1, 4, 1, lit === 2 ? g[3] : s[3]).rect(8, 11, 5, 1, lit === 2 ? g[3] : s[3]);
  return p;
}

/** The tunnel floor: dark, or lit where Tess has walked with her lantern (it stays lit behind her). */
export function tunnelFloor(pal: Pal, lit: boolean): Pixels {
  const p = clear(pal);
  const d = pal.r('dirt');
  const g = pal.r('gold');
  if (lit) {
    speckle(p, 0, 0, 20, 20, [g[0], g[1], g[2], d[4]], 1, 1, 3, 0.3);
    p.rect(0, 0, 20, 2, g[3]);
  } else {
    speckle(p, 0, 0, 20, 20, d, 0, 1, 3, 0.2);
    p.rect(0, 0, 20, 1, d[1]);
  }
  return p;
}

/** Air in the tunnel: black, or warm where a lantern glows (`lit` 1 far, 2 near). */
export function tunnelAir(pal: Pal, lit: 0 | 1 | 2): Pixels {
  const p = clear(pal);
  if (!lit) return p;
  const g = pal.r('gold');
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (lit === 2 ? (x + y) % 2 === 0 : x % 2 === 0 && y % 2 === 0) p.set(x, y, lit === 2 ? g[1] : g[0]);
  return p;
}

/** A lantern on a hook: unlit (dark glass) or lit (a warm flame, glow dots round it). */
export function lantern(pal: Pal, lit: boolean): Pixels {
  const p = lit ? tunnelAir(pal, 2) : clear(pal);
  const s = pal.r('stone');
  const g = pal.r('gold');
  p.rect(9, 0, 2, 4, s[2]);
  p.rect(5, 4, 10, 2, s[3]).rect(6, 6, 8, 10, lit ? g[4] : s[0]).rect(5, 16, 10, 2, s[3]);
  p.rect(6, 6, 1, 10, s[2]).rect(13, 6, 1, 10, s[2]);
  if (lit) p.rect(9, 9, 2, 5, pal.c('orange', 3)).rect(9, 8, 2, 2, g[5]).set(10, 7, g[5]);
  return inked(pal, p);
}

/** A star: off (just sky), a faint dot, or bright (a twinkle loop goes faint, bright, faint). */
export function star(pal: Pal, how: 'off' | 'faint' | 'bright', seed: number): Pixels {
  const p = clear(pal);
  const rand = rng(seed);
  const x = 3 + Math.floor(rand() * 14);
  const y = 3 + Math.floor(rand() * 14);
  const w = pal.r('white');
  if (how === 'faint') p.set(x, y, w[1]);
  if (how === 'bright') p.set(x, y, w[3]).set(x - 1, y, w[1]).set(x + 1, y, w[1]).set(x, y - 1, w[1]).set(x, y + 1, w[1]);
  if (seed % 3 === 0) p.set((x + 9) % 20, (y + 7) % 20, w[0]);
  return p;
}

/** The moon: four blocks (part 0 top-left .. 3 bottom-right) of a round, softly lit moon. */
export function moon(pal: Pal, part: 0 | 1 | 2 | 3): Pixels {
  const big = new Pixels(40, 40, clear(pal).get(0, 0));
  const w = pal.r('white');
  const s = pal.r('stone');
  big.disc(20, 20, 14, w[3]).disc(24, 17, 4, w[2]).disc(14, 25, 3, s[4]).disc(22, 28, 2, w[2]);
  return big.crop((part % 2) * 20, Math.floor(part / 2) * 20, 20, 20);
}

/** A signpost: a post with an arrow board pointing `dir`. */
export function signpost(pal: Pal, dir: 'L' | 'R' | 'U'): Pixels {
  const p = clear(pal);
  const w = pal.r('wood');
  p.rect(9, 8, 3, 12, w[1]);
  if (dir === 'U') {
    p.rect(6, 3, 9, 6, w[3]).rect(6, 3, 9, 1, w[4]);
    for (let k = 0; k < 4; k++) p.rect(10 - k, k, 1 + k * 2, 1, w[3]);
  } else {
    const r = dir === 'R';
    p.rect(r ? 2 : 4, 3, 14, 6, w[3]).rect(r ? 2 : 4, 3, 14, 1, w[4]);
    for (let k = 0; k < 4; k++) p.rect(r ? 16 + k : 3 - k, 2 + k, 1, 8 - k * 2, w[3]);
  }
  return inked(pal, p);
}

/** A little rain puddle on the ground (the cloud left a trail of them). */
export function puddle(pal: Pal): Pixels {
  const p = clear(pal);
  const w = pal.r('water');
  p.rect(3, 17, 14, 3, w[2]).rect(5, 16, 10, 1, w[3]).rect(6, 18, 4, 1, w[4]);
  for (const [x, y] of [
    [6, 9],
    [12, 5],
    [9, 13],
  ])
    p.rect(x, y, 1, 2, w[4]);
  return p;
}

/** The picnic blanket: checks in red and white, part L, M or R. */
export function blanket(pal: Pal, part: 'L' | 'M' | 'R'): Pixels {
  const p = clear(pal);
  const r = pal.r('red');
  const w = pal.r('white');
  for (let y = 12; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? r[2] : w[3]);
  p.rect(0, 12, 20, 1, r[1]);
  if (part === 'M') {
    // a pie dish and a thermos
    p.rect(3, 8, 9, 4, pal.c('parch', 3)).rect(3, 8, 9, 1, pal.c('parch', 4)).rect(4, 9, 7, 2, pal.c('orange', 2));
    p.rect(14, 3, 4, 9, pal.c('teal', 2)).rect(14, 2, 4, 1, pal.c('stone', 3));
  }
  if (part === 'L') p.rect(4, 6, 6, 6, pal.c('white', 3)).rect(5, 7, 4, 1, pal.c('green', 3)).rect(5, 9, 4, 1, pal.c('green', 3));
  if (part === 'R') p.disc(10, 9, 3, pal.c('red', 3)).rect(10, 5, 1, 2, pal.c('wood', 1));
  return inked(pal, p);
}

/** A wide doormat in front of the mountain: part L, M or R (the words are on the sign above it). */
export function doormat(pal: Pal, part: 'L' | 'M' | 'R'): Pixels {
  const p = clear(pal);
  const b = pal.r('wood');
  p.rect(part === 'L' ? 2 : 0, 14, part === 'M' ? 20 : 18, 6, b[3]);
  for (let x = 0; x < 20; x += 2) p.rect(x, 15, 1, 4, b[1]);
  p.rect(part === 'L' ? 2 : 0, 14, part === 'M' ? 20 : 18, 1, b[4]);
  return inked(pal, p);
}
