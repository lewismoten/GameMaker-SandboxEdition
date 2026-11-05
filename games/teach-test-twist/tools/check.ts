// The play-testing bot plays the whole game on the built disk without losing a life, and no level has
// an invisible wall (a solid block drawn as sky).
//   cd web && npx vite-node ../games/teach-test-twist/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(`teach-test-twist: the bot played all three levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
