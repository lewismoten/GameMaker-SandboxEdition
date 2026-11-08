// WALKING VERY FAR's own title picture, in the Bigger Worlds look (the kit's atlas): two little framed views of the
// same hills on an old map page, one with Lian up close and one with Lian a tiny figure on the path, and an arrow.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { landscapePicture } from './art';
import { tinyPose } from './tinyKit';

const PW = 116;
const PH = 70;

/** One view, `PW` x `PH`: the hills, a path along the bottom and Lian on it (big, or a tiny figure). */
function view(pal: Pal, hero: Pixels | undefined): Pixels {
  const p = landscapePicture(pal).crop(100, 50, PW, PH);
  p.rect(0, PH - 4, PW, 2, pal.c('parch', 2)).rect(0, PH - 2, PW, 2, pal.c('grass', 2));
  if (hero) scaleBlit(p, hero, 30, PH - 4 - 40, 1);
  else p.blit(tinyPose(pal, 'stand').crop(8, 12, 4, 8), 56, PH - 4 - 8, 255);
  return p;
}

/** The title in the atlas look: the name, a ribbon, then a near view and a far view with an arrow between. */
export function titlePicture(pal: Pal, hero: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'atlas');
  const p = backdrop(pal, 'atlas');
  const c = pal.c;
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  const y = 80;
  const nx = 24;
  const fx = W - 24 - PW;
  for (const [x, v] of [
    [nx, view(pal, hero)],
    [fx, view(pal, undefined)],
  ] as const) {
    p.rect(x - 4, y - 4, PW + 8, PH + 8, c('parch', 4)).frame(x - 4, y - 4, PW + 8, PH + 8, c('wood', 1));
    p.blit(v, x, y);
  }
  for (const [x, word] of [
    [nx, 'CLOSE'],
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
