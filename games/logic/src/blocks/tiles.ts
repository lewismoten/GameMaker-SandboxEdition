// The background blocks (.BBL) of the circuit boards. Every room of the house shares the
// same block numbers but has its own board color and housing, so each room gets its own
// .BBL drawn from one list of names: floors, autotiled walls, copper traces, conduits
// (traces running over a wall), batteries (the blocks that give birth to current) and the
// outlet that leads to the next board.
import { Pixels, rng } from '../../../kit/pixels';
import { bevel, blob, micro, shadeAt } from '../art/draw';
import { PAL, c, r } from '../art/pal';
import { BlockSet, SOLBOT, SOLID, SOLLEF, SOLRIG, SOLTOP, type BlockDef } from './sets';
import { carlPic } from '../../../kit/carlCameo';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { saveSignBlocks } from '../../../kit/saveSign';

interface Style {
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
  garage: { id: 'garage', board: 'rust', lo: 0, hi: 1, wall: 'metal', face: 3, silk: c('yellow', 3) },
  attic: { id: 'attic', board: 'purple', lo: 0, hi: 1, wall: 'metal', face: 1, silk: c('teal', 4) },
};

/** Trace directions, as bits. */
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

/** Battery kinds: steady current, pulsed current (antipulse: off while pulse is on), a
 * dead cell you bump to start, or a 555 timer chip wired astable. */
export type BatteryKind = 'steady' | 'pulse' | 'antipulse' | 'dead' | 'astable';
/** Ticks a pulse battery stays on and off. */
const PULSE_ON = 27;
const PULSE_OFF = 27;
/** A 555 wired astable with R1 an eighth of R2: high for 0.693(R1+R2)C, low for 0.693(R2)C,
 * so its output is high a little longer than it is low (it can never get under half). The
 * low stretch is long enough to cross the night-light's corridor at a relaxed tapping pace. */
const ASTABLE_HIGH = 72;
const ASTABLE_LOW = 64;
/** Ticks between sparks: one every 5 ticks at 4 pixels a tick leaves no gap. */
const SPARK_EVERY = 5;

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
  if (mask === 15) {
    // two wires crossing: the up-and-down one hops over on a little bridge
    p.rect(7, 6, 6, 8, c('ink', 0));
    p.rect(8, 5, 4, 10, ramp[3]).rect(8, 5, 4, 1, ramp[4]).rect(8, 14, 4, 1, ramp[1]);
  } else if (!straight) blob(p, 9.5, 9.5, 3.6, 3.6, ramp, 1, 4);
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

/** A 555 timer chip sunk in the housing: eight legs, the notch, and its output LED. Every
 * block of one number changes on the same tick, so this LED and the ':' LEDs on the board
 * blink exactly in step with the chip's output. */
function chip555Pic(st: Style, high: boolean): Pixels {
  const p = wallPic(st, 15);
  for (let i = 0; i < 4; i++) p.rect(4 + i * 4, 1, 2, 3, c('metal', 4)).rect(4 + i * 4, 16, 2, 3, c('metal', 4));
  bevel(p, 2, 4, 16, 12, r('ink'), 1);
  p.disc(3.5, 9.5, 1.3, c('ink', 0));
  micro(p, 5, 6, '555', c('paper', 2));
  p.rect(8, 12, 4, 2, high ? c('red', 4) : c('red', 0));
  if (high) p.set(8, 12, c('paper', 3));
  return p;
}

/** The 555's output LED on the board, in step with the chip. */
function led555Pic(st: Style, high: boolean): Pixels {
  const p = wallPic(st, 15);
  p.rect(3, 9, 14, 2, c('metal', 3));
  blob(p, 9.5, 9.5, 5, 5, high ? r('red') : r('red').slice(0, 2), 0, high ? 4 : 1);
  if (high) p.set(7, 7, c('paper', 3)).set(8, 7, c('paper', 3));
  else p.set(8, 8, c('red', 1));
  micro(p, 1, 15, 'OUT', st.silk);
  return p;
}

