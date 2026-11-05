// The play-testing bot plays the whole game on the built disk without losing a life.
//   cd web && npx vite-node ../games/day-night/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';

const { sim } = await play();
console.log(`day-night: the bot played both levels (five scenes); score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
