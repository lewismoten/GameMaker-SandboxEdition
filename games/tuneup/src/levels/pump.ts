// Level 8, Pump Up the Volume (the curb at noon). THE CHEZ's tires are soft, and the owner's
// manual says 32 psi; the only pump is the balloon pump, so Doc Leo climbs the giant (squashed)
// tire on balloon animals. The balloons over his hat breathe on their own: a limp knot, then
// puffed up into a balloon animal (a dog, a swan or a giraffe) that he can hop up through and
// stand on (solid on top only), holding about five seconds, then sagging back to a knot in three
// visible steps (anyone still on it drops). A block's timer runs for every block of its number at
// once, from the scene's start (PLAYGAME has no timer per map cell), so each balloon is its own
// ring of blocks, started at its own point so the towers breathe out of step. Up two balloons to
// each awning, then the tire; on top, he works the pump's handle (Space held) while its gauge
// fills eight notches, and the gate at the far side opens for a full tire.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { AIR, countedDoor, kit, LEDGE, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MON } from '../ids';
import { MapBuilder, at, type Level } from './maps';

/** Notches on the pump's gauge, and ticks each stroke shows before the next. */
export const STROKES = 8;
const STROKE = 6;
/** A balloon's breath: knot steps (limp), puff steps (inflating, air), hold steps (solid on top), sag steps; ticks each. */
const BREATH = { knot: 4, puff: 3, hold: 6, sag: 3 } as const;
const STEP_TICKS = { knot: 15, puff: 2, hold: 15, sag: 10 } as const;
/** Where in its breath each balloon starts (a knot step), tower by tower, lower then upper: the upper puffs up two steps after the lower. */
const START = [
  [2, 0],
  [3, 1],
  [2, 0],
];
export const PUMP = { w: 37, floor: 9, tire: [25, 32] as [number, number], tireTop: 4, handle: 29, door: 34, exit: 35 } as const;
/** The tire's height in blocks (its top row to the floor). */
const TIRE_H = PUMP.floor - PUMP.tireTop;
/** The towers of knots: level x; a knot over the floor and one over the first balloon. */
export const TOWERS = [10, 18, 23];
export const KNOT_ROWS = [6, 3];
/** The awnings at the tops of the first two towers: [first x, last x] on row 3. */
const AWNINGS: [number, number][] = [
  [11, 14],
  [19, 21],
  [24, 24],
];
const ANIMALS = ['dog', 'swan', 'giraffe'] as const;

