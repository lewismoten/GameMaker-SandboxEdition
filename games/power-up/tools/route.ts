// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level. It acts out each lesson once, the mistake included:
//   level 1: jump under the ledge and fall short, then take a star and jump up onto it
//   level 2: jump at the canyon and drop in, climb out, put on the sneakers and run and leap across
import type { Result, StarterBot } from '../../kit/starter/bot';
import { LEDGE_FROM, LEDGE_ROW, GAP_FROM, GAP_TO, GROUND, CANYON_FLOOR } from '../src/levels';
import { POWER, PLAIN, STAR_JUMPS, SNEAKER_STRIDES } from '../src/hero';

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

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
/** The hero's y (top of his bottom block) standing on the ground, on the ledge and on the canyon floor. */
const ON_GROUND = (GROUND - 1) * 20;
const ON_LEDGE = (LEDGE_ROW - 1) * 20;
const ON_FLOOR = (CANYON_FLOOR - 1) * 20;

function counter(bot: StarterBot, n: number): number {
  return bot.sim.ci.meter[n];
}

/** 1. The High Ledge: an ordinary jump falls short; a star's high jump reaches the ledge. */
export async function highLedge(bot: StarterBot): Promise<void> {
  if (counter(bot, POWER.highJump) !== 0) throw new Error('the high jump should start with no uses');
  await must(bot, bot.walk(LEDGE_FROM + 3, 'under the ledge'), 'to the ledge');
  // what the ledge sign asks, and the mistake: an ordinary jump goes up three blocks and comes back down
  await must(bot, bot.jump(), 'an ordinary jump');
  if (bot.px.y !== ON_GROUND) throw new Error(`an ordinary jump should land back on the ground; hero at y ${bot.px.y}`);
  await must(bot, bot.wait(LOOK), 'looking at the ledge');
  bot.say(`an ordinary jump fell short of the ledge at tick ${bot.sim.ticks}`);
  // the stars lie along the ground to the right: take one
  await must(bot, bot.walk(34, 'the stars'), 'to the stars');
  await must(bot, bot.walk(36, 'taking a star'), 'taking a star');
  if (counter(bot, POWER.highJump) !== STAR_JUMPS) throw new Error(`a star should give ${STAR_JUMPS} high jumps, not ${counter(bot, POWER.highJump)}`);
  bot.say(`a star: ${STAR_JUMPS} high jumps`);
  await must(bot, bot.wait(LOOK), 'looking at the star counter');
  // back to the ledge: a high jump, steered onto the planks
  await must(bot, bot.walk(LEDGE_FROM + 3, 'under the ledge again'), 'back to the ledge');
  await must(bot, bot.jump('right', LEDGE_FROM + 5), 'the high jump');
  if (bot.px.y !== ON_LEDGE) throw new Error(`the high jump should land on the ledge; hero at y ${bot.px.y}`);
  if (counter(bot, POWER.highJump) !== STAR_JUMPS - 1) throw new Error(`the high jump should use one; ${counter(bot, POWER.highJump)} left`);
  if (counter(bot, PLAIN.jump) < 1000) throw new Error('the ordinary jump should be unlimited');
  await leave(bot, bot.walk(22, 'the exit'), 'the exit');
}

/** 2. The Wide Gap: drop into the canyon, climb out, put on the sneakers and cross. */
export async function wideGap(bot: StarterBot): Promise<void> {
  if (counter(bot, POWER.fastRight) !== 0) throw new Error('the sneakers should start with no strides');
  await must(bot, bot.walk(GAP_FROM - 1, 'the lip'), 'to the canyon');
  // the mistake: an ordinary jump falls short and the hero drops into the canyon
  await must(bot, bot.jump('right', GAP_TO + 1), 'an ordinary jump at the canyon');
  if (bot.px.y !== ON_FLOOR) throw new Error(`an ordinary jump should fall short into the canyon; hero at y ${bot.px.y}`);
  if (bot.sim.deaths !== 0) throw new Error('the canyon should not hurt');
  await must(bot, bot.wait(LOOK), 'looking up from the canyon');
  bot.say(`an ordinary jump fell short into the canyon at tick ${bot.sim.ticks}`);
  // two steps on the near wall are the way out: walking at them, he hops up each
  await must(bot, bot.walk(GAP_FROM - 2, 'out of the canyon'), 'out of the canyon');
  if (bot.px.y !== ON_GROUND) throw new Error(`the steps should lead out of the canyon; hero at y ${bot.px.y}`);
  // the sneakers are back the way he came: a pair, left foot first
  await must(bot, bot.walk(2, 'the sneakers'), 'to the sneakers');
  if (counter(bot, POWER.fastRight) !== SNEAKER_STRIDES || counter(bot, POWER.fastLeft) !== SNEAKER_STRIDES) {
    throw new Error(`each sneaker should give ${SNEAKER_STRIDES} strides; got ${counter(bot, POWER.fastRight)} and ${counter(bot, POWER.fastLeft)}`);
  }
  bot.say(`sneakers on: ${SNEAKER_STRIDES} strides each way`);
  await must(bot, bot.wait(LOOK), 'looking at the sneakers');
  // run to the lip and leap
  await must(bot, bot.walk(GAP_FROM - 1, 'the lip, running'), 'running to the canyon');
  if (counter(bot, POWER.fastRight) < 8) throw new Error(`the sneakers wore out on the way: ${counter(bot, POWER.fastRight)} strides left`);
  await must(bot, bot.jump('right', GAP_TO + 3), 'the leap');
  if (bot.px.y !== ON_GROUND || bot.px.x < (GAP_TO + 1) * 20) throw new Error(`the leap should land across the canyon; hero at ${bot.px.x}, ${bot.px.y}`);
  bot.say(`across, ${counter(bot, POWER.fastRight)} strides left`);
  await leave(bot, bot.walk(48, 'the exit'), 'the exit');
}
