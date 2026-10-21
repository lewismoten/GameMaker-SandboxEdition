// Stage 2: MEMORY LANE. Deep blue SIMM boards gridded with memory cells (the lit ones are
// data), rows of DRAM chips, gold contact fingers, and the address bus whose data streams
// shove the ship sideways.
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, bevel, blob, micro, shadeAt } from '../art/draw';
import { pics } from '../characters/enemies';
import type { Bestiary } from '../characters/mons';
import type { Pal } from '../art/pal';
import { bat, crawler, eye, keyOf, mite, slug, cluster } from '../sprites/sprites';
import { HURT } from '../characters/sharedMonsters';
import { onFloor, slices, type StageArt } from './tiles';

export function ramArt(p: Pal): StageArt {
  const floor = (v: number): Pixels => {
    const t = new Pixels(20, 20);
    const r = rng(v * 13 + 3);
    t.map((x, y) => shadeAt(p.r('base'), 1, 2, 0.4 + r() * 0.2, x, y));
    // the cell grid
    for (let y = 2; y < 20; y += 5) for (let x = 2; x < 20; x += 5) t.set(x, y, p.c('base', 3)).set(x + 1, y, p.c('base', 0));
    if (v >= 1) {
      // lit cells: data
      const n = v === 1 ? 1 : v === 2 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const x = 2 + 5 * Math.floor(r() * 4);
        const y = 2 + 5 * Math.floor(r() * 4);
        t.rect(x - 1, y - 1, 3, 3, p.c('glow', 1)).set(x, y, p.c('glow', 4));
      }
    }
    if (v === 3) t.rect(0, 9, 20, 1, p.c('base', 4));
    if (v === 4) micro(t, 2, 13, 'A12', p.c('base', 4));
    return t;
  };
  const edge = (side: 'L' | 'R', v: number): Pixels => {
    // gold contact fingers of the SIMM
    const t = new Pixels(20, 20, p.c('base', 0));
    for (let y = 0; y < 20; y++) {
      if (y % 10 < 2) continue;
      for (let x = 3; x < 17; x++) t.set(x, y, shadeAt(p.r('trim'), 2, 5, (x - 3) / 14 + (y % 10 === 2 ? 0.3 : 0), x, y));
    }
    t.rect(side === 'L' ? 19 : 0, 0, 1, 20, p.c('trim', 1));
    if (v === 1) micro(t, 5, 13, side === 'L' ? '72' : '1', p.c('ink', 0));
    return t;
  };
  return { pal: p, floor, edge, floors: 5, edges: 2 };
}

/** A DRAM chip standing up the board: 2 wide x 3 tall, leads down both sides. */
function dram(a: StageArt, label: string): Pixels {
  const p = a.pal;
  const big = onFloor(a, 2, 3);
  for (let y = 6; y < 56; y += 5) big.rect(1, y, 5, 2, p.c('steel', 5)).rect(34, y, 5, 2, p.c('steel', 5));
  bevel(big, 5, 2, 30, 56, p.r('deep'), 1, 1);
  blob(big, 20, 6, 3, 3, p.r('deep'), 0, 0);
  micro(big, 9, 22, label, p.c('label', 3));
  micro(big, 11, 30, '-70', p.c('label', 2));
  micro(big, 9, 40, 'USA', p.c('label', 1));
  return big;
}

/** The cache: a wide SRAM chip (4 x 2) with a sticker. */
function cache(a: StageArt): Pixels {
  const p = a.pal;
  const big = onFloor(a, 4, 2);
  for (let x = 6; x < 76; x += 5) big.rect(x, 1, 2, 5, p.c('steel', 5)).rect(x, 34, 2, 5, p.c('steel', 5));
  bevel(big, 2, 5, 76, 30, p.r('deep'), 1, 2);
  bevel(big, 24, 10, 34, 18, p.r('label'), 3, 1);
  micro(big, 28, 13, 'CACHE', p.c('ink', 0));
  micro(big, 30, 20, '256K', p.c('red', 1));
  return big;
}

/** A row of cells being refreshed: a pulse runs along it (animated, 4 frames). */
function refresh(a: StageArt, k: number): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  for (let x = 2; x < 20; x += 5) {
    const lit = ((x - 2) / 5 + k) % 4 === 0;
    t.rect(x - 1, 6, 3, 8, lit ? p.c('glow', 3) : p.c('base', 0));
    t.rect(x, 7, 1, 6, lit ? p.c('glow', 4) : p.c('base', 3));
  }
  return t;
}

