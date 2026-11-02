// The rubber chicken who does the repairs: Sir Reginald III, and (once the egg is laid)
// Lady Regina III, the same bird with a tiara in front of her comb. A classic rubber chicken, limp as one:
// pale yellow rubber lying on its belly, its long scrawny legs trailing out behind it, a long
// floppy neck that just about holds the head up, a red comb and wattle, an orange beak open
// mid-squawk. Drawn in a 20x20 box at any scale `s`, facing right, on clear (255).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '../../../snowbound/src/art/draw';
import { P } from './palette';

const c = P.c;
const ink = c('ink', 0);

export interface ChickenPose {
  /** Lady Regina III: a tiara in front of her comb. */
  lady?: boolean;
  /** 0 or 1: the head bobs down a little on 1. */
  bob?: number;
  /** Beak open wide (a squawk). */
  squawk?: boolean;
  /** Pecking: the head down at the ground in front. */
  peck?: boolean;
  /** Wings up (a flap). */
  flap?: boolean;
}

/** The chicken in a (20s x 20s) picture, facing right. */
export function chicken(s: number, o: ChickenPose = {}): Pixels {
  const W = Math.round(20 * s);
  const p = new Pixels(W, W, 255);
  const S = (v: number) => v * s;
  const rubber = P.r('rubber');
  const bob = o.bob ? 1 : 0;
  // legs: long and scrawny, trailing out behind the body along the floor, three toes each
  for (const [lx, ly, fx, fy] of [
    [8.6, 17.4, 1.8, 17.2],
    [9.2, 18.6, 2.2, 19.2],
  ]) {
    p.line(Math.round(S(lx)), Math.round(S(ly)), Math.round(S(fx)), Math.round(S(fy)), c('orange', 2));
    if (s >= 2) p.line(Math.round(S(lx)), Math.round(S(ly)) + 1, Math.round(S(fx)), Math.round(S(fy)) + 1, c('orange', 1));
    for (const [tx, ty] of [
      [-1.4, -1.2],
      [-1.6, 0],
      [-1.2, 0.6],
    ])
      p.line(Math.round(S(fx)), Math.round(S(fy)), Math.round(S(fx + tx)), Math.round(S(fy + ty)), c('orange', 1));
  }
  // the body: a plump teardrop lying on its belly, the tail flopped at the back
  blob(p, S(11.8), S(16.2), S(4.4), S(3), rubber, 0, 3);
  blob(p, S(7.6), S(14.8), S(1.6), S(1.5), rubber, 0, 3);
  // the wing, flat along the side (raised in a flap)
  if (o.flap) blob(p, S(9.4), S(12.2), S(3), S(1.8), rubber, 0, 2);
  else blob(p, S(11.8), S(15.8), S(2.6), S(1.5), rubber, 0, 1);
  // the neck: long and floppy, sagging before it lifts the head (or flopped to the floor)
  const hx = o.peck ? 17.4 : 16;
  const hy = (o.peck ? 17.4 : 8.6) + bob;
  for (let t = 0; t <= 1; t += 0.05 / s) {
    const x = 14 + (hx - 14) * t + Math.sin(t * Math.PI) * (o.peck ? 0.4 : 1.4);
    const y = 15 + (hy - 15) * t + Math.sin(t * Math.PI) * (o.peck ? -1.6 : 0.6);
    blob(p, S(x), S(y), S(1.3), S(1.3), rubber, 1, 3);
  }
  // the head, the comb (three bumps) and the wattle
  blob(p, S(hx), S(hy), S(2.3), S(2.1), rubber, 1, 3);
  for (const [dx, dy, r] of [
    [-1.4, -2.2, 0.9],
    [0, -2.6, 1.1],
    [1.3, -2.1, 0.9],
  ])
    blob(p, S(hx + dx), S(hy + dy), S(r), S(r), P.r('red'), 1, 3);
  blob(p, S(hx + 1.6), S(hy + 2.2), S(0.7), S(1.1), P.r('red'), 1, 2);
  // the beak: open, orange
  const bx = Math.round(S(hx + 2));
  const by = Math.round(S(hy - 0.3));
  const open = o.squawk ? 2 : 1;
  for (let i = 0; i < Math.max(2, Math.round(S(2.4))); i++) {
    const h = Math.max(1, Math.round(S(open) * (1 - i / Math.max(2, S(2.4)))));
    p.rect(bx + i, by - Math.ceil(h / 2), 1, 1, c('orange', 3)).rect(bx + i, by + Math.floor(h / 2), 1, 1, c('orange', 2));
  }
  if (o.squawk && s >= 2) p.rect(bx, by, Math.round(S(1.4)), 1, c('tongue', 0));
  // the eye: a round black dot (a rubber chicken always looks surprised)
  const ex = Math.round(S(hx + 0.4));
  const ey = Math.round(S(hy - 0.5));
  if (s >= 3) p.disc(ex, ey, S(0.7), c('paint', 3)).disc(ex, ey, S(0.4), ink);
  else p.set(ex, ey, ink);
  if (o.lady) {
    // a gold tiara in front of the comb, three points and a pink jewel
    const y0 = Math.round(S(hy - 1.7));
    const x0 = Math.round(S(hx - 1.9));
    const x1 = Math.round(S(hx + 1.3));
    const t = Math.max(1, Math.round(S(0.5)));
    p.rect(x0, y0, x1 - x0 + 1, t, c('gold', 1));
    for (const [dx, h] of [
      [-1.7, 2.4],
      [-0.3, 3.4],
      [1.1, 2.4],
    ]) {
      const x = Math.round(S(hx + dx));
      for (let y = Math.round(S(hy - 1.7 - h)); y < y0; y++) p.rect(x - Math.floor(t / 2), y, t, 1, c('gold', 1));
      p.rect(x - Math.floor(t / 2), Math.round(S(hy - 1.7 - h)), t, t, c('paint', 3));
    }
    p.disc(S(hx - 0.3), S(hy - 2.4), Math.max(0.6, S(0.7)), c('pink', 1));
  }
  return outline(p, ink);
}
