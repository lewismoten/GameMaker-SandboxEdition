// DON'T GET SEEN's light: a friendly lamp that hangs from a rail and looks around, and the cone of pale
// light under it, drawn as two blocks that widen toward the floor. Each is 20 by 20 in two frames
// (the lamp's eye looks one way, then the other; the light's stripes slide). The light is pale blue-white,
// like a searchlight, and stops at the bottom of the cone.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** How many blocks of cone hang under the lamp. */
export const CONE = 2;

/** The lamp: a clip on the rail, a round stone body with two eyes that glance left, then right, and a smile, and a bright lens underneath where the light comes out. */
export function drawLamp(pal: Pal, look: 0 | 1): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  p.rect(7, 0, 6, 4, c('stone', 2));
  p.rect(9, 3, 2, 2, c('ink', 1));
  blob(p, 10, 10, 8.4, 5.6, r('stone'), 0, 4);
  for (const x of [6, 12]) {
    p.rect(x, 7, 3, 3, c('white', 3));
    p.rect(x + (look ? 1 : 0), 8, 2, 2, c('ink', 0));
  }
  p.set(7, 12, c('ink', 0)).set(8, 13, c('ink', 0)).set(9, 13, c('ink', 0)).set(10, 13, c('ink', 0)).set(11, 13, c('ink', 0)).set(12, 12, c('ink', 0));
  p.rect(5, 15, 10, 3, c('stone', 1)).rect(6, 16, 8, 2, c('white', 3)).rect(7, 18, 6, 1, c('sky', 5));
  return outline(p, c('ink', 0), { transparent: T });
}

/** Piece `i` (0 at the top) of the cone: the light is narrow under the lamp and as wide as the block at the bottom. */
export function drawCone(pal: Pal, i: number, slide: 0 | 1): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const wAt = (y: number) => 8 + ((i * 20 + y) / (CONE * 20)) * 12; // 8 px wide at the lamp, 20 at the floor
  for (let y = 0; y < 20; y++) {
    const w = wAt(y);
    const x0 = Math.round(10 - w / 2);
    const x1 = Math.round(10 + w / 2) - 1;
    for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1;
      const stripe = (x + y * 2 + slide * 3) % 7 < 2;
      p.set(x, y, edge ? c('sky', 5) : stripe ? c('white', 2) : c('white', 3));
    }
  }
  // a few glints
  const g = slide ? [[7, 6]] : [[12, 12]];
  for (const [x, y] of g) p.set(x, y, c('sky', 5));
  return p;
}
