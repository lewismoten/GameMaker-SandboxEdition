// SOUND BOARD's own title picture, in the Telling a Story look (the kit's stage with curtains): Kit,
// three pads with a picture of each one's sound above it, and the exit door.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { Book } from '../../kit/starter/book';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title in the Telling a Story look: the name, a ribbon, then Kit, three notes floating and the door. */
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
  // three pads, each with a picture of its sound above it
  ['pad.chime', 'pad.coin', 'pad.blip'].forEach((name, i) => {
    const clear = (b: string) => book.pics.get(b)!.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));
    scaleBlit(p, clear(['wave.0', 'wave.2', 'wave.7'][i]), 100 + i * 44, 68, 2);
    scaleBlit(p, clear(name), 100 + i * 44, 110, 2);
  });
  scaleBlit(p, door, 236, 160 - 80, 2);
  frameOf(p, pal, 'stage');
  return p;
}
