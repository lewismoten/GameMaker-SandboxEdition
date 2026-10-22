// The way through the game, as orders for the bot.
import { BASKETS, CRUMBS } from '../src/ids';
import { Bot } from './bot';

const expect = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
};

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** Runs the last order of a level: it must take the loaf into the next scene (or the ending). */
async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/**
 * Plays a stretch where moving monsters can catch the loaf out: if it costs a life or more than
 * `maxLoss` hit points (or goes wrong), it is taken back and played again after a short wait, so
 * the loaf sets out at a better moment.
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

export const crumbs = (bot: Bot) => bot.sim.meter(CRUMBS) - 1;
export const baskets = (bot: Bot) => bot.sim.meter(BASKETS) - 1;

/** 1. The hungry crowd: out of the basket, across the hillside, up on the warm air and into the stack of baskets. */
export async function theCrowd(bot: Bot): Promise<void> {
  expect(bot, 2, 'the hillside');
  await carefully(bot, 'out of the basket', 10, async () => {
    await must(bot, bot.walk(5, 'the side of the basket'), 'side');
    await must(bot, bot.hop('right', 10, 'right', 8), 'hop out');
    await must(bot, bot.walk(11, 'out of the shade'), 'shade');
  });
  await carefully(bot, 'past the hungry man', 12, async () => {
    await must(bot, bot.hop('right', 12, 'right', 18), 'over the feet');
    await must(bot, bot.walk(19, 'past the feet'), 'feet');
  });
  await carefully(bot, 'over the fish basket', 12, async () => {
    await must(bot, bot.walk(30, 'under the hands'), 'hands');
  });
  await carefully(bot, 'over the rock and up on the warm air', 12, async () => {
    await must(bot, bot.walk(35, 'over the rock'), 'rock');
    await must(bot, bot.walk(36, 'up on the second rock'), 'rock 2');
    await must(bot, bot.until('right', () => bot.px.x >= 37 * 20, 'into the warm air', 60), 'warm');
    await must(bot, bot.until(undefined, () => bot.px.y <= 2 * 20, 'up on the warm air', 160), 'lift');
    await must(bot, bot.hop('right', 4, 'right', 39), 'onto the fig branch');
    await must(bot, bot.walk(45, 'along the branch'), 'branch');
    await must(bot, bot.walk(48, 'down to the grass'), 'down');
  });
  await carefully(bot, 'past the goat and the second man', 12, async () => {
    await must(bot, bot.walk(53, 'the jar'), 'jar');
    await must(bot, bot.hop('right', 12, 'right', 60), 'over the feet');
    await must(bot, bot.walk(60, 'past the feet'), 'feet');
  });
  await carefully(bot, 'into the stack of baskets', 12, async () => {
    await leave(bot, bot.walk(66, 'the stack of baskets'), 'the stack');
  });
}

/** 2. The wicker wasteland: holy crumbs room by room, through the chaff and down the weave, then up the east wall to the lid. */
export async function theWasteland(bot: Bot): Promise<void> {
  expect(bot, 3, 'the wasteland');
  const go = (dir: 'left' | 'right' | 'up' | 'down', to: number, label = '') => must(bot, bot.dig(dir, to, label), label || `${dir} to ${to}`);
  const reach = async (x: number, label: string) => {
    await must(bot, bot.walk(x, label), label);
    await must(bot, bot.hop('up', 8), `up for ${label}`);
  };
  const start = crumbs(bot);
  await carefully(bot, 'the first two baskets', 10, async () => {
    await reach(7, 'a holy crumb');
    await must(bot, bot.walk(14, 'through the chaff'), 'chaff');
    await must(bot, bot.hop('up', 8), 'the second holy crumb');
    await must(bot, bot.walk(17, 'the top of the weave'), 'weave');
    await go('down', 10, 'down the weave');
    await must(bot, bot.land(), 'land');
  });
  await carefully(bot, 'west, past the weevil', 12, async () => {
    await reach(9, 'the west holy crumb');
    await must(bot, bot.walk(5, 'through the chaff to the jar'), 'jar');
    await must(bot, bot.hop('left', 10, 'left', 2), 'up on the basket bottom');
    await must(bot, bot.walk(8.5, 'back to the long room'), 'back');
  });
  await carefully(bot, 'east, past the weevil', 12, async () => {
    await must(bot, bot.hop('right', 12, 'right', 14), 'over the weevil');
    await must(bot, bot.walk(16, 'the middle of the long room'), 'middle');
  });
  await carefully(bot, 'east, over the mouse', 12, async () => {
    await must(bot, bot.hop('right', 12, 'right', 22), 'over the mouse');
    await must(bot, bot.hop('up', 8), 'the east holy crumb');
    await must(bot, bot.walk(25, 'the weave down'), 'weave');
    await go('down', 17, 'down the weave');
    await must(bot, bot.land(), 'land');
  });
  await carefully(bot, 'the bottom room', 12, async () => {
    await reach(20, 'a holy crumb by the mouse');
    await reach(28, 'a holy crumb by the moth');
    await must(bot, bot.walk(31, 'the east weave'), 'weave');
  });
  await carefully(bot, 'the side room', 12, async () => {
    await go('up', 8, 'up the weave');
    await must(bot, bot.walk(28, 'into the side room'), 'side room');
    await must(bot, bot.hop('up', 8), 'its holy crumb');
    await must(bot, bot.walk(31, 'back to the weave'), 'weave');
  });
  if (crumbs(bot) - start < 7) throw new Error(`only ${crumbs(bot) - start} holy crumbs here`);
  await carefully(bot, 'up to the lid', 10, async () => {
    await leave(bot, bot.hold('up', 80), 'up the weave and through the lid');
  });
}

export async function theBaskets(bot: Bot): Promise<void> {
  expect(bot, 4, 'the baskets');
}

export async function theWayHome(bot: Bot): Promise<void> {
  expect(bot, 5, 'the way home');
}
