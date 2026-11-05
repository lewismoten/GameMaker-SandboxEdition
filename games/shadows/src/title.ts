// LITTLE SHADOWS' title picture: the name over a stage floor, with Kit and a pip each on a dithered shadow, and a bee high up over its own.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** `hero` is Kit with his dithered shadow; `pip`, `bee` and `shade` are 20x20 critter pictures. Everyone stands on the ground line (y 160) with their shadow just under it. */
export function titlePicture(pal: Pal, hero: Pixels, pip: Pixels, bee: Pixels, shade: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'stage');
  const p = backdrop(pal, 'stage');
  const size = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, size)) / 2), 14, name, look.fill, look.outline, size, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  const ground = 168;
  scaleBlit(p, hero, 46, ground - 80, 2);
  scaleBlit(p, pip, 120, ground - 40, 2);
  scaleBlit(p, shade, 220, ground - 40, 2);
  scaleBlit(p, bee, 220, ground - 40 - 56, 2);
  frameOf(p, pal, 'stage');
  return p;
}
