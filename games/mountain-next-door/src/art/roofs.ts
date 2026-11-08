// The town's rooftops at night, in the game's woodcut: a slate roof to walk on (ridge cap, hatched courses), the
// same roof with a chimney pot in it, a brick chimney stack, warm smoke puffing up on a clock (six pictures, then
// still air) and a little drift of Wisp's snow on the slates.
import { Pixels, dither } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../../kit/starter/palette';
import { inked } from './land';

const clear = (pal: Pal) => new Pixels(20, 20, skyOf(pal));

/** Slates: a ridge cap along the top, then courses of slate with staggered joints, hatched toward the eaves. */
export function slates(pal: Pal, seed: number): Pixels {
  const s = pal.r('stone');
  const p = new Pixels(20, 20, s[2]);
  p.rect(0, 0, 20, 3, s[4]).rect(0, 3, 20, 1, pal.c('ink', 0));
  for (let row = 0; row < 4; row++) {
    const y = 4 + row * 4;
    p.rect(0, y + 3, 20, 1, s[0]);
    for (let x = (row * 5 + seed) % 6; x < 20; x += 6) p.rect(x, y, 1, 3, s[1]);
    if (row > 1) for (let x = 0; x < 20; x++) if ((x + y) % 3 === 0) p.set(x, y + 1, s[1]);
  }
  return p;
}

/** The slates with a clay chimney pot set in them, its mouth dark. */
export function potSlates(pal: Pal): Pixels {
  const p = slates(pal, 2);
  const b = pal.r('brick');
  p.rect(6, 0, 8, 6, b[2]).rect(6, 0, 8, 1, b[4]).rect(5, 0, 10, 2, b[3]).rect(8, 0, 4, 1, pal.c('ink', 0));
  return p;
}

/** A brick chimney stack standing on the roof (solid: hop it). */
export function stack(pal: Pal): Pixels {
  const b = pal.r('brick');
  const p = clear(pal);
  p.rect(3, 4, 14, 16, b[2]).rect(2, 2, 16, 3, b[3]);
  for (let y = 7; y < 20; y += 4) {
    p.rect(3, y, 14, 1, b[0]);
    for (let x = 3 + ((y / 4) % 2) * 3; x < 17; x += 6) p.rect(x, y - 3, 1, 3, b[0]);
  }
  return inked(pal, p);
}

/** Warm smoke rising from a pot: frame `f` of six, or (`f` -1) the still air between puffs, only a faint haze. */
export function puff(pal: Pal, f: number): Pixels {
  const p = clear(pal);
  const fog = pal.r('fog');
  if (f < 0) {
    for (let y = 0; y < 20; y += 5) p.set(9 + (y % 3), y, pal.c('sky', 4));
    return p;
  }
  for (let k = 0; k < 3; k++) {
    const cy = 26 - ((f * 4 + k * 8) % 26) - 3;
    const cx = 10 + Math.round(Math.sin((cy + f) / 4) * 3);
    const r = 3 + k;
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++) {
        const d = Math.hypot(x - cx, y - cy) / r;
        if (d <= 1 && x >= 0 && x < 20 && y >= 0 && y < 20) p.set(x, y, d < 0.5 ? fog[3] : dither(x, y, 1 - d) ? fog[2] : p.get(x, y));
      }
  }
  return p;
}

/** A little drift of Wisp's snow on the slates' ridge, with a sparkle. */
export function drift(pal: Pal): Pixels {
  const p = clear(pal);
  const w = pal.r('white');
  p.rect(4, 16, 12, 4, w[2]).rect(6, 14, 8, 2, w[3]).rect(8, 13, 4, 1, w[3]);
  p.set(10, 9, w[3]).set(9, 10, w[3]).set(11, 10, w[3]).set(10, 11, w[3]);
  return inked(pal, p);
}
