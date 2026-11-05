// The things Kit carries, as blocks (20 by 20, on the sky so they sit anywhere): a wooden crate that is a step
// (solid from above only), a star and a flame on a little round stand. Dropped, a block is the same picture again.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { drawFlame } from './flameArt';
import { drawStar } from './starArt';

/** A crate: planks with a brace across and a nail in each corner. It fills its block, so a stack of them is a stair. */
export function drawCrate(pal: Pal): Pixels {
  const w = pal.r('wood');
  const p = new Pixels(20, 20, skyOf(pal));
  p.rect(0, 0, 20, 20, w[2]).rect(0, 0, 20, 2, w[4]).rect(0, 18, 20, 2, w[0]);
  p.rect(0, 0, 2, 20, w[3]).rect(18, 0, 2, 20, w[1]);
  // the cross brace
  for (let i = 2; i < 18; i++) p.set(i, i, w[1]).set(19 - i, i, w[1]);
  for (const [x, y] of [
    [3, 3],
    [16, 3],
    [3, 16],
    [16, 16],
  ] as const)
    p.set(x, y, w[0]);
  return p;
}

/** A stand: a flat gray disc the item rests on. */
function stand(pal: Pal, p: Pixels): void {
  const s = pal.r('stone');
  p.rect(4, 17, 12, 2, s[2]).rect(5, 16, 10, 1, s[3]).rect(5, 19, 10, 1, s[1]);
}

/** The star or the flame on its stand. */
export function drawItem(pal: Pal, kind: 'star' | 'flame'): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  stand(pal, p);
  const pic = kind === 'star' ? drawStar(pal, 0) : drawFlame(pal, 0);
  p.blit(pic, 0, -1, 255);
  return p;
}
