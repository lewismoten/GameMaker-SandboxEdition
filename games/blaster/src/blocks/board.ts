// Stage 1: THE MOTHERBOARD. Green fiberglass, copper bus lines running up the board,
// chips, capacitors, resistors and blinking LEDs. Its blocks and its virus.
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, bevel, blob, micro, shadeAt, text } from '../art/draw';
import { pics } from '../characters/enemies';
import { biter, bomb, claw, cluster, keyOf, mite, moth } from '../sprites/sprites';
import type { Bestiary } from '../characters/mons';
import type { Pal } from '../art/pal';
import { onFloor, slices, type StageArt } from './tiles';

export function boardArt(p: Pal): StageArt {
  const weave = (seed: number) => {
    const t = new Pixels(20, 20);
    const r = rng(seed);
    t.map((x, y) => {
      const w = ((x + y) % 4 === 0 ? 0.15 : 0) + ((x - y + 40) % 4 === 0 ? 0.1 : 0);
      return shadeAt(p.r('base'), 1, 3, 0.35 + w + r() * 0.15, x, y);
    });
    return t;
  };
  const floor = (v: number): Pixels => {
    const t = weave(v + 1);
    const silk = p.c('grey', 5);
    if (v === 1) {
      // a via
      blob(t, 9.5, 9.5, 3, 3, p.r('trim'), 2, 5);
      t.rect(9, 9, 2, 2, p.c('deep', 0));
    } else if (v === 2) {
      // an empty resistor footprint
      micro(t, 3, 3, 'R12', silk);
      t.frame(3, 10, 14, 6, silk);
      t.rect(1, 12, 2, 2, p.c('trim', 4)).rect(17, 12, 2, 2, p.c('trim', 4));
    } else if (v === 3) {
      // two tiny vias
      for (const [x, y] of [
        [5, 14],
        [14, 5],
      ]) {
        t.rect(x - 1, y - 1, 3, 3, p.c('trim', 4));
        t.set(x, y, p.c('deep', 0));
      }
    } else if (v === 4) {
      // a solder pad pair
      t.rect(4, 8, 4, 4, p.c('steel', 4)).rect(12, 8, 4, 4, p.c('steel', 4));
      t.rect(4, 8, 4, 1, p.c('steel', 6)).rect(12, 8, 4, 1, p.c('steel', 6));
    } else if (v === 5) {
      // where a capacitor goes: its ring, the + side and its name
      t.ring(11, 12, 6.5, silk);
      for (let y = 6; y < 19; y++) for (let x = 5; x < 10; x++) if ((x + y) % 3 === 0 && Math.hypot(x - 11, y - 12) < 6) t.set(x, y, silk);
      micro(t, 1, 1, 'C9', silk);
      micro(t, 16, 1, '+', silk);
      t.rect(13, 11, 3, 3, p.c('trim', 4)).set(14, 12, p.c('deep', 0));
    } else if (v === 6) {
      // where a transistor goes: the flat-sided TO-92 outline and its legs
      micro(t, 1, 1, 'Q5', silk);
      t.line(5, 11, 15, 11, silk);
      for (let x = 5; x <= 15; x++) t.set(x, 11 - Math.round(Math.sqrt(Math.max(0, 25 - (x - 10) ** 2))), silk);
      for (const x of [6, 10, 14]) t.rect(x - 1, 13, 2, 2, p.c('trim', 4));
      micro(t, 5, 15, 'E', silk);
      micro(t, 9, 15, 'B', silk);
      micro(t, 13, 15, 'C', silk);
    } else if (v === 7) {
      // a test point
      t.ring(12, 12, 3.5, silk);
      t.rect(11, 11, 3, 3, p.c('trim', 5)).set(12, 12, p.c('trim', 3));
      micro(t, 1, 2, 'TP3', silk);
    }
    return t;
  };
  const edge = (side: 'L' | 'R', v: number): Pixels => {
    // the ground plane: hatched copper under the green, with mounting holes
    const t = new Pixels(20, 20);
    t.map((x, y) => ((x + y + v) % 3 === 0 ? p.c('trim', 1) : shadeAt(p.r('base'), 0, 2, 0.4, x, y)));
    const inner = side === 'L' ? 19 : 0;
    t.rect(inner, 0, 1, 20, p.c('trim', 3));
    if (v === 1) {
      blob(t, 9.5, 9.5, 6, 6, p.r('trim'), 2, 6);
      blob(t, 9.5, 9.5, 3.5, 3.5, p.r('deep'), 0, 1, -1);
    }
    return t;
  };
  return { pal: p, floor, edge, floors: 8, edges: 2 };
}

