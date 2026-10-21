// Stage 5: THE CPU. The 486's silicon die itself: transistor fields, metal layers, the ALU,
// the on-chip cache, registers flickering and the clock pulsing, the bond pads around the
// edge, and patches of glitch where the virus has eaten in.
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, bevel, micro, shadeAt } from '../art/draw';
import { pics } from '../characters/enemies';
import type { Bestiary } from '../characters/mons';
import type { Pal } from '../art/pal';
import { bomb, claw, cluster, eye, keyOf, mite, moth, slug, wasp } from '../sprites/sprites';
import { onFloor, slices, type StageArt } from './tiles';

export function cpuArt(p: Pal): StageArt {
  const floor = (v: number): Pixels => {
    const t = new Pixels(20, 20);
    t.map((x, y) => {
      const cell = x % 5 === 0 || y % 4 === 0;
      return cell ? p.c('base', 1) : shadeAt(p.r('base'), 2, 3, 0.3 + ((x * 7 + y * 3) % 5) * 0.05, x, y);
    });
    if (v === 1) t.rect(0, 9, 20, 2, p.c('trim', 3)).rect(0, 9, 20, 1, p.c('trim', 5));
    if (v === 2) t.rect(9, 0, 2, 20, p.c('label', 2)).rect(9, 0, 1, 20, p.c('label', 4));
    if (v === 3)
      for (const [x, y] of [
        [2, 2],
        [12, 6],
        [7, 14],
      ])
        t.rect(x, y, 3, 3, p.c('trim', 4)).set(x + 1, y + 1, p.c('deep', 0));
    if (v === 4) {
      const r = rng(77);
      for (let i = 0; i < 9; i++) t.rect(Math.floor(r() * 17), Math.floor(r() * 18), 3, 1, p.c(i % 2 ? 'virus' : 'glow', 2 + (i % 3)));
    }
    return t;
  };
  const edge = (side: 'L' | 'R', v: number): Pixels => {
    // bond pads, with gold wires running off the die
    const t = new Pixels(20, 20, p.c('deep', 1));
    bevel(t, side === 'L' ? 9 : 2, 4, 9, 12, p.r('trim'), 3, 1);
    const wx = side === 'L' ? 0 : 11;
    for (let x = 0; x < 9; x++) t.set(wx + x, 9 + Math.round(Math.sin(x / 3 + v) * 2), p.c('trim', 6));
    return t;
  };
  return { pal: p, floor, edge, floors: 5, edges: 2 };
}

function alu(a: StageArt): Pixels {
  const p = a.pal;
  const big = onFloor(a, 4, 3);
  bevel(big, 2, 2, 76, 56, p.r('deep'), 2, 2);
  for (let y = 8; y < 50; y += 6) for (let x = 8; x < 72; x += 6) big.rect(x, y, 4, 3, p.c('base', (x + y) % 4 ? 3 : 5));
  bevel(big, 26, 22, 28, 14, p.r('trim'), 4, 1);
  micro(big, 34, 27, 'ALU', p.c('ink', 0));
  return big;
}

function cacheArray(a: StageArt): Pixels {
  const p = a.pal;
  const big = onFloor(a, 3, 3);
  bevel(big, 1, 1, 58, 58, p.r('label'), 0, 1);
  for (let y = 4; y < 56; y += 3) for (let x = 4; x < 56; x += 3) big.set(x, y, p.c('label', (x * y) % 7 === 0 ? 4 : 2));
  micro(big, 18, 26, 'L1 8K', p.c('trim', 6));
  return big;
}

function fpu(a: StageArt): Pixels {
  const p = a.pal;
  const big = onFloor(a, 3, 2);
  bevel(big, 2, 2, 56, 36, p.r('base'), 4, 2);
  for (let x = 6; x < 54; x += 4) big.rect(x, 8, 2, 24, p.c('base', 6));
  micro(big, 22, 17, 'FPU', p.c('glow', 4));
  return big;
}

function reg(a: StageArt, k: number): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  bevel(t, 0, 4, 20, 12, p.r('deep'), 1, 1);
  for (let i = 0; i < 8; i++) t.rect(1 + i * 2 + (i >> 2), 7, 1, 6, ((k * 5 + i * 3) % 7) % 2 ? p.c('glow', 4) : p.c('glow', 0));
  return t;
}

function clockPulse(a: StageArt, k: number): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  t.rect(9, 0, 2, 20, p.c('trim', 2));
  t.rect(9, (k * 5) % 20, 2, 5, p.c('glow', 4));
  return t;
}

export function cpuTiles(bs: BlockSet, a: StageArt): void {
  slices(bs, 'alu', alu(a));
  slices(bs, 'l1', cacheArray(a));
  slices(bs, 'fpu', fpu(a));
  for (let k = 0; k < 4; k++) bs.add(`reg${k}`, reg(a, k), { next: `reg${(k + 1) % 4}`, ntime: 2 });
  for (let k = 0; k < 4; k++) bs.add(`clk${k}`, clockPulse(a, 3 - k), { next: `clk${(k + 1) % 4}`, ntime: 1 });
}

export function cpuVirus(b: Bestiary, p: Pal): void {
  pics(b, 'mite', ...mite(keyOf(p, { main: 'virus', accent: 'gold' })));
  pics(b, 'wasp', ...wasp(keyOf(p, { main: 'red', accent: 'slime' })));
  pics(b, 'eye', ...eye(keyOf(p, { main: 'virus', accent: 'slime' })));
  pics(b, 'moth', ...moth(keyOf(p, { main: 'slime', accent: 'virus' })));
  pics(b, 'slug', ...slug(keyOf(p, { main: 'red', accent: 'gold' })));
  const v = keyOf(p, { main: 'virus', accent: 'slime' });
  pics(b, 'bomb', ...bomb(v));
  pics(b, 'clawL', claw(v, true), claw(v, false));
  pics(b, 'clawR', claw(v, true).flipX(), claw(v, false).flipX());
  pics(b, 'cluster', ...cluster(p, { main: 'virus', accent: 'red' }));
}
