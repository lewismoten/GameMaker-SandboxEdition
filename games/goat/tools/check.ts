// The play-testing bot plays the whole game on the built disk: the field, Bethlehem, the
// caravan and the stable, without losing a life, and ends at the manger. Checks the multi-block objects first (tools/align.ts).
//   cd web && npx vite-node ../games/goat/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';
import { align } from './align';

if (align()) throw new Error('goat: a multi-block object is out of line (above)');

const { sim } = await play();
console.log(`goat: the bot reached the manger, third from the left; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
