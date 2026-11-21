// The play-testing bot plays the whole game on the built disk without losing a life.
//   cd web && npx vite-node ../games/heat-waves/tools/check.ts   (BOT_LOG=1 prints every step)
import { checkEntranceWalk } from '../../kit/starter/entranceWalk';
import { play } from './play';

for (let completed = 0; completed < 3; completed++) await checkEntranceWalk((await play(undefined, completed)).bot, 4, 10);
const { sim } = await play();
console.log(`heat-waves: the bot played all three levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
