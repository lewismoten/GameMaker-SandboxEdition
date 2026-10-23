// Plays the whole game on the built disk with the bot: every room in turn (tools/route.ts),
// or by the secret way through the hidey-hole; both go under the stove with Sir Reginald.
import { compileAll } from '../src/compile';
import { Bot } from './bot';
import { INTERLUDE_ROUTE, ROUTE, SECRET_ROUTE, playRoom } from './route';
import { GameSim } from './sim';

/** Ticks (18.2 a second) of play a room's loot may add: a few seconds and a few more a piece, at most about 16 s. */
const LOOT_ALLOWANCE = 60;
const LOOT_ALLOWANCE_MAX = 300;

export async function playThrough(secret: boolean, seed = 1): Promise<Bot> {
  const all = compileAll();
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim, all);
  bot.greedy = true;
  for (let guard = 0; guard < 20 && !sim.ended; guard++) {
    const room = bot.room();
    const level = room.spec.level;
    const stops = room.spec.interlude ? INTERLUDE_ROUTE : (secret && SECRET_ROUTE[level]) || ROUTE[level];
    if (!stops) throw new Error(`No route for ${room.spec.name}`);
    const seg = sim.segments.length;
    // the room played straight, then picking up the loot seen on the way: the loot is kept when
    // it cost no more than a few seconds over the whole room (a detour that throws off the
    // timing past a rolling pin later on is not worth a bottle cap)
    const start = bot.snapshot();
    const got = bot.grabbed.length;
    bot.greedy = false;
    await playRoom(bot, stops);
    const plain = bot.snapshot();
    const plainTime = sim.elapsed - start.sim.clock;
    bot.restore(start);
    bot.greedy = true;
    let ok = true;
    try {
      await playRoom(bot, stops);
    } catch {
      ok = false;
    }
    const n = bot.grabbed.length - got;
    const extra = sim.elapsed - start.sim.clock - plainTime;
    if (!ok || !n || extra > Math.min(LOOT_ALLOWANCE * (n + 1), LOOT_ALLOWANCE_MAX) || sim.scene !== plain.sim.scene) {
      bot.restore(plain);
      bot.grabbed.length = got;
    }
    if (process.env.BOT_LOOT) console.log(`loot ${room.spec.name}: ${n} picked up for ${extra} ticks${bot.grabbed.length === got ? ', left' : ''}`);
    const keys = sim.segments.slice(seg - 1).reduce((n, s) => n + s.keys.length, 0);
    console.log(`ok   ${room.spec.name.padEnd(20)} deaths ${sim.deaths}  hp ${sim.ci.hitpts}  lives ${sim.ci.lives}  ingredients ${sim.ingredients}  score ${sim.ci.score}  (${keys} keys)`);
  }
  if (sim.ended !== 'won') throw new Error(`The bot did not win (${sim.ended})`);
  return bot;
}

