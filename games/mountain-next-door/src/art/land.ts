// The mountain and the town, drawn as 20x20 blocks on the sky color and outlined in ink where they stand alone.
//   mountain   rock (two kinds), the slopes, the snowy peak, mossy ledges to stand on, a sleepy face (eyes that
//              open and blink, a smile, a yawn), and garden gates caught on the rock
//   town       a house wall, a lit or dark window, roof pieces, a picket fence, a garden plugged with a
//              wheelbarrow (until its gate comes back) and the gate put back
//   trail      the trail marker's posts (blank, and with a fresh yellow blaze), a tree trunk and its crown,
//              a footprint the size of a bathtub, an acorn, and a slice of leftover pie
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob, speckle } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { skyOf, type Pal } from '../../../kit/starter/palette';

export const clear = (pal: Pal): Pixels => new Pixels(20, 20, skyOf(pal));
export const inked = (pal: Pal, p: Pixels): Pixels => outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });

/** Rock: the mountain's body, speckled, with a crack or a tuft of moss. */
export function rock(pal: Pal, seed: number): Pixels {
  const p = clear(pal);
  const r = pal.r('rock');
  speckle(p, 0, 0, 20, 20, r, 2, 1, seed, 0.3);
  const rand = rng(seed + 7);
  const cx = 3 + Math.floor(rand() * 12);
  if (seed % 2) for (let y = 4; y < 14; y++) p.set(cx + (y % 3 === 0 ? 1 : 0), y, r[0]);
  else {
    const m = pal.r('moss');
    p.rect(cx, 12, 5, 2, m[2])
      .rect(cx + 1, 11, 3, 1, m[3])
      .set(cx + 2, 10, m[4]);
  }
  p.rect(2 + (seed % 5) * 3, 3, 3, 1, r[4]);
  return p;
}

/** A slope: rock below the diagonal, sky above (`left` rises to the right). */
export function slope(pal: Pal, left: boolean, seed: number): Pixels {
  const p = rock(pal, seed);
  const sky = skyOf(pal);
  const r = pal.r('rock');
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const edge = left ? 19 - x : x;
      if (y < edge) p.set(x, y, sky);
      else if (y === edge || y === edge + 1) p.set(x, y, r[4]);
    }
  const m = pal.r('moss');
  for (let k = 3; k < 18; k += 5) p.set(left ? 19 - k : k, k + 2, m[3]);
  return p;
}

/** The peak: two blocks, a cap of early snow. */
export function peak(pal: Pal, left: boolean): Pixels {
  const p = slope(pal, left, 11);
  const w = pal.r('white');
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const edge = left ? 19 - x : x;
      const wave = 8 + Math.round(Math.sin(x * 0.9) * 2);
      if (y >= edge && y < wave + (left ? 0 : 2)) p.set(x, y, y === edge || y === edge + 1 ? w[3] : w[2]);
    }
  return p;
}

/** A mossy ledge to stand on, over rock (`end` rounds off the side it is on). */
export function ledge(pal: Pal, seed: number): Pixels {
  const p = rock(pal, seed);
  const m = pal.r('moss');
  p.rect(0, 0, 20, 6, m[2]).rect(0, 0, 20, 2, m[4]).rect(0, 6, 20, 1, m[0]);
  for (let x = 1; x < 20; x += 4) p.rect(x, 6, 2, 2, m[1]);
  return p;
}

/** A gentle slope: rising one block over two (`part` 1 is the outer, lower half; 2 the inner, upper half). */
export function gentle(pal: Pal, left: boolean, part: 1 | 2, seed = 12): Pixels {
  const p = rock(pal, seed + part);
  const sky = skyOf(pal);
  const r = pal.r('rock');
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const along = left ? x : 19 - x;
      const edge = Math.round((part === 1 ? 20 : 10) - along / 2);
      if (y < edge) p.set(x, y, sky);
      else if (y < edge + 2) p.set(x, y, r[4]);
    }
  const m = pal.r('moss');
  p.rect(left ? 8 : 9, (part === 1 ? 16 : 6) + 1, 3, 1, m[3]);
  return p;
}

const GATE_COLORS = ['white', 'green', 'blue', 'red'] as const;
export type GateColor = (typeof GATE_COLORS)[number];

