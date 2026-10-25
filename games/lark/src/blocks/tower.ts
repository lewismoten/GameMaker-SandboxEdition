// tower.bbl: the inside of the town clock, seen from the side, where gravity pulls down. Brick
// walls, wooden floors you can hop up through (solid on top only), the escapement's bridges that
// tick and tock in turn (each warns in red before it lets go), the three stuck gears to turn,
// the striking hammer that will only swing once all three turn, and the bell.
import { SOLTOP } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { bevel, shadeAt } from '../art/draw';
import { c, r } from '../art/pal';
import { CTR, GEARS } from '../ids';
import { addKeepsakes } from './keepsakes';
import { BlockSet, GRAV, SOLID } from './sets';

const DOWN = GRAV.s;

/** The tower's inside wall: dark plaster with a few cracks and brick showing through. */
function back(seed: number): Pixels {
  const p = new Pixels(20, 20, c('stone', 1));
  const R = rng(seed);
  p.map((x, y, v) => (R() < 0.25 ? shadeAt(r('stone'), 0, 2, R(), x, y) : v));
  if (seed % 3 === 0) for (let y = 4; y < 12; y++) p.set(6 + Math.round(Math.sin(y) * 1.5), y, c('stone', 0));
  return p;
}

function brick(seed: number): Pixels {
  const p = new Pixels(20, 20, c('brick', 0));
  const R = rng(seed);
  for (let y = 0; y < 20; y += 5)
    for (let x = (y / 5) % 2 ? -5 : 0; x < 20; x += 10) {
      const s = 1 + Math.floor(R() * 2);
      p.rect(x + 1, y + 1, 9, 4, c('brick', s)).rect(x + 1, y + 1, 9, 1, c('brick', s + 1));
    }
  return p;
}

/** A wooden floor, solid on top: Joe can hop up through it from below and stand on it. */
function beam(seed: number): Pixels {
  const p = back(seed);
  bevel(p, 0, 0, 20, 6, r('wood'), 3);
  p.rect(0, 6, 20, 1, c('ink', 1));
  for (const x of [2, 17]) p.rect(x, 7, 1, 3, c('wood', 1));
  return p;
}

/** An escapement bridge: brass ("tick") or copper ("tock"); warning red; gone. */
function bridge(kind: 'tick' | 'tock', state: 'on' | 'warn' | 'gone', seed: number): Pixels {
  const p = back(seed);
  if (state === 'gone') {
    // only the pivots at the ends show where it was
    p.disc(1, 3, 1.5, c('brass', 1)).disc(18, 3, 1.5, c('brass', 1));
    return p;
  }
  const ramp = kind === 'tick' ? 'brass' : 'red';
  const face = state === 'warn' ? 'red' : ramp;
  bevel(p, 0, 0, 20, 6, r(face), state === 'warn' ? 4 : 3);
  // teeth on the underside, like the escapement wheel's pallets
  for (let x = 1; x < 20; x += 4) p.rect(x, 6, 2, 2, c(ramp, 1));
  if (state === 'warn') for (let x = 3; x < 20; x += 6) p.rect(x, 2, 2, 2, c('yellow', 3));
  return p;
}

/** A gear set into the wall: stuck (a red tag on it) or turning (two frames, a tooth apart). */
function gear(state: 'stuck' | 0 | 1, seed: number): Pixels {
  const p = back(seed);
  const a0 = state === 1 ? Math.PI / 8 : 0;
  for (let k = 0; k < 8; k++) {
    const a = a0 + (k * Math.PI) / 4;
    p.disc(10 + Math.cos(a) * 7, 10 + Math.sin(a) * 7, 1.8, c('brass', 2));
  }
  p.disc(10, 10, 6.5, c('brass', 2)).disc(10, 10, 5, c('brass', 3)).disc(10, 10, 2, c('brass', 1));
  p.set(8, 7, c('brass', 4)).set(7, 8, c('brass', 4));
  if (state === 'stuck') {
    p.rect(12, 12, 6, 4, c('red', 2)).frame(12, 12, 6, 4, c('ink', 0));
    p.line(10, 10, 13, 12, c('paper', 3));
  } else p.line(10, 10, 10 + Math.cos(a0) * 5, 10 + Math.sin(a0) * 5, c('brass', 0));
  return p;
}

