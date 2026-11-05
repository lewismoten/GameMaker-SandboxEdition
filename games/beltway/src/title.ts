// ROUND AND ROUND's own title picture: the loop track in the sky with the car at four places on it
// (turned as it goes), the name over the sky, and Kit cheering on the lawn.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { orientIndex } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { drawLoop, lamp } from './scene';
import { CAR_AT, LAMPS, LOOP } from './view';

/** The car's picture turned to one of the engine's 8 orientations. */
function turned(car: Pixels, orient: number): Pixels {
  const out = car.crop(0, 0, 20, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) out.px[y * 20 + x] = car.px[orientIndex(orient, x, y)];
  return out;
}

/** The title: the track with its car at four places and three lamps lit, the name and a ribbon on the lawn, and the hero beside them. */
export function titlePicture(pal: Pal, mb: Book, hero: Pixels, name: string, tagline: string): Pixels {
  const p = drawLoop(pal);
  LAMPS.forEach(([x, y]) => p.blit(lamp(pal, true), x * 20, y * 20));
  // the car at the bottom, the right side, the top and the left side of the loop, each turned the way it faces there
  const car = mb.pics.get('car0')!;
  for (const i of [-1, 1, 3, 5]) {
    const [dx, dy, orient] = i < 0 ? [0, 0, 0] : LOOP[i];
    p.blit(turned(car, orient), (CAR_AT[0] + dx) * 20, (CAR_AT[1] + dy) * 20, 255);
  }
  outlined(p, Math.round((W - textWidth(name, 2)) / 2), 146, name, pal.c('gold', 4), pal.c('ink', 0), 2, pal.c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 168, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 172, tagline, pal.c('ink', 0));
  p.blit(hero, 10, 140, 255);
  return p;
}