/** The copper data bus (4 lanes): V, H and corners (named by the sides they join: ns, ew, ne, nw, se, sw). */
function busTrace(a: StageArt, sides: string): Pixels {
  const p = a.pal;
  const t = new Pixels(20, 20);
  t.px.set(a.floor(0).px);
  for (const l of [3, 7, 11, 15]) {
    const draw = (x: number, y: number, ww: number, hh: number) => {
      t.rect(x, y, ww, hh, p.c('trim', 3));
    };
    if (sides.includes('n')) draw(l, 0, 2, l + 2);
    if (sides.includes('s')) draw(l, l, 2, 20 - l);
    if (sides.includes('w')) draw(0, l, l + 2, 2);
    if (sides.includes('e')) draw(l, l, 20 - l, 2);
  }
  // a highlight down the middle of each lane
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (t.get(x, y) === p.c('trim', 3) && (x + y) % 5 === 0) t.set(x, y, p.c('trim', 5));
  return t;
}

const SIDE: Record<string, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

/**
 * A light green signal trace under the solder mask, two pixels wide, from the middle of each
 * side named to the middle of the block. Two sides make a run or a 45-degree corner; one side
 * and `via` end it in a plated hole.
 */
function trace(a: StageArt, sides: string, via = false): Pixels {
  const p = a.pal;
  const t = new Pixels(20, 20);
  t.px.set(a.floor(0).px);
  const ink = p.c('base', 5);
  const mask = new Uint8Array(400);
  const pen = (x: number, y: number) => {
    for (let yy = 0; yy < 2; yy++)
      for (let xx = 0; xx < 2; xx++) {
        const px = Math.round(x) + xx;
        const py = Math.round(y) + yy;
        if (px >= 0 && py >= 0 && px < 20 && py < 20) mask[py * 20 + px] = 1;
      }
  };
  const stroke = (pts: [number, number][]) => {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let k = 0; k <= n; k++) pen(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n);
    }
  };
  const ends = [...sides];
  const edge = (d: string): [number, number] => [9 + SIDE[d][0] * 10, 9 + SIDE[d][1] * 10];
  const near = (d: string): [number, number] => [9 + SIDE[d][0] * 4, 9 + SIDE[d][1] * 4];
  if (ends.length === 2 && !via) stroke([edge(ends[0]), near(ends[0]), near(ends[1]), edge(ends[1])]);
  else for (const d of ends) stroke([edge(d), [9, 9]]);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (!mask[y * 20 + x]) continue;
      const lit = (y > 0 && !mask[(y - 1) * 20 + x]) || (x > 0 && !mask[y * 20 + x - 1]);
      t.set(x, y, lit ? p.c('base', 6) : ink);
    }
  if (via) {
    t.disc(9.5, 9.5, 3.4, p.c('base', 6));
    t.disc(9.5, 9.5, 2.2, p.c('trim', 4));
    t.rect(9, 9, 2, 2, p.c('deep', 0));
  }
  return t;
}

/** A DIP chip, nine-slice: r 0..2 (notch end, middle, far end), c 0..2 (pins, body, pins). */
function chip(a: StageArt, r: number, c: number, label?: string): Pixels {
  const p = a.pal;
  const t = new Pixels(20, 20);
  t.px.set(a.floor(0).px);
  const x0 = c === 0 ? 6 : 0;
  const x1 = c === 2 ? 14 : 20;
  const y0 = r === 0 ? 3 : 0;
  const y1 = r === 2 ? 17 : 20;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) t.set(x, y, shadeAt(p.r('deep'), 0, 2, 0.4 + (y - y0) * 0.01, x, y));
  if (r === 0) t.rect(x0, y0, x1 - x0, 1, p.c('deep', 3));
  if (c === 0) {
    t.rect(x0, y0, 1, y1 - y0, p.c('deep', 3));
    for (let y = 4; y < 20; y += 8) if (y >= y0 && y + 3 <= y1) t.rect(1, y, 5, 3, p.c('steel', 5)).rect(1, y + 2, 5, 1, p.c('steel', 3));
  }
  if (c === 2) {
    t.rect(x1 - 1, y0, 1, y1 - y0, p.c('ink', 0));
    for (let y = 4; y < 20; y += 8) if (y >= y0 && y + 3 <= y1) t.rect(14, y, 5, 3, p.c('steel', 5)).rect(14, y + 2, 5, 1, p.c('steel', 3));
  }
  if (r === 2) t.rect(x0, y1 - 1, x1 - x0, 1, p.c('ink', 0));
  if (r === 0 && c === 1) blob(t, 10, 3, 3, 3, p.r('deep'), 0, 0);
  if (label) micro(t, 10 - label.length * 2, 8, label, p.c('label', 3));
  return t;
}

/** An electrolytic capacitor seen from above (2x2). */
function capacitor(a: StageArt, ramp: string): Pixels {
  const p = a.pal;
  const big = onFloor(a, 2, 2);
  blob(big, 20, 21, 17, 17, p.r('deep'), 0, 1, 0.3);
  blob(big, 20, 20, 16, 16, p.r(ramp), 1, 4);
  blob(big, 20, 20, 12, 12, p.r('steel'), 2, 6);
  big.rect(19, 9, 2, 22, p.c('steel', 1)).rect(9, 19, 22, 2, p.c('steel', 1));
  // the minus stripe
  for (let y = 6; y < 34; y++)
    for (let x = 4; x < 8; x++) if (big.get(x, y) !== big.get(0, 0) && Math.hypot(x - 20, y - 20) < 16) big.set(x, y, p.c('grey', 6));
  return big;
}

