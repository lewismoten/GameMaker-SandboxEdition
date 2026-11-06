// The play-testing bot plays the whole game on the built disk without losing a life.
//   cd web && npx vite-node ../games/slow-computers/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';

const { sim } = await play();
console.log(`slow-computers: the bot played the three levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
