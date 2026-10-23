// The play-testing bot plays the whole game on the built disk without losing a life. Checks the multi-block objects first (tools/align.ts).
//   cd web && npx vite-node ../games/loaf/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';
import { align } from './align';

if (align()) throw new Error('loaf: a multi-block object is out of line (above)');

const { sim } = await play();
console.log(`loaf: the bot rolled all the way home; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
