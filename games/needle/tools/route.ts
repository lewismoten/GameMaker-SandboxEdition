// The way through the game, as orders for the bot.
import { GOLD, GRACE, THREAD } from '../src/ids';
import { Bot } from './bot';

const expect = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
};

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** Runs the last order of a level: it must take the seed into the next scene (or the ending). */
async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/**
 * Plays a stretch where moving monsters can catch the seed out: if it costs a life or more
 * than `maxLoss` hit points (or goes wrong), it is taken back and played again after a short
 * wait, so the camel sets out at a better moment.
 */
export async function carefully(bot: Bot, label: string, maxLoss: number, stretch: () => Promise<void>): Promise<void> {
  const start = bot.snapshot();
  const hp = bot.sim.ci.hitpts;
  const deaths = bot.sim.deaths;
  let why = '';
  for (let wait = 0; wait <= 300; wait += 6) {
    bot.restore(start);
    try {
      if (wait && (await bot.wait(wait))) throw new Error('a scene change while waiting');
      await stretch();
    } catch (e) {
      why = String(e).split('\n').slice(0, 3).join(' / ');
      continue;
    }
    const loss = hp - bot.sim.ci.hitpts;
    if (bot.sim.deaths === deaths && loss <= maxLoss) {
      bot.say(`${label}: waited ${wait} ticks, lost ${loss} hit points`);
      return;
    }
    why = `lost ${loss} hit points, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})\n${bot.log.slice(-10).join('\n')}`);
}

export const gold = (bot: Bot) => bot.sim.meter(GOLD) - 1;
export const grace = (bot: Bot) => bot.sim.meter(GRACE) - 1;
export const thread = (bot: Bot) => bot.sim.meter(THREAD) - 1;

/** 1. The city gate: the market, the poor, over the roofs, out the needle gate on his knees. */
export async function theCity(bot: Bot): Promise<void> {
  expect(bot, 2, 'the city gate');
  await carefully(bot, 'past the rich man', 12, async () => {
    await must(bot, bot.walk(17, 'past the rich man'), 'rich man');
  });
  await carefully(bot, 'the first stall', 12, async () => {
    await must(bot, bot.walk(23, 'the beggar'), 'beggar');
    await must(bot, bot.walk(28, 'the widow'), 'widow');
  });
  await carefully(bot, 'over the roofs', 12, async () => {
    await must(bot, bot.walk(34, 'the children on the roof'), 'roofs');
    await must(bot, bot.walk(39, 'down from the roofs'), 'down');
  });
  await carefully(bot, 'the well and the cart', 12, async () => {
    await must(bot, bot.walk(43, 'the blind man and the well'), 'well');
    await must(bot, bot.walk(53, 'past the cart and the guard'), 'cart');
  });
  await carefully(bot, 'the second stall and the dog', 12, async () => {
    await must(bot, bot.walk(58, 'the end of the stall'), 'stall');
    await must(bot, bot.hop('right', 12, 'right', 63), 'over the dog');
  });
  await carefully(bot, 'the crates', 12, async () => {
    await must(bot, bot.walk(66, 'up the crates to the lamp'), 'crates');
    await must(bot, bot.walk(69, 'the needle gate'), 'gate');
  });
  if (gold(bot) !== 6 || grace(bot) !== 4) throw new Error(`gold ${gold(bot)}, grace ${grace(bot)} at the needle gate`);
  await carefully(bot, 'through the needle gate', 10, async () => {
    await must(bot, bot.crawl('right', 72, 'through the needle gate'), 'crawl');
    await leave(bot, bot.walk(77, 'the road'), 'the road');
  });
}
