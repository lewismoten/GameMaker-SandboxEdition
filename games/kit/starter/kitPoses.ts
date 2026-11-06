// Kit's whole pose set, every picture drawn from his palette ramps (so a helper's palette recolors it): the side-view
// poses (a head block over a body block, 20x40 together). The slim top-down and diagonal facings are in kitSlim.ts.
// Poses that crouch fill the bottom block alone and leave the top block empty on purpose, so a bird at head height
// misses him (the approach of KIT DUCKS). Friendly throughout: the "death" is dizzy, with stars, nothing worse.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Book } from './book';
import { body, head, outlinedPair, type Legs } from './hero';
import { kitRamp } from './heroLook';
import { scaleDown } from './kitSizes';
import type { Pal } from './palette';

const T = 255;
export interface Pose {
  name: string;
  /** What the pose is for, so a sheet can group them. */
  use: string;
  /** The head block and the body block (20x20 each); top is null for the crouching poses. */
  top: Pixels | null;
  bottom: Pixels;
}

const STAND: Legs = { back: [5, 0], front: [11, 0] };
const WALK: Legs[] = [
  { back: [3, 0], front: [12, 0] },
  { back: [7, 2], front: [9, 0] },
  { back: [12, 0], front: [3, 0] },
  { back: [9, 0], front: [7, 2] },
];

/** A little four-point star, for dizzy and for pickups. */
function star(p: Pixels, pal: Pal, x: number, y: number): void {
  const gold = pal.r('gold');
  p.set(x, y - 1, gold[4])
    .set(x - 1, y, gold[4])
    .set(x + 1, y, gold[4])
    .set(x, y + 1, gold[4])
    .set(x, y, pal.c('white', 3));
}

/** Crouched, in the bottom block alone: `deep` 0 or 1 lowers him a pixel; `feet` shifts the sneakers for a sneaking step. */
function crouch(pal: Pal, deep: 0 | 1, feet: -1 | 0 | 1, reach = false): Pixels {
  const p = new Pixels(20, 20, T);
  const hood = kitRamp(pal, 'hood');
  const pants = kitRamp(pal, 'pants');
  const skin = kitRamp(pal, 'skin');
  const white = pal.r('white');
  blob(p, 7, 14 + deep, 6.5, 4.5, hood, 0, 4);
  // the head, a little smaller, forward and low
  const small = scaleDown(head(pal, 'smile'), 15, 15, pal.c('ink', 0));
  p.blit(small, 4, 2 + deep, T);
  blob(p, 11, 16, 4.5, 2.6, pants, 0, 4);
  for (const x of [4 + feet, 10 - feet])
    p.rect(x, 17, 6, 3, white[3])
      .rect(x, 19, 6, 1, white[1])
      .set(x + 4, 18, kitRamp(pal, 'hat')[3]);
  if (reach) {
    p.line(8, 14, 16, 17, hood[2]).line(8, 15, 16, 18, hood[2]);
    p.disc(17, 17.5, 1.7, skin[2]);
    star(p, pal, 18, 14);
  }
  return outline(p, pal.c('ink', 0), { transparent: T });
}

/** Every side-view pose, in the order a sheet shows them. */
export function sidePoses(pal: Pal): Pose[] {
  const out: Pose[] = [];
  const add = (name: string, use: string, top: Pixels, bottom: Pixels) => {
    const [t, b] = outlinedPair(pal, top, bottom);
    out.push({ name, use, top: t, bottom: b });
  };
  const crouched = (name: string, use: string, bottom: Pixels) => out.push({ name, use, top: null, bottom });
  const stand = body(pal, { arms: 'down', legs: STAND });
  add('stand', 'idle', head(pal, 'smile'), stand);
  add('blink', 'idle', head(pal, 'blink'), stand);
  add('look', 'idle', head(pal, 'smile', false, -1), stand);
  WALK.forEach((legs, i) => add(`walk${i}`, 'walk', head(pal, 'smile'), body(pal, { arms: i % 2 ? 'swingB' : 'swingA', legs })));
  add('jump', 'jump', head(pal, 'smile', false, 0, 'both'), body(pal, { arms: 'high', legs: 'tuck' }));
  add('fall', 'fall', head(pal, 'oh', false, 0, 'left'), body(pal, { arms: 'flail', legs: 'dangle' }));
  add('drop', 'drop', head(pal, 'oh', false, 0, 'both'), body(pal, { arms: 'high', legs: 'dangle' }));
  add('climb0', 'climb', head(pal, 'back', true), body(pal, { arms: 'upA', legs: 'climbA', front: true, back: true }));
  add('climb1', 'climb', head(pal, 'back', true), body(pal, { arms: 'upB', legs: 'climbB', front: true, back: true }));
  add('hurt', 'hurt', head(pal, 'ouch'), body(pal, { arms: 'out', legs: { back: [4, 0], front: [12, 0] } }));
  // dizzy and friendly: swirly eyes and stars circling the beanie
  for (const k of [0, 1]) {
    const h = head(pal, 'dizzy');
    for (const [x, y] of k
      ? [
          [2, 4],
          [17, 1],
          [18, 7],
        ]
      : [
          [1, 1],
          [18, 4],
          [3, 7],
        ])
      star(h, pal, x, y);
    add(`dizzy${k}`, 'death', h, body(pal, { arms: 'out', legs: k ? { back: [5, 0], front: [11, 0] } : { back: [4, 0], front: [12, 0] } }));
  }
  crouched('reach', 'pickup', crouch(pal, 1, 0, true));
  add('grab', 'pickup', head(pal, 'cheer'), body(pal, { arms: 'windup', legs: STAND }));
  crouched('duck0', 'duck', crouch(pal, 0, 0));
  crouched('duck1', 'duck', crouch(pal, 1, 0));
  crouched('sneak0', 'sneak', crouch(pal, 0, -1));
  crouched('sneak1', 'sneak', crouch(pal, 0, 1));
  add('throw0', 'shoot', head(pal, 'smile'), body(pal, { arms: 'windup', legs: STAND }));
  add('throw1', 'shoot', head(pal, 'cheer'), body(pal, { arms: 'release', legs: { back: [4, 0], front: [11, 0] } }));
  add('throw2', 'shoot', head(pal, 'smile'), body(pal, { arms: 'follow', legs: STAND }));
  add('cheer', 'cheer', head(pal, 'cheer', false, 0, 'both'), body(pal, { arms: 'high', legs: STAND }));
  return out;
}

/** Adds the poses the Starter hero doesn't have yet (dizzy, drop, reach, duck, sneak) to a block set, as `<name>.top` and `<name>`. */
export function addExtraPoses(book: Book, pal: Pal): void {
  const extra = ['dizzy0', 'dizzy1', 'drop', 'reach', 'duck0', 'duck1', 'sneak0', 'sneak1'];
  for (const p of sidePoses(pal)) {
    if (!extra.includes(p.name)) continue;
    if (p.top) book.add(`${p.name}.top`, p.top);
    book.add(p.name, p.bottom);
  }
}

/** A pose as one 20x40 picture. */
export function wholePose(p: Pose): Pixels {
  const w = new Pixels(20, 40, T);
  if (p.top) w.blit(p.top, 0, 0, T);
  return w.blit(p.bottom, 0, 20, T);
}
