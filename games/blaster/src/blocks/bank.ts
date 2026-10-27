// Stage 2's side leg, "The Memory Bank", seen from the side (its own palette, s2s.pal, Memory
// Lane's): flying the gap between two SIMMs lying one over the other, the lower one's chips
// standing up from its board, the upper one's hanging down, and the next pair of sticks dim in
// the dark behind. The 6502's stack hangs from the upper board here too: bytes pushed one at a
// time down toward the floor until it overflows and they all pop.
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, bevel, flipY, micro, shadeAt } from '../art/draw';
import type { Pal } from '../art/pal';
import { HURT } from '../characters/sharedMonsters';
import { STACK_BYTES, stackCell } from './ram';
import { SOLID, addTerrain, type SideArt } from './sideTiles';

/** The ramps this leg adds to Memory Lane's palette: the dark gap between the sticks. */
export function bankRamps(p: Pal): void {
  p.ramp('gap', 6, [2, 4, 14], [70, 84, 140], [18, 24, 56]);
}

function gapWall(p: Pal, seed: number): Pixels {
  const r = rng(seed);
  return new Pixels(20, 20).map((x, y) => shadeAt(p.r('gap'), 0, 2, 0.3 + ((x + y * 3) % 9 === 0 ? 0.15 : 0) + r() * 0.08, x, y));
}

export function bankArt(p: Pal): SideArt {
  const floor = (v: number) => {
    const t = gapWall(p, 60 + v);
    // now and then a far chip's leg glints
    if (v === 1) t.rect(6, 12, 8, 1, p.c('gap', 4)).rect(6, 13, 8, 1, p.c('gap', 2));
    return t;
  };
  const face = (side: 'floor' | 'ceil') => (side === 'floor' ? simmTop(p) : flipY(simmTop(p)));
  return { pal: p, floor, edge: (_s, v) => floor(v), floors: 2, edges: 1, face };
}

/** A SIMM's board, edge on: blue fiberglass layers. */
function simmSide(p: Pal): Pixels {
  return new Pixels(20, 20).map((x, y) => shadeAt(p.r('base'), 0, 2, 0.4 + (y % 6 === 0 ? 0.2 : 0) + ((x * 5 + y) % 11 === 0 ? 0.1 : 0), x, y));
}

/** Its top surface: the green-blue solder mask, a gold trace, the board's edge lit. */
function simmTop(p: Pal): Pixels {
  const t = simmSide(p);
  for (let x = 0; x < 20; x++) for (let y = 0; y < 5; y++) t.set(x, y, shadeAt(p.r('base'), 2, 5, 0.85 - y * 0.15, x, y));
  t.rect(0, 0, 20, 1, p.c('base', 6)).rect(0, 2, 20, 1, p.c('trim', 4));
  return t;
}

/** How many cells the stack has. */
export const BANK_STACK = 5;

/** The leg's own blocks. */
export function bankBlocks(bs: BlockSet, a: SideArt, beat: number): void {
  const p = a.pal;
  const back = a.floor(0);
  addTerrain(bs, back, { cIn: flipY(simmSide(p)), cBot: flipY(simmTop(p)), fIn: simmSide(p), fTop: simmTop(p) }, p.c('base', 6));

  // a DRAM chip standing on the lower board, seen from the side: black, legs into the board
  const chip = new Pixels(40, 20);
  chip.blit(back, 0, 0).blit(back, 20, 0);
  bevel(chip, 3, 4, 34, 12, p.r('deep'), 1, 1);
  for (let x = 5; x < 36; x += 4) chip.rect(x, 16, 2, 4, p.c('steel', 5));
  micro(chip, 8, 8, '41256', p.c('label', 2));
  bs.add('chipF00', chip.crop(0, 0, 20, 20), { solid: SOLID });
  bs.add('chipF01', chip.crop(20, 0, 20, 20), { solid: SOLID });
  // and one hanging from the upper board (its label still reads the right way up)
  const hang = flipY(chip);
  micro(hang.rect(5, 6, 30, 7, p.c('deep', 1)), 8, 7, '41256', p.c('label', 2));
  bs.add('chipC00', hang.crop(0, 0, 20, 20), { solid: SOLID });
  bs.add('chipC01', hang.crop(20, 0, 20, 20), { solid: SOLID });

  // the stack, hanging from the upper board: cell k is empty for k + 1 beats, then full (a
  // byte that burns) for N - k beats; every chain has the same period and they start together
  const side = { ...a, floor: () => back.crop(0, 0, 20, 20) };
  const N = BANK_STACK;
  STACK_BYTES.slice(0, N).forEach((b, k) => {
    bs.add(`stk${k}`, stackCell(side, null), { next: `stkF${k}`, ntime: (k + 1) * beat });
    bs.add(`stkF${k}`, stackCell(side, b), { next: `stk${k}`, ntime: (N - k) * beat, chHitPt: HURT.hazard, touch: 'stkGap' });
  });
  const gap = stackCell(side, null);
  for (let i = 0; i < 5; i++) gap.set(4 + i * 3, 6 + ((i * 7) % 8), p.c('gray', 2));
  bs.add('stkGap', gap);

  // scenery in the dark behind: the next pair of sticks, a chip at a time, dim
  const far = new Pixels(40, 20);
  far.blit(back, 0, 0).blit(back, 20, 0);
  far.rect(4, 6, 32, 9, p.c('gap', 3)).rect(4, 6, 32, 1, p.c('gap', 4));
  for (let x = 6; x < 36; x += 4) far.rect(x, 15, 1, 3, p.c('gap', 3));
  bs.add('far00', far.crop(0, 0, 20, 20));
  bs.add('far01', far.crop(20, 0, 20, 20));
  const lbl = new Pixels(40, 20);
  lbl.blit(back, 0, 0).blit(back, 20, 0);
  micro(lbl, 6, 8, 'BANK 0', p.c('gap', 4));
  bs.add('lbl00', lbl.crop(0, 0, 20, 20));
  bs.add('lbl01', lbl.crop(20, 0, 20, 20));
}
