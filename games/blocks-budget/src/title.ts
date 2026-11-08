// 150 BLOCKS' own title picture, in the Bigger Worlds look (the kit's atlas): an old page with Lena beside a
// door, and a little village of four houses on it, drawn from the game's own blocks with the count under them.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { HOUSE } from './pictures';

/** The title in the atlas look: the name, a ribbon, then Lena by a door, and four houses on the page. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'atlas');
  const p = backdrop(pal, 'atlas');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  p.rect(36, 158, 32, 3, look.floorShadow).rect(246, 158, 40, 3, look.floorShadow);
  // four houses, red and blue roofs in turn: the walls are the red house's, because the blue house reuses them
  const hx = 80;
  const hy = 114;
  for (let i = 0; i < 4; i++) {
    const roof = i % 2 === 0 ? 'red' : 'blue';
    for (let dy = 0; dy < HOUSE.h; dy++)
      for (let dx = 0; dx < HOUSE.w; dx++) {
        const tile = book.pics.get(`house.${roof}.${dx}${dy}`) ?? book.pics.get(`house.red.${dx}${dy}`);
        scaleBlit(
          p,
          tile!.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c)),
          hx + (i * HOUSE.w + dx) * 20,
          hy + dy * 20,
          1,
        );
      }
  }
  p.rect(hx, hy + 40, 160, 3, look.floorShadow);
  const note = '4 HOUSES, 6 BLOCKS';
  text(p, Math.round((W - textWidth(note)) / 2), 98, note, pal.c('ink', 0));
  scaleBlit(p, hero, 30, 160 - 80, 2);
  scaleBlit(p, door, 250, 160 - 80, 2);
  frameOf(p, pal, 'atlas');
  return p;
}
