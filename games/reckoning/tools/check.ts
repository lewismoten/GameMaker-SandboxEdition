// The play-testing bot plays the whole game on the built disk without losing a life. Checks the multi-block objects first (tools/align.ts).
//   cd web && npx vite-node ../games/reckoning/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';
import { align } from './align';

if (align()) throw new Error('reckoning: a multi-block object is out of line (above)');

const { sim } = await play();
console.log(`reckoning: the bot made it to the porcelain throne; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
