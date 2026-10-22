// Helpers every level's blocks use: hint signs on stakes, the sky band for a map row,
// sidewalks and roads, wallpaper and floorboards for indoors, and scents for the sniff.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, micro, speckle, sprite } from '../art/draw';
import { FLIP, type Bestiary } from '../characters/mons';
import { POWER } from '../ids';
import { c, r } from '../blocks/tiles';

/** Sky band (0 = high .. 3 = the horizon) for map row y, when the ground is at row `ground`. */
export const bandAt = (y: number, ground: number) => {
  const d = ground - y;
  return d >= 10 ? 0 : d >= 7 ? 1 : d >= 4 ? 2 : 3;
};

/** A hint sign on a stake over `base`, with an optional arrow. */
export function sign(base: Pixels, words: string, arrow?: 'up' | 'down' | 'right' | 'left'): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  p.rect(9, 12, 2, 8, c('wood', 1));
  p.rect(0, 1, 20, 12, c('wood', 3)).frame(0, 1, 20, 12, c('wood', 0));
  p.rect(1, 2, 18, 1, c('wood', 4));
  const w = words.length * 4 - 1 + (arrow ? 4 : 0);
  const x = 10 - Math.floor(w / 2);
  micro(p, x, 5, words, c('ink', 0));
  if (arrow) {
    const ax = x + w - 2;
    const red = c('red', 2);
    if (arrow === 'up' || arrow === 'down') {
      p.rect(ax, 4, 1, 7, red);
      const tip = arrow === 'up' ? 4 : 10;
      const dir = arrow === 'up' ? 1 : -1;
      p.set(ax - 1, tip + dir, red)
        .set(ax + 1, tip + dir, red)
        .set(ax - 2, tip + 2 * dir, red)
        .set(ax + 2, tip + 2 * dir, red);
    } else {
      p.rect(ax - 2, 7, 5, 1, red);
      const tip = arrow === 'right' ? ax + 2 : ax - 2;
      const dir = arrow === 'right' ? -1 : 1;
      p.set(tip + dir, 6, red)
        .set(tip + dir, 8, red)
        .set(tip + 2 * dir, 5, red)
        .set(tip + 2 * dir, 9, red);
    }
  }
  return p;
}

/** Concrete sidewalk slabs. */
export function sidewalk(seed: number, ramp = 'stone'): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r(ramp), 3, 1, seed, 0.2);
  p.rect(0, 0, 20, 2, c(ramp, 4)).rect(0, 2, 20, 1, c(ramp, 2));
  p.rect(seed % 2 ? 19 : 9, 0, 1, 20, c(ramp, 1));
  p.rect(0, 16, 20, 4, c(ramp, 2)).rect(0, 16, 20, 1, c(ramp, 4));
  return p;
}

/** Asphalt, with a dashed yellow line when `dashes`. */
export function road(dashes: boolean, seed: number): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r('asphalt'), 1, 1, seed, 0.3);
  if (dashes) p.rect(2, 9, 12, 2, c('yellow', 3));
  return p;
}

/** Wallpaper: a ground color with a pattern (stripes, little flowers, stars or diamonds). */
export function wallpaper(ramp: string, pattern: 'stripes' | 'sprig' | 'stars' | 'diamonds' | 'tiles', seed = 1, accent = 'paint'): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r(ramp), 2, 1, seed, 0.08);
  if (pattern === 'stripes') for (let x = 0; x < 20; x += 5) p.rect(x, 0, 2, 20, c(ramp, 3));
  if (pattern === 'sprig')
    for (const [x, y] of [
      [4, 4],
      [14, 14],
    ])
      p.set(x, y, c(accent, 3))
        .set(x - 1, y + 1, c('green', 1))
        .set(x + 1, y + 1, c('green', 1))
        .set(x, y + 2, c('green', 1));
  if (pattern === 'stars')
    for (const [x, y] of [
      [5, 5],
      [15, 15],
    ])
      p.set(x, y - 1, c(accent, 3))
        .set(x - 1, y, c(accent, 3))
        .set(x, y, c(accent, 3))
        .set(x + 1, y, c(accent, 3))
        .set(x, y + 1, c(accent, 3));
  if (pattern === 'diamonds')
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) if ((x + y) % 10 === 0 || (x - y + 20) % 10 === 0) p.set(x, y, c(ramp, 1));
  if (pattern === 'tiles') {
    p.rect(0, 0, 20, 20, c(accent, 3));
    for (let k = 0; k < 20; k += 5) p.rect(0, k, 20, 1, c(accent, 1)).rect(k, 0, 1, 20, c(accent, 1));
  }
  return p;
}

