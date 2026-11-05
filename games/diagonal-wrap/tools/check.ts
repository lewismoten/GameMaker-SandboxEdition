// The play-testing bot plays the whole game on the built disk and must win without losing a life; route.ts
// asserts what each sign teaches: the hedge stops him, the road runs off the bottom of the map and he comes in at the
// top (once on the straight road, three times on the tilted one, and once across the right edge), and the tilted road
// takes about three times as many ticks.
//   cd web && npx vite-node ../games/diagonal-wrap/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(
  `diagonal-wrap: the bot played both levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`,
);
