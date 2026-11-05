// BEAMS AND FOG's title picture: the name over a dark stage, a dithered beam falling on Kit, and a lantern with a checkerboard halo.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { painted } from './light';

/** `hero` is Kit; `critters` holds the lanterns and the puff. A beam of dots falls on Kit; a lantern and a puff of fog float beside him. */
export function titlePicture(pal: Pal, hero: Pixels, critters: Book, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'stage');
  const p = backdrop(pal, 'stage');
  const size = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, size)) / 2), 14, name, look.fill, look.outline, size, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  const ground = 168;
  // the beam: a trapezoid of dots on the stage, from the top of the picture down to Kit's feet
  const light = pal.c('gold', 4);
  for (let y = 70; y < ground; y++) {
    const half = 12 + (y - 70) * 0.28;
    for (let x = Math.ceil(78 - half); x <= 78 + half; x++) if (painted(Math.abs(x - 78) > half - 8 ? 25 : 50, x, y)) p.set(x, y, light);
  }
  scaleBlit(p, hero, 46, ground - 80, 2);
  scaleBlit(p, critters.pics.get('lamp.soft')!, 190, ground - 90, 3);
  scaleBlit(p, critters.pics.get('puff')!, 232, ground - 50, 3);
  frameOf(p, pal, 'stage');
  return p;
}
