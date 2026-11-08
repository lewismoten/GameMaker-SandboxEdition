// Hale's Orchard's windfall, as a 20x20 woodcut block: a red apple with a stalk and one leaf, lying in the grass.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../../kit/starter/palette';
import { clear, inked } from './land';

export function apple(pal: Pal): Pixels {
  const p = clear(pal);
  const r = pal.r('red');
  const w = pal.r('wood');
  const g = pal.r('grass');
  p.disc(8, 13, 4, r[3]).disc(12, 13, 4, r[3]).rect(6, 11, 8, 6, r[3]);
  p.rect(6, 11, 3, 2, r[4]).set(6, 13, r[4]);
  p.rect(12, 15, 3, 2, r[2]).rect(9, 17, 3, 1, r[2]);
  p.rect(10, 8, 1, 4, w[1]).rect(11, 7, 3, 2, g[2]).set(14, 7, g[3]);
  return inked(pal, p);
}
