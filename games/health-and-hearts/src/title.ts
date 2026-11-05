// HEALTH AND HEARTS's own title picture, in the Moving and Pushing look (the kit's sunset): Kit, three hearts
// floating in a row and the exit door.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { Book } from '../../kit/starter/book';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title in the Moving and Pushing look (a sunset): the name, a ribbon, then Kit, three hearts floating and the door. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'sunset');
  const p = backdrop(pal, 'sunset');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 40, 160 - 80 - 4, 2);
  const heart = book.pics.get('heart')!.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));
  for (let i = 0; i < 3; i++) scaleBlit(p, heart, 112 + i * 36, 160 - 76 - (i === 1 ? 10 : 0), 2);
  scaleBlit(p, door, 236, 160 - 80, 2);
  frameOf(p, pal, 'sunset');
  return p;
}