export function pumpBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'curb');
  const { book, c, R } = k;
  const sky = () => k.pic('sky');
  // a knot: a little limp balloon on a string
  const knot = (col: string) => {
    const p = sky();
    p.line(10, 0, 10, 8, c('ink', 1));
    blob(p, 10, 13, 3, 4, R(col), 0, 2);
    p.rect(9, 8, 2, 2, c(col, 0));
    return p;
  };
  const balloon = (a: (typeof ANIMALS)[number], squash: number) => {
    const p = sky();
    const s = 1 - squash * 0.22;
    const y = 10 + squash * 2;
    if (a === 'dog') {
      // a balloon dog like Teddy: a body, a head, two upright ears, four legs, a tail
      blob(p, 10, y, 6 * s, 3 * s, R('orange'), 0, 3);
      blob(p, 16, y - 4 * s, 3 * s, 3 * s, R('orange'), 0, 3);
      blob(p, 15, y - 8 * s, 1.2, 2.4 * s, R('orange'), 0, 3);
      blob(p, 18, y - 8 * s, 1.2, 2.4 * s, R('orange'), 0, 3);
      for (const x of [6, 9, 12, 14]) blob(p, x, y + 4 * s, 1.2, 2.4 * s, R('orange'), 0, 3);
      blob(p, 3, y - 3 * s, 1.4, 2.6 * s, R('orange'), 0, 3);
    } else if (a === 'swan') {
      blob(p, 9, y + 1, 7 * s, 3.5 * s, R('paint'), 1, 3);
      blob(p, 15, y - 4 * s, 1.6, 5 * s, R('paint'), 1, 3);
      blob(p, 13, y - 9 * s, 2.4, 1.6, R('paint'), 1, 3);
      p.set(11, Math.round(y - 9 * s), c('orange', 2));
    } else {
      blob(p, 8, y + 2, 5 * s, 2.6 * s, R('yellow'), 0, 3);
      blob(p, 13, y - 4 * s, 1.6, 6 * s, R('yellow'), 0, 3);
      blob(p, 15, y - 10 * s, 2.4, 1.8, R('yellow'), 0, 3);
      for (const x of [5, 11]) blob(p, x, y + 6 * s, 1.2, 2.2 * s, R('yellow'), 0, 3);
    }
    // the knot's shine
    p.set(9, y - 1, c('paint', 3));
    return p;
  };
  const col = { dog: 'orange', swan: 'paint', giraffe: 'yellow' } as const;
  // each animal's breath, a ring of blocks: knot, puff (air), hold and sag (solid on top), knot again
  for (const a of ANIMALS) {
    const ring: { name: string; pic: Pixels; solid: boolean; t: number }[] = [];
    for (let i = 0; i < BREATH.knot; i++) ring.push({ name: `knot.${a}${i}`, pic: knot(col[a]), solid: false, t: STEP_TICKS.knot });
    for (let i = 0; i < BREATH.puff; i++) ring.push({ name: `${a}.puff${i}`, pic: balloon(a, 2.5 - i), solid: false, t: STEP_TICKS.puff });
    const full = balloon(a, 0);
    for (let i = 0; i < BREATH.hold; i++) ring.push({ name: `${a}${i}`, pic: full, solid: true, t: STEP_TICKS.hold });
    for (let i = 0; i < BREATH.sag; i++) ring.push({ name: `${a}.sag${i}`, pic: balloon(a, (i + 1) * 0.9), solid: true, t: STEP_TICKS.sag });
    ring.forEach((r, i) => book.add(r.name, r.pic, { ...(r.solid ? { solid: LEDGE } : {}), ...AIR, ntime: r.t, next: ring[(i + 1) % ring.length].name }));
  }
  // a shop awning to stand on (solid on top), striped; its post below
  const awning = sky();
  for (let x = 0; x < 20; x += 6) awning.rect(x, 0, 3, 8, c('accent', 3)).rect(x + 3, 0, 3, 8, c('paint', 3));
  awning.rect(0, 8, 20, 2, c('accent', 1));
  book.add('awning', awning, { solid: LEDGE, ...AIR });
  const post = sky();
  post.rect(9, 0, 2, 20, c('mach', 2));
  book.add('post', post, AIR);
  // the tire, squashed flat at the top and bottom: rubber with tread, the white wheel in the middle
  const [t0, t1] = PUMP.tire;
  const tw = t1 - t0 + 1;
  const th = TIRE_H * 20;
  const big = new Pixels(tw * 20, th, 255);
  const ink = c('ink', 0);
  for (let y = 0; y < th; y++)
    for (let x = 0; x < tw * 20; x++) {
      const dx = Math.max(0, Math.abs(x - tw * 10) - (tw * 10 - 20));
      const dy = Math.max(0, Math.abs(y - th / 2) - (th / 2 - 20));
      if (dx * dx + dy * dy < 20 * 20) big.set(x, y, (x + y) % 8 < 2 && dy > 0 ? c('shade', 0) : c('shade', 1));
    }
  big
    .disc(tw * 10, th / 2, 28, c('paint', 3))
    .disc(tw * 10, th / 2, 24, c('paint', 2))
    .disc(tw * 10, th / 2, 8, c('mach', 4))
    .disc(tw * 10, th / 2, 3, ink);
  for (let by = 0; by < TIRE_H; by++)
    for (let bx = 0; bx < tw; bx++) {
      const p = sky().blit(big.crop(bx * 20, by * 20, 20, 20), 0, 0, 255);
      // solid where the tire fills most of the block (the top row flat, so it stands)
      let fill = 0;
      for (let yy = 0; yy < 20; yy++) for (let xx = 0; xx < 20; xx++) if (big.get(bx * 20 + xx, by * 20 + yy) !== 255) fill++;
      book.add(`tire${bx}.${by}`, p, fill > 200 ? { solid: SOLID } : AIR);
    }
  // the pump: its handle over the tire (Space works it), the barrel and hose behind Doc Leo
  const handle = (n: number, down: boolean) => {
    const p = sky();
    p.rect(0, 0, 20, 9, ink);
    for (let i = 0; i < STROKES; i++)
      p.rect(1 + i * 2 + Math.floor(i / 4) * 2, 1, 2, 7, i < n ? c(n === STROKES ? 'green' : 'yellow', 2 + (i % 2)) : c('shade', 1));
    p.rect(3, down ? 14 : 11, 14, 3, c('wood', 2)).rect(9, down ? 17 : 14, 2, down ? 3 : 6, c('mach', 4));
    return p;
  };
  for (let n = 0; n < STROKES; n++) {
    const last = n === STROKES - 1;
    const stroke = last ? { effect: CTR.psi, eamt: 1, score: 100, hp: 1 } : { score: 10 };
    book.add(`handle${n}`, handle(n, false), { ...AIR, ...stroke, touch: `handle${n}.d` });
    book.add(`handle${n}.d`, handle(n + 1, true), { ...AIR, ntime: STROKE, next: last ? 'handle.full' : `handle${n + 1}` });
  }
  book.add('handle.full', handle(STROKES, false), AIR);
  const barrel = sky();
  barrel.rect(6, 0, 8, 20, c('blue', 2)).rect(6, 0, 2, 20, c('blue', 3)).rect(9, 0, 2, 4, c('mach', 4));
  book.add('barrel', barrel, AIR);
  countedDoor(k, 'gate', 'sky', CTR.psi, 1, (p: Pixels) => {
    p.disc(10, 12, 4, c('paint', 3)).rect(10, 9, 1, 4, ink);
  });
  return k;
}