/** A solderless breadboard: cream plastic and rows of holes on a tenth-inch grid. */
function breadboardPic(seed: number): Pixels {
  const p = new Pixels(20, 20);
  const R = rng(seed * 5 + 1);
  p.map((x, y) => shadeAt(r('paper'), 2, 3, 0.55 + (R() - 0.5) * 0.3, x, y));
  for (const y of [2, 7, 12, 17])
    for (const x of [2, 7, 12, 17]) {
      p.rect(x - 1, y - 1, 3, 3, c('paper', 1)).set(x, y, c('ink', 1));
      if (seed === 2 && x === 12 && y === 2) p.rect(x - 1, y - 1, 3, 3, c('metal', 4)); // a leg left in
    }
  return p;
}

/** A 40-pin chip across three blocks (part 0, 1, 2): the 6502, on the breadboard. */
function cpuPic(st: Style, part: number): Pixels {
  const w = new Pixels(60, 20);
  const bb = breadboardPic(0);
  for (let i = 0; i < 3; i++) w.blit(bb, i * 20, 0);
  for (let i = 0; i < 20; i++) w.rect(1 + i * 3, 1, 2, 3, c('metal', 4)).rect(1 + i * 3, 16, 2, 3, c('metal', 4));
  bevel(w, 0, 4, 60, 12, r('ink'), 1);
  w.disc(2.5, 9.5, 1.6, c('ink', 0));
  micro(w, 9, 5, 'MOS', c('paper', 1));
  micro(w, 25, 8, '6502', c('paper', 3), 1);
  micro(w, 44, 11, '1MHZ', c('metal', 2));
  const p = new Pixels(20, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, w.get(x + part * 20, y));
  void st;
  return p;
}

function outletPic(st: Style, under = floorPic(st, 0)): Pixels {
  const p = under;
  bevel(p, 3, 1, 14, 18, r('paper'), 2);
  p.rect(6, 5, 2, 5, c('ink', 0)).rect(12, 5, 2, 5, c('ink', 0));
  p.disc(9.5, 13.5, 2, c('ink', 0));
  p.rect(9, 1, 2, 1, c('metal', 2)).rect(9, 18, 2, 1, c('metal', 2));
  return p;
}

