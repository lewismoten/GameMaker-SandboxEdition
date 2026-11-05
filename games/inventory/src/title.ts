// PICK IT UP's own title picture, in Game Feel's sunset look: the hero with a crate, a star and a flame on their stands
// in a row, the frosty grump they are for, a sparkle and the door beyond.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title: the name, a ribbon, then the hero, a crate, a star and a flame on their stands, the frosty grump and the door. */
export function titlePicture(pal: Pal, book: Book, mb: Book, _star: Pixels, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'sunset');
  const p = backdrop(pal, 'sunset');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  const put = (pic: Pixels, x: number, y: number, scale: number) => scaleBlit(p, pic, x, y, scale);
  // the things sit on the sky in the level; here they stand on the sunset
  const clear = (pic: Pixels) => pic.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));
  p.rect(44, 158, 32, 3, look.floorShadow);
  p.rect(84, 158, 128, 3, look.floorShadow);
  put(hero, 30, 160 - 80, 2);
  put(clear(book.pics.get('crate')!), 88, 160 - 40, 2);
  put(clear(book.pics.get('starItem')!), 128, 160 - 40, 2);
  put(clear(book.pics.get('flameItem')!), 168, 160 - 40, 2);
  put(mb.pics.get('frosty0')!, 206, 160 - 40, 2);
  put(mb.pics.get('twinkle0')!, 236, 160 - 70, 1);
  scaleBlit(p, door, 268, 160 - 80, 2);
  frameOf(p, pal, 'sunset');
  return p;
}
