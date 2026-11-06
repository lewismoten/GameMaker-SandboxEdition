// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level. It acts out each lesson once, the mistake included:
//   level 1: walk into the lone spike (10 hit points, once), then jump over the row of three
//   level 2: walk into the pool (a life), watch the room start again, then jump across
//   level 3: take the planks over the spikes and the bridge over the pool, losing nothing
import type { Result, StarterBot } from '../../kit/starter/bot';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** Hit points a spike takes (hazards.ts SPIKE_HURT). */
const SPIKE_COST = 10;
/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;

/** Every coin is 10 points: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** 1. Spikes: walk into the lone spike on purpose, then jump over the three. */
export async function spikes(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const hp0 = bot.sim.ci.hitpts;
  await must(bot, bot.walk(12, 'the lone spike'), 'to the lone spike');
  // what the SPIKES HURT sign teaches, once, on purpose: walk in, take one small hurt, and watch it
  await must(bot, bot.walk(16, 'through the lone spike'), 'into the lone spike');
  await must(bot, bot.wait(LOOK), 'watching the hurt');
  if (bot.sim.ci.hitpts !== hp0 - SPIKE_COST) throw new Error(`the lone spike should cost exactly ${SPIKE_COST}; hit points ${hp0} -> ${bot.sim.ci.hitpts}`);
  bot.say(`hurt once by the spike: hit points ${hp0} -> ${bot.sim.ci.hitpts} at tick ${bot.sim.ticks}`);
  await must(bot, bot.walk(24, 'the row of spikes'), 'to the row of spikes');
  await must(bot, bot.jump('right', 29), 'over the row of spikes');
  if (bot.sim.ci.hitpts !== hp0 - SPIKE_COST) throw new Error(`the row of spikes hurt: hit points ${bot.sim.ci.hitpts}`);
  coins(bot, score, 4, 'level 1 coins');
  await leave(bot, bot.walk(37, 'the exit'), 'the exit');
}

/** 2. The Pool: fall in once, see the room start again, then jump across. */
export async function pool(bot: StarterBot): Promise<void> {
  const lives = bot.sim.ci.lives;
  const deaths = bot.sim.deaths;
  await must(bot, bot.walk(11, 'the pool'), 'to the pool');
  // what the FALL IN sign teaches, once, on purpose: walk in, lose the life, come back at the way in
  const out = await bot.walk(15, 'into the pool');
  if (out !== 'dead') throw new Error(`walking into the pool should cost a life; got ${out ?? 'nothing'}`);
  await must(bot, bot.wait(LOOK), 'watching the room start again');
  if (bot.sim.deaths !== deaths + 1) throw new Error('the pool should cost exactly one life');
  if (bot.sim.ci.lives !== lives - 1) throw new Error(`lives ${lives} -> ${bot.sim.ci.lives}, expected one less`);
  if (bot.sim.ci.hitpts !== 50) throw new Error(`hit points should be back to 50, not ${bot.sim.ci.hitpts}`);
  if (Math.abs(bot.px.x - 60) > 24) throw new Error(`back at x ${bot.px.x}, not at the way in`);
  bot.say(`fell in the pool: lives ${lives} -> ${bot.sim.ci.lives}, back at x ${bot.px.x} with ${bot.sim.ci.hitpts} hit points`);
  // counted from here: walking in, his head can brush the first coin over the pool before he falls, and the score keeps it
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(12, 'the pool'), 'to the pool again');
  await must(bot, bot.jump('right', 17), 'across the pool');
  coins(bot, score, 3, 'level 2 coins');
  await leave(bot, bot.walk(22, 'the exit'), 'the exit');
}

/** 3. The Safe Way: up onto the planks over the spikes, across the plank bridge, losing nothing. */
export async function safeWay(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  const deaths = bot.sim.deaths;
  await must(bot, bot.walk(8, 'the planks'), 'to the planks');
  await must(bot, bot.jump('right', 10), 'up onto the planks');
  await must(bot, bot.walk(13, 'the end of the planks'), 'along the planks');
  await must(bot, bot.walk(18, 'the bridge'), 'to the bridge');
  await must(bot, bot.walk(25, 'across the bridge'), 'across the bridge');
  if (bot.sim.ci.hitpts !== hp || bot.sim.deaths !== deaths) throw new Error('the safe way cost something');
  coins(bot, score, 3, 'level 3 coins');
  await leave(bot, bot.walk(33, 'the exit'), 'the exit');
}
