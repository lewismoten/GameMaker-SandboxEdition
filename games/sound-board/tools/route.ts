// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level. It acts out each lesson once, and checks the ears' side of it:
// after every step the sound numbers the engine was asked to play (tools/listen.ts) are the
// ones the signs name.
//   level 1: every pad (one by one, the silent one too), the replay door once, then the jump
//            where the short sound cuts the long one off
//   level 2: a coin, a key, the gate, a jump, the spike, the wrong gate
import type { Result, StarterBot } from '../../kit/starter/bot';
import { BOARD, FEEDBACK } from '../src/levels';
import { SLOT, lengthOf } from '../src/sounds';
import type { Heard } from './sim';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through a door. */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** A person's look at what just happened, in ticks (about a second). */
const LOOK = 20;

/** The ear: what the bot's game has asked the speaker to play so far (tools/sim.ts). */
const ear = (bot: StarterBot): Heard[] => (bot.sim as unknown as { heard: Heard[] }).heard;

/** After `go`, exactly the sounds `want` must have been asked for, in that order (`some`: these among others, such as the jump a bot makes to get over something). */
async function hears(bot: StarterBot, want: number[], what: string, go: () => Promise<void>, some = false): Promise<void> {
  const h = ear(bot);
  const mark = h.length;
  await go();
  await must(bot, bot.wait(LOOK), `listening to ${what}`);
  const got = h.slice(mark).map((x) => x.slot);
  if (some ? !want.every((n) => got.includes(n)) : got.join() !== want.join())
    throw new Error(`${what}: heard sounds ${got.join(', ') || '(none)'}, expected ${want.join(', ')}`);
  bot.say(`${what}: sound ${want.join(', ')}`);
}

/** 1. The Board: the four pads along the row, the replay door, then the jump. */
export async function theBoard(bot: StarterBot): Promise<void> {
  const [chime, coin, blip, quiet] = BOARD.units.map(([, x0]) => x0 + 1);
  await hears(bot, [SLOT.chime], 'the chime pad', () => must(bot, bot.walk(chime + 1, 'the chime pad'), 'to the chime pad'));
  // the replay door by the entrance puts the pads back: walk back to it, and the chime plays again
  await leave(bot, bot.walk(BOARD.again, 'the replay door'), 'the replay door');
  await must(bot, bot.wait(10), 'back at the start');
  await hears(bot, [SLOT.chime], 'the chime pad, again', () => must(bot, bot.walk(chime + 1, 'the chime pad'), 'to the chime pad again'));
  await hears(bot, [SLOT.coin], 'the coin pad', () => must(bot, bot.walk(coin + 1, 'the coin pad'), 'to the coin pad'));
  await hears(bot, [SLOT.blip], 'the blip pad', () => must(bot, bot.walk(blip + 1, 'the blip pad'), 'to the blip pad'));
  // the silent pad still asks for sound 3; the sound is empty, so nothing is heard
  await hears(bot, [SLOT.quiet], 'the silent pad (an empty sound)', () => must(bot, bot.walk(quiet + 1, 'the silent pad'), 'to the silent pad'));
  // the jump: the long pad, then the short one a block lower: the short one cuts the long one off
  const h = ear(bot);
  const mark = h.length;
  await must(bot, bot.walk(BOARD.jump.x, 'under the two pads'), 'under the two pads');
  await must(bot, bot.jump(), 'jumping up through the pads');
  await must(bot, bot.land(), 'landing');
  await must(bot, bot.wait(LOOK), 'listening to the jump');
  // the hero is wider than one block, so he may touch both pad blocks of a row at once: count each sound's first play
  const got = h.slice(mark);
  const long = got.find((g) => g.slot === SLOT.fanfare);
  const short = got.find((g) => g.slot === SLOT.ping && long && g.tick >= long.tick);
  if (!long || !short || got.some((g) => !([SLOT.fanfare, SLOT.ping, SLOT.jump] as number[]).includes(g.slot)))
    throw new Error(`the jump: heard ${got.map((g) => `${g.slot}@${g.tick}`).join(', ')}`);
  const gap = short.tick - long.tick;
  const ticksLong = (lengthOf(SLOT.fanfare) / 145.6) * 18.2;
  if (gap >= ticksLong) throw new Error(`the short sound came ${gap} ticks after the long one, which lasts ${ticksLong.toFixed(1)}: nothing was cut off`);
  bot.say(`the jump: the long sound (4) is cut off ${gap} ticks in by the short one (5); it would last ${ticksLong.toFixed(1)}`);
  await leave(bot, bot.walk(BOARD.exit + 1, 'the exit'), 'the exit');
}

/** 2. Sounds Tell You: each thing that happens has a sound that says so. */
export async function feedback(bot: StarterBot): Promise<void> {
  const f = FEEDBACK;
  await hears(bot, [SLOT.ping, SLOT.ping], 'two coins', () => must(bot, bot.walk(f.coins[1] + 1, 'the coins'), 'along the coins'));
  await hears(bot, [SLOT.blip], 'the key', () => must(bot, bot.walk(f.key + 1, 'the key'), 'to the key'));
  await hears(bot, [SLOT.creak], 'the gate', () => must(bot, bot.walk(f.gate + 2, 'through the gate'), 'through the gate'));
  const [l0] = f.ledge;
  await must(bot, bot.walk(l0 - 2, 'the ledge'), 'to the ledge');
  await hears(bot, [SLOT.jump, SLOT.ping, SLOT.ping], 'a jump and two coins', async () => {
    await must(bot, bot.jump('right', l0 + 1), 'up onto the ledge');
    await must(bot, bot.walk(l0 + 3, 'along the ledge'), 'along the ledge');
  });
  await must(bot, bot.walk(f.ledge[1] + 3, 'down from the ledge'), 'down from the ledge');
  await hears(bot, [SLOT.hurt], 'the spike', () => must(bot, bot.walk(f.spike + 2, 'through the spike'), 'through the spike'), true);
  await must(bot, bot.walk(f.wrong - 2, 'the wrong gate'), 'to the wrong gate');
  await hears(bot, [SLOT.nope], 'the wrong gate', () => must(bot, bot.walk(f.wrong + 2, 'over the wrong gate'), 'over the wrong gate'), true);
  await leave(bot, bot.walk(f.exit + 1, 'the exit'), 'the exit');
}
