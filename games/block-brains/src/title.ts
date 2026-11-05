// ROLL THE DICE's own title picture, in the Putting It Together look (a blueprint over a
// wooden bench, kit/starter/titleStyles.ts): the hero beside three gates, one open and two shut.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { gate } from './props';

/** The title: the name, a ribbon, then the hero beside three gates on the bench. */
export function titlePicture(pal: Pal, hero: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'workbench');
  const p = backdrop(pal, 'workbench');
  const size = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, size)) / 2), 14, name, look.fill, look.outline, size, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 40, 160 - 80 - 4, 2);
  // three gates (each 20x40: two cells high, drawn twice as big) side by side on the bench: the middle one is open
  (['gold', 'blue', 'red'] as const).forEach((hue, i) => {
    const g = new Pixels(20, 40, pal.c('sky', 3));
    for (let y = 0; y < 2; y++) g.blit(gate(pal, hue, i !== 1), 0, y * 20);
    scaleBlit(p, g, 126 + i * 58, 80, 2);
  });
  frameOf(p, pal, 'workbench');
  return p;
}
