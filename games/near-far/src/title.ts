// NEAR AND FAR's own title picture, in the Bigger Worlds look (the kit's atlas): two little framed views on an old
// map page, a near one with a big tree and Mara, and a far one with the same things small and pale, and an arrow.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { hazed } from './haze';
import { bigTreePicture, half } from './scenery';

const PW = 116;
const PH = 70;

/** One view, `PW` x `PH`: sky, ground, and a tree (big, or half the size). */
function view(pal: Pal, tree: Pixels, hero: Pixels | undefined, small: boolean): Pixels {
  const sky = pal.c('sky', 3);
  const g = pal.r('grass');
  const d = pal.r('dirt');
  const p = new Pixels(PW, PH, sky);
  const ground = PH - 14;
  p.disc(96, ground + 12, small ? 14 : 24, g[2]);
  p.rect(0, ground + 4, PW, 10, d[2])
    .rect(0, ground, PW, 4, g[3])
    .rect(0, ground, PW, 1, g[5]);
  p.blit(tree, 16, ground - tree.h + 2, 255);
  p.disc(92, 14, 6, pal.c('gold', 3));
  if (hero) scaleBlit(p, hero, 62, ground - 38, 1);
  else {
    // a small house in the distance, in the half-size style of the game
    p.rect(66, ground - 9, 16, 9, pal.c('parch', 3))
      .rect(64, ground - 14, 20, 5, pal.c('red', 2))
      .rect(72, ground - 6, 3, 6, pal.c('wood', 2));
  }
  return p;
}

/** The title in the atlas look: the name, a ribbon, then a near view and a far view with an arrow between. */
export function titlePicture(pal: Pal, hero: Pixels, haze: Uint8Array, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'atlas');
  const p = backdrop(pal, 'atlas');
  const c = pal.c;
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  const big = bigTreePicture(pal);
  const sky = pal.c('sky', 3);
  const small = half(big, sky);
  const near = view(
    pal,
    big.crop(0, 0, 40, 60).map((_x, _y, v) => (v === sky ? 255 : v)),
    hero,
    false,
  );
  const far = hazed(
    view(
      pal,
      small.map((_x, _y, v) => (v === sky ? 255 : v)),
      undefined,
      true,
    ),
    haze,
  );
  const y = 80;
  const nx = 24;
  const fx = W - 24 - PW;
  for (const [x, v] of [
    [nx, near],
    [fx, far],
  ] as const) {
    p.rect(x - 4, y - 4, PW + 8, PH + 8, c('parch', 4)).frame(x - 4, y - 4, PW + 8, PH + 8, c('wood', 1));
    p.blit(v, x, y);
  }
  for (const [x, word] of [
    [nx, 'NEAR'],
    [fx, 'FAR'],
  ] as const) {
    const w = textWidth(word) + 8;
    p.rect(x + 3, y + 3, w, 12, c('parch', 4)).frame(x + 3, y + 3, w, 12, c('wood', 1));
    text(p, x + 7, y + 6, word, c('ink', 0));
  }
  // an arrow from the near view to the far one
  const ax = nx + PW + 8;
  const ay = y + 20;
  const aw = fx - 8 - ax;
  p.rect(ax, ay - 2, aw - 6, 4, c('wood', 1));
  for (let k = 0; k < 6; k++) p.rect(ax + aw - 6 + k, ay - 6 + k, 1, 12 - 2 * k, c('wood', 1));
  frameOf(p, pal, 'atlas');
  return p;
}