/** A little garden gate (pickets, rails, a latch) on clear sky, for hanging on rock or standing in a fence. */
export function gate(pal: Pal, color: GateColor, tilt: number): Pixels {
  const p = new Pixels(20, 20, 255);
  const g = pal.r(color);
  const top = g.length - 1;
  for (let k = 0; k < 4; k++) {
    const x = 2 + k * 4;
    const dy = Math.round(k * tilt);
    p.rect(x, 3 + dy, 3, 15, g[top - 1]).rect(x, 3 + dy, 1, 15, g[top]);
    p.set(x + 1, 2 + dy, g[top - 1]);
  }
  p.rect(1, 6 + Math.round(tilt * 1.5), 18, 2, g[1]).rect(1, 13 + Math.round(tilt * 1.5), 18, 2, g[1]);
  p.rect(16, 9 + Math.round(tilt * 2), 2, 2, pal.c('gold', 3));
  return outline(p, pal.c('ink', 0), { transparent: 255 });
}

/** A gate caught on the rock: the rock with a gate hanging crooked on it. */
export function gateOnRock(pal: Pal, color: GateColor, seed: number): Pixels {
  const p = rock(pal, seed);
  p.blit(gate(pal, color, 0.6), 0, 0, 255);
  return p;
}

/** A house's wall: siding in `ramp`. */
export function wall(pal: Pal, ramp: string): Pixels {
  const p = clear(pal);
  const r = pal.r(ramp);
  p.rect(0, 0, 20, 20, r[3]);
  for (let y = 4; y < 20; y += 5) p.rect(0, y, 20, 1, r[1]);
  return p;
}

/** A window on a wall: `lit` glows warm. */
export function windowOn(pal: Pal, ramp: string, lit: boolean): Pixels {
  const p = wall(pal, ramp);
  const glass = lit ? pal.r('gold') : pal.r('blue');
  p.rect(3, 3, 14, 13, pal.c('white', 3));
  p.rect(5, 5, 10, 9, glass[lit ? 4 : 2]).rect(5, 5, 10, 3, glass[lit ? 5 : 3]);
  p.rect(9, 5, 2, 9, pal.c('white', 3)).rect(5, 9, 10, 1, pal.c('white', 3));
  if (lit) p.rect(5, 11, 4, 3, pal.c('orange', 3));
  return p;
}

/** A roof piece: L (the left slope), M (the ridge run), R, or F (all roof: the eaves' row under another row). */
export function roof(pal: Pal, part: 'L' | 'M' | 'R' | 'F'): Pixels {
  const p = clear(pal);
  const r = pal.r('brick');
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const inside = part === 'F' ? true : part === 'M' ? y >= 6 : part === 'L' ? y >= 19 - x : y >= x;
      if (inside) p.set(x, y, (y + (x >> 2)) % 5 === 0 ? r[1] : r[2]);
    }
  if (part === 'M') p.rect(0, 6, 20, 2, r[4]);
  return inked(pal, p);
}

/** A white picket fence. */
export function fence(pal: Pal): Pixels {
  const p = clear(pal);
  const w = pal.r('white');
  for (const x of [1, 7, 13])
    p.rect(x, 4, 4, 16, w[2])
      .rect(x, 4, 1, 16, w[3])
      .rect(x + 1, 3, 2, 1, w[2]);
  p.rect(0, 8, 20, 2, w[1]).rect(0, 15, 20, 2, w[1]);
  return inked(pal, p);
}

/** A garden's gateway plugged with a wheelbarrow tipped on its end until the gate comes back. */
export function plug(pal: Pal): Pixels {
  const p = clear(pal);
  const tray = pal.r('red');
  const s = pal.r('stone');
  p.rect(3, 1, 14, 13, tray[2]).rect(3, 1, 14, 2, tray[4]).rect(5, 4, 10, 8, tray[1]);
  p.rect(5, 14, 2, 6, s[1]).rect(13, 14, 2, 6, s[1]);
  p.disc(10, 16, 3, s[0]).disc(10, 16, 1.5, s[3]);
  return inked(pal, p);
}

/** The gate back in its gateway, standing open so you can walk through. */
export function gateHome(pal: Pal, color: GateColor): Pixels {
  const p = clear(pal);
  const w = pal.r('white');
  p.rect(0, 3, 3, 17, w[2]).rect(17, 3, 3, 17, w[2]);
  const g = gate(pal, color, 0);
  // swung open: drawn narrow against the left post
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (x % 3 === 0 && g.get(x, y) !== 255) p.set(3 + Math.floor(x / 3), y, g.get(x, y));
  return inked(pal, p);
}

/** A trail post: plain, or with a fresh yellow blaze painted on it. */
export function post(pal: Pal, blazed: boolean): Pixels {
  const p = clear(pal);
  const w = pal.r('wood');
  p.rect(7, 2, 7, 18, w[2]).rect(7, 2, 2, 18, w[3]).rect(12, 2, 2, 18, w[1]);
  p.rect(7, 1, 7, 1, w[4]);
  if (blazed) {
    const g = pal.r('gold');
    p.rect(8, 5, 5, 8, g[4]).rect(8, 5, 5, 1, g[5]).rect(12, 6, 1, 7, g[2]);
    p.set(14, 9, g[4]).set(15, 11, g[3]);
  }
  return inked(pal, p);
}

