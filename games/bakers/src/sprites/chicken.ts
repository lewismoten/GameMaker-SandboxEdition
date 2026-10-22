// chick.cbl: Sir Reginald Cluckington III, Doc Leo's rubber chicken, as a character of his own
// (the stove interlude): yellow rubber, orange beak and feet, a red comb and his red harness.
// He waddles four ways (the body rocks a pixel), flaps both wings for a glide, squawks with
// his beak wide open, squashes and stretches when he bounces, and goes flat (pfff) when he
// plays dead, which he learned from Doc Leo.
import { Pixels } from '../../../kit/pixels';
import { CLEAR, blob, outline, recolor } from '../art/draw';
import { c, r } from '../art/pal';
import { BlockSet } from '../blocks/sets';

export type ChickPose = 'stand' | 'flap' | 'squawk' | 'blink';

const ink = () => c('ink', 0);

/** Drop shadow under an outlined sprite (only on clear pixels). */
function shadow(p: Pixels, x: number, w: number): Pixels {
  for (let y = 18; y < 20; y++) for (let xx = x; xx < x + w; xx++) if (p.get(xx, y) === CLEAR) p.set(xx, y, c('dark', 0));
  return p;
}

/** Sir Reginald facing right (the side view; mirrored for left). `step` rocks the waddle. */
function side(step: number, pose: ChickPose): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const lift = step ? 1 : 0;
  const leg = c('orange', 2);
  // legs and feet
  p.line(8, 14, 7 - lift, 17, leg).line(11, 14, 12 + lift, 17, leg).rect(5 - lift, 17, 3, 1, leg).rect(11 + lift, 17, 3, 1, leg);
  // tail, body, wing
  p.rect(2, 7 - lift, 2, 2, c('yellow', 3)).set(1, 6 - lift, c('yellow', 3));
  blob(p, 8.5, 11 - lift, 6, 4, r('yellow'), 1, 3);
  if (pose === 'flap') p.line(7, 9 - lift, 3, 2, c('yellow', 2)).line(8, 9 - lift, 5, 2, c('yellow', 2)).line(9, 9 - lift, 7, 3, c('yellow', 1));
  else p.rect(5, 11 - lift, 6, 2, c('yellow', 1));
  // the harness: a red strap round the chest, a brass ring for the leash
  p.rect(11, 8 - lift, 1, 6, c('red', 3)).set(11, 11 - lift, c('brass', 3));
  // head
  p.disc(14, 6 - lift, 3, c('yellow', 3)).set(13, 4 - lift, c('yellow', 4));
  p.set(13, 2 - lift, c('red', 3)).set(14, 2 - lift, c('red', 3)).set(15, 3 - lift, c('red', 3)).set(16, 8 - lift, c('red', 2));
  if (pose === 'squawk') p.line(17, 5 - lift, 19, 3 - lift, c('orange', 2)).line(17, 7 - lift, 19, 9 - lift, c('orange', 2)).set(17, 6 - lift, c('red', 1));
  else p.rect(17, 6 - lift, 2, 1, c('orange', 2)).set(17, 7 - lift, c('orange', 1));
  if (pose === 'blink') p.set(15, 5 - lift, c('yellow', 1));
  else p.set(15, 5 - lift, ink());
  return shadow(outline(p, ink()), 4, 12);
}

/** Facing you. */
function front(step: number, pose: ChickPose): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const lift = step ? 1 : 0;
  const leg = c('orange', 2);
  p.line(8, 15, 8, 17, leg).line(12, 15, 12, 17, leg).rect(6 + lift, 17, 3, 1, leg).rect(11 + lift, 17, 3, 1, leg);
  if (pose === 'flap') {
    p.line(5, 11, 1, 4, c('yellow', 2)).line(5, 12, 2, 6, c('yellow', 2)).line(15, 11, 19, 4, c('yellow', 2)).line(15, 12, 18, 6, c('yellow', 2));
  } else {
    p.rect(4, 10, 2, 4, c('yellow', 2)).rect(14, 10, 2, 4, c('yellow', 2));
  }
  blob(p, 10, 12 - lift * 0.5, 5.5, 4.5, r('yellow'), 1, 3);
  p.rect(5, 12, 10, 1, c('red', 3)).set(10, 12, c('brass', 3));
  p.disc(10, 6, 3.5, c('yellow', 3)).set(9, 4, c('yellow', 4));
  p.set(9, 2, c('red', 3)).set(10, 1, c('red', 3)).set(11, 2, c('red', 3)).set(10, 2, c('red', 3));
  if (pose === 'squawk') p.rect(9, 7, 3, 3, c('orange', 2)).set(10, 8, c('red', 1));
  else p.rect(9, 7, 3, 1, c('orange', 2)).set(10, 8, c('orange', 1));
  p.set(10, 10, c('red', 2));
  const eye = pose === 'blink' ? c('yellow', 1) : ink();
  p.set(8, 5, eye).set(12, 5, eye);
  return shadow(outline(p, ink()), 5, 11);
}

