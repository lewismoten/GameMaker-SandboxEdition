// The play-testing bot plays the whole game on the built disk without losing a life. Checks the multi-block objects first (tools/align.ts).
//   cd web && npx vite-node ../games/remote/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';
import { align } from './align';

if (align()) throw new Error('remote: a multi-block object is out of line (above)');

const { sim, bot } = await play();
console.log(`pickups seen on screen and left lying, by level: ${JSON.stringify(bot.left)} (NO_LOOT=1 plays without grabbing them)`);
console.log(`remote: the bot found the remote; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