/** The big cog behind it all, a quarter in each of four blocks. */
function cog(part: number): Pixels {
  const big = new Pixels(40, 40);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) big.set(x, y, back(5).get(x % 20, y % 20));
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    big.disc(20 + Math.cos(a) * 16, 20 + Math.sin(a) * 16, 3, c('stone', 3));
  }
  big.disc(20, 20, 15, c('stone', 3)).disc(20, 20, 12, c('stone', 2)).disc(20, 20, 4, c('stone', 4));
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + 0.3;
    big.line(20, 20, 20 + Math.cos(a) * 12, 20 + Math.sin(a) * 12, c('stone', 4));
  }
  return big.crop((part % 2) * 20, part < 2 ? 0 : 20, 20, 20);
}

function window(seed: number): Pixels {
  const p = back(seed);
  p.rect(5, 2, 10, 15, c('ink', 0));
  p.disc(10, 6, 5, c('ink', 0));
  p.rect(6, 4, 8, 12, c('dusk', 1)).disc(10, 6, 4, c('dusk', 1));
  p.set(8, 7, c('paper', 4)).set(12, 11, c('paper', 3));
  p.rect(9, 3, 1, 13, c('stone', 2)).rect(6, 9, 8, 1, c('stone', 2));
  return p;
}

function door(): Pixels {
  const p = back(2);
  p.rect(3, 2, 14, 18, c('ink', 0)).disc(10, 4, 7, c('ink', 0));
  p.rect(4, 4, 12, 16, c('wood', 2)).disc(10, 5, 6, c('wood', 2));
  for (const x of [7, 10, 13]) p.rect(x, 3, 1, 17, c('wood', 1));
  p.disc(14, 12, 1, c('brass', 3));
  return p;
}

/** A trapdoor overhead with a short ladder: the way up to the belfry. */
function hatch(): Pixels {
  const p = back(4);
  p.rect(2, 0, 16, 4, c('wood', 3)).frame(2, 0, 16, 4, c('ink', 0));
  p.rect(4, 4, 2, 16, c('wood', 2)).rect(14, 4, 2, 16, c('wood', 2));
  for (let y = 7; y < 20; y += 4) p.rect(4, y, 12, 1, c('wood', 3));
  return p;
}

/** The striking hammer on its arm: raised and held (solid), or swung down and clear. */
function hammer(down: boolean): Pixels {
  const p = back(7);
  if (down) {
    p.rect(2, 16, 16, 2, c('stone', 3));
    p.rect(14, 12, 5, 6, c('stone', 4)).frame(14, 12, 5, 6, c('ink', 0));
    return p;
  }
  p.rect(9, 0, 3, 14, c('stone', 3)).frame(9, 0, 3, 14, c('ink', 0));
  p.rect(4, 12, 13, 8, c('stone', 4)).frame(4, 12, 13, 8, c('ink', 0));
  p.rect(5, 13, 11, 1, c('stone', 5));
  // the gauge on its arm: three little windows, one for each gear
  for (let k = 0; k < GEARS; k++) p.rect(6 + k * 3, 16, 2, 2, c('red', 3));
  return p;
}

function bellRope(): Pixels {
  const p = back(8);
  for (let y = 0; y < 20; y++) p.set(10 + Math.round(Math.sin(y / 3)), y, c('wood', 4)).set(11 + Math.round(Math.sin(y / 3)), y, c('wood', 3));
  p.disc(10, 18, 2.5, c('red', 2));
  return p;
}

