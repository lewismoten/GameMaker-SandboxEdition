// Up on the mountain's back: wobbly rocks in a path (a slab up, half sunk, gone into the rock face, rising again),
// a ladder fixed to the rock (drawn on rock, not sky), and the summit's damp dent, the shape of something soft that
// sat there a long time.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { dither } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../../kit/starter/palette';
import { ledge, rock } from './land';

/** A wobbly rock in the path: a mossy slab up, half sunk into the face, or gone (only the rock face shows). */
export function scree(pal: Pal, how: 'up' | 'half' | 'under'): Pixels {
  const p = rock(pal, 21);
  const r = pal.r('rock');
  const m = pal.r('moss');
  if (how === 'up') {
    p.rect(1, 0, 18, 7, r[3]).rect(1, 0, 18, 2, m[3]).rect(2, 0, 16, 1, m[4]).rect(1, 7, 18, 1, r[0]);
    p.set(4, 4, r[1]).set(12, 3, r[1]).set(15, 5, r[4]);
  } else if (how === 'half') {
    p.rect(3, 5, 14, 5, r[2]).rect(3, 5, 14, 1, m[2]).rect(3, 10, 14, 1, r[0]);
  } else for (let x = 4; x < 16; x++) p.set(x, 6 + (x % 3), r[0]);
  return p;
}

/** A ladder bolted to the rock: the Starters' ladder with the rock behind it instead of sky. */
export function ladderOnRock(pal: Pal, ladder: Pixels, seed: number): Pixels {
  const p = rock(pal, seed);
  const sky = skyOf(pal);
  return p.map((x, y, c) => (ladder.get(x, y) === sky ? c : ladder.get(x, y)));
}

/** The summit's dent (`k` 0 .. 2, left to right): the mossy ledge pressed down in a soft, damp, cloud-shaped hollow, with dew on it. */
export function dent(pal: Pal, k: 0 | 1 | 2): Pixels {
  const p = ledge(pal, 30 + k);
  const m = pal.r('moss');
  const w = pal.r('water');
  return p.map((x, y, c) => {
    const gx = x + k * 20;
    // a cloud's lumpy outline: three soft bumps along the top of the hollow
    const bump = Math.max(0, Math.cos(((gx - 30) / 30) * Math.PI * 1.5)) * 2;
    const inside = ((gx - 30) / 28) ** 2 + ((y - 4) / (3.4 + bump)) ** 2;
    if (inside > 1) return c;
    if ((gx * 7 + y * 3) % 23 === 0) return w[4]; // dew
    return dither(x, y, 1 - inside) ? m[0] : m[1];
  });
}
