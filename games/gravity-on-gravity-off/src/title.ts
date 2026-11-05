// GRAVITY ON, GRAVITY OFF's own title picture, in the Worlds That Push Back look (the kit's breeze): Rima from the side with a
// down arrow beside him, and Rima from above on a patch of lawn with an arrow on each side.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** A small arrow pointing `dir`, `n` pixels long, with its tip at (x, y). */
function arrow(p: Pixels, x: number, y: number, dir: 'up' | 'down' | 'left' | 'right', n: number, col: number): void {
  for (let i = 0; i < n; i++) {
    const w = i; // widens from the tip
    if (dir === 'down') p.rect(x - w, y - i, 2 * w + 1, 1, col);
    if (dir === 'up') p.rect(x - w, y + i, 2 * w + 1, 1, col);
    if (dir === 'right') p.rect(x - i, y - w, 1, 2 * w + 1, col);
    if (dir === 'left') p.rect(x + i, y - w, 1, 2 * w + 1, col);
  }
}

/** The title: the name on two lines, a ribbon, then Rima beside a down arrow and Rima from above on the lawn. */
export function titlePicture(pal: Pal, side: Pixels, above: Pixels, tagline: string): Pixels {
  const look = lookOf(pal, 'breeze');
  const p = backdrop(pal, 'breeze');
  const lines = ['GRAVITY ON,', 'GRAVITY OFF'];
  lines.forEach((l, i) => outlined(p, Math.round((W - textWidth(l, 2)) / 2), 8 + i * 19, l, look.fill, look.outline, 2, look.shadow));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  // gravity on: Rima stands on the floor, and an arrow shows which way he is pulled
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, side, 40, 160 - 80 - 4, 2);
  arrow(p, 104, 130, 'down', 14, pal.c('gold', 5));
  p.rect(103, 100, 3, 18, pal.c('gold', 5));
  // gravity off: Rima from above on a patch of lawn, an arrow for each way he can walk
  const g = pal.r('grass');
  bevel(p, 192, 88, 96, 72, g, 2, 2);
  scaleBlit(p, above, 220, 104, 2);
  const gold = pal.c('gold', 5);
  arrow(p, 240, 91, 'up', 8, gold);
  arrow(p, 240, 157, 'down', 8, gold);
  arrow(p, 195, 124, 'left', 8, gold);
  arrow(p, 285, 124, 'right', 8, gold);
  frameOf(p, pal, 'breeze');
  return p;
}
