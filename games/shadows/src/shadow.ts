// THE SHADOW, the one trick of this game: a game has no see-through colors, so a shadow is pixels painted into the
// picture of the thing that casts it. It is drawn behind the thing, in the bottom rows of its 20x20 block, and a
// dithered one leaves every other pixel clear (color 255), so whatever is under the sprite shows through the holes.
import type { Pal } from '../../kit/starter/palette';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

const T = 255;

/** How a shadow is painted: not at all, one flat color, or a checkerboard that lets the ground show through. */
export type Shade = 'none' | 'solid' | 'dither';

/** The shadow's color: the Starters' ink, one step up from the outline's. */
export const shadowColor = (pal: Pal): number => pal.c('ink', 1);

/** A flat shadow `rx` pixels either side of the middle, four rows tall (rows 16 to 19), widest on row 18. Half a pixel wider counts. */
export function shadowLayer(kind: Shade, color: number, rx: number, h = 20): Pixels {
  const p = new Pixels(20, h, T);
  if (kind === 'none' || rx <= 0) return p;
  const y0 = h - 2;
  const WIDTH: Record<number, number> = { [-2]: 0.55, [-1]: 0.9, 0: 1, 1: 0.8 };
  for (let dy = -2; dy <= 1; dy++) {
    const half = Math.round(rx * WIDTH[dy] * 2) / 2;
    for (let x = Math.ceil(10 - half); x < Math.floor(10 + half); x++) {
      if (kind === 'dither' && (x + y0 + dy) % 2 !== 0) continue;
      p.set(x, y0 + dy, color);
    }
  }
  return p;
}

/** `body` with a shadow painted behind it (the body's own pixels win). `mark` paints the shadow in that color instead, for the manual's pictures. */
export function withShadow(body: Pixels, kind: Shade, pal: Pal, rx: number, mark?: number): Pixels {
  const out = shadowLayer(kind, mark ?? shadowColor(pal), rx, body.h);
  return out.blit(body, 0, 0, T);
}
