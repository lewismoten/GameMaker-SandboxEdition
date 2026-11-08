// The ridge's wind flag, as a 20x20 woodcut block: a post with a pennant that flies right, flies left or hangs
// still, and two little lamps at its foot that show how long the wind has left (both lit: plenty, one: it is about to
// change, none is never drawn). The flag is the ridge's clock; read it before you step into a gap.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../../kit/starter/palette';
import { clear, inked } from './land';

export function vane(pal: Pal, flies: 'right' | 'left' | 'still', lamps: 1 | 2): Pixels {
  const p = clear(pal);
  const w = pal.r('wood');
  const o = pal.r('orange');
  const wh = pal.r('white');
  p.rect(9, 3, 2, 17, w[2]).rect(9, 3, 1, 17, w[3]).rect(8, 2, 4, 2, w[3]);
  const flag = pal.c('red', 3);
  const edge = pal.c('red', 1);
  if (flies === 'still') {
    p.rect(11, 5, 4, 7, flag).rect(11, 11, 4, 1, edge).rect(14, 6, 1, 5, edge);
  } else {
    const dir = flies === 'right' ? 1 : -1;
    for (let k = 0; k < 8; k++) {
      const x = dir > 0 ? 11 + k : 8 - k;
      p.rect(x, 4 + (k > 5 ? 1 : 0), 1, 6 - Math.floor(k / 2), flag);
    }
    // streaks of wind behind the pennant
    const tail = dir > 0 ? [2, 6] : [14, 18];
    p.rect(tail[0], 3, 4, 1, wh[3]).rect(tail[0] + 1, 12, 5, 1, wh[3]).rect(tail[1] - 1, 8, 3, 1, wh[3]);
  }
  p.rect(5, 15, 10, 1, w[1]).rect(6, 16, 8, 4, w[2]);
  for (let k = 0; k < 2; k++) {
    const lit = k < lamps;
    p.rect(7 + k * 4, 17, 2, 2, lit ? o[3] : w[0]);
  }
  return inked(pal, p);
}
