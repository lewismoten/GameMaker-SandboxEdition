// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin and key on the way, with a look at each sign.
//   level 1 (teach): jump the gap, then drop into it for the coin and climb out
//   level 2 (test): drop into the spiked gap on purpose (it hurts, a little), then jump the wider one clean
//   level 3 (twist): drop in for the key, climb out, jump the spiked gap, open the locked door
// The checks here fail if a coin is missed, a jump over a gap hurts, or the door opens without the key.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { SPIKE_HURT } from '../src/hazards';
import { AT, GROUND } from '../src/levels';

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

/** What a score should be: 10 a coin and 25 a key. */
function score(bot: StarterBot, from: number, o: { coins: number; keys?: number }, what: string): void {
  const want = o.coins * 10 + (o.keys ?? 0) * 25;
  const got = bot.sim.ci.score - from;
  if (got !== want) throw new Error(`${what}: scored ${got}, expected ${want} (${o.coins} coins, ${o.keys ?? 0} keys)`);
}

/** A person's look at a sign, in ticks (about two seconds). */
const READ = 36;

/** Jumps the gap at `col` (`w` wide) with a run-up from `col - 4`: Space tapped while walking, the arrow held until he is past. */
async function overGap(bot: StarterBot, col: number, w: number): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(col - 4, 'the run-up'), 'to the run-up');
  bot.sim.press(SCAN.right);
  for (let t = 0; t < 400 && bot.px.x < (col - 1) * 20 + 10; t++) await must(bot, bot.tick(), 'running up');
  bot.sim.press(SCAN.space);
  await must(bot, bot.wait(2), 'jumping');
  bot.sim.release(SCAN.space);
  for (let t = 0; t < 90 && bot.px.x < (col + w + 1) * 20; t++) await must(bot, bot.tick(), 'in the air');
  bot.sim.release(SCAN.right);
  await must(bot, bot.land(), 'landing');
  bot.say(`jumped the gap at ${col}`);
  if (bot.px.y > (GROUND - 1) * 20 + 6) throw new Error(`fell into the gap at ${col}: y ${bot.px.y}`);
  if (bot.sim.ci.hitpts !== hp) throw new Error(`the gap at ${col} hurt: hit points ${hp} -> ${bot.sim.ci.hitpts}`);
}

/** Walks off the left lip into the gap at `col` (`w` wide), then climbs out on the right by walking and jumping. */
async function dropIn(bot: StarterBot, col: number, w: number): Promise<void> {
  await must(bot, bot.walk(col + 1, 'into the gap'), 'into the gap');
  await must(bot, bot.walk(col + w - 1, 'across the gap floor'), 'across the gap floor');
  await must(bot, bot.walk(col + w + 1, 'out of the gap'), 'out of the gap');
}

/** 1. Teach. */
export async function teach(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  await must(bot, bot.walk(12, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  await overGap(bot, AT.one.gap, AT.one.width);
  // what the second sign says, once: go back, drop in, take the coin, climb out
  await must(bot, bot.walk(AT.one.gap - 1, 'back to the gap'), 'back to the gap');
  await dropIn(bot, AT.one.gap, AT.one.width);
  await must(bot, bot.walk(AT.one.exit - 5, 'the coins'), 'on along the coins');
  score(bot, from, { coins: 5 }, 'level 1');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`level 1 cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(AT.one.exit + 1, 'the exit'), 'the exit');
}

/** 2. Test. */
export async function test(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  // the mistake, once, on purpose: walk into the spiked gap and take a hurt
  await must(bot, bot.walk(AT.two.gap - 1, 'the spiked gap'), 'to the gap');
  await dropIn(bot, AT.two.gap, AT.two.width);
  const lost = hp - bot.sim.ci.hitpts;
  if (lost < SPIKE_COST || lost % SPIKE_COST !== 0 || lost > SPIKE_COST * AT.two.width)
    throw new Error(`the spiked gap should cost whole spikes; hit points ${hp} -> ${bot.sim.ci.hitpts}`);
  bot.say(`hurt by the spikes: hit points ${hp} -> ${bot.sim.ci.hitpts}`);
  await must(bot, bot.walk(AT.two.wide - 5, 'the wider sign'), 'to the wider sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  const keep = bot.sim.ci.hitpts;
  await must(bot, bot.walk(AT.two.wide - 5, 'a run-up'), 'run-up');
  await overGap(bot, AT.two.wide, AT.two.wideWidth);
  if (bot.sim.ci.hitpts !== keep) throw new Error('the wider gap hurt');
  await must(bot, bot.walk(AT.two.exit - 5, 'the coins'), 'on along the coins');
  score(bot, from, { coins: 7 }, 'level 2');
  await leave(bot, bot.walk(AT.two.exit + 1, 'the exit'), 'the exit');
}

/** 3. Twist. */
export async function twist(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(7, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  await must(bot, bot.walk(AT.three.gap - 3, 'the key sign'), 'to the key sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  await must(bot, bot.walk(AT.three.gap - 1, 'the edge'), 'to the edge');
  await dropIn(bot, AT.three.gap, AT.three.width);
  await must(bot, bot.walk(AT.three.wide - 5, 'the run-up'), 'on along the coins');
  await overGap(bot, AT.three.wide, AT.three.wideWidth);
  await must(bot, bot.walk(AT.three.door - 4, 'the locked sign'), 'to the locked sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  await must(bot, bot.walk(AT.three.door + 1, 'through the door'), 'through the door');
  await must(bot, bot.walk(AT.three.door + 7, 'the coins'), 'the coins');
  score(bot, from, { coins: 7, keys: 1 }, 'level 3');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`level 3 cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(AT.three.exit + 1, 'the exit'), 'the exit');
}
