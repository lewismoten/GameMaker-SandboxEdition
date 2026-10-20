// The background blocks (.BBL) of the circuit boards. Every room of the house shares the
// same block numbers but has its own board color and housing, so each room gets its own
// .BBL drawn from one list of names: floors, autotiled walls, copper traces, conduits
// (traces running over a wall), batteries (the blocks that give birth to current) and the
// outlet that leads to the next board.
import { Pixels, rng } from '../kit/pixels';
import { bevel, blob, micro, shadeAt } from './draw';
import { c, r } from './pal';
import { BlockSet, SOLID, type BlockDef } from './sets';

export interface Style {
  id: string;
  /** Board (floor) ramp and the shades used. */
  board: string;
  lo: number;
  hi: number;
  /** Housing (wall) ramp and face shade. */
  wall: string;
  face: number;
  /** Silkscreen ink. */
  silk: number;
}

export const STYLES: Record<string, Style> = {
  kitchen: { id: 'kitchen', board: 'pcb', lo: 1, hi: 2, wall: 'plastic', face: 3, silk: c('paper', 3) },
  living: { id: 'living', board: 'mask', lo: 0, hi: 1, wall: 'wood', face: 2, silk: c('paper', 2) },
  garage: { id: 'garage', board: 'orange', lo: 0, hi: 1, wall: 'metal', face: 3, silk: c('yellow', 3) },
  attic: { id: 'attic', board: 'purple', lo: 0, hi: 1, wall: 'ink', face: 2, silk: c('teal', 4) },
};

/** Trace directions, as bits. */
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

/** Battery kinds: steady current, pulsed current, or a dead cell you bump to start. */
export type BatteryKind = 'steady' | 'pulse' | 'dead';
/** Ticks a pulse battery stays on and off. */
export const PULSE_ON = 27;
export const PULSE_OFF = 27;
/** Ticks between sparks: one every 5 ticks at 4 pixels a tick leaves no gap. */
export const SPARK_EVERY = 5;

function floorPic(st: Style, seed: number): Pixels {
  const p = new Pixels(20, 20);
  const R = rng(seed * 7 + 3);
  const ramp = r(st.board);
  p.map((x, y) => shadeAt(ramp, st.lo, st.hi, 0.35 + (R() - 0.5) * 0.25, x, y));
  // a faint grid of the board's fiberglass weave and a via now and then
  for (let i = 0; i < 20; i += 5) p.set(i, 0, ramp[st.lo]).set(0, i, ramp[st.lo]);
  if (seed % 3 === 1) p.disc(5 + (seed % 2) * 9, 14 - (seed % 2) * 8, 1.6, c('gold', 1)).set(5 + (seed % 2) * 9, 14 - (seed % 2) * 8, c('ink', 0));
  return p;
}

/** Copper from the center to each side in `mask`. */
function trace(p: Pixels, mask: number, ramp = r('copper')): Pixels {
  const seg = (x: number, y: number, w: number, h: number) => p.rect(x, y, w, h, ramp[2]);
  if (mask & N) seg(8, 0, 4, 12);
  if (mask & S) seg(8, 8, 4, 12);
  if (mask & W) seg(0, 8, 12, 4);
  if (mask & E) seg(8, 8, 12, 4);
  // highlight and shade along the run
  if (mask & (N | S)) for (let y = 0; y < 20; y++) if ((y < 10 && mask & N) || (y >= 10 && mask & S)) p.set(8, y, ramp[3]).set(11, y, ramp[1]);
  if (mask & (E | W)) for (let x = 0; x < 20; x++) if ((x < 10 && mask & W) || (x >= 10 && mask & E)) p.set(x, 8, ramp[3]).set(x, 11, ramp[1]);
  const straight = mask === (N | S) || mask === (E | W);
  if (!straight) blob(p, 9.5, 9.5, 3.6, 3.6, ramp, 1, 4);
  if (mask === N || mask === E || mask === S || mask === W) p.disc(9.5, 9.5, 1.2, c('ink', 0));
  return p;
}

function wallPic(st: Style, mask: number): Pixels {
  const p = new Pixels(20, 20);
  const ramp = r(st.wall);
  const f = st.face;
  p.rect(0, 0, 20, 20, ramp[f]);
  // subtle texture
  const R = rng(mask + 11);
  for (let i = 0; i < 18; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), ramp[Math.max(0, f - 1)]);
  const hi = ramp[Math.min(ramp.length - 1, f + 1)];
  const lo = ramp[Math.max(0, f - 2)];
  const deep = c('ink', 0);
  if (!(mask & N)) p.rect(0, 0, 20, 2, hi);
  if (!(mask & W)) p.rect(0, 0, 2, 20, hi);
  if (!(mask & S)) p.rect(0, 16, 20, 2, lo).rect(0, 18, 20, 2, deep);
  if (!(mask & E)) p.rect(16, 0, 2, 20, lo).rect(18, 0, 2, 20, deep);
  return p;
}

function batteryPic(st: Style, kind: BatteryKind, lit: boolean): Pixels {
  const p = wallPic(st, 15);
  bevel(p, 2, 2, 16, 16, r('ink'), 1);
  const body = kind === 'dead' ? r('metal') : r('green');
  for (let y = 4; y < 16; y++) for (let x = 4; x < 16; x++) p.set(x, y, shadeAt(body, 0, body.length - 1, 1 - (x - 4) / 13, x, y));
  p.rect(4, 4, 12, 2, c('metal', 4));
  // the + terminal
  const plus = kind === 'dead' ? c('metal', 2) : c('gold', 3);
  p.rect(9, 6, 2, 8, plus).rect(6, 9, 8, 2, plus);
  // status lamp
  const lamp = kind === 'dead' ? c('red', 1) : kind === 'pulse' ? (lit ? c('yellow', 3) : c('yellow', 0)) : c('green', 3);
  p.rect(13, 13, 3, 3, lamp);
  if (kind === 'pulse') micro(p, 4, 13, '~', lit ? c('yellow', 3) : c('ink', 2));
  if (kind === 'dead') micro(p, 5, 12, '!', c('red', 3));
  return p;
}

