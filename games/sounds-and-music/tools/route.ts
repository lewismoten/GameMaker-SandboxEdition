// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level. It acts out each lesson once, the mistake included:
//   level 1: walk the room that has a song and take the four coins
//   level 2: coins (score), two bags (money), walk into the spike (hurt, 10 hit points), two hearts (10 back each)
//   level 3: the quiet room: jump up to a ledge, and run the row of five coins, each cutting off the last sound
// What the ears get (which song, which sound) is data, so check.ts checks that on the built files.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { BAGS, COINS_2, GROUND_COINS, HEARTS, LEDGE, SPIKE_X } from '../src/levels';
import { MONEY } from '../src/hero';

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

/** Hit points a spike takes (pickups.ts SPIKE_HURT). */
const SPIKE_COST = 10;
/** Hit points a heart gives back (pickups.ts HEART_HEAL). */
const HEART = 10;
/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;

/** Every coin is 10 points: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

const hp = (bot: StarterBot) => bot.sim.ci.hitpts;

/** Money so far: the money counter shows one less than it holds. */
const money = (bot: StarterBot) => bot.sim.ci.meter[MONEY] - 1;

/** 1. A Song Per Room: walk the room with its song, take the four coins, go through the door. */
export async function songRoom(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(13, 'the loop sign'), 'to the loop sign');
  await must(bot, bot.walk(19, 'the coins'), 'toward the coins');
  await must(bot, bot.walk(26, 'past the coins'), 'past the coins');
  coins(bot, score, 4, 'level 1 coins');
  await leave(bot, bot.walk(37, 'the exit'), 'the exit');
}

/** 2. Sounds on Pickups: a coin sound, a money sound, the hurt sound, the help sound. */
export async function pickups(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const hp0 = hp(bot);
  const money0 = money(bot);
  await must(bot, bot.walk(COINS_2[2] + 1, 'the coins'), 'along the coins');
  coins(bot, score, COINS_2.length, 'level 2 coins');
  bot.say(`score ${score} -> ${bot.sim.ci.score}: the score sound three times`);
  await must(bot, bot.walk(BAGS[1] + 1, 'the bags'), 'to the bags');
  await must(bot, bot.wait(LOOK), 'listening to the bags');
  if (money(bot) !== money0 + BAGS.length) throw new Error(`two bags should add 2 money: ${money0} -> ${money(bot)}`);
  bot.say(`money ${money0} -> ${money(bot)}: the money sound`);
  // what the SPIKE sign teaches, once, on purpose: walk in, hear it, lose ten
  await must(bot, bot.walk(SPIKE_X - 2, 'the spike'), 'to the spike');
  await must(bot, bot.walk(SPIKE_X + 2, 'through the spike'), 'into the spike');
  await must(bot, bot.wait(LOOK), 'listening to the hurt');
  if (hp(bot) !== hp0 - SPIKE_COST) throw new Error(`the spike should cost ${SPIKE_COST}; hit points ${hp0} -> ${hp(bot)}`);
  const low = hp(bot);
  await must(bot, bot.walk(HEARTS[0], 'the first heart'), 'to the first heart');
  await must(bot, bot.wait(LOOK), 'listening to the first heart');
  if (hp(bot) !== low + HEART) throw new Error(`a heart should give ${HEART} back; hit points ${low} -> ${hp(bot)}`);
  await must(bot, bot.walk(HEARTS[1], 'the second heart'), 'to the second heart');
  await must(bot, bot.wait(LOOK), 'listening to the second heart');
  if (hp(bot) !== low + 2 * HEART) throw new Error(`two hearts should give 20 back; hit points ${hp(bot)}`);
  bot.say(`hurt then mended: hit points ${hp0} -> ${low} -> ${hp(bot)}`);
  await leave(bot, bot.walk(47, 'the exit'), 'the exit');
}

/** 3. A Quiet Room: jump up to the ledge for its coins, then run the row of five coins. */
export async function quietRoom(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(13, 'the jump sign'), 'to the jump sign');
  await must(bot, bot.walk(LEDGE.x0 - 2, 'the ledge'), 'to the ledge');
  await must(bot, bot.jump('right', LEDGE.x0 + 1), 'up onto the ledge');
  await must(bot, bot.walk(LEDGE.x1 - 0, 'along the ledge'), 'along the ledge');
  await must(bot, bot.walk(LEDGE.x1 + 3, 'down from the ledge'), 'down from the ledge');
  await must(bot, bot.walk(GROUND_COINS[0] - 1, 'the row of coins'), 'to the row of coins');
  await must(bot, bot.walk(GROUND_COINS[4] + 1, 'through the row of coins'), 'through the row of coins');
  coins(bot, score, 3 + GROUND_COINS.length, 'level 3 coins');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}
