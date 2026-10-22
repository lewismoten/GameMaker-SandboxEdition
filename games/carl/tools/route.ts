// The way through the game, as orders for the bot.
import { EARS, HOURS, SMILES, SNACKS } from '../src/ids';
import { Bot } from './bot';

const expect = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
};

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** Runs the last order of a level: it must take Carl into the next scene (or the ending). */
async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/**
 * Plays a stretch where moving things can catch Carl out: if it costs a life or more than
 * `maxLoss` hit points (or goes wrong), it is taken back and played again after a short wait, so
 * Carl sets out at a better moment.
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

const count = (bot: Bot, k: number) => bot.sim.meter(k) - 1;
const need = (bot: Bot, k: number, n: number, what: string) => {
  if (count(bot, k) < n) throw new Error(`only ${count(bot, k)} ${what}`);
};

type Pt = [number, number];
const go = (bot: Bot, pts: Pt[], what: string) => must(bot, bot.path(pts, what), what);

/** Up against the ceiling (or a ledge above), then a nudge `dir`, then a barrel roll that way: the whoosh flies ahead. */
async function rollAhead(bot: Bot, dir: 'left' | 'right', align: 'up' | 'down' = 'up'): Promise<void> {
  await must(bot, bot.hold(align, 6), `align ${align}`);
  await must(bot, bot.hold(dir, 1), 'face');
  await must(bot, bot.tap('space', 6), 'roll');
}

/** 1. The couch: eight snacks, past the towel in the bookcase gap, onto the lamp. */
export async function theCouch(bot: Bot): Promise<void> {
  expect(bot, 2, 'the couch');
  await carefully(bot, 'the bookshelf', 10, () => go(bot, [[6, 4], [7, 4], [10, 2]], 'candy on the shelf'));
  await carefully(bot, 'the coffee table', 10, () =>
    go(
      bot,
      [
        [21, 4],
        [22, 8],
        [24, 8],
        [26, 8],
        [27, 8],
        [28, 8],
      ],
      'popcorn, Loaf #13, chips, soda, salsa',
    ),
  );
  await carefully(bot, 'over Teddy', 10, () =>
    go(
      bot,
      [
        [29, 6],
        [30, 4],
        [31, 4],
        [33, 4],
        [35, 5],
        [35, 6],
      ],
      'the pizzas',
    ),
  );
  await carefully(bot, 'under the towels', 10, () =>
    go(
      bot,
      [
        [37, 7],
        [41, 7],
        [41, 1],
        [41, 4],
        [44, 4],
        [45, 7],
        [46, 9],
      ],
      'the donut and the candy',
    ),
  );
  need(bot, SNACKS, 8, 'snacks');
  await carefully(bot, 'the towel in the bookcase gap', 10, async () => {
    await go(bot, [[46, 1]], 'the gap');
    await rollAhead(bot, 'right');
    await go(bot, [[50, 1], [53, 4]], 'through');
  });
  await carefully(bot, 'the lamp', 10, () => leave(bot, bot.fly(55, 4, 'the shade'), 'the lamp'));
}

export const counts = { snacks: (b: Bot) => count(b, SNACKS), smiles: (b: Bot) => count(b, SMILES), ears: (b: Bot) => count(b, EARS), hours: (b: Bot) => count(b, HOURS) };
