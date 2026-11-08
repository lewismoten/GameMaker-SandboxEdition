// Turning pictures a quarter turn clockwise, k times: the wall levels draw their ground, hedges and doors turned
// to face the hero, and the hero turned with them (src/hero.ts).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

/** `p` turned clockwise by `k` quarter turns (0 to 3); a quarter turn swaps its width and height. */
export function turn(p: Pixels, k: number): Pixels {
  let cur = p;
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) {
    const next = new Pixels(cur.h, cur.w);
    for (let y = 0; y < cur.h; y++) for (let x = 0; x < cur.w; x++) next.px[x * next.w + (cur.h - 1 - y)] = cur.px[y * cur.w + x];
    cur = next;
  }
  return cur;
}

/** A two-block tall picture (top block over bottom block) turned `k` quarter turns and cut back into its two
 *  blocks: `bottom` is the one next to the wall, `top` the one farther out. */
export function turnedPair(top: Pixels, bottom: Pixels, k: number): { top: Pixels; bottom: Pixels } {
  const whole = new Pixels(20, 40);
  whole.blit(top, 0, 0).blit(bottom, 0, 20);
  const t = turn(whole, k);
  switch (((k % 4) + 4) % 4) {
    case 0:
      return { top: t.crop(0, 0, 20, 20), bottom: t.crop(0, 20, 20, 20) };
    case 1:
      return { top: t.crop(20, 0, 20, 20), bottom: t.crop(0, 0, 20, 20) };
    case 2:
      return { top: t.crop(0, 20, 20, 20), bottom: t.crop(0, 0, 20, 20) };
    default:
      return { top: t.crop(0, 0, 20, 20), bottom: t.crop(20, 0, 20, 20) };
  }
}