/** A tree trunk (`blazed` with a yellow mark; `marked` with a chalk outline where a blaze should go), and the round crown of leaves above it. */
export function trunk(pal: Pal, blazed: boolean, marked = false): Pixels {
  const p = clear(pal);
  const w = pal.r('wood');
  p.rect(6, 0, 8, 20, w[1]).rect(7, 0, 3, 20, w[2]).rect(12, 0, 1, 20, w[0]);
  p.rect(5, 17, 10, 3, w[1]);
  if (blazed) p.rect(7, 6, 5, 7, pal.c('gold', 4)).rect(7, 6, 5, 1, pal.c('gold', 5));
  else if (marked) p.rect(6, 5, 7, 9, pal.c('white', 3)).rect(7, 6, 5, 7, pal.c('wood', 4)).set(9, 9, pal.c('white', 3));
  else p.disc(10, 13, 2, w[0]).set(9, 12, pal.c('ink', 0));
  return inked(pal, p);
}

/** A big round crown of autumn leaves, 60x60, cut into nine blocks (0..8, left to right, top to bottom): an orange oak, or (`maple`) a taller red-and-gold maple. */
export function crown(pal: Pal, k: number, maple = false): Pixels {
  const big = new Pixels(60, 60, skyOf(pal));
  const o = maple ? pal.r('brick') : pal.r('orange');
  const red = maple ? pal.r('gold') : pal.r('brick');
  const rand = rng(maple ? 41 : 17);
  const puffs = maple
    ? [
        [30, 36, 20],
        [18, 38, 11],
        [42, 38, 11],
        [30, 18, 14],
        [21, 25, 10],
        [40, 24, 10],
        [30, 49, 11],
      ]
    : [
        [30, 34, 22],
        [16, 30, 13],
        [44, 30, 13],
        [24, 16, 12],
        [38, 15, 12],
        [30, 46, 14],
      ];
  for (const [cx, cy, r] of puffs) blob(big, cx, cy, r, r * 0.9, o, maple ? 1 : 0, o.length - 1);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rand() * 60);
    const y = Math.floor(rand() * 60);
    if (big.get(x, y) !== skyOf(pal)) big.rect(x, y, 2, 2, i % 3 ? red[maple ? 4 : 2] : o[4]);
  }
  const p = inked(pal, big).crop((k % 3) * 20, Math.floor(k / 3) * 20, 20, 20);
  return p;
}

/** Ground pressed into a footprint as long as a bathtub: grass edge (`part` L, M or R), a dent of mud with a toe line. */
export function print(pal: Pal, part: 'L' | 'M' | 'R'): Pixels {
  const p = clear(pal);
  const d = pal.r('dirt');
  const g = pal.r('grass');
  p.rect(0, 0, 20, 20, d[2]);
  speckle(p, 0, 6, 20, 14, d, 2, 1, part.charCodeAt(0), 0.2);
  p.rect(0, 0, 20, 6, d[1]).rect(0, 5, 20, 1, d[0]);
  if (part === 'L') p.rect(0, 0, 4, 20, g[3]).rect(3, 0, 1, 20, g[1]);
  if (part === 'R') p.rect(16, 0, 4, 20, g[3]).rect(16, 0, 1, 20, g[1]);
  if (part === 'M') for (const x of [3, 9, 15]) p.disc(x + 1, 2, 2, d[0]);
  return p;
}

/** An acorn: a little treasure. */
export function acorn(pal: Pal): Pixels {
  const p = clear(pal);
  const w = pal.r('wood');
  const o = pal.r('orange');
  p.disc(10, 12, 5, o[1]).disc(9, 11, 3, o[2]).set(8, 10, o[4]);
  p.rect(4, 6, 12, 4, w[1]).rect(5, 5, 10, 1, w[2]);
  for (let x = 5; x < 15; x += 2) p.set(x, 7, w[3]);
  p.rect(9, 3, 2, 2, w[0]);
  return inked(pal, p);
}

/** A slice of leftover pie on a plate: a few hit points back. */
export function pie(pal: Pal): Pixels {
  const p = clear(pal);
  const plate = pal.r('white');
  const crust = pal.r('parch');
  p.rect(2, 14, 16, 3, plate[2]).rect(2, 14, 16, 1, plate[3]);
  for (let y = 0; y < 8; y++) p.rect(4 + y, 6 + y, 13 - y, 1, pal.c('orange', 2));
  p.rect(4, 5, 13, 2, crust[3]).rect(4, 5, 13, 1, crust[4]);
  p.rect(15, 6, 2, 8, crust[2]);
  return inked(pal, p);
}

