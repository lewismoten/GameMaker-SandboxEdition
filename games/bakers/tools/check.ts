// Proves the kitchen can be finished on the built disk: the bot plays every room in turn
// (tools/route.ts) and wins, then plays again taking the Cold Cellar's secret way through the
// hidey-hole, which skips the Tea Room, and wins that way too.
//   cd web && npx vite-node ../games/bakers/tools/check.ts [--secret]
import { compileAll } from '../src/compile';
import { roomScene } from '../src/game';
import { Bot } from './bot';
import { ROUTE, SECRET_ROUTE, playRoom } from './route';
import { GameSim } from './sim';

export async function playThrough(secret: boolean, seed = 1): Promise<Bot> {
  const all = compileAll();
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim, all);
  for (let guard = 0; guard < 20 && !sim.ended; guard++) {
    const room = bot.room();
    const level = room.spec.level;
    const stops = (secret && SECRET_ROUTE[level]) || ROUTE[level];
    if (!stops) throw new Error(`No route for ${room.spec.name}`);
    const seg = sim.segments.length;
    await playRoom(bot, stops);
    const keys = sim.segments.slice(seg - 1).reduce((n, s) => n + s.keys.length, 0);
    console.log(`ok   ${room.spec.name.padEnd(20)} deaths ${sim.deaths}  hp ${sim.ci.hitpts}  lives ${sim.ci.lives}  ingredients ${sim.ingredients}  score ${sim.ci.score}  (${keys} keys)`);
  }
  if (sim.ended !== 'won') throw new Error(`The bot did not win (${sim.ended})`);
  return bot;
}

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
