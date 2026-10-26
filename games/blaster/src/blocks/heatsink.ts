// Stage 5's side leg, "The Heat Sink", seen from the side (its own palette, s5s.pal, the CPU's
// with a warm dark): flying over the 486 under its fan, between the heat sink's aluminum fins.
// The fins rise from the heat sink's base and the fan's frame hangs overhead; behind, the
// fan's blades turn dim in the dark (a ring of pictures), and the heat rising off the chip
// shimmers up through the gaps and shoves the ship upward.
import { Pixels } from '../../../kit/pixels';
import { BlockSet, flipY, micro, shadeAt } from '../art/draw';
import type { Pal } from '../art/pal';
import { SOLID, addTerrain, type SideArt } from './sideTiles';

/** The ramp this leg adds to the CPU's palette: the warm dark under the fan. */
export function sinkRamps(p: Pal): void {
  p.ramp('warm', 5, [8, 4, 6], [90, 40, 30], [36, 14, 16]);
}

function warmDark(p: Pal, v: number): Pixels {
  // a little warmer low down, where the chip is
  return new Pixels(20, 20).map((x, y) => shadeAt(p.r('warm'), 0, 2, 0.3 + ((x * 7 + y * 5 + v * 3) % 23 === 0 ? 0.3 : 0), x, y));
}

/** The heat sink's base: brushed aluminum, the fins' roots along its top. */
function baseTop(p: Pal): Pixels {
  const t = new Pixels(20, 20).map((x, y) => shadeAt(p.r('steel'), 2, 4, 0.55 + (y % 3 === 0 ? 0.1 : 0) - y * 0.01, x, y));
  t.rect(0, 0, 20, 2, p.c('steel', 6));
  for (const x of [2, 7, 12, 17]) t.rect(x, 2, 1, 18, p.c('steel', 2));
  return t;
}

function baseIn(p: Pal): Pixels {
  return new Pixels(20, 20).map((x, y) => shadeAt(p.r('steel'), 1, 3, 0.45 + (x % 5 === 2 ? -0.2 : 0), x, y));
}

/** The fan's frame overhead: black plastic, its screw holes. */
function frame(p: Pal): Pixels {
  const t = new Pixels(20, 20).map((x, y) => shadeAt(p.r('deep'), 0, 2, 0.5 + ((x + y) % 6 === 0 ? 0.15 : 0), x, y));
  t.rect(0, 0, 20, 3, p.c('deep', 3));
  return t;
}

export function sinkArt(p: Pal): SideArt {
  const floor = (v: number) => warmDark(p, v);
  const face = (side: 'floor' | 'ceil') => (side === 'floor' ? baseTop(p) : flipY(frame(p)));
  return { pal: p, floor, edge: (_s, v) => floor(v), floors: 2, edges: 1, face };
}

export function sinkBlocks(bs: BlockSet, a: SideArt): void {
  const p = a.pal;
  const back = a.floor(0);
  addTerrain(bs, back, { cIn: frame(p), cBot: flipY(frame(p)), fIn: baseIn(p), fTop: baseTop(p) }, p.c('steel', 6));
  // a fin: a thin aluminum plate standing up from the base, its top rounded
  const fin = (top: boolean) => {
    const t = back.crop(0, 0, 20, 20);
    for (let y = top ? 4 : 0; y < 20; y++) for (let x = 6; x < 14; x++) t.set(x, y, shadeAt(p.r('steel'), 2, 6, 0.9 - (x - 6) / 10, x, y));
    if (top) t.rect(7, 2, 6, 2, p.c('steel', 5));
    t.rect(13, top ? 4 : 0, 1, top ? 16 : 20, p.c('steel', 1));
    return t;
  };
  bs.add('finT', fin(true), { solid: SOLID });
  bs.add('finM', fin(false), { solid: SOLID });
  // a fan blade's tip hanging in through the frame's grille
  const grille = back.crop(0, 0, 20, 20);
  for (let x = 1; x < 20; x += 4) grille.rect(x, 0, 2, 20, p.c('deep', 2));
  grille.rect(0, 17, 20, 3, p.c('deep', 3));
  bs.add('grille', grille, { solid: SOLID });
  // the fan far behind: dim blades turning, a ring of three pictures over 2 x 2 blocks
  for (let k = 0; k < 3; k++) {
    const big = new Pixels(40, 40);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) big.blit(back, c * 20, r * 20);
    for (let y = 0; y < 40; y++)
      for (let x = 0; x < 40; x++) {
        const d = Math.hypot(x - 19.5, y - 19.5);
        if (d > 18) continue;
        const a2 = Math.atan2(y - 19.5, x - 19.5) + (k * Math.PI * 2) / 21 + d * 0.06;
        const blade = Math.cos(a2 * 7) > 0.35;
        if (d < 5) big.set(x, y, p.c('warm', 3));
        else if (blade) big.set(x, y, p.c('warm', 2));
        else if (Math.round(d) === 18) big.set(x, y, p.c('warm', 3));
      }
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 2; c++) bs.add(`fan${k}${r}${c}`, big.crop(c * 20, r * 20, 20, 20), { next: `fan${(k + 1) % 3}${r}${c}`, ntime: 2 });
  }
  // the chip's markings on the base, here and there
  const mark = baseTop(p);
  micro(mark, 4, 8, '486', p.c('steel', 1));
  bs.add('mark', mark, { solid: SOLID });
}