function screwPic(st: Style, under = floorPic(st, 2)): Pixels {
  const p = under;
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

/** A one-way diode laid in the board: Watt may roll through only the way it points. */
function diodePic(st: Style, dir: number): Pixels {
  const p = floorPic(st, 1);
  // drawn pointing east, then turned
  const d = new Pixels(20, 20, 255);
  d.rect(1, 6, 18, 8, c('ink', 0));
  d.rect(2, 7, 16, 6, c('metal', 1));
  for (let i = 0; i < 6; i++) d.rect(4 + i, 7 + Math.floor(i / 2), 1, 6 - 2 * Math.floor(i / 2), c('yellow', 3));
  d.rect(10, 7, 2, 6, c('paper', 3));
  for (let x = 13; x < 17; x++) d.set(x, 10 - (x - 13), c('metal', 4)).set(x, 9 + (x - 13), c('metal', 4));
  const turn = dir === E ? 0 : dir === S ? 1 : dir === W ? 2 : 3;
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      let sx = x;
      let sy = y;
      for (let t = 0; t < turn; t++) [sx, sy] = [sy, 19 - sx];
      const v = d.get(sx, sy);
      if (v !== 255) p.set(x, y, v);
    }
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

/**
 * Carl the fly (A Fly Named Carl) sitting smugly on a chip with BUG stamped on it: now and then
 * the chip shorts out in sparks under him. Found the bug.
 */
function bugPic(st: Style, zap: number): Pixels {
  const p = decorPic(st, 'ic');
  const fly = carlPic(
    {
      ink: c('ink', 0),
      fly: [c('metal', 0), c('metal', 1), c('metal', 2), c('metal', 3), c('metal', 4)],
      eye: [c('red', 0), c('red', 1), c('red', 2), c('red', 3)],
      wing: [c('paper', 1), c('paper', 2), c('paper', 3)],
      white: c('paper', 3),
      red: c('red', 2),
    },
    { view: 'front', wing: zap, mood: zap ? 'grin' : 'smug' },
  );
  // he sits on the top half of the chip, over its stamp
  for (let y = 0; y < 12; y++) for (let x = 0; x < 20; x++) if (fly.get(x, y + 2) !== 255) p.set(x, y, fly.get(x, y + 2));
  if (zap)
    for (const [x, y] of [
      [1, 10],
      [0, 12],
      [2, 14],
      [18, 10],
      [19, 12],
      [17, 14],
    ] as [number, number][])
      p.set(x, y, (x + y) % 2 ? c('zap', 3) : c('spark', 4));
  micro(p, 5, 12, 'BUG', c('paper', 3));
  return p;
}

/** Block number of the felt egg in every room's set (an object: only the pickup key takes it). */
export const EGG = 149;

/** A felted egg sitting on the board: copper-orange felt, a yellow bolt appliqued on, a
 * zigzag of black running stitch like a resistor, and a brass button terminal on top. */
export function eggPic(st: Style, under = floorPic(st, 0)): Pixels {
  const p = under;
  const R = rng(9149);
  const cx = 10;
  const cy = 10.5;
  const inside = (x: number, y: number, grow = 0) => {
    const ry = 7.5 + grow;
    const rx = (y + 0.5 < cy ? 5.3 : 6.3) + grow;
    const nx = (x + 0.5 - cx) / rx;
    const ny = (y + 0.5 - cy) / ry;
    return nx * nx + ny * ny <= 1;
  };
  // a soft shadow on the board, then a dark edge so the felt stands off any board
  for (let x = 5; x < 16; x++) p.set(x, 18, c('ink', 0));
  for (let x = 6; x < 15; x++) p.set(x, 19, c('ink', 1));
  const felt = r('copper');
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (inside(x, y, 1) && !inside(x, y)) p.set(x, y, c('ink', 0));
      if (!inside(x, y)) continue;
      // lit from the top left, with fuzzy felt speckle
      const l = 0.55 - (x - cx) / 12 - (y - cy) / 20 + (R() - 0.5) * 0.15;
      p.set(x, y, shadeAt(felt, 1, 3, l, x, y));
    }
  // blanket stitch just inside the edge in pale thread
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (inside(x, y) && !inside(x, y, -1) && (x + y) % 3 === 0) p.set(x, y, c('paper', 3));
  // the zigzag of black running stitch around the waist, like a resistor's leads
  for (let x = 4; x < 17; x++) {
    const y = 13 + [0, 1, 0, -1][x % 4];
    if (inside(x, y, -0.8)) p.set(x, y, c('ink', 0));
  }
  // the yellow lightning bolt applique, with a dark stitched edge below and right
  const bolt = ['....yy', '...yy.', '..yy..', '.yyyyy', '...yy.', '..yy..', '.yy...', '.y....'];
  bolt.forEach((row, yy) => [...row].forEach((ch, xx) => ch === 'y' && p.set(7 + xx, 5 + yy + 1, c('copper', 0)).set(8 + xx, 5 + yy, c('copper', 0))));
  p.draw(7, 5, bolt, { y: c('yellow', 3) });
  // the brass button terminal on top
  p.rect(9, 1, 2, 2, c('gold', 2)).set(9, 1, c('gold', 3)).set(10, 2, c('gold', 0));
  return p;
}

/** A wall with the faint seam of a little access panel in it. Watt can roll right in. */
function seamPic(st: Style, mask: number): Pixels {
  const p = wallPic(st, mask);
  const ramp = r(st.wall);
  const seam = ramp[Math.max(0, st.face - 1)];
  p.frame(4, 4, 12, 12, seam);
  p.set(5, 6, ramp[Math.max(0, st.face - 2)]).set(5, 13, ramp[Math.max(0, st.face - 2)]);
  return p;
}