/** The address decoder: a gold comb of lines (one per row of the board). */
function comb(a: StageArt, end: boolean): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  for (let y = 1; y < 20; y += 3) t.rect(0, y, end ? 12 : 20, 1, p.c('trim', 3));
  if (end) t.rect(12, 0, 3, 20, p.c('trim', 2));
  return t;
}

export function ramTiles(bs: BlockSet, a: StageArt): void {
  slices(bs, 'dramA', dram(a, 'MT4C'));
  slices(bs, 'dramB', dram(a, 'TMS4'));
  slices(bs, 'cache', cache(a));
  for (let k = 0; k < 4; k++) bs.add(`ref${k}`, refresh(a, k), { next: `ref${(k + 1) % 4}`, ntime: 2 });
  bs.add('comb', comb(a, false));
  bs.add('combEnd', comb(a, true));
  bs.add('combEndR', comb(a, true).flipX());
}

// ------------------------------------------------------------------ page one: the stack
// A 6502 keeps its stack in page one, $0100-$01FF, and it grows downward from $01FF. Here
// it is a row of cells pushed one byte at a time from the right until the whole lane is
// full, then it overflows and wraps, and every byte pops at once. No monsters and no
// counters: cell k is a two-block chain, empty for (k+1) beats and full for (N-k) beats,
// so every chain has the same period and they all start together.

/** The bytes as they're pushed: LDA #$FF / STA $D020 / NOP / JMP ($FFFC), a reset! / RTS / BRK / NOP. */
export const STACK_BYTES = ['A9', 'FF', '8D', '20', 'D0', 'EA', '6C', 'FC', 'FF', '60', '00', 'EA'];

function stackCell(a: StageArt, byte: string | null): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  if (byte === null) {
    t.frame(2, 4, 16, 12, p.c('base', 3));
    micro(t, 7, 8, '--', p.c('base', 3));
  } else {
    bevel(t, 1, 3, 18, 14, p.r('trim'), 4, 1);
    micro(t, 6, 8, byte, p.c('ink', 0));
  }
  return t;
}

/** A floor label in the 3x5 font, w blocks wide. */
function label(a: StageArt, w: number, s: string, c: number): Pixels {
  const big = onFloor(a, w, 1);
  micro(big, Math.round((w * 20 - s.length * 4) / 2), 8, s, c);
  return big;
}

/** The stack row's cells, a hole the ship burns in a full cell, and the page labels. */
export function stackTiles(bs: BlockSet, a: StageArt, beat: number): void {
  const N = STACK_BYTES.length;
  STACK_BYTES.forEach((b, k) => {
    bs.add(`stk${k}`, stackCell(a, null), { next: `stkF${k}`, ntime: (k + 1) * beat });
    bs.add(`stkF${k}`, stackCell(a, b), { next: `stk${k}`, ntime: (N - k) * beat, chHitPt: HURT.hazard, touch: 'stkGap' });
  });
  const gap = stackCell(a, null);
  for (let i = 0; i < 5; i++) gap.set(4 + i * 3, 6 + ((i * 7) % 8), a.pal.c('grey', 2));
  bs.add('stkGap', gap);
  slices(bs, 'lblStk', label(a, 3, 'PAGE 1: STACK', a.pal.c('glow', 3)));
  bs.add('lbl1FF', label(a, 1, '$01FF', a.pal.c('base', 5)));
  slices(bs, 'lblZp', label(a, 3, 'ZERO PAGE $00', a.pal.c('glow', 3)));
}

export function ramVirus(b: Bestiary, p: Pal): void {
  pics(b, 'mite', ...mite(keyOf(p, { main: 'gold', accent: 'red' })));
  pics(b, 'bat', ...bat(keyOf(p, { main: 'virus', accent: 'slime' })));
  pics(b, 'eye', ...eye(keyOf(p, { main: 'virus', accent: 'red' })));
  pics(b, 'slug', ...slug(keyOf(p, { main: 'slime', accent: 'pink' })));
  pics(b, 'crawler', ...crawler(keyOf(p, { main: 'pink', accent: 'virus' })));
  pics(b, 'cluster', ...cluster(p, { main: 'slime', accent: 'gold' }));
}
