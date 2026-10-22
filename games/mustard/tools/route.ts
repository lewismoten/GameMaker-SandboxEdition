// The way through the game, as orders for the bot.
import { WATER } from '../src/ids';
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
 * wait, so the seed sets out at a better moment.
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

export const water = (bot: Bot) => bot.sim.meter(WATER) - 1;

/** 1. The mound and the garden. */
export async function theMound(bot: Bot): Promise<void> {
  expect(bot, 2, 'the mound');
  await carefully(bot, 'out of the mound', 10, async () => {
    await must(bot, bot.hop('right', 8, 'right', 7), 'hop out');
    await must(bot, bot.walk(13, 'the flower bed'), 'flower bed');
  });
  await carefully(bot, 'the flowerpots and the leaves', 12, async () => {
    await must(bot, bot.walk(17, 'up the flowerpots'), 'pots');
    for (const x of [20, 23, 26, 29]) await must(bot, bot.hop('right', 8, 'right', x + 0.5), `leaf ${x}`);
    await must(bot, bot.walk(31, 'the dandelion'), 'dandelion');
  });
  await carefully(bot, 'over the wall', 12, async () => {
    await must(bot, bot.until('right', () => bot.px.x >= 33 * 20, 'into the fluff', 60), 'fluff');
    await must(bot, bot.until(undefined, () => bot.px.y <= 3 * 20, 'up on the fluff', 120), 'fluff');
    await must(bot, bot.hop('right', 4, 'right', 37), 'onto the wall');
    await must(bot, bot.walk(39, 'the top of the wall'), 'wall');
    await must(bot, bot.walk(48, 'the vegetable patch'), 'vegetables');
  });
  await carefully(bot, 'the vegetable patch', 12, async () => {
    await must(bot, bot.walk(54, 'the thistle'), 'thistle');
    await must(bot, bot.hop('right', 10, 'right', 57), 'over the thistle');
    await must(bot, bot.walk(56.5, 'under the leaf'), 'leaf');
    await must(bot, bot.hop('up', 14), 'up on the leaf');
    await must(bot, bot.hop('right', 8, 'right', 59.5), 'the tall pots');
    await must(bot, bot.walk(60.5, 'the golden flower'), 'the golden flower');
    await leave(bot, bot.walk(68, 'the sunny patch'), 'the sunny patch');
  });
}