/** A strip of masking tape across a wall with a word written on it. */
function tapePic(st: Style, mask: number, word: string): Pixels {
  const p = wallPic(st, mask);
  // two lines of writing on a strip of masking tape
  p.rect(0, 3, 20, 15, c('paper', 2));
  for (let x = 0; x < 20; x += 3) p.set(x, 3, c('paper', 1)).set(x + 1, 17, c('paper', 1));
  word.split(' ').forEach((w, i) => micro(p, 10 - Math.floor((w.length * 4 - 1) / 2), 5 + i * 6, w, c('ink', 0)));
  return p;
}

/** Every block a room's boards use, drawn in its style. */
export interface Battery {
  /** The wire's number in its room. */
  k: number;
  kind: BatteryKind;
  /** The monster (spark) it gives birth to. */
  mon: number;
  /** A 555's ticks high (a given high is low half as long; the default is low 64 of 72). */
  high?: number;
}

export function buildTiles(
  st: Style,
  batteries: Battery[] = [],
  opts: { breadboard?: boolean; seams?: number[]; fusebox?: boolean; easterEgg?: boolean; hatches?: number[]; saveSign?: boolean } = {},
): BlockSet {
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
  // Diodes: one way only. A block's solid sides stop Watt rolling INTO it from that side.
  add('diodeE', diodePic(st, E), { solid: SOLRIG | SOLTOP | SOLBOT });
  add('diodeW', diodePic(st, W), { solid: SOLLEF | SOLTOP | SOLBOT });
  add('diodeN', diodePic(st, N), { solid: SOLTOP | SOLLEF | SOLRIG });
  add('diodeS', diodePic(st, S), { solid: SOLBOT | SOLLEF | SOLRIG });
  for (const k of ['cap', 'res', 'ic', 'xtal']) add(k, decorPic(st, k), { solid: SOLID });
  add('led', decorPic(st, 'led', 1), { solid: SOLID, next: 'ledOff', ntime: 9 });
  add('ledOff', decorPic(st, 'led', 0), { solid: SOLID, next: 'led', ntime: 9 });
  // a cameo from A Fly Named Carl: the bug in the chip (housing, like any other part)
  add('bug', bugPic(st, 0), { solid: SOLID, next: 'bugZap', ntime: 40 });
  add('bugZap', bugPic(st, 1), { solid: SOLID, next: 'bug', ntime: 4 });
  // the tin heart: a small bonus on the board, a glint crossing it now and then
  for (let k = 0; k < SHINE_FRAMES; k++)
    add(
      `tinHeart${k || ''}`,
      drawTinHeart(floorPic(st, 0), { ink: c('ink', 0), tin: [c('metal', 2), c('metal', 3), c('metal', 4)], white: c('metal', 5), dark: c('metal', 1) }, k),
      {
        score: 100,
        touch: 'floor0',
        next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`,
        ntime: k ? 2 : 50,
      },
    );
  // Batteries: each wire's battery gives birth to that wire's spark every SPARK_EVERY ticks
  // (only the batteries a room uses are drawn into its block set).
  for (const b of batteries) {
    const k = b.k;
    if (b.kind === 'steady' || b.kind === 'dead') add(`bat${k}`, batteryPic(st, 'steady', true), { solid: SOLID, birthMon: b.mon, birthTime: SPARK_EVERY });
    if (b.kind === 'dead') add(`dead${k}`, batteryPic(st, 'dead', false), { solid: SOLID, touch: `bat${k}` });
    if (b.kind === 'pulse' || b.kind === 'antipulse') {
      add(`pulse${k}`, batteryPic(st, 'pulse', true), { solid: SOLID, birthMon: b.mon, birthTime: SPARK_EVERY, next: `pulseOff${k}`, ntime: PULSE_ON });
      add(`pulseOff${k}`, batteryPic(st, 'pulse', false), { solid: SOLID, next: `pulse${k}`, ntime: PULSE_OFF });
    }
    if (b.kind === 'astable') {
      const high = b.high ?? ASTABLE_HIGH;
      add(`chip${k}`, chip555Pic(st, true), { solid: SOLID, birthMon: b.mon, birthTime: SPARK_EVERY, next: `chipLow${k}`, ntime: high });
      add(`chipLow${k}`, chip555Pic(st, false), { solid: SOLID, next: `chip${k}`, ntime: high === ASTABLE_HIGH ? ASTABLE_LOW : high / 2 });
    }
  }
  // the ':' LEDs follow the room's first 555
  const first555 = batteries.find((b) => b.kind === 'astable');
  if (first555) {
    const high = first555.high ?? ASTABLE_HIGH;
    add('out555', led555Pic(st, true), { solid: SOLID, next: 'out555Low', ntime: high });
    add('out555Low', led555Pic(st, false), { solid: SOLID, next: 'out555', ntime: high === ASTABLE_HIGH ? ASTABLE_LOW : high / 2 });
  }
  // A breadboard board: its floor is a solderless breadboard, its wires blue jumpers, and a
  // 6502 sits across three blocks.
  if (opts.breadboard) {
    for (let k = 0; k < 3; k++) add(`bb${k}`, breadboardPic(k));
    const pad = breadboardPic(1);
    pad.ring(9.5, 9.5, 8, c('gold', 2)).ring(9.5, 9.5, 7, c('gold', 1));
    micro(pad, 4, 8, 'GND', c('ink', 0));
    add('bbPad', pad);
    add('bbOutlet', outletPic(st, breadboardPic(0)), { score: 1000, effect: 1, eamt: 1 });
    add('bbScrew', screwPic(st, breadboardPic(2)), { score: 500, effect: 1, eamt: 1, touch: 'bb0' });
    for (let m = 1; m < 16; m++) {
      const p = trace(breadboardPic(m % 3), m, r('blue'));
      // a stripped end where a jumper plugs in
      if (m === N || m === E || m === S || m === W) p.disc(9.5, 9.5, 1.6, c('metal', 4));
      add(`jumper${m}`, p);
    }
    for (let k = 0; k < 3; k++) add(`cpu${k}`, cpuPic(st, k), { solid: SOLID });
  }
  // a panel in the housing that isn't quite a wall, and what lies behind it
  for (const m of opts.seams ?? []) add(`seam${m}`, seamPic(st, m));
  if (opts.fusebox) {
    add('socket', outletPic(st));
    add('tape', tapePic(st, N | E | W, 'PRESS SPACE'));
  }
  // the painted Easter egg (kit/easterEgg.ts), only in the room that hides it: a few points, a
  // glint crossing it now and then, and no sound (added last, so no block before it moves)
  if (opts.easterEgg) {
    const egg = {
      ink: c('ink', 0),
      shell: [c('pink', 0), c('pink', 1), c('pink', 2)],
      paint: [c('teal', 2), c('teal', 4)],
      accent: c('yellow', 3),
      white: c('paper', 3),
    };
    for (let k = 0; k < EGG_SHINE_FRAMES; k++)
      add(`easterEgg${k || ''}`, drawEasterEgg(floorPic(st, 0), egg, 'dots', k), {
        score: 50,
        touch: 'floor0',
        next: `easterEgg${(k + 1) % EGG_SHINE_FRAMES || ''}`,
        ntime: k ? 2 : 60,
      });
  }
  // a hatch in the housing (a panel like the seam's) into the crawlspace behind a board, and
  // back out of it (added last, so no block before it moves)
  for (const m of opts.hatches ?? []) add(`hatch${m}`, seamPic(st, m));
  // the save sign (kit/saveSign.ts), laid on the board's floor, only in the room that shows it
  if (opts.saveSign) {
    const [l, rt] = saveSignBlocks(PAL.pal, { board: [floorPic(st, 0), floorPic(st, 1)] }).board;
    add('saveL', l);
    add('saveR', rt);
  }
  bs.addAt(EGG, 'egg', eggPic(st), { obj: true, touch: 'floor0' });
  return bs;
}
