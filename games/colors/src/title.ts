// COLORS THAT WORK's own title picture, in the Telling a Story look (the stage): Yana, a red plate, a green
// plate, a light striped plate and a spike, in a row on the floor, and the exit door.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { Book } from '../../kit/starter/book';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title in the stage look: the name, a ribbon, then Yana, four plates in a row and the door. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'stage');
  const p = backdrop(pal, 'stage');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 40, 160 - 80 - 4, 2);
  const clear = (n: string) => book.pics.get(n)!.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));
  ['plateHot', 'plateSafe', 'plateStripe', 'spikeRed'].forEach((n, i) => scaleBlit(p, clear(n), 100 + i * 40, 160 - 40, 2));
  scaleBlit(p, door, 268, 160 - 80, 2);
  frameOf(p, pal, 'stage');
  return p;
}
