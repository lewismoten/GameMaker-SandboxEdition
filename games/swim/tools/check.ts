// The play-testing bot plays the whole game on the built disk. It must win without losing a life;
// route.ts asserts what each sign teaches: the creek carries Kit back, the deep pool floats him, the lift raises him.
//   cd web && npx vite-node ../games/swim/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(
  `under the surface: the bot played all three levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`,
);
