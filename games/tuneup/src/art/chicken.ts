// The rubber chicken who does the repairs: Sir Reginald III, and (once the egg is laid)
// Lady Regina III, the same bird with a bow on the comb. A classic rubber chicken: pale yellow
// rubber, a long limp neck, a red comb and wattle, an orange beak open mid-squawk, little wings
// and long scrawny legs. Drawn in a 20x20 box at any scale `s`, facing right, on clear (255).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '../../../snowbound/src/art/draw';
import { P } from './palette';

const c = P.c;
const ink = c('ink', 0);

export interface ChickenPose {
  /** Lady Regina III: a bow on her comb. */
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
  // legs: long and scrawny, three toes each
  for (const lx of [8.5, 11]) {
    p.line(Math.round(S(lx)), Math.round(S(14)), Math.round(S(lx - 0.5)), Math.round(S(19)), c('orange', 2));
    if (s >= 2) p.line(Math.round(S(lx) + 1), Math.round(S(14)), Math.round(S(lx - 0.5) + 1), Math.round(S(19)), c('orange', 1));
    p.line(Math.round(S(lx - 2)), Math.round(S(19.4)), Math.round(S(lx + 1.6)), Math.round(S(19.4)), c('orange', 1));
  }
  // the body: a plump teardrop, tail up at the back
  blob(p, S(9), S(11.5), S(5.4), S(3.6), rubber, 0, 3);
  blob(p, S(4.4), S(9.2), S(2), S(2.6), rubber, 0, 3);
  // the wing
  if (o.flap) blob(p, S(8.6), S(7.8), S(3), S(2), rubber, 0, 2);
  else blob(p, S(9.6), S(11.4), S(3), S(1.8), rubber, 0, 1);
  // the neck: long and limp, a little bent
  const hx = o.peck ? 15.6 : 14.2;
  const hy = (o.peck ? 13 : 4.4) + bob;
  for (let t = 0; t <= 1; t += 0.05 / s) {
    const x = 12 + (hx - 12) * t + Math.sin(t * Math.PI) * (o.peck ? 1.5 : -0.8);
    const y = 9.4 + (hy - 9.4) * t;
    blob(p, S(x), S(y), S(1.4), S(1.4), rubber, 1, 3);
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
    // a bow on the comb, ribbon pink
    const cx = S(hx - 0.2);
    const cy = S(hy - 3.6);
    blob(p, cx - S(1.1), cy, S(1), S(0.8), P.r('pink'), 1, 3);
    blob(p, cx + S(1.1), cy, S(1), S(0.8), P.r('pink'), 1, 3);
    p.disc(cx, cy, Math.max(0.6, S(0.45)), c('pink', 0));
  }
  return outline(p, ink);
}
