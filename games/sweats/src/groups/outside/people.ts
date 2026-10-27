// The folk of the INTO THE WILD set, drawn from one figure: a head with its hair, a shirt, trousers
// (or a skirt, or shorts), walking legs, arms down or flung up, and a mark over the head ("?" for
// the confused, "!" for the afraid). Face on for folk who stand, side on (walking right, mirrored
// for left) for folk who walk.
import { Pixels } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Pal } from '../../art/pal';
import { T, outline } from '../../common/sprites';

interface PersonOpts {
  hair: string;
  shirt: string;
  pants: string;
  step: number;
  arms?: 'down' | 'up';
  mark?: string;
  shout?: boolean;
  skirt?: boolean;
  shorts?: boolean;
  bun?: boolean;
  glasses?: boolean;
  band?: boolean;
  /** A scrap of receipt stuck to the calf. */
  scrap?: boolean;
  /** Head height (smaller folk sit lower). */
  short?: boolean;
  /** Leave it without its outline (the caller adds more first). */
  raw?: boolean;
  /** Side on, walking right (the monster's path mirrors it for left). */
  side?: boolean;
}

export function person(pal: Pal, o: PersonOpts): Pixels {
  if (o.side) return sideOn(pal, o);
  const c = pal.c;
  const ink = c('ink', 0);
  const p = new Pixels(20, 20, T);
  const d = o.short ? 3 : 0;
  // legs
  const legs =
    o.step % 2
      ? [
          [8, -2],
          [12, 2],
        ]
      : [
          [8, 0],
          [12, 0],
        ];
  for (const [lx, dx] of legs) {
    for (let y = 14; y < 18; y++) p.rect(lx + Math.round(((y - 14) / 4) * dx) - 1, y, 2, 1, o.shorts && y > 15 ? c('skin', 2) : c(o.pants, 1));
    p.rect(lx + dx - 1, 18, 3, 2, c('ink', 1));
  }
  if (o.scrap) p.rect(13, 15, 3, 3, c('white', 2));
  if (o.skirt) p.rect(6, 13, 9, 3, c(o.pants, 1)).rect(6, 13, 9, 1, c(o.pants, 2));
  // body and arms
  p.rect(6, 8 + d, 9, 6 - d, c(o.shirt, 2)).rect(6, 8 + d, 9, 1, c(o.shirt, 1 + 1));
  if (o.arms === 'up')
    p.line(6, 9 + d, 3, 3 + d, c(o.shirt, 1))
      .line(14, 9 + d, 17, 3 + d, c(o.shirt, 1))
      .set(3, 2 + d, c('skin', 2))
      .set(17, 2 + d, c('skin', 2));
  else
    p.line(5, 9 + d, 4, 13, c(o.shirt, 1))
      .line(15, 9 + d, 16, 13, c(o.shirt, 1))
      .set(4, 14, c('skin', 2))
      .set(16, 14, c('skin', 2));
  // head
  blob(p, 10, 5 + d, 3.2, 3.2, pal.r('skin'), 1, 4);
  p.rect(7, 1 + d, 7, 2, c(o.hair, 1))
    .set(7, 3 + d, c(o.hair, 1))
    .set(13, 3 + d, c(o.hair, 1));
  if (o.bun) p.disc(10, 1 + d, 1.6, c(o.hair, 2));
  if (o.band) p.rect(7, 3 + d, 7, 1, c('red', 2));
  p.set(9, 5 + d, ink).set(12, 5 + d, ink);
  if (o.glasses) p.rect(8, 5 + d, 2, 1, c('metal', 2)).rect(11, 5 + d, 2, 1, c('metal', 2));
  if (o.shout) p.rect(10, 7 + d, 2, 1, ink);
  else p.set(10, 7 + d, c('skin', 0)).set(11, 7 + d, c('skin', 0));
  if (o.mark) micro(p, 16, 0, o.mark, c('yellow', 2));
  return o.raw ? p : outline(p, ink);
}

/** The same figure side on, walking right: a stride, the near arm swinging, the face in profile. */
function sideOn(pal: Pal, o: PersonOpts): Pixels {
  const c = pal.c;
  const ink = c('ink', 0);
  const p = new Pixels(20, 20, T);
  const d = o.short ? 3 : 0;
  // legs: the far one a shade darker, a stride on odd steps, the shoes pointing ahead
  const stride = o.step % 2 ? 2 : 0;
  const leg = (dx: number, k: number) => {
    for (let y = 14; y < 18; y++) p.rect(9 + Math.round(((y - 13) / 5) * dx), y, 2, 1, o.shorts && y > 15 ? c('skin', k + 1) : c(o.pants, k));
    p.rect(9 + dx, 18, 3, 2, c('ink', 1));
  };
  leg(-stride, 0);
  leg(stride, 1);
  if (o.scrap) p.rect(10 + stride, 15, 2, 2, c('white', 2));
  if (o.skirt) p.rect(7, 13, 7, 3, c(o.pants, 1)).rect(7, 13, 7, 1, c(o.pants, 2));
  // body, and the arms: the near one swinging against the near leg, or both flung up ahead
  p.rect(7, 8 + d, 6, 6 - d, c(o.shirt, 2)).rect(7, 8 + d, 1, 6 - d, c(o.shirt, 1));
  const up = o.arms === 'up';
  if (up) p.line(9, 9 + d, 9, 2 + d, c(o.shirt, 0)).set(9, 1 + d, c('skin', 1));
  else p.line(10, 9 + d, 10 - stride, 13, c(o.shirt, 1)).set(10 - stride, 14, c('skin', 2));
  // head in profile: hair over the top and down the back, one eye, the nose ahead
  blob(p, 10, 5 + d, 3, 3.2, pal.r('skin'), 1, 4);
  p.rect(7, 1 + d, 6, 2, c(o.hair, 1))
    .rect(7, 3 + d, 2, 2, c(o.hair, 1))
    .set(13, 5 + d, c('skin', 3))
    .set(14, 6 + d, c('skin', 2))
    .set(9, 5 + d, c('skin', 1));
  if (o.bun) p.disc(7, 2 + d, 1.6, c(o.hair, 2));
  if (o.band) p.rect(7, 3 + d, 6, 1, c('red', 2));
  p.set(11, 5 + d, ink);
  if (o.glasses) p.rect(11, 5 + d, 2, 1, c('metal', 2)).set(10, 5 + d, c('metal', 1));
  if (o.shout) p.rect(12, 7 + d, 1, 2, ink);
  else p.set(12, 7 + d, c('skin', 0));
  // the near arm flung up ahead of the face
  if (up) p.line(11, 9 + d, 14, 3 + d, c(o.shirt, 1)).set(14, 2 + d, c('skin', 2));
  if (o.mark) micro(p, 16, 0, o.mark, c('yellow', 2));
  return o.raw ? p : outline(p, ink);
}
