// RIDE ALONG's title picture: the neon look (Showcase Tricks), the helper on the ground at the left, and the
// rocket (at the right, as the exit of level 1) rising above a little trail of stars.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { starSprite } from './rideBlocks';
import { rocket } from './shipArt';

/** The title: the name, a ribbon, the helper, four stars climbing and the rocket on the neon backdrop. */
export function titlePicture(pal: Pal, hero: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'neon');
  const p = backdrop(pal, 'neon');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 40, 160 - 80, 2);
  // a row of stars climbing from the helper to the rocket
  const star = starSprite(pal);
  for (let i = 0; i < 4; i++) scaleBlit(p, star, 98 + i * 30, 126 - i * 16, 1);
  scaleBlit(p, rocket(pal, true, 1), 226, 160 - 88, 2);
  frameOf(p, pal, 'neon');
  return p;
}
