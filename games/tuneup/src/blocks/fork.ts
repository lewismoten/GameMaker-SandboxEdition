// The tuning forks hidden one to a level (Tune-Up's secrets): a fork shining in a nook, and the
// glint that tells where to look. A fork gives 250 points and counts on CTR.forks. Each level
// adds them over its own background block (`back`), so they sit in the wall they hang in.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { AIR, type Kit } from './common';
import { CTR } from '../ids';
import { POP_TICKS, drawPoints } from './pop';

/** A tuning fork: two tines joined at the bottom of a U, a stem and a foot; `shine` adds its twinkle. */
function drawFork(p: Pixels, k: Kit, shine: boolean): Pixels {
  const { c } = k;
  const ink = c('ink', 0);
  const lo = c('metal', 3);
  const hi = c('metal', 5);
  p.rect(5, 2, 3, 8, ink).rect(12, 2, 3, 8, ink).rect(5, 8, 10, 4, ink).rect(8, 11, 4, 8, ink);
  p.rect(6, 2, 1, 7, hi).rect(13, 2, 1, 7, lo).rect(7, 9, 6, 2, lo).rect(9, 11, 2, 7, hi).rect(8, 8, 4, 1, c('metal', 4));
  p.rect(7, 2, 1, 6, ink).rect(12, 2, 1, 6, ink);
  p.rect(9, 17, 2, 1, lo);
  if (shine) p.rect(2, 3, 3, 1, c('cloud', 2)).rect(3, 2, 1, 3, c('cloud', 2)).rect(15, 12, 2, 1, c('cloud', 2));
  return p;
}

/** A passable block with a few glints on `back`: the tell that a nook is near. */
export function glint(k: Kit, back: string, name = `${back}.glint`): string {
  const { c } = k;
  const p = k.pic(back);
  p.rect(4, 5, 3, 1, c('cloud', 2)).rect(5, 4, 1, 3, c('cloud', 2)).set(14, 13, c('cloud', 2)).set(13, 13, c('cloud', 1)).set(15, 13, c('cloud', 1));
  k.book.add(name, p, AIR);
  return name;
}

/** The fork over `back`: it twinkles, and a touch takes it (a tune, 250 points, one more fork). */
export function addFork(k: Kit, back: string): void {
  const hit = { ...AIR, effect: CTR.forks, eamt: 1, score: 250, touch: 'fork.pop', ntime: 12 };
  // taken: its 250 pops up over the wall for a moment
  k.book.add('fork.pop', drawPoints(k, k.pic(back), 250, 4), { ...AIR, ntime: POP_TICKS, next: back });
  k.book.add('fork', drawFork(k.pic(back), k, false), { ...hit, next: 'fork.1' });
  k.book.add('fork.1', drawFork(k.pic(back), k, true), { ...hit, next: 'fork' });
}
