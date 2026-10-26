// night.bbl: the top-down blocks of the second leg's stops, all at night. Chapter 4's toy shop
// (shelves of toys, the counter, the big music box Joe goes into, the third goat from the left),
// chapter 5's car lot (painted bays, parked cars, gates on timers that warn in amber, breakers,
// the charger, THE CHEZ at the curb and Doc Leo), and chapter 6's cove (sand, sea, the rocks that
// show only when the old lamp sputters, the lighthouse).
import { Pixels, rng } from '../../../kit/pixels';
import { chezPicture } from '../../../kit/chez';
import { bevel } from '../art/draw';
import { c, r } from '../art/pal';
import { BREAKERS, CTR } from '../ids';
import { carlPicture } from '../sprites/critters';
import { goat } from '../sprites/friends';
import { leo } from '../sprites/people';
import { addKeepsakes, heart } from './keepsakes';
import { BlockSet, SOLID } from './sets';
import { ONE_WAY_SOUTH, addRope, noise, on, swingGate, water } from './tiles';

// ------------------------------------------------------------------ the toy shop

function shopFloor(seed: number): Pixels {
  const p = new Pixels(20, 20);
  return noise(
    p.map((x, y) => ((Math.floor(x / 10) + Math.floor(y / 10)) % 2 ? c('paper', 2) : c('red', 1))),
    seed,
    'paper',
    1,
    2,
    0.05,
  );
}

/** A toy shelf from above: building blocks, a spinning top, a ball, a stuffed bear. */
function toyShelf(seed: number): Pixels {
  const p = new Pixels(20, 20, c('wood', 2));
  bevel(p, 0, 0, 20, 20, r('wood'), 2);
  const R = rng(seed);
  for (let i = 0; i < 4; i++) {
    const x = 2 + (i % 2) * 9;
    const y = 2 + Math.floor(i / 2) * 9;
    const kind = Math.floor(R() * 4);
    if (kind === 0) for (let k = 0; k < 3; k++) p.rect(x + k * 2, y + 4 - k * 2, 3, 3, c(['red', 'blue', 'yellow'][k], 3));
    else if (kind === 1) p.disc(x + 3, y + 3, 3, c('green', 3)).set(x + 2, y + 2, c('paper', 4));
    else if (kind === 2)
      p.disc(x + 3, y + 3, 3, c('wood', 4))
        .disc(x + 1, y + 1, 1.2, c('wood', 4))
        .disc(x + 5, y + 1, 1.2, c('wood', 4));
    else p.disc(x + 3, y + 4, 2.5, c('purple', 3)).rect(x + 3, y, 1, 3, c('ink', 1));
  }
  return p;
}

function counter(): Pixels {
  const p = new Pixels(20, 20, c('wood', 3));
  bevel(p, 0, 0, 20, 20, r('wood'), 3);
  p.rect(0, 16, 20, 4, c('wood', 1));
  return p;
}

/** The big music box on the floor, a quarter in each of four blocks: a painted lid propped open, its little dancer. */
function musicBox(part: number, ground: Pixels): Pixels {
  const big = new Pixels(40, 40);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) big.set(x, y, ground.get(x % 20, y % 20));
  big.rect(2, 2, 36, 36, c('wood', 1));
  bevel(big, 3, 3, 34, 34, r('wood'), 4);
  big.rect(7, 7, 26, 26, c('red', 1)).frame(7, 7, 26, 26, c('brass', 2));
  for (let k = 0; k < 4; k++) big.disc(9 + (k % 2) * 22, 9 + Math.floor(k / 2) * 22, 1.5, c('brass', 3));
  // the dancer in the middle, on one toe
  big.disc(20, 15, 2, c('skin', 3));
  big.rect(19, 17, 3, 5, c('pink', 2)).rect(15, 21, 11, 2, c('pink', 3));
  big.rect(20, 23, 1, 5, c('skin', 2));
  heart(big, 20, 31, 3, c('brass', 3));
  return big.crop((part % 2) * 20, part < 2 ? 0 : 20, 20, 20);
}

/** The music box's keyhole, in its front: the way in for a robot small enough (walk onto it). */
function keyhole(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(2, 0, 16, 10, c('wood', 3)).rect(2, 0, 16, 1, c('wood', 4));
  p.disc(10, 4, 2.5, c('brass', 3)).disc(10, 4, 1.2, c('ink', 0)).rect(10, 5, 1, 3, c('ink', 0));
  return p;
}

// ------------------------------------------------------------------ the car lot

function lotFloor(seed: number, line = false): Pixels {
  const p = noise(new Pixels(20, 20, c('stone', 1)), seed, 'stone', 0, 2, 0.25);
  if (line) p.rect(0, 0, 2, 20, c('paper', 3));
  return p;
}

