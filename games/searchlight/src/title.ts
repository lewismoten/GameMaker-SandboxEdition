// DON'T GET SEEN's own title picture, in the Foes and Bosses look (the kit's arena): the lamp hangs from a
// rail over the ring with its cone of light down to the floor, Mara peeks out of a trench beside it, and
// the door waits on the far side.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { CONE } from './lightArt';

/** The title in the arena look: the name, a ribbon, then the lamp and its light, Mara and the door. */
export function titlePicture(pal: Pal, mb: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'arena');
  const p = backdrop(pal, 'arena');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  const put = (pic: Pixels, x: number, y: number, scale: number) => scaleBlit(p, pic, x, y, scale);
  p.rect(36, 158, 32, 3, look.floorShadow).rect(188, 158, 40, 3, look.floorShadow);
  put(hero, 30, 160 - 80, 2);
  // the lamp and its cone, a block (20 px) each, drawn at twice their size
  const top = 160 - 20 * (CONE + 1);
  p.rect(96, top - 6, 128, 5, pal.c('stone', 2))
    .rect(96, top - 6, 128, 1, pal.c('stone', 4))
    .rect(96, top - 2, 128, 2, pal.c('ink', 0));
  put(mb.pics.get('lamp1')!, 150, top, 1);
  for (let i = 0; i < CONE; i++) put(mb.pics.get(`cone${i}_0`)!, 150, 160 - 20 * (CONE - i), 1);
  put(door, 268, 160 - 80, 2);
  frameOf(p, pal, 'arena');
  return p;
}
