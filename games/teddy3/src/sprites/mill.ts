// The water wheels' paddles: the one coming up the near side, flat and wet (stand on it and
// ride it up), and the ones going round the rest of the wheel, seen edge-on and darker (they
// only pass by). Both on clear backgrounds, for monster blocks.
import { Pixels } from '../../../kit/pixels';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);

/** The rising paddle: a broad plank across the top of the block, banded, its spoke below. */
export function paddle(): Pixels {
  const p = new Pixels(20, 20, 255);
  p.rect(0, 0, 20, 6, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 5, 20, 1, c('ink', 0));
  p.rect(4, 1, 1, 4, c('metal', 2)).rect(15, 1, 1, 4, c('metal', 2));
  for (const x of [2, 9, 17]) p.set(x, 6, c('water', 3));
  p.rect(8, 6, 4, 14, c('wood', 1)).rect(8, 6, 1, 14, c('wood', 2));
  return p;
}

/** A paddle going round the back of the wheel, edge-on: a dark plank on its spoke. */
export function paddleBack(upright: boolean): Pixels {
  const p = new Pixels(20, 20, 255);
  if (upright) p.rect(7, 0, 6, 20, c('wood', 1)).rect(7, 0, 1, 20, c('wood', 2)).rect(12, 0, 1, 20, c('ink', 0));
  else p.rect(0, 7, 20, 6, c('wood', 1)).rect(0, 7, 20, 1, c('wood', 2)).rect(0, 12, 20, 1, c('ink', 0));
  return p;
}
