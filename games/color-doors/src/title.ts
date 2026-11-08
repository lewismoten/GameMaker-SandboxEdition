// COLOR DOORS' title picture: Lena and a row of five doors under the name, with three overlapping circles of red, green and blue light.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The three lights and what they make where they overlap: red and green make yellow, green and blue make cyan, red and blue make magenta, all three make white. */
const LIGHTS: { cx: number; cy: number; mask: number }[] = [
  { cx: -6, cy: 0, mask: 1 },
  { cx: 6, cy: 0, mask: 2 },
  { cx: 0, cy: 10, mask: 4 },
];
const MIX = ['', 'lt-red', 'lt-green', 'lt-yellow', 'lt-blue', 'lt-magenta', 'lt-cyan', 'lt-white'];

/** Three overlapping circles of red, green and blue light, mixing where they meet: how a screen makes every color. */
function lightCircles(p: Pixels, pal: Pal, cx: number, cy: number, r: number): void {
  for (let y = cy - r - 2; y <= cy + 10 + r + 2; y++)
    for (let x = cx - r - 7; x <= cx + r + 7; x++) {
      let mask = 0;
      for (const l of LIGHTS) if ((x - cx - l.cx) ** 2 + (y - cy - l.cy) ** 2 <= r * r) mask |= l.mask;
      if (mask) p.set(x, y, pal.c(MIX[mask], 0));
    }
}

/** The title: the name, a ribbon, five doors across the floor, Lena at the left and, over her, three lights: red, green and blue. */
export function titlePicture(pal: Pal, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'breeze');
  const p = backdrop(pal, 'breeze');
  outlined(p, Math.round((W - textWidth(name, 3)) / 2), 14, name, look.fill, look.outline, 3, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  lightCircles(p, pal, 52, 52, 11);
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 10, 160 - 80, 2);
  for (let i = 0; i < 5; i++) scaleBlit(p, door, 100 + i * 44, 160 - 80, 2);
  frameOf(p, pal, 'breeze');
  return p;
}
