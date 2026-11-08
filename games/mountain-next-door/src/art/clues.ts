// What the mountain left behind in THE EMPTY SPOT, as 20x20 woodcut blocks (ink outline, flat colors, a few hatch
// lines): a moss rug, a chipped stone with a glint, a tuft of cloud fluff, a very small snowdrift, and an arrow of
// pebbles. Each is a small thing on the hollow's floor; Tess takes one by walking into it.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../../kit/starter/palette';
import { clear, inked } from './land';

export const CLUES = ['rug', 'chip', 'fluff', 'drift', 'arrow'] as const;
export type Clue = (typeof CLUES)[number];

export function clue(pal: Pal, which: Clue): Pixels {
  const p = clear(pal);
  const m = pal.r('moss');
  const r = pal.r('rock');
  const f = pal.r('fog');
  const w = pal.r('white');
  const wt = pal.r('water');
  if (which === 'rug') {
    // a square of moss with its roots hanging off one edge, hatched
    p.rect(3, 11, 14, 6, m[2]).rect(4, 10, 12, 1, m[3]).rect(6, 9, 8, 1, m[3]);
    for (let x = 4; x < 16; x += 3) p.rect(x, 13, 1, 3, m[1]);
    p.rect(3, 17, 3, 1, m[1]).rect(9, 17, 2, 2, m[1]).rect(14, 17, 3, 1, m[1]);
  } else if (which === 'chip') {
    // a chip of mountain: a three-sided rock with a crack, and one bright glint
    p.rect(4, 12, 13, 5, r[2]).rect(6, 9, 9, 3, r[2]).rect(8, 7, 5, 2, r[3]);
    p.rect(4, 15, 13, 2, r[1]);
    for (let y = 9; y < 15; y++) p.set(11 + (y % 2), y, r[0]);
    p.rect(14, 5, 1, 4, w[3]).rect(13, 6, 3, 1, w[3]);
  } else if (which === 'fluff') {
    // a tuft of cloud, caught on a twig
    p.line(3, 17, 17, 9, pal.c('wood', 1));
    p.disc(8, 10, 3, f[2]).disc(12, 8, 4, f[3]).disc(15, 11, 3, f[2]).rect(7, 11, 10, 2, f[2]);
    p.set(11, 6, w[3]).set(12, 6, w[3]).rect(9, 9, 2, 1, f[0]);
  } else if (which === 'drift') {
    // Wisp's snow: a very small drift, still cold (a blue shadow and one flake in the air)
    p.disc(10, 15, 6, w[3]).rect(3, 15, 15, 4, w[3]);
    p.rect(11, 15, 6, 4, f[1]).rect(5, 12, 2, 1, w[2]);
    p.set(14, 6, wt[4]).set(13, 7, wt[4]).set(15, 7, wt[4]).set(14, 8, wt[4]);
  } else {
    // five pebbles set in a line, and the last two make an arrowhead pointing right
    for (const [x, y] of [
      [3, 10],
      [7, 10],
      [11, 10],
    ] as const)
      p.rect(x, y, 3, 2, r[3]).rect(x, y + 1, 3, 1, r[1]);
    p.rect(14, 6, 3, 2, r[3]).rect(14, 14, 3, 2, r[3]).rect(15, 8, 3, 2, r[2]).rect(15, 12, 3, 2, r[2]).rect(16, 10, 3, 2, r[3]);
  }
  return inked(pal, p);
}
