// ROLL THE DICE's own title picture, in the Wiring and Puzzles look (a green circuit
// board, kit/starter/titleStyles.ts): the hero beside three dice on the board.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { face } from './props';

/** The title: the name, a ribbon, then the hero beside three dice on the board. */
export function titlePicture(pal: Pal, hero: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'circuit');
  const p = backdrop(pal, 'circuit');
  const size = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, size)) / 2), 14, name, look.fill, look.outline, size, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 40, 160 - 80 - 4, 2);
  // three dice (each 20x20, drawn twice as big) side by side on the board, showing 3, 6 and 4
  [3, 6, 4].forEach((n, i) => {
    scaleBlit(p, face(pal, n, false), 126 + i * 58, 110, 2);
  });
  frameOf(p, pal, 'circuit');
  return p;
}
