// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin and key on the way, with a look at each sign.
//   level 1: walk, jump the wall, climb the hill's coins, pop the gumdrop, exit
//   level 2: walk into one spike on purpose, jump the others, bump the locked door once, climb for the key, open the door
//   level 3: all of it, with nothing lost
// The checks here fail if a coin is missed, a spike hurts, or the door opens without the key.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { POP_POINTS } from '../src/monsters';
import { SPIKE_HURT } from '../src/hazards';
import { AT } from '../src/levels';

/** Hit points one spike takes. */
const SPIKE_COST = -SPIKE_HURT;

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

/** What a score should be: 10 a coin, 25 a key and 50 a popped gumdrop. */
function score(bot: StarterBot, from: number, o: { coins: number; keys?: number; pops?: number }, what: string): void {
  const want = o.coins * 10 + (o.keys ?? 0) * 25 + (o.pops ?? 0) * POP_POINTS;
  const got = bot.sim.ci.score - from;
  if (got !== want) throw new Error(`${what}: scored ${got}, expected ${want} (${o.coins} coins, ${o.keys ?? 0} keys, ${o.pops ?? 0} pops)`);
}

/** A person's look at a sign, in ticks (about two seconds). */
const READ = 36;

/** Jumps the spikes at `col` and `col + 1` from two blocks before them, landing past them with every hit point. */
async function overSpikes(bot: StarterBot, col: number): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(col - 2, 'the spikes'), 'to the spikes');
  await must(bot, bot.jump('right', col + 3), 'over the spikes');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`the spikes hurt: hit points ${hp} -> ${bot.sim.ci.hitpts}`);
}

/** Walks into a door that is still shut, as a person would to see what it does, and checks it did not open. */
async function bump(bot: StarterBot, col: number): Promise<void> {
  await must(bot, bot.walk(col - 1, 'the locked door'), 'to the door');
  bot.sim.press(SCAN.right);
  const r = await bot.wait(30);
  bot.sim.release(SCAN.right);
  if (r) throw new Error(`bumping the door: ${r}`);
  if (bot.px.x >= col * 20) throw new Error('the door let the hero through without a key');
  bot.say('bumped the locked door, still shut');
}

/** 1. Walk and Jump. */
export async function walkAndJump(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  await must(bot, bot.walk(14, 'the coins'), 'to the coins');
  await must(bot, bot.walk(AT.one.wall - 1, 'the wall'), 'to the wall');
  await must(bot, bot.wait(READ), 'looking at the wall');
  await must(bot, bot.walk(AT.one.wall + 3, 'over the wall'), 'over the wall');
  await must(bot, bot.walk(AT.one.hillEnd + 1, 'across the hill'), 'up the hill and across');
  await must(bot, bot.walk(AT.one.gumdrop - 3, 'the gumdrop sign'), 'to the gumdrop sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  await must(bot, bot.walk(AT.one.gumdrop + 4, 'the gumdrop'), 'through the gumdrop');
  score(bot, from, { coins: 8, pops: 1 }, 'level 1');
  await leave(bot, bot.walk(AT.one.exit + 1, 'the exit'), 'the exit');
}

/** 2. Key and Door. */
export async function keyAndDoor(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(8, 'the spikes sign'), 'to the sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  // what the sign teaches, once, on purpose: walk into the lone spike, take one hurt, and watch it
  await must(bot, bot.walk(AT.two.lone - 1, 'the lone spike'), 'to the lone spike');
  await must(bot, bot.walk(AT.two.lone + 2, 'through the lone spike'), 'into the lone spike');
  await must(bot, bot.wait(40), 'watching the hurt');
  if (bot.sim.ci.hitpts !== hp - SPIKE_COST) throw new Error(`the lone spike should cost exactly ${SPIKE_COST}; hit points ${hp} -> ${bot.sim.ci.hitpts}`);
  bot.say(`hurt once by the spike: hit points ${hp} -> ${bot.sim.ci.hitpts}`);
  await overSpikes(bot, AT.two.spikes);
  await bump(bot, AT.two.door);
  await must(bot, bot.walk(AT.two.ladder + 1, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(AT.two.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(AT.two.key, 'the key'), 'along the ledge to the key');
  await must(bot, bot.walk(AT.two.ladder + 1, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(AT.two.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(AT.two.door - 1, 'the locked door'), 'to the door');
  await must(bot, bot.walk(AT.two.door + 1, 'through the door'), 'through the door');
  await must(bot, bot.walk(AT.two.door + 9, 'the coins'), 'the coins');
  score(bot, from, { coins: 8, keys: 1 }, 'level 2');
  if (bot.sim.ci.hitpts !== hp - SPIKE_COST) throw new Error(`level 2 cost more than the one spike: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(AT.two.exit + 1, 'the exit'), 'the exit');
}

/** 3. All Together. */
export async function allTogether(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(8, 'the first sign'), 'to the sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  await overSpikes(bot, AT.three.spikes);
  await must(bot, bot.walk(AT.three.wall - 1, 'the gumdrop path'), 'along the coins and past the gumdrop');
  await must(bot, bot.walk(AT.three.key + 1, 'the key'), 'over the wall, onto the key');
  await must(bot, bot.walk(AT.three.door - 3, 'the key sign'), 'to the key sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  await must(bot, bot.walk(AT.three.door + 1, 'through the door'), 'through the door');
  await must(bot, bot.walk(AT.three.door + 8, 'the coins'), 'the coins');
  score(bot, from, { coins: 6, keys: 1, pops: 1 }, 'level 3');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`level 3 cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(AT.three.exit + 1, 'the exit'), 'the exit');
}
