// The way through the game, as orders for the bot. Like a player, it picks up what it can see on
// the way when the detour is short (the coins on the dresser, the couch and the bookshelf, the
// glasses of water, the TV remote, the milk in the reckoning), and hops over everything noisy.
import { ROLLS, SEQ, STRAW, WILL } from '../src/ids';
import { Bot } from './bot';

const expect = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
};

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** Runs the last order of an act: it must take the man into the next scene (or the ending). */
async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/**
 * Plays a stretch where moving things can catch the man out: if it costs a life or more than
 * `maxLoss` dignity (or goes wrong), it is taken back and played again after a short wait, so
 * he sets out at a better moment.
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
      bot.say(`${label}: waited ${wait} ticks, lost ${loss} dignity`);
      return;
    }
    why = `lost ${loss} dignity, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})\n${bot.log.slice(-10).join('\n')}`);
}

export const will = (bot: Bot) => bot.sim.meter(WILL) - 1;
export const rolls = (bot: Bot) => bot.sim.meter(ROLLS) - 1;
export const straws = (bot: Bot) => bot.sim.meter(STRAW) - 1;
export const milk = (bot: Bot) => bot.sim.meter(SEQ.speak);

/** I. 3:17 a.m.: out of bed, past the creaky board, the dogs, the basket and the Lego, through the living room to the kitchen. */
export async function bedroom(bot: Bot): Promise<void> {
  expect(bot, 2, 'the bedroom');
  await carefully(bot, 'out of bed', 0, async () => {
    await must(bot, bot.walk(8, 'the night stand'), 'stand');
    await must(bot, bot.hop('right', 10, 'right', 12), 'over the creaky board');
    await must(bot, bot.walk(13, 'by the dresser'), 'dresser');
    await must(bot, bot.hop('up', 12), 'up on the dresser');
    await must(bot, bot.walk(15, 'the coins on the dresser'), 'coins');
    await must(bot, bot.walk(19, 'into the hall'), 'hall');
  });
  await carefully(bot, 'past Teddy and the squeaky toy', 0, async () => {
    await must(bot, bot.walk(20.5, 'before Teddy'), 'teddy');
    await must(bot, bot.hop('right', 12, 'right', 24), 'over Teddy');
    await must(bot, bot.walk(24.8, 'under the shelf'), 'shelf');
    await must(bot, bot.hop('up', 12), 'the coins on the hall shelf');
    await must(bot, bot.walk(26.4, 'along the shelf'), 'along');
    await must(bot, bot.hop('right', 6, 'right', 29.8), 'off the shelf, over the squeaky toy');
  });
  await carefully(bot, 'the basket and the Lego', 0, async () => {
    await must(bot, bot.walk(30, 'by the basket'), 'basket');
    await must(bot, bot.hop('right', 12, 'right', 33), 'over the basket');
    await must(bot, bot.walk(34, 'the coins by the Lego'), 'coins');
    await must(bot, bot.hop('right', 12, 'right', 37.6), 'over the Lego');
  });
  await carefully(bot, 'past Gwinn', 0, async () => {
    await must(bot, bot.walk(38, 'before Gwinn'), 'gwinn');
    await must(bot, bot.hop('right', 12, 'right', 41.5), 'over Gwinn');
    await must(bot, bot.walk(46, 'the glass of water, into the living room'), 'living room');
  });
  await carefully(bot, 'the couch, the remote', 0, async () => {
    await must(bot, bot.hop('right', 12, 'right', 48), 'up on the couch');
    await must(bot, bot.walk(49, 'on the couch'), 'couch');
    await must(bot, bot.hop('up', 8), 'the coins on the couch back');
    await must(bot, bot.walk(53, 'the remote down the side of the couch'), 'remote');
    await must(bot, bot.hop('right', 12, 'right', 56.6), 'over the creaky board');
  });
  await carefully(bot, 'the bookshelf', 0, async () => {
    await must(bot, bot.walk(60.5, 'by the bookshelf'), 'shelf');
    await must(bot, bot.hop('up', 12, 'right', 61.2), 'up on the first shelf');
    await must(bot, bot.hop('up', 12), 'up on the top shelf');
    await must(bot, bot.walk(62, 'the glass of water on top'), 'water');
    await must(bot, bot.hop('right', 6, 'right', 65.6), 'off the shelf, over the Lego');
  });
  await carefully(bot, 'into the kitchen', 0, async () => {
    await leave(bot, bot.walk(68, 'the kitchen door'), 'the kitchen');
  });
}

export async function fridge(bot: Bot): Promise<void> {
  expect(bot, 3, 'the kitchen');
}

export async function dash(bot: Bot): Promise<void> {
  expect(bot, 4, 'the hall');
}

export async function reckoning(bot: Bot): Promise<void> {
  expect(bot, 5, 'the reckoning');
}
