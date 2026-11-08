// LUCKY CAT's levels in order, and the palette each is shown in.
//   1. Ladder Lane            go over the ladder, mind the cracks
//   2. Mirror Maze            Left and Right swap
//   3. Town Hall              umbrellas lift you; toss the salt
//   4. Earlier That Morning   the turn: play Rascal at dawn, rigging the pranks
//   5. Race to the Fair       the clock tower's meter, a gate that shuts
//   6. The Clock Tower        four floors up to the 13th bell
//   7. Knock on Wood          the crows
//   8. Payback                Rascal's roof
import { buildCatPalette } from '../palette';
import type { Level } from '../level';
import { levelAlley } from './alley';
import { levelOne } from './one';
import { levelFive } from './five';
import { levelFour } from './four';
import { levelMarket } from './market';
import { levelMorning } from './morning';
import { levelRigging } from './rigging';
import { levelShop } from './shop';
import { levelSteps } from './steps';
import { levelSix } from './six';
import { levelThree } from './three';
import { levelTower } from './tower';
import { levelTwo } from './two';

/** The base palette and every level. */
export function buildLevels(): { pal: ReturnType<typeof buildCatPalette>; levels: Level[] } {
  const pal = buildCatPalette();
  const levels: Level[] = [
    levelOne(pal),
    levelAlley(pal),
    levelTwo(pal),
    levelSteps(pal),
    levelThree(pal),
    levelShop(pal),
    levelMorning(pal),
    levelRigging(pal),
    levelFour(pal),
    levelTower(pal),
    levelFive(pal),
    levelMarket(pal),
    levelSix(pal),
  ];
  return { pal, levels };
}
