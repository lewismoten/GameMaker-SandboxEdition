// The way through the game, as orders for the bot.
import { FAITH, WATER } from '../src/ids';
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
export const faith = (bot: Bot) => bot.sim.meter(FAITH) - 1;

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

/** 2. Deep down in the dust: five drops of water, then up through the crack. */
export async function theDust(bot: Bot): Promise<void> {
  expect(bot, 3, 'the dust');
  const go = (dir: 'left' | 'right' | 'up' | 'down', to: number, label = '') => must(bot, bot.dig(dir, to, label), label || `${dir} to ${to}`);
  await carefully(bot, 'the first cave', 10, async () => {
    await go('right', 14);
    await go('down', 8);
    await go('left', 10, 'into the first cave');
    await must(bot, bot.walk(7, 'its drop of water'), 'water 1');
    await must(bot, bot.walk(10.5, 'back to the roots'), 'back');
  });
  await carefully(bot, 'under the rocks', 10, async () => {
    await go('right', 23);
    await go('down', 14);
    await go('left', 19, 'into the second cave');
    await must(bot, bot.walk(15, 'its drop of water'), 'water 2');
    await must(bot, bot.walk(18, 'the golden flower'), 'flower');
    await must(bot, bot.walk(19, 'back to the roots'), 'back');
  });
  await carefully(bot, "the mole's cave", 10, async () => {
    await go('right', 26, "into the mole's cave");
    await must(bot, bot.walk(30, 'its drop of water'), 'water 3');
    await must(bot, bot.walk(32, 'under the groundwater'), 'under');
    await go('up', 4, 'the groundwater');
  });
  await carefully(bot, 'the last cave', 10, async () => {
    await go('right', 38);
    await go('down', 10);
    await go('right', 39, 'into the last cave');
    await must(bot, bot.walk(41, 'its drop of water'), 'water 5');
    await must(bot, bot.walk(43, 'the far wall'), 'wall');
  });
  if (water(bot) < 5) throw new Error(`only ${water(bot)} drops of water`);
  await carefully(bot, 'up to the crack', 10, async () => {
    await go('up', 1, 'under the sidewalk');
    await go('right', 44);
    await leave(bot, bot.hold('up', 30), 'through the crack');
  });
}

/** 3. The mountain: faith on the way up, and each wall of boulders moved with it. */
export async function theMountain(bot: Bot): Promise<void> {
  expect(bot, 4, 'the mountain');
  const glimmer = async (x: number, label: string) => {
    await must(bot, bot.walk(x, label), label);
    await must(bot, bot.hop('up', 12), `up for ${label}`);
  };
  await carefully(bot, 'the meadow', 10, async () => {
    await glimmer(5, 'a glimmer of faith');
    await must(bot, bot.walk(10, 'the first terrace'), 'meadow');
  });
  await carefully(bot, 'the first terraces', 10, async () => {
    await glimmer(14, 'faith past the goat');
    await must(bot, bot.walk(22, 'the first wall'), 'terrace');
  });
  await carefully(bot, 'the first wall', 10, async () => {
    await must(bot, bot.walk(26, 'through the first wall'), 'wall A');
    await glimmer(29, 'faith on the high terrace');
  });
  await carefully(bot, 'the second wall', 12, async () => {
    await must(bot, bot.walk(33, 'through the second wall'), 'wall B');
    await glimmer(38, 'faith on the peak');
    await must(bot, bot.walk(44, 'down from the peak'), 'peak');
  });
  await carefully(bot, 'the last wall', 12, async () => {
    await must(bot, bot.walk(48, 'through the last wall'), 'wall C');
    await leave(bot, bot.walk(62, 'the pass'), 'the pass');
  });
}

/** 4. Up the great plant, on the breeze, past the clouds and into the palm of God's hand. */
export async function theSky(bot: Bot): Promise<void> {
  expect(bot, 5, 'the sky');
  const rise = (row: number, label: string) => must(bot, bot.until(undefined, () => bot.px.y <= row * 20, label, 160), label);
  await carefully(bot, 'the lower branches', 10, async () => {
    await must(bot, bot.walk(14, 'under the branches'), 'start');
    for (const row of [39, 36, 33]) {
      await must(bot, bot.hop('up', 14), `up to ${row}`);
      if (bot.at.y !== row) throw new Error(`not on the branch at ${row} (${bot.at.y})`);
    }
  });
  await carefully(bot, 'the evening breeze', 10, async () => {
    await must(bot, bot.until('right', () => bot.px.x >= 22 * 20, 'into the breeze', 120), 'breeze');
    await rise(20, 'up on the breeze');
    await must(bot, bot.hop('left', 4, 'left', 18.5), 'onto the nest branch');
    if (bot.at.y !== 19) throw new Error(`not on the nest branch (${bot.at.y})`);
  });
  await carefully(bot, 'the upper branches', 10, async () => {
    await must(bot, bot.walk(14.5, 'under the next branch'), 'branch');
    for (const row of [16, 13]) {
      await must(bot, bot.hop('up', 14), `up to ${row}`);
      if (bot.at.y !== row) throw new Error(`not on the branch at ${row} (${bot.at.y})`);
    }
  });
  await carefully(bot, 'the breeze to the clouds', 10, async () => {
    await must(bot, bot.walk(6, 'the left breeze'), 'breeze');
    await must(bot, bot.until('left', () => bot.px.x <= 5 * 20, 'into the breeze', 60), 'breeze');
    await rise(6, 'up on the breeze');
    // over the clouds, into the light that lifts into the palm, and across it to the middle
    const toPalm = async () =>
      (await bot.hop('right', 4, 'right', 9.5)) ?? (await bot.hop('up', 14)) ?? (await bot.hop('right', 6)) ?? (await bot.until('right', () => false, 'the palm', 200));
    await leave(bot, toPalm(), "the palm of God's hand");
  });
}
