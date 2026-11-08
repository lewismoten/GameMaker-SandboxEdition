// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press.
//   the tumble: a look at the first sign, then a stop at each tree long enough to watch its leaf fall all the way (the
//               stiff one, the spinning one, and the floating one, which is the slowest), the door;
//   the gust:   a stop by each tree through a gust (all three crowns bend and blow leaves off together), the last door,
//               which ends the game.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { GUST, GUST_EVERY, TUMBLE } from '../src/levels';

async function through(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'no link fired'}\n${bot.log.slice(-8).join('\n')}`);
}
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** A person's look at what just happened, in ticks (about two seconds). */
const LOOK = 40;
/** How long a stop at a tree in level 1 lasts: a branch drops its leaf every TUMBLE.every ticks, and the floating leaf takes about two of those to come down. */
const WATCH = [TUMBLE.every + 20, TUMBLE.every + 20, TUMBLE.every * 2 + 40];

export async function journey(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(LOOK), 'reading the first sign');
  for (const [i, t] of TUMBLE.trees.entries()) {
    await must(bot, bot.walk(t.x - 3, 'to a sign', 2500), `walking to the sign by tree ${i}`);
    await must(bot, bot.wait(LOOK), 'reading the sign');
    await must(bot, bot.walk(t.x, 'under the tree', 2500), `walking under tree ${i}`);
    await must(bot, bot.wait(WATCH[i]), 'watching the leaf fall');
  }
  await through(bot, bot.walk(TUMBLE.exit, 'the tumble door', 3000), 'tumble door');
  if ((bot.sim.scene as number) !== 3) throw new Error(`the first door should lead to the gust (3), not ${bot.sim.scene}`);
  await must(bot, bot.wait(LOOK), 'reading the first sign');
  for (const [i, t] of GUST.trees.entries()) {
    await must(bot, bot.walk(t.x + 4, 'beside a tree', 2500), `walking beside tree ${i}`);
    await must(bot, bot.wait(i === 0 ? GUST_EVERY : Math.round(GUST_EVERY * 0.6)), 'watching for a gust');
  }
  await through(bot, bot.walk(GUST.exit, 'the last door', 3000), 'last door');
}
