// The play-testing bot plays both levels on the built disk without losing a life, and the maps have no invisible walls.
//   cd web && npx vite-node ../games/many-rooms/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(`many-rooms: the bot played both levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
