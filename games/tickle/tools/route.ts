// The way through the game, as orders for the bot.
import { NEEDED } from '../src/ids';
import { Bot } from './bot';

const expect = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
};

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** Runs the last order of a level: it must take Doc Leo into the next scene (or the ending). */
async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/**
 * Plays a stretch where moving monsters can catch Doc Leo out: if it costs a life or more than
 * `maxLoss` rapport (or goes wrong), it is taken back and played again after a short wait, so he
 * sets out at a better moment.
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
      bot.say(`${label}: waited ${wait} ticks, lost ${loss} rapport`);
      return;
    }
    why = `lost ${loss} rapport, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})\n${bot.log.slice(-10).join('\n')}`);
}

/** Pins and tickles the next rat that way. */
const tickle = (bot: Bot, dir: 'left' | 'right', label: string) => carefully(bot, label, 8, () => must(bot, bot.tickleNext(dir, label), label));

/** Hops from where Doc Leo stands up onto a ledge, landing at column `to` on row `row` (his bottom block). */
async function upTo(bot: Bot, dir: 'left' | 'right' | 'up', to: number, row: number, label: string, hold = 10): Promise<void> {
  await must(bot, bot.hop(dir, hold, dir === 'up' ? undefined : dir, to), label);
  if (bot.at.y !== row) throw new Error(`${label}: landed on row ${bot.at.y}, not ${row}`);
}

const enough = (bot: Bot, level: number) => {
  if (bot.carpet < NEEDED[level]) throw new Error(`only ${bot.carpet} rats in the carpet at door ${level + 1} (needs ${NEEDED[level]})`);
};

/** 1. The course: five practice rats, Loaf #13, the door. */
export async function theCourse(bot: Bot): Promise<void> {
  expect(bot, 2, 'the course');
  await tickle(bot, 'right', 'practice rat 1');
  await carefully(bot, 'up on the first desk', 0, async () => {
    await must(bot, bot.walk(14.5, 'by the first desk'), 'desk');
    await upTo(bot, 'right', 16.2, 7, 'onto the desk', 8);
  });
  await tickle(bot, 'right', 'practice rat 2');
  await carefully(bot, 'the drops and down', 10, async () => {
    await must(bot, bot.walk(21, 'the drops, and down'), 'down');
  });
  await tickle(bot, 'right', 'the tense rat');
  await carefully(bot, 'Loaf #13', 10, async () => {
    await must(bot, bot.walk(31, 'by the lunch desk'), 'desk');
    await upTo(bot, 'right', 32, 7, 'onto the lunch desk', 8);
    await must(bot, bot.walk(36, 'hello, Loaf; the coffee'), 'loaf');
  });
  await tickle(bot, 'right', 'the rat under the Bunsen burner');
  await carefully(bot, 'up on the last desk', 0, async () => {
    await must(bot, bot.walk(43, 'by the last desk'), 'desk');
    await upTo(bot, 'right', 45.2, 7, 'onto the last desk', 8);
  });
  await tickle(bot, 'right', 'practice rat 5');
  await carefully(bot, 'the chicken', 10, async () => {
    await must(bot, bot.walk(51, 'the rubber chicken'), 'chicken');
  });
  enough(bot, 0);
  await carefully(bot, 'the door', 10, async () => {
    await leave(bot, bot.walk(60, 'through the door'), 'the door');
  });
}

/** 2. The lab: benches, racks over the Tesla coils and the floor buffer, past Dean Dour. */
export async function theLab(bot: Bot): Promise<void> {
  expect(bot, 3, 'the lab');
  await tickle(bot, 'right', 'the first lab rat');
  await carefully(bot, 'up on the first bench', 0, async () => {
    await must(bot, bot.walk(9.5, 'by the bench'), 'bench');
    await upTo(bot, 'right', 11.2, 9, 'onto the bench', 6);
  });
  await tickle(bot, 'right', 'the rat on the bench');
  await carefully(bot, 'up on the rack over the coils', 0, async () => {
    await must(bot, bot.walk(18, 'the end of the bench'), 'bench end');
    await upTo(bot, 'right', 20.2, 7, 'onto the rack', 10);
  });
  await tickle(bot, 'right', 'the tense rat on the rack');
  await carefully(bot, 'over the floor buffer', 0, async () => {
    await must(bot, bot.walk(27, 'the coffee'), 'coffee');
    await must(bot, bot.walk(29, 'down onto the bench'), 'bench');
    if (bot.at.y !== 9) throw new Error(`not on the bench (${bot.at.y})`);
    await must(bot, bot.walk(31, 'the end of the bench'), 'bench end');
    await upTo(bot, 'right', 33.2, 7, 'onto the second rack', 10);
  });
  await tickle(bot, 'right', 'the first rat on the second rack');
  await tickle(bot, 'right', 'the second rat on the second rack');
  await carefully(bot, 'over Dean Dour', 0, async () => {
    await must(bot, bot.walk(43, 'the drops, and down'), 'down');
    await must(bot, bot.hop('right', 12, 'right', 51.5), 'over the dean');
    await upTo(bot, 'right', 52.5, 9, 'onto the long bench', 6);
    await must(bot, bot.walk(59, 'hello, seed'), 'seed');
    await upTo(bot, 'right', 60.2, 7, 'onto the last rack', 10);
  });
  await tickle(bot, 'right', 'the rat on the last rack');
  await carefully(bot, 'the chicken, and down', 4, async () => {
    await must(bot, bot.walk(65.6, 'the rubber chicken'), 'chicken');
  });
  await carefully(bot, 'down by the door', 6, async () => {
    await must(bot, bot.walk(67.5, 'down'), 'down');
  });
  await tickle(bot, 'left', 'the rat under the rack');
  await tickle(bot, 'right', 'the rat by the door');
  enough(bot, 1);
  await carefully(bot, 'the window', 10, async () => {
    await leave(bot, bot.walk(75, 'out the window'), 'the window');
  });
}

export const ROUTE = [theCourse, theLab];
