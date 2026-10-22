// The play-testing bot plays the whole game on the built disk without losing a life.
//   cd web && npx vite-node ../games/remote/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';

const { sim } = await play();
console.log(`remote: the bot found the remote; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
