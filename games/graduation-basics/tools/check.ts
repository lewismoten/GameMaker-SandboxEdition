// The play-testing bot plays the whole game on the built disk without losing a life.
//   cd web && npx vite-node ../games/graduation-basics/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(`graduation-basics: the bot walked the aisle; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