/** A car parked in a bay, seen from above, half in each of two blocks across. */
function parkedCar(half: 0 | 1, col: string): Pixels {
  const big = new Pixels(40, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 40; x++) big.set(x, y, lotFloor(3).get(x % 20, y));
  big.rect(2, 3, 36, 14, c('ink', 0));
  big.rect(3, 4, 34, 12, c(col, 2)).rect(3, 4, 34, 2, c(col, 3));
  big.rect(12, 5, 7, 10, c('blue', 1)).rect(24, 5, 6, 10, c('blue', 1));
  big.rect(19, 5, 5, 10, c(col, 3));
  return big.crop(half * 20, 0, 20, 20);
}

/** A sliding gate in the lot's fence: open, warning (amber light), or shut. */
function slideGate(state: 'open' | 'warn' | 'shut', seed: number): Pixels {
  const p = lotFloor(seed);
  p.rect(0, 0, 3, 20, c('stone', 3)).rect(17, 0, 3, 20, c('stone', 3));
  if (state === 'open') {
    p.rect(17, 2, 3, 16, c('stone', 4));
    return p;
  }
  for (let y = 2; y < 18; y += 3) p.rect(3, y, 14, 1, c('stone', 4));
  p.rect(3, 2, 1, 16, c('stone', 4)).rect(16, 2, 1, 16, c('stone', 4));
  p.disc(10, 10, 2, state === 'warn' ? c('yellow', 3) : c('red', 2));
  return p;
}

function lotFence(): Pixels {
  const p = lotFloor(9);
  for (let x = 0; x < 20; x += 4) p.rect(x, 0, 1, 20, c('stone', 3));
  p.rect(0, 4, 20, 1, c('stone', 3)).rect(0, 15, 20, 1, c('stone', 3));
  return p;
}

/** A breaker box on a post: its handle down (off) or thrown up (on, a green light). */
function breaker(on: boolean): Pixels {
  const p = lotFloor(5);
  p.rect(4, 3, 12, 14, c('stone', 3)).frame(4, 3, 12, 14, c('ink', 0));
  p.rect(9, on ? 5 : 10, 2, 5, c('red', 2));
  p.disc(10, 14, 1.5, on ? c('green', 3) : c('ink', 1));
  return p;
}

/** The charger on the curb: dark until the breakers are on, then its socket glows. */
function charger(live: boolean): Pixels {
  const p = lotFloor(6);
  p.rect(5, 2, 10, 16, c('stone', 2)).frame(5, 2, 10, 16, c('ink', 0));
  p.rect(7, 4, 6, 4, live ? c('green', 3) : c('ink', 1));
  p.disc(10, 13, 2, live ? c('window', 2) : c('ink', 1));
  return p;
}

const CHEZ_INK = () => ({
  body: [c('red', 1), c('red', 2), c('red', 3)] as [number, number, number],
  trim: c('red', 0),
  glass: [c('blue', 1), c('blue', 3)] as [number, number],
  roof: c('ink', 0),
  tire: c('ink', 1),
  hub: c('stone', 4),
  bumper: c('stone', 3),
  lamp: c('yellow', 3),
  tail: c('red', 3),
  stripe: c('stone', 1),
  pin: c('paper', 4),
  rim: c('paper', 4),
});

/** THE CHEZ at the curb, facing left (so its charge port, at the rear passenger side, faces the charger), half a block each. */
function chez(half: 0 | 1, glow: boolean): Pixels {
  const big = new Pixels(40, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 40; x++) big.set(x, y, lotFloor(4).get(x % 20, y));
  const car = chezPicture(CHEZ_INK(), 'left');
  for (let y = 0; y < car.h; y++)
    for (let x = 0; x < car.w; x++) {
      const v = car.get(x, y);
      if (v >= 0 && v !== 255 && v !== 254) big.set(x, y, v);
    }
  if (glow) big.disc(33, 11, 2, c('window', 2));
  return big.crop(half * 20, 0, 20, 20);
}

// ------------------------------------------------------------------ the cove

function sand(seed: number): Pixels {
  return noise(new Pixels(20, 20, c('brass', 1)), seed, 'brass', 0, 2, 0.3);
}

/** A rock in the cove: almost black, or (for a moment, when the old lamp sputters) lit. */
function rock(lit: boolean, seed: number): Pixels {
  const p = sand(seed);
  const R = rng(seed);
  const ramp = lit ? 'window' : 'ink';
  p.disc(10, 11, 8, c(ramp, 0));
  p.disc(9, 9, 6, c(ramp, lit ? 1 : 1));
  if (lit) p.disc(7, 7, 2.5, c('window', 2));
  for (let i = 0; i < 4; i++) p.set(4 + Math.floor(R() * 12), 6 + Math.floor(R() * 10), c(ramp, 0));
  return p;
}

