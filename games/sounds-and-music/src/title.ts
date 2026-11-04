// SOUNDS AND MUSIC's own title picture, in the Telling a Story look (the kit's stage with curtains): Kit,
// three musical notes floating in a row and the exit door.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline, scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { Book } from '../../kit/starter/book';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** A musical note (a beamed pair of eighths when `pair`, else a single one with a flag), 20 x 20, on clear sky. */
function note(pal: Pal, pair: boolean): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const g = pal.r('gold');
  const ink = pal.c('ink', 0);
  if (pair) {
    p.disc(5.5, 15, 3.2, g[4]).disc(14.5, 13, 3.2, g[4]);
    p.rect(8, 3, 2, 12, g[4]).rect(17, 1, 2, 12, g[4]).rect(8, 2, 11, 3, g[4]);
    p.rect(4, 13, 2, 1, g[5]).rect(13, 11, 2, 1, g[5]);
  } else {
    p.disc(7.5, 15.5, 3.6, g[4]);
    p.rect(10, 2, 2, 14, g[4]);
    for (let i = 0; i < 6; i++) p.rect(12 + i, 2 + i, 2, 3, g[4]);
    p.rect(6, 14, 2, 1, g[5]);
  }
  return outline(p, ink, { transparent: skyOf(pal) });
}

/** The title in the Telling a Story look: the name, a ribbon, then Kit, three notes floating and the door. */
export function titlePicture(pal: Pal, _book: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
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
  [false, true, false].forEach((pair, i) => scaleBlit(p, note(pal, pair).map((_x, _y, c) => (c === skyOf(pal) ? 255 : c)), 112 + i * 36, 160 - 76 - (i === 1 ? 10 : 0), 2));
  scaleBlit(p, door, 236, 160 - 80, 2);
  frameOf(p, pal, 'stage');
  return p;
}
