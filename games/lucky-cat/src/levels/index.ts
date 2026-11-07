// LUCKY CAT's levels in order, and the palette each is shown in.
//   1. Ladder Lane       go around the ladder, mind the cracks
//   2. Mirror Maze       Left and Right swap
//   3. Town Hall         umbrellas lift you; toss the salt
//   4. Race to the Fair  the clock tower's meter, a gate that shuts
//   5. Knock on Wood     the crows
//   6. Rascal's Roof     who has been pulling the ropes?
import { buildCatPalette } from '../palette';
import type { Level } from '../level';
import { levelOne } from './one';

/** The base palette and every level. */
export function buildLevels(): { pal: ReturnType<typeof buildCatPalette>; levels: Level[] } {
  const pal = buildCatPalette();
  const levels: Level[] = [levelOne(pal)];
  return { pal, levels };
}
