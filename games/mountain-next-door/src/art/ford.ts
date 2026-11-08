// The ford's wave in THE FORD, as 20x20 blocks: a swell of river standing one block above the surface (it carries Tess
// along, left or right, like the gusts on the ridge), and the stone stairs out of the water.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../../kit/starter/palette';
import { clear } from './land';

/** The swell: water a few pixels deep with a foam crest and chevrons showing the way it runs (`dir` 1 right, -1 left), three frames. */
export function swell(pal: Pal, dir: 1 | -1, frame: number): Pixels {
  const p = clear(pal);
  const w = pal.r('water');
  const f = pal.r('fog');
  p.rect(0, 9, 20, 11, w[2]).rect(0, 9, 20, 1, w[3]);
  for (let x = 0; x < 20; x++) {
    const crest = 5 + Math.round(2 * Math.sin(((x + frame * 6) / 20) * Math.PI * 2));
    p.rect(x, crest, 1, 9 - crest, w[3])
      .set(x, crest, f[3])
      .set(x, crest + 1, f[2]);
  }
  for (let k = 0; k < 2; k++) {
    const x0 = (frame * 5 + k * 10) % 20;
    for (let d = 0; d < 3; d++) {
      const x = x0 - d;
      if (x >= 0 && x < 20) p.set(x, 13 + d, w[4]).set(x, 17 - d, w[4]);
    }
  }
  return dir > 0 ? p : p.flipX();
}

/** Stairs out of the river: a block of the bank's own stone with a ripple along the bottom. */
export function bankStep(pal: Pal): Pixels {
  const p = clear(pal);
  const s = pal.r('stone');
  const w = pal.r('water');
  p.rect(0, 0, 20, 20, s[1]).rect(0, 0, 20, 3, s[3]);
  for (let x = 0; x < 20; x += 6) p.rect(x, 7, 3, 1, s[0]).rect(x + 2, 13, 3, 1, s[0]);
  p.rect(0, 16, 20, 4, w[2]).rect(0, 16, 20, 1, w[4]);
  return p;
}
