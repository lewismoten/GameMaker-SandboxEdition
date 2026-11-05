// MAPS IN MAPS's own title picture, in the Bigger Worlds look (the kit's atlas): an old map page with Kit from above on a
// patch of lawn, and three pictures of one trip: world, town and house.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title in the atlas look: the name, a ribbon, Kit from above on the lawn, and three pictures of a trip into a house. */
export function titlePicture(pal: Pal, above: Pixels, tiny: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'atlas');
  const p = backdrop(pal, 'atlas');
  const c = pal.c;
  outlined(p, Math.round((W - textWidth(name, 2)) / 2), 18, name, look.fill, look.outline, 2, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  // Kit from above on a patch of lawn, big
  bevel(p, 28, 92, 72, 64, pal.r('grass'), 2, 2);
  scaleBlit(p, above, 44, 106, 2);
  // three pictures of one trip, each a different scale: a world with a tiny town on it, the town's streets, a room
  const px = 120;
  const py = 92;
  const pw = 54;
  const ph = 44;
  const gap = 12;
  const frame = (i: number, base: number) => {
    const x = px + i * (pw + gap);
    p.rect(x - 2, py - 2, pw + 4, ph + 4, c('ink', 0)).rect(x, py, pw, ph, base);
    return x;
  };
  // 1: the world, a sea round a green country, the town one dot of roofs, Kit tiny
  let x = frame(0, c('blue', 2));
  p.rect(x + 6, py + 6, pw - 12, ph - 12, c('grass', 3)).rect(x + 6, py + ph - 9, pw - 12, 3, c('parch', 3));
  p.rect(x + 28, py + 12, 7, 4, c('ink', 0)).rect(x + 29, py + 13, 5, 2, c('red', 3)).rect(x + 29, py + 8, 1, 5, c('ink', 0));
  scaleBlit(p, tiny, x + 12, py + 20, 1);
  // 2: the town, streets and bigger roofs
  x = frame(1, c('grass', 3));
  p.rect(x + 22, py, 8, ph, c('dirt', 3)).rect(x, py + 26, pw, 7, c('dirt', 3));
  for (const [hx, hy, ramp] of [
    [x + 4, py + 5, 'brick'],
    [x + 36, py + 5, 'blue'],
    [x + 36, py + 34, 'orange'],
  ] as const)
    p.rect(hx, hy, 14, 10, c('ink', 0)).rect(hx + 1, hy + 1, 12, 5, c(ramp, 3)).rect(hx + 1, hy + 6, 12, 3, c('parch', 3)).rect(hx + 6, hy + 6, 3, 4, c('wood', 2));
  scaleBlit(p, above, x + 3, py + 18, 1);
  // 3: a room, floor, a bed and a rug, Kit large
  x = frame(2, c('wood', 3));
  for (let yy = 4; yy < ph; yy += 5) p.rect(x, py + yy, pw, 1, c('wood', 2));
  p.rect(x + 28, py + 12, 20, 18, c('red', 2)).frame(x + 28, py + 12, 20, 18, c('red', 0)).rect(x + 4, py + 5, 10, 22, c('green', 2)).frame(x + 4, py + 5, 10, 22, c('wood', 1));
  scaleBlit(p, above, x + 7, py + 2, 2);
  // the arrows between them
  for (const i of [0, 1]) {
    const ax = px + (i + 1) * (pw + gap) - gap + 1;
    p.rect(ax, py + 20, gap - 3, 2, c('white', 3)).rect(ax + gap - 5, py + 18, 2, 6, c('white', 3));
  }
  frameOf(p, pal, 'atlas');
  return p;
}
