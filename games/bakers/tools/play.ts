// Plays the whole game on the built disk with the bot: every room in turn (tools/route.ts),
// or by the secret way through the hidey-hole.
import { compileAll } from '../src/compile';
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

