// The Bakehouse's way out: the black iron range's skirt and the gap under it, too low for
// Doc Leo, where the molasses jug rolled in 1777 (it is still rolling: molasses has never
// been in a hurry). Stepping up to it sends in Sir Reginald Cluckington III (game.ts).
import { Pixels } from '../../../kit/pixels';
import { c } from '../art/pal';
import { on } from '../art/kit';
import type { BlockSet } from './sets';

function stoveGap(fl: Pixels): Pixels {
  const p = on(fl);
  // the range's iron skirt, riveted, on two stubby legs
  p.rect(0, 0, 20, 9, c('ink', 0)).rect(0, 0, 20, 8, c('metal', 1)).rect(0, 0, 20, 1, c('metal', 2));
  for (const x of [3, 8, 13, 17]) p.set(x, 4, c('metal', 3));
  p.rect(0, 9, 3, 7, c('metal', 1)).rect(17, 9, 3, 7, c('metal', 1)).rect(0, 15, 4, 1, c('metal', 2)).rect(16, 15, 4, 1, c('metal', 2));
  // the dark underneath, and a glint of the jug far back in it
  p.rect(3, 9, 14, 7, c('dark', 0)).rect(3, 9, 14, 1, c('ink', 0));
  p.rect(9, 11, 3, 3, c('rootbeer', 1)).set(10, 11, c('rootbeer', 3)).set(9, 12, c('paper', 3));
  // something has been dragged out of there before: scuffs in the dust
  p.rect(5, 17, 10, 1, c('floor', 2)).rect(7, 18, 6, 1, c('floor', 2));
  return p;
}

export function addStoveGap(t: BlockSet, fl: Pixels): void {
  t.add('stoveGap', stoveGap(fl));
}
