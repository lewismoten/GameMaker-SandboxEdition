// Proves the kitchen can be finished on the built disk: the bot plays every room in turn
// (tools/route.ts) and wins, then plays again taking the Cold Cellar's secret way through the
// hidey-hole, which skips the Tea Room, and wins that way too.
//   cd web && npx vite-node ../games/bakers/tools/check.ts [--secret]
import { roomScene } from '../src/game';
import { SECRET_ROUTE } from './route';
import { playThrough } from './play';

const secretOnly = process.argv.includes('--secret');
try {
  if (!secretOnly) {
    const bot = await playThrough(false);
    console.log(`WON  normal route: ${bot.sim.deaths} deaths, score ${bot.sim.ci.score}, ${bot.squawks} squawks`);
  }
  if (Object.keys(SECRET_ROUTE).length) {
    const bot = await playThrough(true);
    if (bot.sim.trail.includes(roomScene(6))) throw new Error('The secret route went through the Tea Room');
    if (!bot.sim.trail.includes(roomScene(0))) throw new Error('The secret route never reached the hidey-hole');
    console.log(`WON  secret route (skips the Tea Room): ${bot.sim.deaths} deaths, score ${bot.sim.ci.score}`);
  }
} catch (e) {
  console.error(`FAIL ${(e as Error).message}`);
  process.exitCode = 1;
}
