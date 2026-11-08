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
  const f = pal.r('fog');
  const w = pal.r('white');
  const wt = pal.r('water');
  if (which === 'rug') {
    // a lumpy mat of moss lying flat, with darker tufts and a few roots trailing off the edge
    p.rect(2, 13, 16, 4, m[2]).rect(4, 11, 12, 2, m[2]).rect(6, 10, 3, 1, m[3]).rect(11, 10, 3, 1, m[3]).rect(3, 12, 3, 1, m[3]).rect(14, 12, 3, 1, m[3]);
    for (const x of [5, 9, 13]) p.rect(x, 14, 2, 2, m[1]);
    p.rect(2, 17, 2, 1, m[1]).rect(8, 17, 1, 2, m[1]).rect(15, 17, 3, 1, m[1]);
  } else if (which === 'chip') {
    // a chip broken off the mountain: an angular shard of gray stone, a lit face and a shadowed one, a crack, one glint
    const st = pal.r('stone');
    for (let y = 4; y < 18; y++) {
      const left = y < 11 ? 9 - Math.round((y - 4) * 0.7) : 4;
      const right = y < 11 ? 10 + Math.round((y - 4) * 0.5) : 16;
      for (let x = left; x <= right; x++) p.set(x, y, x < 10 ? st[3] : st[1]);
    }
    for (let y = 8; y < 17; y++) p.set(10 + (y % 3 === 0 ? 1 : 0), y, st[0]);
    p.rect(5, 16, 11, 1, st[0]).rect(6, 11, 2, 1, w[3]).rect(6, 10, 1, 3, w[3]);
  } else if (which === 'fluff') {
    // a tuft of cloud puffs lying on a twig that forks
    const wd = pal.r('wood');
    p.rect(2, 16, 16, 1, wd[2]).rect(12, 14, 1, 2, wd[2]).rect(15, 13, 1, 3, wd[2]).rect(2, 17, 5, 1, wd[1]);
    p.disc(6, 12, 3, f[2]).disc(10, 10, 4, f[3]).disc(14, 12, 3, f[2]).rect(5, 12, 11, 3, f[2]);
    p.rect(8, 8, 2, 1, w[3]).rect(11, 12, 3, 1, f[0]).rect(5, 14, 11, 1, f[1]);
  } else if (which === 'drift') {
    // Wisp's snow: a very small drift, still cold (a blue shadow and one flake in the air)
    p.disc(10, 15, 6, w[3]).rect(3, 15, 15, 4, w[3]);
    for (let y = 11; y < 19; y++) p.rect(13 + Math.floor(Math.abs(y - 15) / 2), y, 5 - Math.floor(Math.abs(y - 15) / 2), 1, f[1]);
    p.rect(5, 12, 2, 1, w[2]);
    p.set(14, 6, wt[4]).set(13, 7, wt[4]).set(15, 7, wt[4]).set(14, 8, wt[4]);
  } else {
    // three pebbles in a line and five more set as a chevron, so the line points right
    const st = pal.r('stone');
    for (const x of [1, 5, 9]) p.rect(x, 9, 3, 2, st[3]).rect(x, 10, 3, 1, st[1]);
    for (const [x, y] of [
      [12, 5],
      [14, 7],
      [16, 9],
      [14, 11],
      [12, 13],
    ] as const)
      p.rect(x, y, 2, 2, st[3]).rect(x, y + 1, 2, 1, st[1]);
  }
  return inked(pal, p);
}
