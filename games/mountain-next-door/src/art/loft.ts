// The inside of the town hall's tower at night, in the game's woodcut: plank walls with grain and knots, carved
// beams, arched windows, a wall lamp with a warm hatched glow, a big clock face (3 x 3 blocks) and the iron works
// behind it (a gear, 2 x 2), and a swinging pendulum. The smoke from the flues is drawn over the same planks.
import { Pixels, dither } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../../kit/starter/palette';
import { hatch } from './style';

/** Planks across, four courses of five rows, each with its own grain; `seed` moves the joints and knots. */
export function planks(pal: Pal, seed: number): Pixels {
  const w = pal.r('wood');
  const p = new Pixels(20, 20, w[1]);
  for (let row = 0; row < 4; row++) {
    const y = row * 5;
    p.rect(0, y + 4, 20, 1, w[0]);
    p.rect(0, y, 20, 1, w[2]);
    for (let x = 0; x < 20; x++) if ((x * 3 + row * 7 + seed * 5) % 11 === 0) p.set(x, y + 2, w[0]);
    p.rect((row * 7 + seed * 6) % 18, y + 1, 1, 3, w[0]); // the joint between two boards
  }
  const kx = 4 + seed * 9;
  p.rect(kx, 7, 3, 2, w[0]).set(kx + 1, 7, w[2]);
  return p;
}

/** A carved beam standing on the planks: a squared post with a light edge, a shadow side hatched, and chevrons cut in. */
export function beam(pal: Pal, seed: number): Pixels {
  const w = pal.r('wood');
  const ink = pal.c('ink', 0);
  const p = planks(pal, seed);
  p.rect(6, 0, 8, 20, w[2]).rect(6, 0, 2, 20, w[3]).rect(7, 0, 1, 20, w[4]);
  hatch(p, 11, 0, 3, 20, w[0], 3);
  for (let y = 2; y < 20; y += 6)
    p.set(9, y, ink)
      .set(10, y + 1, ink)
      .set(9, y + 2, ink);
  p.rect(5, 0, 1, 20, ink).rect(14, 0, 1, 20, ink);
  return p;
}

/** An arched window on the planks: a dark night with two stars, or (`lit`) a warm pane. */
export function arch(pal: Pal, lit: boolean): Pixels {
  const w = pal.r('wood');
  const ink = pal.c('ink', 0);
  const sky = pal.r('sky');
  const p = planks(pal, 1);
  p.rect(4, 4, 12, 13, w[3]);
  p.rect(6, 7, 8, 9, sky[0]).rect(7, 6, 6, 1, sky[0]).rect(8, 5, 4, 1, sky[0]);
  p.rect(9, 6, 2, 10, w[3]).rect(6, 11, 8, 1, w[3]);
  if (lit) p.rect(6, 12, 3, 4, pal.c('gold', 4)).rect(11, 12, 3, 4, pal.c('gold', 3));
  else p.set(7, 8, pal.c('white', 3)).set(12, 13, pal.c('white', 3));
  p.rect(3, 17, 14, 2, w[2]).rect(3, 19, 14, 1, ink);
  return p;
}

/** A hurricane lamp hung on the planks, a hatched glow of warm light round it. */
export function wallLamp(pal: Pal): Pixels {
  const p = planks(pal, 0);
  const g = pal.r('gold');
  const ink = pal.c('ink', 0);
  p.map((x, y, c) => {
    const d = Math.hypot(x - 10, y - 11);
    return d < 10 && dither(x, y, 0.75 - d / 14) ? g[3] : c;
  });
  p.rect(9, 0, 2, 3, ink).rect(7, 3, 6, 2, pal.c('rock', 2));
  p.rect(6, 5, 8, 10, g[5]).rect(8, 7, 4, 6, pal.c('orange', 3));
  p.rect(6, 15, 8, 2, pal.c('rock', 2)).rect(5, 5, 1, 12, ink).rect(14, 5, 1, 12, ink);
  return p;
}

