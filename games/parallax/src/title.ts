// PARALLAX's own title picture: the land of level 1 with its three bands, a sky banner and
// Rima cheering on the path. The bands are drawn in the same colors the levels use.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { CLEAR, backOf, layerOf, stillCell, type BandName } from './scene';
import { FENCE, HILLS, TOWN, type Band } from './view';

/** The whole screen of level 1 on a 320x200 picture, the bands drawn a little apart from their rest position so the title is not just the level. */
function land(pal: Pal): Pixels {
  const p = new Pixels(320, 200, 0);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) p.blit(stillCell(pal, y), x * 20, y * 20, CLEAR);
  const bands: [BandName, Band, number][] = [
    ['hills', HILLS, 6],
    ['town', TOWN, 0],
    ['fence', FENCE, 8],
  ];
  for (const [name, b, dx] of bands)
    for (let x = 0; x < 16; x++) {
      const cell = new Pixels(20, 20, 0);
      cell.px.set(backOf(pal, name).px);
      const layer = layerOf(pal, name);
      for (let yy = 0; yy < 20; yy++)
        for (let xx = 0; xx < 20; xx++) if (layer.get((xx + dx) % 20, yy) !== CLEAR) cell.set(xx, yy, layer.get((xx + dx) % 20, yy));
      p.blit(cell, x * 20, b.row * 20, CLEAR);
    }
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
  scaleBlit(p, hero, 200, 108, 2);
  return p;
}