export const GATES = GATE_COLORS;

/** The size of the mountain's foot, in blocks. */
export const FOOT = { w: 5, h: 4 } as const;

/**
 * The mountain's big foot across the sidewalk, seen from the side: a rounded mound of rock coming out of the
 * mountain, with three toes at the front, each with a toenail. Part `k` (0 .. FOOT.w * FOOT.h - 1) is one block,
 * left to right, top to bottom.
 */
export function foot(pal: Pal, k: number): Pixels {
  const W = FOOT.w * 20;
  const H = FOOT.h * 20;
  const sky = skyOf(pal);
  const big = new Pixels(W, H, sky);
  const r = pal.r('rock');
  const inside = (x: number, y: number) =>
    ((x - 30) / 52) ** 2 + ((y - H) / 66) ** 2 <= 1 ||
    [
      [62, 62, 16],
      [80, 68, 12],
      [93, 72, 8],
    ].some(([cx, cy, rr]) => (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr) ||
    (x >= 60 && y >= 70);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x, y)) big.set(x, y, x < 30 ? r[4] : (x + y * 3) % 17 === 0 ? r[1] : r[3]);
  // shading under the toes, a few cracks, moss on top
  for (let x = 0; x < W; x++) for (let y = H - 4; y < H; y++) if (big.get(x, y) !== sky) big.set(x, y, r[2]);
  const m = pal.r('moss');
  big.rect(18, 18, 22, 3, m[2]).rect(22, 16, 12, 2, m[3]);
  // toenails, pale and rounded, at the front of each toe
  for (const [cx, cy, w, h] of [
    [70, 56, 7, 5],
    [86, 63, 5, 4],
    [97, 69, 3, 3],
  ])
    for (let y = -h; y <= h; y++)
      for (let x = -w; x <= w; x++) if ((x / w) ** 2 + (y / h) ** 2 <= 1) big.set(cx + x, cy + y, y < -h / 3 ? pal.c('parch', 4) : pal.c('parch', 3));
  const out = outline(big, pal.c('ink', 0), { transparent: sky });
  return out.crop((k % FOOT.w) * 20, Math.floor(k / FOOT.w) * 20, 20, 20);
}

/** A garden arbor over a gateway, in three parts: `top` (a leafy roof), `beam` (the cross beam) and `posts` (walk between them). */
export function arbor(pal: Pal, part: 'top' | 'beam' | 'posts'): Pixels {
  const p = clear(pal);
  const w = pal.r('wood');
  const g = pal.r('green');
  if (part === 'top') {
    for (let x = 0; x < 20; x++) for (let y = 6 + Math.round(Math.sin(x * 0.5) * 2); y < 20; y++) p.set(x, y, (x + y) % 5 ? g[2] : g[1]);
    for (const [x, y] of [
      [4, 10],
      [11, 8],
      [16, 12],
    ])
      p.disc(x, y, 2, pal.c('pink', 2)).set(x, y, pal.c('gold', 4));
  } else if (part === 'beam') {
    p.rect(0, 0, 20, 20, g[1]);
    p.rect(0, 8, 20, 6, w[2]).rect(0, 8, 20, 1, w[4]).rect(0, 13, 20, 1, w[0]);
    for (const x of [3, 9, 15]) p.disc(x, 6, 3, g[3]);
  } else {
    p.rect(0, 0, 3, 20, w[2]).rect(17, 0, 3, 20, w[2]).rect(0, 0, 1, 20, w[3]).rect(17, 0, 1, 20, w[3]);
    for (const [x, y] of [
      [2, 3],
      [18, 8],
      [1, 14],
    ])
      p.disc(x, y, 2, g[2]);
  }
  return inked(pal, p);
}

/** A fallen log lying across the path (L and R ends), one block high: hop it. */
export function log(pal: Pal, part: 'L' | 'R'): Pixels {
  const p = clear(pal);
  const w = pal.r('wood');
  p.rect(0, 6, 20, 14, w[2]).rect(0, 6, 20, 2, w[3]).rect(0, 17, 20, 3, w[1]);
  for (const x of [5, 13]) p.rect(x, 10, 4, 1, w[1]);
  if (part === 'L') p.disc(4, 13, 6, w[3]).ring(4, 13, 4, w[1]).ring(4, 13, 2, w[1]);
  else p.rect(14, 3, 2, 4, w[1]).rect(15, 2, 3, 2, pal.c('green', 3));
  return inked(pal, p);
}