/** The chipset: a square chip with pins on all four sides (4x4). */
function chipset(a: StageArt): Pixels {
  const p = a.pal;
  const big = onFloor(a, 4, 4);
  for (let i = 0; i < 14; i++) {
    const k = 12 + i * 4;
    big.rect(k, 4, 2, 8, p.c('steel', 5)).rect(k, 68, 2, 8, p.c('steel', 5));
    big.rect(4, k, 8, 2, p.c('steel', 5)).rect(68, k, 8, 2, p.c('steel', 5));
  }
  bevel(big, 10, 10, 60, 60, p.r('deep'), 1, 2);
  blob(big, 18, 18, 3, 3, p.r('deep'), 0, 0);
  text(big, 18, 30, 'SANDBOX', p.c('label', 4));
  text(big, 22, 42, 'SX-486', p.c('label', 2));
  text(big, 22, 52, '(C)1994', p.c('label', 1));
  return big;
}

function resistor(a: StageArt, vertical: boolean): Pixels {
  const p = a.pal;
  const t = new Pixels(20, 20);
  t.px.set(a.floor(0).px);
  const bands = [p.c('red', 2), p.c('ink', 0), p.c('gold', 3)];
  if (vertical) {
    t.rect(9, 0, 2, 20, p.c('steel', 5));
    bevel(t, 6, 4, 8, 12, p.r('label'), 2, 1);
    bands.forEach((c, i) => t.rect(6, 6 + i * 3, 8, 1, c));
  } else {
    t.rect(0, 9, 20, 2, p.c('steel', 5));
    bevel(t, 4, 6, 12, 8, p.r('label'), 2, 1);
    bands.forEach((c, i) => t.rect(6 + i * 3, 6, 1, 8, c));
  }
  return t;
}

function led(a: StageArt, on: boolean, ramp: string): Pixels {
  const p = a.pal;
  const t = new Pixels(20, 20);
  t.px.set(a.floor(0).px);
  if (on) blob(t, 10, 10, 8, 8, p.r(ramp), 0, 2, 0.4);
  blob(t, 10, 10, 5, 5, p.r(ramp), on ? 2 : 0, on ? 4 : 1);
  if (on) t.set(8, 8, p.c('grey', 7));
  t.rect(4, 17, 12, 2, p.c('steel', 3));
  return t;
}

function crystal(a: StageArt): Pixels {
  const p = a.pal;
  const big = onFloor(a, 2, 1);
  bevel(big, 3, 4, 34, 12, p.r('steel'), 4, 2);
  big.rect(8, 7, 24, 6, p.c('steel', 3));
  text(big, 8, 6, '33.0', p.c('ink', 0));
  return big;
}

/** Stage 1 landmark blocks. */
export function boardTiles(bs: BlockSet, a: StageArt): void {
  for (const s of ['ns', 'ew', 'ne', 'nw', 'se', 'sw', 'nse', 'nsw']) bs.add(`tr_${s}`, trace(a, s));
  for (const s of 'nsew') bs.add(`tr_${s}V`, trace(a, s, true));
  for (const s of ['ns', 'ew', 'se', 'sw', 'ne', 'nw']) bs.add(`bus_${s}`, busTrace(a, s));
  const labels = ['74LS', '138', 'BIOS', '1994', 'AMI', '8042'];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) bs.add(`chip${r}${c}`, chip(a, r, c));
  labels.forEach((l, i) => bs.add(`chipL${i}`, chip(a, 1, 1, l)));
  slices(bs, 'capB', capacitor(a, 'blue'));
  slices(bs, 'capG', capacitor(a, 'slime'));
  slices(bs, 'cs', chipset(a));
  bs.add('resH', resistor(a, false));
  bs.add('resV', resistor(a, true));
  bs.add('ledR', led(a, true, 'red'), { next: 'ledR1', ntime: 9 });
  bs.add('ledR1', led(a, false, 'red'), { next: 'ledR', ntime: 9 });
  bs.add('ledG', led(a, true, 'slime'), { next: 'ledG1', ntime: 4 });
  bs.add('ledG1', led(a, false, 'slime'), { next: 'ledG', ntime: 13 });
  slices(bs, 'xtal', crystal(a));
}

// ------------------------------------------------------------------ the virus, stage 1

export function boardVirus(b: Bestiary, p: Pal): void {
  const v = keyOf(p, { main: 'virus', accent: 'slime' });
  pics(b, 'mite', ...mite(v));
  pics(b, 'biter', ...biter(keyOf(p, { main: 'slime', accent: 'virus' })));
  pics(b, 'moth', ...moth(keyOf(p, { main: 'pink', accent: 'virus' })));
  pics(b, 'bomb', ...bomb(v));
  pics(b, 'clawL', claw(v, true), claw(v, false));
  pics(b, 'clawR', claw(v, true).flipX(), claw(v, false).flipX());
  pics(b, 'cluster', ...cluster(p, { main: 'virus', accent: 'cyan' }));
}
