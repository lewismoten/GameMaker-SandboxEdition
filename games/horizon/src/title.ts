// TO THE HORIZON's own title picture: the road itself, with a ball at each of its four sizes
// coming down the left lane, and Kit cheering on the near road.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { drawScene } from './scene';
import { laneX } from './view';

/** The title: the name over the sky, a ribbon, then the road with its balls and the hero. */
export function titlePicture(pal: Pal, mb: Book, hero: Pixels, name: string, tagline: string): Pixels {
  const p = drawScene(pal);
  outlined(p, Math.round((W - textWidth(name, 2)) / 2), 8, name, pal.c('gold', 4), pal.c('ink', 0), 2, pal.c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 34, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 38, tagline, pal.c('ink', 0));
  // one ball at each size, down the left lane (a sprite's feet sit on its row 6, 11, 16 or 19)
  [74, 98, 128, 168].forEach((feet, i) => {
    const bottom = [6, 11, 16, 19][i];
    scaleBlit(p, mb.pics.get(`ball${i}`)!, Math.round(laneX(-1, feet)) - 10, feet - bottom - 1, 1);
  });
  scaleBlit(p, hero, 200, 200 - 80, 2);
  return p;
}
