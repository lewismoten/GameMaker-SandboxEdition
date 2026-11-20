// The play-testing bot plays the whole game on the built disk without losing a life.
//   cd web && npx vite-node ../games/parallax/tools/check.ts   (BOT_LOG=1 prints every step)
import { checkEntranceWalk } from '../../kit/starter/entranceWalk';
import { play } from './play';

for (let completed = 0; completed < 2; completed++) await checkEntranceWalk((await play(undefined, completed)).bot, 6, 10);
const { sim } = await play();
console.log(`parallax: the bot played both levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