/** The bell, a quarter in each of four blocks. */
function bell(part: number): Pixels {
  const big = new Pixels(40, 40);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) big.set(x, y, back(9).get(x % 20, y % 20));
  big.rect(17, 0, 6, 5, c('wood', 2));
  for (let y = 5; y < 36; y++) {
    const half = 6 + (y - 5) * 0.42 + (y > 30 ? (y - 30) * 1.2 : 0);
    for (let x = Math.round(20 - half); x <= 20 + half; x++) big.set(x, y, shadeAt(r('brass'), 1, 4, 0.9 - Math.abs(x - 14) / 22, x, y));
  }
  big.rect(4, 35, 32, 2, c('brass', 1)).disc(20, 37, 2.5, c('brass', 1));
  return big.crop((part % 2) * 20, part < 2 ? 0 : 20, 20, 20);
}

/** The lighthouse's great lamp, out: rings of glass prisms round a cold bulb. */
function lamp(): Pixels {
  const p = back(10);
  p.rect(3, 16, 14, 4, c('brass', 1));
  p.disc(10, 9, 8, c('brass', 2)).disc(10, 9, 7, c('blue', 3));
  for (const rr of [5, 3]) p.ring(10, 9, rr, c('paper', 3));
  p.disc(10, 9, 1.5, c('stone', 3));
  return p;
}

export function towerSet(): BlockSet {
  const s = new BlockSet(150, false);
  s.add('brick', brick(1), { solid: SOLID });
  s.add('brick2', brick(2), { solid: SOLID });
  s.add('air', back(1), { grav: DOWN });
  s.add('air2', back(3), { grav: DOWN });
  s.add('airWindow', window(6), { grav: DOWN });
  for (let k = 0; k < 4; k++) s.add(`cog${k}`, cog(k), { grav: DOWN });
  s.add('beam', beam(1), { solid: SOLTOP, grav: DOWN });
  // the escapement: every copy keeps one clock, so all the ticks let go together, then the tocks
  s.add('tick', bridge('tick', 'on', 1), { solid: SOLTOP, grav: DOWN, next: 'tickWarn', ntime: 32 });
  s.add('tickWarn', bridge('tick', 'warn', 1), { solid: SOLTOP, grav: DOWN, next: 'tickGone', ntime: 12 });
  s.add('tickGone', bridge('tick', 'gone', 1), { grav: DOWN, next: 'tick', ntime: 20 });
  s.add('tockWarn', bridge('tock', 'warn', 2), { solid: SOLTOP, grav: DOWN, next: 'tockGone', ntime: 12 });
  s.add('tockGone', bridge('tock', 'gone', 2), { grav: DOWN, next: 'tock', ntime: 20 });
  s.add('tock', bridge('tock', 'on', 2), { solid: SOLTOP, grav: DOWN, next: 'tockWarn', ntime: 32 });
  // the stuck gears: touch one and it turns (a gear counted, and it keeps turning)
  s.add('gearTurn0', gear(0, 3), { grav: DOWN, next: 'gearTurn1', ntime: 4 });
  s.add('gearTurn1', gear(1, 3), { grav: DOWN, next: 'gearTurn0', ntime: 4 });
  s.add('gear', gear('stuck', 3), { grav: DOWN, effect: CTR.task, eamt: 1, score: 50, touch: 'gearTurn0' });
  s.add('door', door(), { grav: DOWN });
  s.add('hatch', hatch(), { grav: DOWN });
  s.add('hammerDown', hammer(true), { grav: DOWN });
  s.add('hammer', hammer(false), { solid: SOLID, effect: CTR.task, eamt: -GEARS, touch: 'hammerDown' });
  s.add('bellRope', bellRope(), { grav: DOWN });
  for (let k = 0; k < 4; k++) s.add(`bell${k}`, bell(k), { grav: DOWN });
  s.add('lamp', lamp(), { grav: DOWN });
  addKeepsakes(s, back(1), 'air');
  return s;
}
