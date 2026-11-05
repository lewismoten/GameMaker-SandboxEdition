// ROAD TILES' own title picture, in the Bigger Worlds look (the kit's atlas): an old map page with Kit from above on a
// patch of lawn, and a sheet of its own road blocks.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title in the atlas look: the name, a ribbon, Kit from above on the lawn, and a sheet of the game's road blocks on the page. */
export function titlePicture(pal: Pal, above: Pixels, name: string, tagline: string, pieces: Pixels[]): Pixels {
  const look = lookOf(pal, 'atlas');
  const p = backdrop(pal, 'atlas');
  const c = pal.c;
  outlined(p, Math.round((W - textWidth(name, 3)) / 2), 14, name, look.fill, look.outline, 3, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  // Kit from above on a patch of lawn, big
  bevel(p, 28, 92, 72, 64, pal.r('grass'), 2, 2);
  scaleBlit(p, above, 44, 106, 2);
  // a tile sheet: eight of the game's own blocks, drawn twice as big, in two rows on an old page
  const x0 = 136;
  const y0 = 84;
  const cell = 41;
  p.rect(x0 - 5, y0 - 5, 4 * cell + 9, 2 * cell + 9, c('parch', 4)).frame(x0 - 5, y0 - 5, 4 * cell + 9, 2 * cell + 9, c('wood', 1));
  pieces.slice(0, 8).forEach((tile, i) => {
    const x = x0 + (i % 4) * cell;
    const y = y0 + Math.floor(i / 4) * cell;
    scaleBlit(p, tile, x, y, 2);
    p.frame(x - 1, y - 1, 42, 42, c('ink', 0));
  });
  frameOf(p, pal, 'atlas');
  return p;
}
