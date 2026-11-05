// ROOMS ON ONE MAP's own title picture, in the Bigger Worlds look (the kit's atlas): an old map page with Kit
// beside a door, and a small map of four colored rooms with a dotted route from one to the next.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title in the atlas look: the name, a ribbon, then Kit by a door, and a map of four rooms pinned on the page. */
export function titlePicture(pal: Pal, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'atlas');
  const p = backdrop(pal, 'atlas');
  const c = pal.c;
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  p.rect(36, 158, 32, 3, look.floorShadow).rect(246, 158, 40, 3, look.floorShadow);
  // the map: four rooms, each in its color, with a dotted route red -> blue -> green -> gold
  const mx = 108;
  const my = 82;
  const rw = 44;
  const rh = 28;
  const rooms: [number, number, string][] = [
    [0, 0, 'red'],
    [1, 0, 'blue'],
    [0, 1, 'green'],
    [1, 1, 'gold'],
  ];
  p.rect(mx - 4, my - 4, 2 * rw + 12, 2 * rh + 12, c('parch', 4)).frame(mx - 4, my - 4, 2 * rw + 12, 2 * rh + 12, c('wood', 1));
  for (const [cx, cy, ramp] of rooms) {
    const x = mx + cx * (rw + 4);
    const y = my + cy * (rh + 4);
    p.rect(x, y, rw, rh, c(ramp, 2)).frame(x, y, rw, rh, c(ramp, 0)).rect(x + 1, y + 1, rw - 2, 2, c(ramp, 4));
    p.rect(x + rw - 12, y + rh - 14, 5, 12, c('wood', 2)); // a door
  }
  const dots = (x0: number, y0: number, x1: number, y1: number) => {
    for (let k = 0; k <= 6; k++) p.rect(Math.round(x0 + ((x1 - x0) * k) / 6), Math.round(y0 + ((y1 - y0) * k) / 6), 2, 2, c('ink', 0));
  };
  dots(mx + rw - 10, my + 14, mx + rw + 14, my + 14);
  dots(mx + rw + 14, my + 14, mx + 14, my + rh + 18);
  dots(mx + 14, my + rh + 18, mx + rw + 14, my + rh + 18);
  scaleBlit(p, hero, 30, 160 - 80, 2);
  scaleBlit(p, door, 250, 160 - 80, 2);
  frameOf(p, pal, 'atlas');
  return p;
}
