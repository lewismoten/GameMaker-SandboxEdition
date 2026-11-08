// BEAT THE CLOCK's own title picture, in the Putting It Together look (a blueprint over a wooden
// bench, kit/starter/titleStyles.ts): the hero beside a big stopwatch with a bar of five segments
// over it, four green and one going out, and the exit door at the far end of the bench.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title: the name, a ribbon, then the hero, a stopwatch under a bar of segments, and the door. */
export function titlePicture(pal: Pal, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const { c } = pal;
  const look = lookOf(pal, 'workbench');
  const p = backdrop(pal, 'workbench');
  const size = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, size)) / 2), 14, name, look.fill, look.outline, size, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 40, 160 - 80 - 4, 2);
  // the bar: a dark board with five segments, the right-hand one thin and orange (going out)
  const bx = 98;
  const by = 74;
  p.rect(bx - 4, by - 4, 124, 20, c('wood', 1))
    .frame(bx - 4, by - 4, 124, 20, c('wood', 0))
    .rect(bx - 2, by - 2, 120, 16, c('ink', 0));
  for (let i = 0; i < 5; i++) {
    const x = bx + i * 23;
    if (i < 4) p.rect(x, by + 1, 21, 10, c('green', 2)).rect(x, by + 1, 21, 3, c('green', 3));
    else p.rect(x, by + 4, 21, 4, c('orange', 3));
  }
  // the stopwatch: a button on top, a gold case, a white face, a red hand
  const cx = 158;
  const cy = 128;
  p.rect(cx - 5, cy - 41, 10, 7, c('gold', 2)).rect(cx - 3, cy - 36, 6, 6, c('gold', 3));
  p.disc(cx, cy, 31, c('gold', 1)).disc(cx, cy, 29, c('gold', 3)).disc(cx, cy, 25, c('white', 3)).ring(cx, cy, 25, c('gold', 1));
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const long = i % 3 === 0;
    p.line(
      Math.round(cx + Math.sin(a) * (long ? 18 : 21)),
      Math.round(cy - Math.cos(a) * (long ? 18 : 21)),
      Math.round(cx + Math.sin(a) * 23),
      Math.round(cy - Math.cos(a) * 23),
      c('ink', 0),
    );
  }
  p.line(cx, cy, cx + 14, cy - 11, c('red', 2))
    .line(cx, cy + 1, cx + 14, cy - 10, c('red', 2))
    .disc(cx, cy, 2.5, c('ink', 0));
  scaleBlit(p, door, 268, 160 - 80, 2);
  frameOf(p, pal, 'workbench');
  return p;
}
