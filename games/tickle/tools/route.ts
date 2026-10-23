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

/** 3. The sewers: up the steam onto the pipe over the alligator, the long walkway, the low pipe, the last walkway. */
export async function theSewers(bot: Bot): Promise<void> {
  expect(bot, 4, 'the sewers');
  await tickle(bot, 'right', 'the first wild rat');
  await carefully(bot, 'up the steam and onto the pipe', 0, async () => {
    await must(bot, bot.walk(12, 'by the grate'), 'grate');
    await must(
      bot,
      bot.until('right', () => bot.px.x >= 13 * 20, 'into the steam', 30),
      'steam',
    );
    await must(
      bot,
      bot.until(undefined, () => bot.px.y <= 3 * 20, 'up the steam', 160),
      'lift',
    );
    await upTo(bot, 'right', 14.4, 4, 'onto the pipe', 4);
  });
  await tickle(bot, 'right', 'the rat on the pipe');
  await carefully(bot, 'off the pipe past the channel', 0, async () => {
    await must(bot, bot.walk(25.5, 'down off the pipe'), 'down');
    if (bot.at.y !== 11) throw new Error(`not on the walkway (${bot.at.y})`);
  });
  await tickle(bot, 'right', 'the tense wild rat');
  await tickle(bot, 'right', 'the rat by the cheese');
  await carefully(bot, 'the step and the low pipe', 0, async () => {
    await must(bot, bot.walk(38, 'the coffee'), 'coffee');
    await must(bot, bot.hop('up', 8), 'the coffee');
    await must(bot, bot.walk(40, 'up on the step'), 'step');
    if (bot.at.y !== 10) throw new Error(`not on the step (${bot.at.y})`);
    await upTo(bot, 'right', 41.2, 8, 'onto the low pipe', 8);
  });
  await tickle(bot, 'right', 'the rat on the low pipe');
  await carefully(bot, 'off the low pipe', 0, async () => {
    await must(bot, bot.walk(50.5, 'down off the pipe'), 'down');
    if (bot.at.y !== 11) throw new Error(`not on the walkway (${bot.at.y})`);
  });
  await tickle(bot, 'right', 'the rat on the last walkway');
  await tickle(bot, 'right', 'the tense rat on the last walkway');
  await tickle(bot, 'right', 'the rat by the door');
  await carefully(bot, 'the chicken', 4, async () => {
    await must(bot, bot.walk(66.5, 'under the chicken'), 'under');
    await must(bot, bot.hop('up', 10), 'the chicken');
  });
  enough(bot, 2);
  await carefully(bot, 'the manhole', 10, async () => {
    await leave(bot, bot.walk(74, 'up the ladder to the street'), 'the manhole');
  });
}

/** 4. The empire: the tower's floor, then ledge by ledge up to the balcony. */
export async function theTower(bot: Bot): Promise<void> {
  expect(bot, 5, 'the tower');
  await tickle(bot, 'right', 'the first rat in the tower');
  await carefully(bot, "past the Jacob's ladder", 0, async () => {
    await must(bot, bot.walk(11, "past the Jacob's ladder"), 'ladder');
  });
  await tickle(bot, 'right', 'the tense rat on the floor');
  await tickle(bot, 'right', 'the rat at the far end');
  await carefully(bot, 'the first ledge', 0, async () => {
    await must(bot, bot.walk(19, 'under the first ledge'), 'ledge');
    await upTo(bot, 'right', 20.2, 19, 'onto the first ledge', 8);
  });
  await tickle(bot, 'right', 'the rat on the first ledge');
  await carefully(bot, 'the second ledge', 0, async () => {
    await must(bot, bot.walk(30, 'the coffee'), 'coffee');
    await upTo(bot, 'right', 32.2, 17, 'onto the second ledge', 8);
  });
  await tickle(bot, 'right', 'the rat by Dean Dour');
  await carefully(bot, 'the third ledge', 0, async () => {
    await must(bot, bot.walk(32, 'back along the ledge'), 'back');
    await upTo(bot, 'left', 30, 15, 'onto the third ledge', 8);
  });
  await tickle(bot, 'left', 'the tense rat on the third ledge');
  await carefully(bot, 'the fourth ledge', 0, async () => {
    await must(bot, bot.walk(22, 'the end of the ledge'), 'end');
    await upTo(bot, 'left', 20, 13, 'onto the fourth ledge', 8);
  });
  await tickle(bot, 'left', 'the rat on the fourth ledge');
  await carefully(bot, 'the fifth ledge', 0, async () => {
    await must(bot, bot.walk(10, 'the end of the ledge'), 'end');
    await upTo(bot, 'left', 8, 11, 'onto the fifth ledge', 8);
  });
  await tickle(bot, 'left', 'the rat on the fifth ledge');
  await carefully(bot, 'the chicken and the sixth ledge', 0, async () => {
    await must(bot, bot.walk(1, 'the rubber chicken'), 'chicken');
    await must(bot, bot.walk(8, 'back along the ledge'), 'back');
    await upTo(bot, 'right', 10.2, 9, 'onto the sixth ledge', 8);
  });
  await tickle(bot, 'right', 'the rat on the sixth ledge');
  await carefully(bot, 'the seventh ledge', 0, async () => {
    await must(bot, bot.walk(20, 'the end of the ledge'), 'end');
    await upTo(bot, 'right', 22.2, 7, 'onto the seventh ledge', 8);
  });
  await tickle(bot, 'right', 'the tense rat on the seventh ledge');
  await carefully(bot, 'the top ledge', 0, async () => {
    await must(bot, bot.walk(32, 'the end of the ledge'), 'end');
    await upTo(bot, 'right', 34.2, 5, 'onto the top ledge', 8);
  });
  enough(bot, 3);
  await carefully(bot, 'the balcony', 10, async () => {
    await bot.tap('l', 20);
    await leave(bot, bot.walk(42, 'out onto the balcony'), 'the balcony');
  });
}

export const ROUTE = [theCourse, theLab, theSewers, theTower];
