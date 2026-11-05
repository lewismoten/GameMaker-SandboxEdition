// SLOW COMPUTERS's own title picture, in the Putting It Together look (a blueprint over a wooden
// bench, kit/starter/titleStyles.ts): the hero beside a short pad and a long pad.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { pad } from './props';

/** The title: the name, a ribbon, then the hero beside the two sound pads on the bench. */
export function titlePicture(pal: Pal, hero: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'workbench');
  const p = backdrop(pal, 'workbench');
  const size = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, size)) / 2), 14, name, look.fill, look.outline, size, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 40, 160 - 80 - 4, 2);
  // the two pads on the bench (each drawn four times as big): a short one and a long one
  const sky = pal.c('sky', 3);
  const bare = (kind: 'short' | 'long') => pad(pal, kind, false).map((_x, _y, col) => (col === sky ? 255 : col));
  scaleBlit(p, bare('short'), 124, 100, 3);
  scaleBlit(p, bare('long'), 200, 100, 3);
  frameOf(p, pal, 'workbench');
  return p;
}
