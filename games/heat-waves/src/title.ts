// HEAT WAVES' own title picture: the noon desert of the levels (the sky, the far hills, the sand and
// the road), the name over the sky on a ribbon, and Kit cheering on the road. The hills are drawn
// with each row moved a pixel or two, as the wobble has them part way through.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { bandCell, bandPicture, stillCell } from './scene';
import { HAZE_ROWS } from './view';

/** The whole screen of the desert on a 320x200 picture. */
function land(pal: Pal): Pixels {
  const p = new Pixels(320, 200, 0);
  const band = bandPicture(pal);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) p.blit(stillCell(pal, y, x), x * 20, y * 20, 255);
  HAZE_ROWS.forEach((y, r) => {
    for (let x = 0; x < 16; x++) p.blit(bandCell(band, r, x % 4, [-1, 1, 2][r]), x * 20, y * 20, 255);
  });
  return p;
}

/** The title: the name over the sky, a ribbon, then the land and the hero. */
export function titlePicture(pal: Pal, hero: Pixels, name: string, tagline: string): Pixels {
  const p = land(pal);
  outlined(p, Math.round((W - textWidth(name, 2)) / 2), 8, name, pal.c('gold', 4), pal.c('ink', 0), 2, pal.c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 34, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 38, tagline, pal.c('ink', 0));
  scaleBlit(p, hero, 200, 104, 2);
  return p;
}
