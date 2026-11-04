// WATCH YOUR STEP's own title picture: the hero on the grass with spikes, a pool and the exit door
// ahead of him, and nothing floating or trailing from him (the kit's title arcs coins from the hero).
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import type { Book } from '../../kit/starter/book';
import { scene, W } from '../../kit/starter/screens';

/** The title: the name, a ribbon, then the hero, a patch of spikes, a pool and the door. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const p = scene(pal, book, 160);
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, pal.c('gold', 4), pal.c('ink', 0), s, pal.c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 54, tagline, pal.c('ink', 0));
  scaleBlit(p, hero, 30, 160 - 80, 2);
  for (let i = 0; i < 2; i++) scaleBlit(p, book.pics.get('spikeUp')!, 100 + i * 40, 160 - 40, 2);
  for (let i = 0; i < 2; i++) {
    scaleBlit(p, book.pics.get('waterTop')!, 190 + i * 40, 160 - 20, 2);
    scaleBlit(p, book.pics.get('water')!, 190 + i * 40, 160 + 20, 2);
  }
  scaleBlit(p, door, 276, 160 - 80, 2);
  return p;
}
