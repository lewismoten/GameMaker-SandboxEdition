// Guests from the maintainer's other games: one passable block each, drawn over the scene's own
// background in the scene's palette (games/kit/cameos.ts recolors them), with no touch effect and no
// sound. `placeCameo` puts one where the map still shows plain background, so it never covers play.
import { CLEAR } from '../../../kit/cameos';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { MapBuilder } from '../levels/maps';
import { ORIGIN } from '../levels/maps';
import { AIR, type Kit } from './common';
import type { BlockBook } from './common';

/** The palette ramps a guest may use: the fixed half every scene shares. */
const GUEST_RAMPS = ['ink', 'cloud', 'skin', 'red', 'yellow', 'gold', 'blue', 'purple', 'pink', 'metal', 'steel', 'gray', 'coat', 'paint', 'water', 'wood'];

/** Adds block `name`: `draw`'s 20x20 picture on top of block `back`. */
export function addCameo(
  k: Kit,
  name: string,
  back: string,
  draw: (host: Uint8Array, use: number[]) => Pixels,
  attrs: Parameters<BlockBook['add']>[2] = AIR,
): void {
  const use = GUEST_RAMPS.flatMap((r) => k.R(r));
  k.book.add(name, k.pic(back).blit(draw(k.pal.pal, use), 0, 0, CLEAR), attrs);
}

/** Sets `name` at the first of `spots` (level x, y) that still shows block `back`; false if none does. */
export function placeCameo(m: MapBuilder, name: string, back: string, spots: [number, number][]): boolean {
  for (const [x, y] of spots)
    if (m.map.blocks[(y + ORIGIN) * 100 + x + ORIGIN] === m.book.n(back)) {
      m.set(x, y, name);
      return true;
    }
  return false;
}
