// THE SHOW's own title picture, in the Showcase Tricks look (the kit's neon): a little stage with its
// curtains and valance, Pip and Blu on it saying HI to each other, and Kit and the door on either side.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title in the neon look: the name, a ribbon, then the stage with its actors, Kit and the door. */
export function titlePicture(pal: Pal, mb: Book, book: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'neon');
  const p = backdrop(pal, 'neon');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  const put = (pic: Pixels, x: number, y: number, scale: number) => scaleBlit(p, pic, x, y, scale);
  p.rect(36, 158, 32, 3, look.floorShadow).rect(252, 158, 40, 3, look.floorShadow);
  put(hero, 30, 160 - 80, 2);
  // the stage: a curtain on each side and the valance across, each block drawn at twice its size
  const clear = (b: Pixels) => b.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));
  const valance = clear(book.pics.get('valance')!);
  const curtain = book.pics.get('curtain')!;
  const left = 88;
  const right = 248;
  for (let x = left; x <= right; x += 40) put(valance, x, 80, 2);
  for (const x of [left, right]) put(curtain, x, 120, 2);
  p.rect(left, 160, right - left + 40, 4, pal.c('wood', 1)).rect(left, 160, right - left + 40, 2, pal.c('wood', 3));
  put(mb.pics.get('pipsays')!, left + 48, 120, 2);
  put(mb.pics.get('blusays')!, right - 48, 120, 2);
  put(door, 288, 160 - 40, 1);
  frameOf(p, pal, 'neon');
  return p;
}