/** The big clock face, as nine blocks: a carved wooden ring, a pale dial with twelve marks, and hands at ten to three. */
export function clockFace(pal: Pal): Pixels[] {
  const w = pal.r('wood');
  const ink = pal.c('ink', 0);
  const big = new Pixels(60, 60);
  const wall = planks(pal, 0);
  big.map((x, y) => wall.get(x % 20, y % 20));
  const cx = 29.5;
  const cy = 29.5;
  big.map((x, y, c) => {
    const d = Math.hypot(x - cx, y - cy);
    if (d <= 27) return d > 25 ? ink : d > 22 ? (dither(x, y, 0.5) ? w[4] : w[3]) : d > 21 ? ink : pal.c('white', 2);
    return c;
  });
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    const len = k % 3 === 0 ? 6 : 3;
    for (let r = 20 - len; r <= 20; r += 0.5) big.set(Math.round(cx + Math.sin(a) * r), Math.round(cy - Math.cos(a) * r), ink);
  }
  const hand = (deg: number, len: number, wide: boolean) => {
    const a = (deg * Math.PI) / 180;
    for (let r = 0; r <= len; r += 0.5) {
      const x = Math.round(cx + Math.sin(a) * r);
      const y = Math.round(cy - Math.cos(a) * r);
      big.set(x, y, ink);
      if (wide) big.set(x + 1, y, ink);
    }
  };
  hand(-60, 12, true); // the hour hand
  hand(60, 18, false); // the minute hand (the clock is eleven minutes fast)
  big.rect(28, 28, 3, 3, pal.c('red', 3));
  return Array.from({ length: 9 }, (_, i) => big.crop((i % 3) * 20, Math.floor(i / 3) * 20, 20, 20));
}

/** The iron works: a big toothed gear on a hub, with a smaller one meshing at its corner, on the planks (2 x 2 blocks). */
export function gear(pal: Pal): Pixels[] {
  const ink = pal.c('ink', 0);
  const iron = pal.r('rock');
  const big = new Pixels(40, 40);
  const wall = planks(pal, 1);
  big.map((x, y) => wall.get(x % 20, y % 20));
  const wheel = (cx: number, cy: number, r: number, teeth: number, hub: number) => {
    big.map((x, y, c) => {
      const d = Math.hypot(x - cx, y - cy);
      const a = Math.atan2(y - cy, x - cx);
      const tooth = Math.cos(a * teeth) > 0.2 ? 2 : 0;
      if (d <= r + tooth) return d > r + tooth - 1.2 ? ink : d < hub ? ink : d < hub + 2 ? iron[1] : d > r - 4 ? iron[3] : iron[2];
      return c;
    });
    for (let s = 0; s < 3; s++) {
      const a = (s * Math.PI * 2) / 3 + 0.5;
      for (let q = hub; q < r - 3; q += 0.5) big.set(Math.round(cx + Math.cos(a) * q), Math.round(cy + Math.sin(a) * q), ink);
    }
  };
  wheel(15, 22, 13, 9, 3);
  wheel(34, 8, 5, 6, 1);
  return [0, 1, 2, 3].map((i) => big.crop((i % 2) * 20, Math.floor(i / 2) * 20, 20, 20));
}

/** The pendulum, 1 x 2 blocks (top, bottom), swung to one `side`: a rod and a brass bob, on the planks. */
export function pendulum(pal: Pal, side: -1 | 1): Pixels[] {
  const ink = pal.c('ink', 0);
  const g = pal.r('gold');
  const big = new Pixels(20, 40);
  const wall = planks(pal, 0);
  big.map((x, y) => wall.get(x, y % 20));
  for (let y = 0; y < 30; y++) {
    const x = 10 + Math.round((side * y * 3) / 30);
    big.set(x, y, ink).set(x + 1, y, g[2]);
  }
  const bx = 10 + side * 3;
  big.map((x, y, c) => {
    const d = Math.hypot(x - bx, y - 31);
    return d <= 5 ? (d > 4 ? ink : Math.hypot(x - bx + 1, y - 30) < 2.5 ? g[5] : g[3]) : c;
  });
  return [big.crop(0, 0, 20, 20), big.crop(0, 20, 20, 20)];
}

/** Warm smoke rising on the planks: puffs of pale, soft-edged fog (frame `f` of six), or (`f` -1) only a faint haze between. */
export function loftPuff(pal: Pal, f: number): Pixels {
  const p = planks(pal, 0);
  const fog = pal.r('fog');
  if (f < 0) {
    for (let y = 1; y < 20; y += 4) for (const dx of [-1, 0, 1]) if ((y + dx) % 3) p.set(9 + dx + (y % 3), y, fog[1]);
    return p;
  }
  for (let k = 0; k < 3; k++) {
    const cy = 26 - ((f * 4 + k * 8) % 26) - 3;
    const cx = 10 + Math.round(Math.sin((cy + f) / 4) * 3);
    const r = 3 + k;
    for (let y = cy - r - 1; y <= cy + r + 1; y++)
      for (let x = cx - r - 1; x <= cx + r + 1; x++) {
        if (x < 0 || x >= 20 || y < 0 || y >= 20) continue;
        const d = Math.hypot(x - cx, y - cy) / r;
        if (d <= 0.6) p.set(x, y, fog[3]);
        else if (d <= 0.9) p.set(x, y, dither(x, y, 1.1 - d) ? fog[3] : fog[2]);
        else if (d <= 1.15 && dither(x, y, 1.2 - d)) p.set(x, y, fog[2]);
      }
  }
  return p;
}
