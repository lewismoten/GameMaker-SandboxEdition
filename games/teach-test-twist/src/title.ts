// TEACH, TEST, TWIST's own title picture, in the Putting It Together look (a blueprint over a wooden
// bench, kit/starter/titleStyles.ts): the hero beside a row of four cards on the bench (a key, a
// coin, a gumdrop and spikes: the pieces the game is made of) and the exit door at the far end.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title: the name, a ribbon, then the hero, four cards of game pieces on the bench, and the door. */
export function titlePicture(pal: Pal, hero: Pixels, door: Pixels, cards: Pixels[], name: string, tagline: string): Pixels {
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
  // the cards: a wooden tray with four pieces, each on its own sky-colored card
  const tx = 91;
  const ty = 94;
  p.rect(tx - 4, ty - 4, 4 * 43 + 5, 50, c('wood', 1)).frame(tx - 4, ty - 4, 4 * 43 + 5, 50, c('wood', 0));
  cards.forEach((card, i) => {
    const x = tx + i * 43;
    p.rect(x, ty, 42, 42, skyOf(pal)).frame(x, ty, 42, 42, c('ink', 0));
    scaleBlit(p, card, x + 1, ty + 1, 2);
  });
  scaleBlit(p, door, 268, 160 - 80, 2);
  frameOf(p, pal, 'workbench');
  return p;
}
