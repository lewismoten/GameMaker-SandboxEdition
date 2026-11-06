// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level. It acts out each lesson once, the mistake included:
//   level 1: walk into the spike (10 hit points), once
//   level 2: walk into another spike, then take the two hearts (10 back each)
//   level 3: walk straight into the four spikes without the hearts, which costs a life; the room starts
//            again, and this time the hearts on the ledge come first and the face adds a life
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';

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

/** Hit points a spike takes (health.ts SPIKE_HURT). */
const SPIKE_COST = 10;
/** Hit points a heart gives back (health.ts HEART_HEAL). */
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

/** 1. Hit Points: walk into the spike on purpose and watch the hit points drop. */
export async function hitPoints(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const hp0 = hp(bot);
  await must(bot, bot.walk(14, 'the spike sign'), 'to the spike sign');
  // what the SPIKE sign teaches, once, on purpose: walk in, lose ten, and watch it
  await must(bot, bot.walk(19, 'through the spike'), 'into the spike');
  await must(bot, bot.wait(LOOK), 'watching the hit points drop');
  if (hp(bot) !== hp0 - SPIKE_COST) throw new Error(`the spike should cost exactly ${SPIKE_COST}; hit points ${hp0} -> ${hp(bot)}`);
  bot.say(`hit once by the spike: hit points ${hp0} -> ${hp(bot)} at tick ${bot.sim.ticks}`);
  await must(bot, bot.walk(30, 'past the coins'), 'past the coins');
  coins(bot, score, 4, 'level 1 coins');
  await leave(bot, bot.walk(37, 'the exit'), 'the exit');
}

/** 2. Hearts Heal: take another spike, then the two hearts give the hit points back. */
export async function heartsHeal(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const hp0 = hp(bot);
  await must(bot, bot.walk(11, 'the spike'), 'to the spike');
  await must(bot, bot.walk(15, 'through the spike'), 'into the spike');
  await must(bot, bot.wait(LOOK), 'watching the hit points drop');
  if (hp(bot) !== hp0 - SPIKE_COST) throw new Error(`the spike should cost ${SPIKE_COST}; hit points ${hp0} -> ${hp(bot)}`);
  const low = hp(bot);
  await must(bot, bot.walk(18, 'the first heart'), 'to the first heart');
  await must(bot, bot.wait(LOOK), 'watching the first heart');
  if (hp(bot) !== low + HEART) throw new Error(`a heart should give ${HEART} back; hit points ${low} -> ${hp(bot)}`);
  await must(bot, bot.walk(21, 'the second heart'), 'to the second heart');
  await must(bot, bot.wait(LOOK), 'watching the second heart');
  if (hp(bot) !== hp0 - SPIKE_COST + 2 * HEART) throw new Error(`two hearts should give 20 back; hit points ${hp(bot)}`);
  bot.say(`mended: hit points ${low} -> ${hp(bot)} at tick ${bot.sim.ticks}`);
  await must(bot, bot.walk(31, 'past the coins'), 'past the coins');
  coins(bot, score, 3, 'level 2 coins');
  await leave(bot, bot.walk(37, 'the exit'), 'the exit');
}

/** 3. Lives: four spikes on the ground are more than 30 hit points, so the third costs a life; then the ledge hearts first, and the face. */
export async function lives(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const lives0 = bot.sim.ci.lives;
  const deaths = bot.sim.deaths;
  if (hp(bot) !== 30) throw new Error(`level 3 should begin with 30 hit points, not ${hp(bot)}`);
  await must(bot, bot.walk(12, 'the hearts sign'), 'to the hearts sign');
  // what the ZERO sign teaches, once, on purpose: walk the ground without the hearts and run out
  const out = await bot.walk(32, 'into the four spikes');
  if (out !== 'dead') throw new Error(`the four spikes should cost a life; got ${out ?? 'nothing'}, hit points ${hp(bot)}`);
  await must(bot, bot.wait(LOOK), 'watching the room start again');
  if (bot.sim.deaths !== deaths + 1) throw new Error('the spikes should cost exactly one life');
  if (bot.sim.ci.lives !== lives0 - 1) throw new Error(`lives ${lives0} -> ${bot.sim.ci.lives}, expected one less`);
  if (hp(bot) !== 30) throw new Error(`hit points should be back to 30, not ${hp(bot)}`);
  if (Math.abs(bot.px.x - 60) > 24) throw new Error(`back at x ${bot.px.x}, not at the way in`);
  bot.say(`ran out: lives ${lives0} -> ${bot.sim.ci.lives}, back at x ${bot.px.x} with ${hp(bot)} hit points`);
  // again: up to the ledge and its two hearts first
  await must(bot, bot.walk(12, 'the ledge'), 'to the ledge');
  await must(bot, bot.jump('right', 15), 'up onto the ledge');
  await must(bot, bot.walk(19, 'the hearts'), 'along the ledge');
  await must(bot, bot.wait(LOOK), 'watching the hearts');
  if (hp(bot) !== 30 + 2 * HEART) throw new Error(`two hearts should take 30 to ${30 + 2 * HEART}, not ${hp(bot)}`);
  bot.say(`past where I started: ${hp(bot)} hit points`);
  await must(bot, bot.walk(21, 'down to the ground'), 'down from the ledge');
  bot.say(`on the ground at x ${bot.px.x}: ${hp(bot)} hit points`);
  for (const x of [23, 26, 29, 32]) {
    await must(bot, bot.walk(x, 'toward the spikes'), 'through the four spikes');
    bot.say(`x ${bot.px.x}: ${hp(bot)} hit points`);
  }
  await must(bot, bot.wait(LOOK), 'watching the hit points');
  if (hp(bot) !== 30 + 2 * HEART - 4 * SPIKE_COST) throw new Error(`the four spikes should leave ${30 + 2 * HEART - 4 * SPIKE_COST}, not ${hp(bot)}`);
  await must(bot, bot.walk(35, 'the face ledge'), 'to the face ledge');
  const have = bot.sim.ci.lives;
  await must(bot, bot.jump('right', 38), 'up onto the face ledge');
  await must(bot, bot.walk(40, 'the face'), 'to the face');
  await must(bot, bot.wait(LOOK), 'watching the lives');
  if (bot.sim.ci.lives !== have + 1) throw new Error(`the face should add a life: ${have} -> ${bot.sim.ci.lives}`);
  bot.say(`a face: lives ${have} -> ${bot.sim.ci.lives}`);
  await must(bot, bot.walk(43, 'down from the ledge'), 'down from the face ledge');
  coins(bot, score, 4, 'level 3 coins');
  await leave(bot, bot.walk(47, 'the exit'), 'the exit');
}
