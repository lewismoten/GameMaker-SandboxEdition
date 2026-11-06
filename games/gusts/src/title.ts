// GUSTS' own title picture, in the Worlds That Push Back look (the kit's breeze): Mia, a windsock streaming
// in the wind, and a shaft of air with a gust and leaves rising in it.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { pole, sock, updraft } from './props';

/** The title: the name, a ribbon, then Mia beside a windsock in a gust and a shaft of wind. */
export function titlePicture(pal: Pal, hero: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'breeze');
  const p = backdrop(pal, 'breeze');
  const size = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, size)) / 2), 14, name, look.fill, look.outline, size, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 40, 160 - 80 - 4, 2);
  // a windsock on its pole (streaming left), then two cells of updraft: fluttering leaves under a gust
  const mast = new Pixels(20, 40, pal.c('sky', 3)).blit(sock(pal, 'gust'), 0, 0).blit(pole(pal), 0, 20);
  scaleBlit(p, mast, 130, 80, 2);
  scaleBlit(p, new Pixels(20, 40, pal.c('sky', 3)).blit(updraft(pal, 'gust'), 0, 0).blit(updraft(pal, 'flutter'), 0, 20), 190, 80, 2);
  frameOf(p, pal, 'breeze');
  return p;
}
