// FLASH SAFE's own title picture, in the Putting It Together look (a blueprint over a wooden
// bench, kit/starter/titleStyles.ts): the hero beside a burr, a lit lamp and a bolt on a dark sky (each small and gentle).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { STORM, bolt, burr, lamp, lampPost } from './props';

/** The title: the name, a ribbon, then the hero beside three vents on the bench. */
export function titlePicture(pal: Pal, hero: Pixels, name: string, tagline: string): Pixels {
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
  // three small things on the bench (each drawn twice as big): a burr, a lit lamp on its post and a bolt on the storm sky
  const burrPic = new Pixels(20, 20, pal.c('sky', 3)).blit(burr(pal, false), 0, 0, 255);
  const lampPic = new Pixels(20, 40, pal.c('sky', 3)).blit(lamp(pal, 3), 0, 0).blit(lampPost(pal)[0], 0, 20);
  const boltPic = new Pixels(20, 40, pal.c(STORM, 2)).blit(bolt(pal, pal.c(STORM, 2), true)[0], 0, 0).blit(bolt(pal, pal.c(STORM, 2), true)[1], 0, 20);
  scaleBlit(p, burrPic, 118, 120, 2);
  scaleBlit(p, lampPic, 176, 80, 2);
  scaleBlit(p, boltPic, 234, 80, 2);
  frameOf(p, pal, 'workbench');
  return p;
}
