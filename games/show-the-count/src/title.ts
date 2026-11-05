// SHOW THE COUNT's title picture: the circuit-board look (Wiring and Puzzles), Kit on the left, a row
// of bulbs (two lit, one dark) at head height, and the door at the right.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title: the name, a ribbon, Kit, a meter of bulbs and the door on a green circuit board. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'circuit');
  const p = backdrop(pal, 'circuit');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 40, 160 - 80, 2);
  const bulb = (n: string) => book.pics.get(n)!.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));
  ['bulbOn', 'bulbOn', 'bulbOff'].forEach((n, i) => scaleBlit(p, bulb(n), 118 + i * 34, 72, 2));
  scaleBlit(p, door, 236, 160 - 80, 2);
  frameOf(p, pal, 'circuit');
  return p;
}