export function pump(book: Kit['book']): Level {
  const { w, floor } = PUMP;
  const m = new MapBuilder(book, { '.': 'sky', '=': 'walk', a: 'awning', '|': 'post' }, 'walk');
  m.fill(0, 0, w, floor, '.').fill(0, floor, w, 1, '=');
  TOWERS.forEach((x, i) => KNOT_ROWS.forEach((y, j) => m.set(x, y, `knot.${ANIMALS[(i + j) % 3]}${START[i][j]}`)));
  for (const [a, b] of AWNINGS) {
    m.fill(a, 3, b - a + 1, 1, 'a');
    m.fill(b, 4, 1, floor - 4, '|');
  }
  const [t0, t1] = PUMP.tire;
  for (let by = 0; by < TIRE_H; by++) for (let bx = 0; bx <= t1 - t0; bx++) m.set(t0 + bx, PUMP.tireTop + by, `tire${bx}.${by}`);
  // (the handle is a row below the screen's top: PLAYGAME changes only blocks wholly on screen)
  m.set(PUMP.handle, PUMP.tireTop - 3, 'handle0')
    .set(PUMP.handle + 1, PUMP.tireTop - 2, 'barrel')
    .set(PUMP.handle + 1, PUMP.tireTop - 1, 'barrel');
  m.set(PUMP.door, floor - 2, 'gate.top').set(PUMP.door, floor - 1, 'gate');
  m.fill(w - 1, 0, 1, floor, '=');
  m.link(PUMP.exit, floor - 1);
  m.mon(MON.reggie, 4, floor - 1);
  return { m, start: at(8, 5), size: [w, 10] };
}
