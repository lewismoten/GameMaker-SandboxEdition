// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would
// press, level by level. It acts out each lesson once, the mistake included:
//   level 1: walk across the row of red and green plates (they look alike to some players, so the bot
//            doesn't pick): the red ones sting, 5 hit points each, twice
//   level 2: the same row with spikes and light striped plates: jump the spikes, walk the plates, no sting
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { STING } from '../src/colorBlocks';
import { PLATE_X, ROW } from '../src/levels';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
/** How many plates in the row sting, and where the row ends. */
const STINGS = [...ROW].filter((c) => c === 'H').length;
const ROW_END = PLATE_X + ROW.length;

/** Every coin is 10 points: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

const hp = (bot: StarterBot) => bot.sim.ci.hitpts;

/** 1. Red and Green: walk the row; every red plate stings. */
export async function redAndGreen(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const hp0 = hp(bot);
  await must(bot, bot.walk(PLATE_X - 1, 'the plates'), 'to the plates');
  await must(bot, bot.walk(ROW_END + 1, 'across the plates'), 'across the plates');
  await must(bot, bot.wait(LOOK), 'watching the hit points');
  if (hp(bot) !== hp0 + STINGS * STING) throw new Error(`${STINGS} red plates should cost ${-STINGS * STING}; hit points ${hp0} -> ${hp(bot)}`);
  bot.say(`stung by the red plates: hit points ${hp0} -> ${hp(bot)} at tick ${bot.sim.ticks}`);
  await must(bot, bot.walk(30, 'past the coins'), 'past the coins');
  coins(bot, score, 3, 'level 1 coins');
  await leave(bot, bot.walk(37, 'the exit'), 'the exit');
}

/** 2. Shape and Brightness: jump the spikes, walk the light striped plates; no sting. */
export async function shapeAndBrightness(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const hp0 = hp(bot);
  await must(bot, bot.walk(PLATE_X - 1, 'the plates'), 'to the plates');
  for (let i = 0; i < ROW.length; i++) {
    if (ROW[i] === 'H') {
      // a spike: from the plate before it, jump to the plate after
      await must(bot, bot.jump('right', PLATE_X + i + 1), 'over a spike');
    } else {
      await must(bot, bot.walk(PLATE_X + i, 'a plate'), 'along the plates');
    }
  }
  await must(bot, bot.walk(ROW_END + 1, 'past the plates'), 'past the plates');
  await must(bot, bot.wait(LOOK), 'watching the hit points');
  if (hp(bot) !== hp0) throw new Error(`level 2 should cost nothing when you read the shapes; hit points ${hp0} -> ${hp(bot)}`);
  bot.say(`read the shapes: hit points still ${hp(bot)} at tick ${bot.sim.ticks}`);
  await must(bot, bot.walk(30, 'past the coins'), 'past the coins');
  coins(bot, score, 3, 'level 2 coins');
  await leave(bot, bot.walk(37, 'the exit'), 'the exit');
}
