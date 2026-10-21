// The Jamie Street sled run: most of the slope is GLIDE ground (grav 5, up and down at once:
// the pulls cancel so the sled keeps its speed), steep stretches pull it down (grav 4), moguls
// kick it up (grav 1), rocks and trees hurt, gate flags line the run, and a dollar bill and a
// cocoa mug wait on the snow.
import { rng } from '../../../kit/pixels';
import { blob, shadeAt } from '../art/draw';
import { Ctx, MONEY, SOLID } from './book';
import type { addThings } from './things';

type Treats = ReturnType<typeof addThings>;

export function addSled(k: Ctx, { pine, mug, bill }: Treats) {
  const { book, R, c, snow, P } = k;
  // ---------- the Jamie Street sled run ----------
  const slope = (seed: number, tracks: boolean, steep = 0) => {
    const p = P();
    const r = rng(seed);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(snow, 3 - steep, 6, 0.78 + Math.sin((x + y * 0.3 + seed) * 0.314) * 0.06 + (r() - 0.5) * 0.16, x, y));
    if (tracks)
      for (let y = 0; y < 20; y++)
        p.set(6 + Math.round(Math.sin(y * 0.3 + seed) * 1.2), y, c('snow', 3)).set(13 + Math.round(Math.sin(y * 0.3 + seed) * 1.2), y, c('snow', 3));
    if (steep)
      for (const [x, y] of [
        [5, 6],
        [14, 13],
      ])
        for (let i = 0; i < 3; i++) p.set(x - i, y - i, c('snow', 2)).set(x + i, y - i, c('snow', 2));
    return p;
  };
  // grav 5 = up AND down: the pulls cancel, so the sled keeps whatever speed it has.
  const GLIDE = 5;
  book.add('slope', slope(1, false), { grav: GLIDE });
  book.add('slopeT', slope(2, true), { grav: GLIDE });
  book.add('steep', slope(3, false, 1), { grav: 4 });
  const mogul = slope(4, false);
  blob(mogul, 10, 11, 8, 5, snow, 1, 6);
  book.add('mogul', mogul, { grav: 1 });
  const rock = slope(5, false);
  blob(rock, 10, 12, 8, 6, R('grey'), 1, 4);
  blob(rock, 9, 8, 6, 2.5, snow, 4, 6);
  book.add('rock', rock, { solid: SOLID, hp: -8 });
  book.add('slopeTree', pine(slope(6, false)), { solid: SOLID, hp: -10 });
  const flag = (col: string) => {
    const p = slope(7, false);
    p.rect(9, 3, 1, 15, c('ink', 1));
    for (let y = 0; y < 6; y++) p.rect(10, 3 + y, 6 - y, 1, c(col, 3));
    blob(p, 9, 18, 3, 1, snow, 2, 3);
    return p;
  };
  book.add('flagRed', flag('coat'), { grav: GLIDE });
  book.add('flagBlue', flag('siding'), { grav: GLIDE });
  const finish = slope(8, false);
  for (let y = 6; y < 14; y++) for (let x = 0; x < 20; x++) finish.set(x, y, ((x >> 2) + (y >> 2)) % 2 ? c('coat', 3) : c('snow', 6));
  book.add('finish', finish);
  book.add('slopeBill', bill(slope(9, false), 0.1), { grav: GLIDE, effect: MONEY, eamt: 1, score: 10, touch: 'slope' });
  book.add('slopeCocoa', mug(slope(10, false), 0), { grav: GLIDE, hp: 35, score: 25, touch: 'slope' });
}