function outletPic(st: Style): Pixels {
  const p = floorPic(st, 0);
  bevel(p, 3, 1, 14, 18, r('paper'), 2);
  p.rect(6, 5, 2, 5, c('ink', 0)).rect(12, 5, 2, 5, c('ink', 0));
  p.disc(9.5, 13.5, 2, c('ink', 0));
  p.rect(9, 1, 2, 1, c('metal', 2)).rect(9, 18, 2, 1, c('metal', 2));
  return p;
}

function screwPic(st: Style): Pixels {
  const p = floorPic(st, 2);
  blob(p, 9.5, 10, 5.5, 5.5, r('gold'), 0, 3);
  p.line(6, 13, 13, 7, c('gold', 0)).line(7, 13, 13, 8, c('gold', 0));
  return p;
}

function padPic(st: Style): Pixels {
  const p = floorPic(st, 1);
  p.ring(9.5, 9.5, 8, c('gold', 2)).ring(9.5, 9.5, 7, c('gold', 1));
  micro(p, 4, 8, 'GND', st.silk);
  return p;
}

function decorPic(st: Style, kind: string, frame = 0): Pixels {
  const p = wallPic(st, 15);
  if (kind === 'cap') {
    blob(p, 9.5, 9.5, 8, 8, r('blue'), 1, 4);
    p.line(5, 9, 14, 9, c('blue', 0)).line(9, 5, 9, 14, c('blue', 0));
    micro(p, 1, 1, '+', c('paper', 3));
  } else if (kind === 'res') {
    p.rect(0, 9, 20, 2, c('metal', 3));
    bevel(p, 3, 5, 14, 10, r('plastic'), 3);
    for (const [x, col] of [
      [5, c('red', 2)],
      [8, c('purple', 2)],
      [11, c('yellow', 2)],
      [14, c('gold', 2)],
    ])
      p.rect(x, 5, 2, 10, col);
  } else if (kind === 'led') {
    blob(p, 9.5, 9.5, 6, 6, frame ? r('red') : r('red').slice(0, 2), 0, frame ? 4 : 1);
    if (frame) p.set(7, 7, c('paper', 3));
  } else if (kind === 'ic') {
    for (let i = 2; i < 18; i += 4) p.rect(i, 0, 2, 3, c('metal', 4)).rect(i, 17, 2, 3, c('metal', 4));
    bevel(p, 1, 3, 18, 14, r('ink'), 1);
    p.disc(4, 6, 1.2, c('ink', 2));
  } else if (kind === 'xtal') {
    bevel(p, 2, 6, 16, 8, r('metal'), 4);
    micro(p, 4, 8, '4MHZ', c('ink', 0));
  }
  return p;
}

/** Every block the boards use, drawn in one room's style. Names fix the numbering. */
export function buildTiles(st: Style): BlockSet {
  const bs = new BlockSet(150, false);
  const add = (name: string, px: Pixels, def: BlockDef = {}) => bs.add(name, px, def);
  const vp = new Pixels(20, 20, c('night', 0));
  for (let i = 0; i < 20; i += 4) vp.set(i, i, c('night', 1));
  add('void', vp, { solid: SOLID });
  for (let k = 0; k < 3; k++) add(`floor${k}`, floorPic(st, k));
  add('pad', padPic(st));
  add('outlet', outletPic(st), { score: 1000, effect: 1, eamt: 1 });
  add('screw', screwPic(st), { score: 500, effect: 1, eamt: 1, touch: 'floor0' });
  for (let m = 0; m < 16; m++) add(`wall${m}`, wallPic(st, m), { solid: SOLID });
  for (let m = 1; m < 16; m++) add(`trace${m}`, trace(floorPic(st, m % 3), m));
  for (let m = 1; m < 16; m++) {
    const p = wallPic(st, 15);
    p.rect(0, 0, 20, 20, r(st.wall)[Math.max(0, st.face - 2)]);
    trace(p, m, r('copper'));
    add(`conduit${m}`, p, { solid: SOLID });
  }
  for (const k of ['cap', 'res', 'ic', 'xtal']) add(k, decorPic(st, k), { solid: SOLID });
  add('led', decorPic(st, 'led', 1), { solid: SOLID, next: 'ledOff', ntime: 9 });
  add('ledOff', decorPic(st, 'led', 0), { solid: SOLID, next: 'led', ntime: 9 });
  // Batteries: battery k gives birth to monster k (its own wire) every SPARK_EVERY ticks.
  for (let k = 0; k < 16; k++) {
    add(`bat${k}`, batteryPic(st, 'steady', true), { solid: SOLID, birthMon: k, birthTime: SPARK_EVERY });
  }
  for (let k = 0; k < 16; k++) {
    add(`dead${k}`, batteryPic(st, 'dead', false), { solid: SOLID, touch: `bat${k}` });
  }
  for (let k = 0; k < 8; k++) {
    add(`pulse${k}`, batteryPic(st, 'pulse', true), { solid: SOLID, birthMon: k, birthTime: SPARK_EVERY, next: `pulseOff${k}`, ntime: PULSE_ON });
    add(`pulseOff${k}`, batteryPic(st, 'pulse', false), { solid: SOLID, next: `pulse${k}`, ntime: PULSE_OFF });
  }
  return bs;
}
