// QUICKSAND's own title picture, in the Worlds That Push Back look (the kit's breeze): the hero on a
// stepping stone, then a row of sand going from smooth to a swirl, left to right.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { STAGES, sandAt, stone } from './props';

/** The title: the name, a ribbon, then the hero on a stone beside sand at each stage of sinking. */
export function titlePicture(pal: Pal, hero: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'breeze');
  const p = backdrop(pal, 'breeze');
  const size = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, size)) / 2), 14, name, look.fill, look.outline, size, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  // the hero on a stone, then the sand's stages in a row, smooth to swirl
  scaleBlit(p, stone(pal), 40, 160, 2);
  scaleBlit(p, hero, 40, 160 - 80, 2);
  for (let i = 0; i < STAGES; i++) scaleBlit(p, sandAt(pal, 'sand', i), 120 + i * 40, 160, 2);
  frameOf(p, pal, 'breeze');
  return p;
}
