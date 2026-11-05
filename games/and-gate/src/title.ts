// BOTH TOGETHER's own title picture: the circuit-board look (Wiring and Puzzles), Kit on the left,
// two dials and a spark on a copper wire over his head, a lit lamp at its end and the door at the right.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title: the name, a ribbon, Kit, a wire with two green dials, a spark and a lit lamp, and the door on a green circuit board. */
export function titlePicture(pal: Pal, book: Book, mb: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
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
  // a copper wire across, with a dial, a spark, a second dial and the lit lamp on it
  const copper = pal.c('orange', 3);
  p.rect(100, 84, 124, 4, pal.c('ink', 0)).rect(100, 85, 124, 2, copper);
  const put = (pic: Pixels, x: number, y: number) => scaleBlit(p, pic, x, y, 2);
  put(mb.pics.get('dialOn0')!, 104, 68);
  put(mb.pics.get('spark0')!, 138, 66);
  put(mb.pics.get('dialOn0')!, 168, 68);
  put(mb.pics.get('light0')!, 212, 62);
  scaleBlit(p, door, 268, 160 - 80, 2);
  frameOf(p, pal, 'circuit');
  return p;
}
