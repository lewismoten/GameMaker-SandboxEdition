// COLOR DOORS' title picture: Kit and a row of five doors, each with a bar of swatches over it, under the name.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { SWATCHES } from './colorBlocks';

/** The title: the name, a ribbon, five doors across the floor and a stripe of the eight swatches over them, Kit at the left. */
export function titlePicture(pal: Pal, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'breeze');
  const p = backdrop(pal, 'breeze');
  outlined(p, Math.round((W - textWidth(name, 3)) / 2), 14, name, look.fill, look.outline, 3, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  // the eight swatches in a row, then five doors
  SWATCHES.forEach((s, i) => {
    const x = 40 + i * 30;
    p.rect(x - 1, 78, 28, 20, pal.c('ink', 0)).rect(x, 79, 26, 18, pal.c(`sw-${s.word}`, 0));
  });
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 40 - 30, 160 - 80, 2);
  for (let i = 0; i < 5; i++) scaleBlit(p, door, 100 + i * 44, 160 - 80, 2);
  frameOf(p, pal, 'breeze');
  return p;
}
