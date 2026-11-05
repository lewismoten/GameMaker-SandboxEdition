// The play-testing bot plays the whole game on the built disk and wins without losing a life.
// route.ts asserts what each level teaches: two red plates sting 5 hit points each, and the spikes
// of level 2 are jumped, so that level costs nothing.
//   cd web && npx vite-node ../games/colors/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(`colors: the bot played both levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
