// The play-testing bot plays the whole game on the built disk without losing a life.
//   cd web && npx vite-node ../games/smirked/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';

const { sim, bot } = await play();
console.log(`pickups seen on screen and left lying, by level: ${JSON.stringify(bot.left)} (NO_LOOT=1 plays without grabbing them)`);
console.log(`smirked: the bot bonded with the exit sign; score ${sim.ci.score}, Lily smirked ${sim.meter(23) - 1} times, ${sim.trail.length} scenes entered`);
