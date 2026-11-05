// UNDER THE HOOD's title picture: the neon look (Showcase Tricks), Lian on the left, the four bytes of
// "Play" in a row at head height, and the door at the right.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { PLAY_BYTES } from './hoodBlocks';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title: the name, a ribbon, Lian, the four bytes and the door on the neon backdrop. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
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
  PLAY_BYTES.forEach(([hex], i) => {
    const byte = book.pics.get(`b${hex}`)!.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));
    scaleBlit(p, byte, 90 + i * 35, 76, 2);
  });
  scaleBlit(p, door, 236, 160 - 80, 2);
  frameOf(p, pal, 'neon');
  return p;
}
