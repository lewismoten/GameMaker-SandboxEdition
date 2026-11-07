// LUCKY CAT's levels in order, and the palette each is shown in.
//   1. Ladder Lane       go around the ladder, mind the cracks
//   2. Mirror Maze       Left and Right swap
//   3. Town Hall         umbrellas lift you; toss the salt
//   4. Race to the Fair  the clock tower's meter, a gate that shuts
//   5. The Clock Tower   four floors up to the 13th bell
//   6. Knock on Wood     the crows
//   7. Rascal's Roof     who has been pulling the ropes?
import { buildCatPalette } from '../palette';
import type { Level } from '../level';
import { levelOne } from './one';
import { levelFive } from './five';
import { levelFour } from './four';
import { levelSix } from './six';
import { levelThree } from './three';
import { levelTower } from './tower';
import { levelTwo } from './two';

/** The base palette and every level. */
export function buildLevels(): { pal: ReturnType<typeof buildCatPalette>; levels: Level[] } {
  const pal = buildCatPalette();
  const levels: Level[] = [levelOne(pal), levelTwo(pal), levelThree(pal), levelFour(pal), levelTower(pal), levelFive(pal), levelSix(pal)];
  return { pal, levels };
}
