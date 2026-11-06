// SLIPPERY AND BOUNCY's own title picture, in the Worlds That Push Back look (the kit's breeze): Kit, a block of ice,
// a belt and a spring pad in a row, and the exit door.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { Book } from '../../kit/starter/book';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title in the Worlds That Push Back look (a breeze): the name, a ribbon, then Kit, the ice, the belt, the spring and the door. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'breeze');
  const p = backdrop(pal, 'breeze');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  p.rect(44, 158, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 40, 160 - 80 - 4, 2);
  // the ice, the belt and the spring pad stand in a row on the floor line, so each reads at a glance
  ['ice', 'belt', 'spring'].forEach((name, i) =>
    scaleBlit(
      p,
      book.pics.get(name)!.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c)),
      112 + i * 40,
      160 - 44,
      2,
    ),
  );
  scaleBlit(p, door, 236, 160 - 80, 2);
  frameOf(p, pal, 'breeze');
  return p;
}
