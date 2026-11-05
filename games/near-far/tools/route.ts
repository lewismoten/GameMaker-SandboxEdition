// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level
// by level, taking the coins on the way. Each level acts out its lesson once. Level 1 steps into the
// distance, takes the far coins, steps back out near (a trail is a link both ways) and goes into the distance
// again to the far door. Level 2 tries the cliff (and is stopped), then goes into the distance, walks past
// where the cliff is and steps out near on the other side.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { FLOOR, LAND_X } from '../src/levels';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The scene the hero is in now. */
const here = (bot: StarterBot): number => bot.sim.trail[bot.sim.trail.length - 1];

/** An order that must take the hero through a link; then he settles on the cell it lands him on, which must be column `col` of the window (feet row 5) of the scene it lands in. */
async function leave(bot: StarterBot, r: Promise<Result>, what: string, col: number | 'end'): Promise<void> {
  const from = here(bot);
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
  bot.say(`through ${what}`);
  if (col === 'end') return;
  if (here(bot) === from) throw new Error(`${what} did not change the scene`);
  await must(bot, bot.land(), `landing after ${what}`);
  const want = { x: col * 20, y: (FLOOR - 1) * 20 };
  const got = bot.px;
  if (got.x !== want.x || got.y !== want.y) throw new Error(`after ${what} the hero stood at ${got.x},${got.y}, not at ${want.x},${want.y}`);
}

/** Every coin is 10 points: points taken since `from` must be `n` coins. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** 1. Into the Distance: near coins, the trail to the far plane, far coins, back near by the trail there, then the far plane again and its door. */
export async function intoTheDistance(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const near = here(bot);
  await must(bot, bot.walk(11, 'the near coins'), 'the near coins');
  coins(bot, score, 2, 'the near plane');
  await leave(bot, bot.walk(14, 'the trail into the distance'), 'the trail into the distance', LAND_X);
  if (here(bot) === near) throw new Error('the trail did not lead to another scene');
  const far = here(bot);
  await must(bot, bot.walk(10, 'the far coins'), 'the far coins');
  coins(bot, score, 4, 'both planes');
  // stepping back: the trail in the far plane is a link of its own
  await leave(bot, bot.walk(1, 'the trail back'), 'the trail back', LAND_X);
  if (here(bot) === far) throw new Error('the trail back stayed in the far plane');
  await must(bot, bot.walk(11, 'the near coins again'), 'the near coins again');
  await leave(bot, bot.walk(14, 'the trail again'), 'the trail again', LAND_X);
  if (here(bot) !== far) throw new Error('the trail did not lead to the far plane again');
  await leave(bot, bot.walk(14, 'the far door'), 'the far door', LAND_X);
}

/** The first block of the cliff in the near plane's first window. */
const cliffCol = 13;

/** 2. Past the Cliff: the cliff stops him, the far plane does not, and the trail there lands on the other side. */
export async function pastTheCliff(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(10, 'the near coins'), 'the near coins');
  coins(bot, score, 2, 'the near side');
  // the mistake, once: walk at the cliff and jump at it
  await must(bot, bot.walk(cliffCol - 1, 'the foot of the cliff'), 'the foot of the cliff');
  const before = bot.px.x;
  await must(bot, bot.jump('right', cliffCol + 2), 'jumping at the cliff');
  if (bot.px.x >= cliffCol * 20) throw new Error('the cliff did not stop him');
  bot.say(`the cliff stopped him at ${(bot.px.x / 20).toFixed(1)} (was ${(before / 20).toFixed(1)})`);
  await leave(bot, bot.walk(1, 'the trail past the cliff'), 'the trail past the cliff', LAND_X);
  await must(bot, bot.walk(6, 'the far coins'), 'the far coins');
  coins(bot, score, 4, 'both planes');
  // he lands on the other side of the cliff: window B's middle, column 24 of the near map
  await leave(bot, bot.walk(14, 'the far trail'), 'the far trail', 24);
  await must(bot, bot.walk(26, 'the coins past the cliff'), 'the coins past the cliff');
  coins(bot, score, 6, 'level 2');
  await leave(bot, bot.walk(29, 'the exit door'), 'the exit door', 'end');
}
