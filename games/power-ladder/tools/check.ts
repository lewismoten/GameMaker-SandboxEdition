// The play-testing bot plays the whole game on the built disk without losing a life.
//   cd web && npx vite-node ../games/power-ladder/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { checkEntranceWalk } from '../../kit/starter/entranceWalk';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
for (let completed = 0; completed < 3; completed++) await checkEntranceWalk((await play(undefined, completed)).bot, 1, 4);
const { sim } = await play();
console.log(`power-ladder: the bot played all three levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