/** From behind: comb, the back of the harness, tail feathers. */
function back(step: number, pose: ChickPose): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const lift = step ? 1 : 0;
  const leg = c('orange', 2);
  p.line(8, 15, 8, 17, leg).line(12, 15, 12, 17, leg).rect(7 - lift, 17, 2, 1, leg).rect(12 - lift, 17, 2, 1, leg);
  if (pose === 'flap') p.line(5, 11, 1, 4, c('yellow', 2)).line(15, 11, 19, 4, c('yellow', 2));
  blob(p, 10, 12 - lift * 0.5, 5.5, 4.5, r('yellow'), 1, 3);
  p.rect(9, 14, 3, 3, c('yellow', 3)).set(10, 17, c('yellow', 2));
  p.rect(10, 8, 1, 7, c('red', 3)).rect(5, 11, 10, 1, c('red', 3)).set(10, 11, c('brass', 3));
  p.disc(10, 6, 3.5, c('yellow', 3));
  p.set(9, 2, c('red', 3)).set(10, 1, c('red', 3)).set(11, 2, c('red', 3)).set(10, 2, c('red', 3));
  return shadow(outline(p, ink()), 5, 11);
}

export function reggie(facing: 'down' | 'up' | 'side', step = 0, pose: ChickPose = 'stand'): Pixels {
  return facing === 'side' ? side(step, pose) : facing === 'up' ? back(step, pose) : front(step, pose);
}

/** Squashed flat (the bottom of a bounce) or stretched tall (the top). */
export function reggieBounce(stretch: boolean): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  if (stretch) {
    blob(p, 10, 9, 4, 6, r('yellow'), 1, 3);
    p.disc(10, 3, 2.5, c('yellow', 3)).set(10, 0, c('red', 3)).set(9, 1, c('red', 3)).set(11, 1, c('red', 3));
    p.rect(9, 5, 3, 1, c('orange', 2)).set(9, 3, ink()).set(11, 3, ink()).rect(6, 9, 8, 1, c('red', 3));
    p.line(9, 15, 9, 16, c('orange', 2)).line(11, 15, 11, 16, c('orange', 2));
    return shadow(outline(p, ink()), 7, 6);
  }
  blob(p, 10, 14, 8, 3.5, r('yellow'), 1, 3);
  p.disc(10, 10, 3, c('yellow', 3)).set(9, 7, c('red', 3)).set(10, 7, c('red', 3)).set(11, 7, c('red', 3));
  p.rect(9, 12, 3, 1, c('orange', 2)).set(8, 10, ink()).set(12, 10, ink()).rect(3, 14, 14, 1, c('red', 3));
  p.rect(5, 17, 3, 1, c('orange', 2)).rect(12, 17, 3, 1, c('orange', 2));
  return shadow(outline(p, ink()), 2, 16);
}

/** Playing dead: flat as a pancake, X eyes; `puff` adds the last of the air going out. */
export function reggieFlat(puff: boolean): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  blob(p, 9, 15, 8, 2.2, r('yellow'), 0, 2);
  p.rect(14, 12, 5, 3, c('yellow', 2)).rect(19, 13, 1, 1, c('orange', 2)).set(15, 11, c('red', 3)).set(16, 11, c('red', 3));
  p.set(15, 13, ink()).set(17, 13, ink());
  p.rect(1, 17, 3, 1, c('orange', 2)).rect(5, 18, 3, 1, c('orange', 2));
  const out = outline(p, ink());
  if (puff) out.disc(4, 8, 2, c('paper', 4)).disc(7, 6, 1.5, c('paper', 4)).set(9, 4, c('paper', 4));
  return out;
}

export function buildChickenBlocks(): BlockSet {
  const b = new BlockSet(50, true);
  for (const f of ['down', 'up', 'side'] as const) for (const s of [0, 1]) b.add(`${f}${s}`, reggie(f, s));
  b.add('flapSide0', reggie('side', 0, 'flap'));
  b.add('flapSide1', reggie('side', 1, 'flap'));
  b.add('flapDown', reggie('down', 0, 'flap'));
  b.add('flapUp', reggie('up', 0, 'flap'));
  b.add('squawk', reggie('down', 0, 'squawk'));
  b.add('blink', reggie('down', 0, 'blink'));
  b.add('squash', reggieBounce(false));
  b.add('stretch', reggieBounce(true));
  b.add('hurt', recolor(reggie('down', 0), (v) => (v === c('ink', 0) ? v : c('red', 4))));
  b.add('dead', reggieFlat(false));
  b.add('dead2', reggieFlat(true));
  return b;
}
