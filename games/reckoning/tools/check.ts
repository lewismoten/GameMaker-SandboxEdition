// The play-testing bot plays the whole game on the built disk without losing a life.
//   cd web && npx vite-node ../games/reckoning/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';

const { sim } = await play();
console.log(`reckoning: the bot made it to the porcelain throne; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
