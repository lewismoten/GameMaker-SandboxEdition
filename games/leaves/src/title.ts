// LEAVES IN THE WIND's title picture, in the warm sunset look: the name, a ribbon, Mara on the left, a maple and a birch on
// the right, and leaves of all three kinds tumbling across between them, each in a different frame of its turn.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { leafPicture, TUMBLE } from './leafArt';
import type { Kind } from './palette';
import { crownPicture, trunkPicture } from './trees';

/** Where the leaves are drawn: [kind, frame, x, y, scale]. They drift from the trees toward Mara, falling as they go. */
const FLYING: [Kind, number, number, number, number][] = [
  ['maple', 0, 168, 66, 2],
  ['birch', 3, 146, 102, 2],
  ['oak', 1, 118, 70, 2],
  ['maple', 5, 104, 112, 2],
  ['birch', 6, 86, 84, 2],
  ['oak', 4, 150, 130, 2],
  ['maple', 2, 196, 138, 1],
  ['birch', 0, 212, 120, 1],
];

export function titlePicture(pal: Pal, hero: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'sunset');
  const p = backdrop(pal, 'sunset');
  const size = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, size)) / 2), 14, name, look.fill, look.outline, size, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  const ground = 160;
  // the trees: their crowns and trunks drawn over the sunset, keeping the sky color out (it is the crown's background)
  const sky = pal.c('sky', 3);
  const tree = (kind: Kind, seed: number, x: number, top: number) => {
    const crown = crownPicture(pal, kind, seed);
    for (let y = 0; y < 60; y++) for (let cx = 0; cx < 60; cx++) if (crown.get(cx, y) !== sky) p.set(x + cx, top + y, crown.get(cx, y));
    for (let y = top + 60; y < ground; y += 20) {
      const t = trunkPicture(pal, kind, y + 20 >= ground);
      for (let ty = 0; ty < 20 && y + ty < ground; ty++) for (let tx = 0; tx < 20; tx++) if (t.get(tx, ty) !== sky) p.set(x + 20 + tx, y + ty, t.get(tx, ty));
    }
  };
  tree('birch', 38, 250, 74);
  tree('maple', 23, 212, 68);
  p.rect(44, ground - 2, 32, 3, look.floorShadow);
  scaleBlit(p, hero, 40, ground - 80 - 4, 2);
  for (const [kind, frame, x, y, s] of FLYING) scaleBlit(p, leafPicture(pal, kind, TUMBLE[frame]), x, y, s);
  frameOf(p, pal, 'sunset');
  return p;
}