/** Floorboards seen edge-on, a strip of shadow under them. */
export function floorboards(seed: number, ramp = 'wood'): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 6, r(ramp), 3, 1, seed, 0.15);
  p.rect(0, 0, 20, 1, c(ramp, 4));
  p.rect(0, 6, 20, 1, c(ramp, 0));
  const R = rng(seed);
  p.rect(Math.floor(R() * 20), 1, 1, 5, c(ramp, 1));
  speckle(p, 0, 7, 20, 13, r(ramp), 1, 1, seed + 1, 0.12);
  for (let y = 9; y < 20; y += 4) p.rect(0, y, 20, 1, c(ramp, 0));
  return p;
}


/**
 * Scents: wisps on the air that only a sniff (S) can beat. Each one turns into what is
 * hidden there, born where the scent was: `hidden` is a monster name in this level (a
 * pickup popping up and landing, for example).
 */
export function scent(b: Bestiary, name: string, hidden: string): void {
  if (!b.mb.has('scent1')) throw new Error('scent pics missing');
  b.add(name, {
    pics: [
      ['scent1', 6],
      ['scent2', 6],
    ],
    power: POWER.scent,
    becomes: hidden,
    upscore: 25,
  });
}

/** A found thing that hops up out of its hiding place and lands one block on. */
export function popUp(b: Bestiary, name: string, pic: string, lands: string, dx = 0): void {
  b.add(name, {
    pics: [[pic, 2]],
    power: 2,
    path: [
      [0, -1, 5],
      [dx, 0, 5],
    ],
    end: -1,
    becomes: lands,
  });
}

/** A pest that paces back and forth along `w` blocks (beaten by the tricks above its power). */
export function pacer(b: Bestiary, name: string, pics: [string, number][], power: number, w: number, becomes?: string, speed = 2): void {
  b.add(name, {
    pics,
    power,
    path: [
      [w, 0, speed, 0],
      [0, 0, speed, FLIP],
    ],
    becomes,
    upscore: 25,
  });
}

export { sprite };

/** Water: deep below the surface; `phase` for the ripple animation. */
export function water(surface: boolean, phase: number, base?: Pixels): Pixels {
  const p = base ? copyOf(base) : new Pixels(20, 20, c('water', 1));
  if (!base) for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x * 3 + y * 7 + phase * 5) % 13 === 0) p.set(x, y, c('water', 2));
  if (surface) {
    p.rect(0, 12, 20, 8, c('water', 1));
    for (let x = 0; x < 20; x++) {
      const y = 11 + Math.round(Math.sin((x + phase * 4) / 3));
      p.set(x, y, c('water', 3)).set(x, y + 1, c('water', 2));
    }
  }
  return p;
}

function copyOf(base: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  return p;
}

/** A rope knot tying something shut (chew it), over `base`. */
export function ropeKnot(base: Pixels): Pixels {
  const p = copyOf(base);
  p.rect(0, 8, 20, 3, c('hay', 2)).rect(0, 8, 20, 1, c('hay', 3));
  blob(p, 10, 9, 4, 4, r('hay'), 1, 3);
  p.line(8, 12, 6, 18, c('hay', 1)).line(12, 12, 14, 18, c('hay', 1));
  return p;
}
