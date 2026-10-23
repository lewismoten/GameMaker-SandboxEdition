// The play-testing bot plays the whole game on the built disk without losing a life. Checks the
// multi-block objects first (tools/align.ts).
//   cd web && npx vite-node ../games/risi/tools/check.ts   (BOT_LOG=1 prints every step; BOT_UPTO=n stops after level n)
import { align } from './align';
import { play } from './play';

if (align()) throw new Error('risi: a multi-block object is out of line (above)');

const upTo = process.env.BOT_UPTO ? Number(process.env.BOT_UPTO) : undefined;
const { sim } = await play(undefined, upTo);
console.log(`risi: ${upTo ? `the bot played ${upTo} level(s)` : 'the bot laid the laurel crown on the altar'}; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
