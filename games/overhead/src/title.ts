// OVERHEAD's own title picture, in the Bigger Worlds look (the kit's atlas): an old map page with Kit from above on a
// patch of lawn, and a small map of four areas joined in a ring by their roads.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title in the atlas look: the name, a ribbon, Kit from above on the lawn, and a ring of four areas on the page. */
export function titlePicture(pal: Pal, above: Pixels, name: string, tagline: string): Pixels {
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
  // the map: four areas in a ring, each its own color, joined by roads
  const mx = 140;
  const my = 82;
  const rw = 56;
  const rh = 32;
  const areas: [number, number, string][] = [
    [0, 0, 'green'],
    [1, 0, 'orange'],
    [0, 1, 'grass'],
    [1, 1, 'blue'],
  ];
  const road = c('dirt', 3);
  p.rect(mx - 4, my - 4, 2 * rw + 14, 2 * rh + 14, c('parch', 4)).frame(mx - 4, my - 4, 2 * rw + 14, 2 * rh + 14, c('wood', 1));
  for (const [cx, cy, ramp] of areas) {
    const x = mx + cx * (rw + 6);
    const y = my + cy * (rh + 6);
    p.rect(x, y, rw, rh, c(ramp, 2)).frame(x, y, rw, rh, c(ramp, 0)).rect(x + 1, y + 1, rw - 2, 2, c(ramp, 4));
  }
  p.rect(mx + rw - 4, my + rh / 2 - 2, 14, 4, road).rect(mx + rw - 4, my + rh + 6 + rh / 2 - 2, 14, 4, road);
  p.rect(mx + rw / 2 - 2, my + rh - 4, 4, 14, road).rect(mx + rw + 6 + rw / 2 - 2, my + rh - 4, 4, 14, road);
  scaleBlit(p, above, mx + 6, my + 6, 1);
  frameOf(p, pal, 'atlas');
  return p;
}