/** The lighthouse's base, 2x2, white and red bands, a door in it. */
function lighthouse(part: number, lit: boolean, ground: Pixels): Pixels {
  const big = new Pixels(40, 40);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) big.set(x, y, ground.get(x % 20, y % 20));
  big.disc(20, 20, 18, c('stone', 2));
  for (let y = 0; y < 40; y++)
    for (let x = 0; x < 40; x++) if ((x - 20) ** 2 + (y - 20) ** 2 <= 15 * 15) big.set(x, y, Math.floor((x + y) / 8) % 2 ? c('red', 2) : c('paper', 4));
  big.disc(20, 20, 6, lit ? c('window', 2) : c('ink', 1));
  if (lit) big.disc(20, 20, 3, c('yellow', 3));
  return big.crop((part % 2) * 20, part < 2 ? 0 : 20, 20, 20);
}

function lighthouseDoor(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(5, 0, 10, 14, c('paper', 4)).rect(7, 2, 6, 12, c('wood', 1)).disc(10, 3, 3, c('wood', 1));
  p.rect(5, 14, 10, 2, c('stone', 3));
  return p;
}

export function nightSet(): BlockSet {
  const s = new BlockSet(150, false);
  const fl = shopFloor(1);
  const lf = lotFloor(1);
  const sd = sand(1);
  // the toy shop
  s.add('shopFloor', fl);
  s.add('toys', toyShelf(1), { solid: SOLID });
  s.add('toys2', toyShelf(2), { solid: SOLID });
  s.add('counter', counter(), { solid: SOLID });
  for (let k = 0; k < 4; k++) s.add(`box${k}`, musicBox(k, fl), { solid: SOLID });
  s.add('keyhole', keyhole(fl));
  s.add('goat', on(fl, goat(0)));
  s.add('goatGlad', on(fl, goat(1)));
  addRope(s, fl, 4);
  s.add('swing4', swingGate(fl), { solid: ONE_WAY_SOUTH });
  // the car lot
  s.add('lot', lf);
  s.add('lotLine', lotFloor(2, true));
  s.add('lotFence', lotFence(), { solid: SOLID });
  for (const [k, col] of [
    [0, 'blue'],
    [1, 'green'],
    [2, 'purple'],
  ] as const) {
    s.add(`car${k}a`, parkedCar(0, col), { solid: SOLID });
    s.add(`car${k}b`, parkedCar(1, col), { solid: SOLID });
  }
  // the lot's gates: every copy of each keeps one clock, the A gates and the B gates by turns
  s.add('gateA', slideGate('open', 1), { next: 'gateAwarn', ntime: 30 });
  s.add('gateAwarn', slideGate('warn', 1), { next: 'gateAshut', ntime: 10 });
  s.add('gateAshut', slideGate('shut', 1), { solid: SOLID, next: 'gateA', ntime: 34 });
  s.add('gateBshut', slideGate('shut', 2), { solid: SOLID, next: 'gateB', ntime: 34 });
  s.add('gateB', slideGate('open', 2), { next: 'gateBwarn', ntime: 30 });
  s.add('gateBwarn', slideGate('warn', 2), { next: 'gateBshut', ntime: 10 });
  s.add('breakerOn', breaker(true));
  s.add('breaker', breaker(false), { solid: SOLID, effect: CTR.task, eamt: 1, score: 50, touch: 'breakerOn' });
  s.add('chargerLive', charger(true));
  s.add('charger', charger(false), { solid: SOLID, effect: CTR.task, eamt: -BREAKERS, touch: 'chargerLive' });
  s.add('chez0', chez(0, false), { solid: SOLID });
  s.add('chez1', chez(1, false), { solid: SOLID });
  s.add('chezLit0', chez(0, true), { solid: SOLID });
  s.add('chezLit1', chez(1, true), { solid: SOLID });
  s.add('leo', on(lf, leo()));
  s.add('leoGlad', on(lf, leo(true, true)));
  addRope(s, lf, 5);
  s.add('swing5', swingGate(lf), { solid: ONE_WAY_SOUTH });
  // the cove
  s.add('sand', sd);
  s.add('sand2', sand(2));
  s.add('sea', water(0), { solid: SOLID, next: 'sea2', ntime: 20 });
  s.add('sea2', water(1), { solid: SOLID, next: 'sea', ntime: 20 });
  s.add('rock', rock(false, 1), { solid: SOLID, next: 'rockLit', ntime: 46 });
  s.add('rockLit', rock(true, 1), { solid: SOLID, next: 'rock', ntime: 7 });
  s.add('rockStill', rock(true, 1), { solid: SOLID });
  for (let k = 0; k < 4; k++) s.add(`light${k}`, lighthouse(k, false, sd), { solid: SOLID });
  for (let k = 0; k < 4; k++) s.add(`lightLit${k}`, lighthouse(k, true, sd), { solid: SOLID });
  s.add('lightDoor', lighthouseDoor(sd));
  s.add('carlTile', on(sd, carlPicture()));
  addRope(s, sd, 6);
  s.add('swing6', swingGate(sd), { solid: ONE_WAY_SOUTH });
  addKeepsakes(s, fl, 'shopFloor', { fuse: 'lot', lens: 'sand' });
  return s;
}
