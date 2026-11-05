// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. It acts out each lesson once and the
// checks here fail unless each does what its sign says:
//   level 1: press Enter and the clip HELLO starts; press it again and it starts over
//   level 2: walk into the first speaker (counter up: WELCOME), wait for it; walk into the second
//            (counter down: DEEPER); a clip started while another plays cuts it
//   level 3: walk into the speaker (BYE) and on to the door, which the clip has finished before
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, L1, L2, L3, buildLevels } from '../src/levels';

/** Enter's PC scan code. */
export const ENTER_SCAN = 28;

const names = (() => {
  const { book } = buildLevels();
  return [...book.index].map(([n]) => n);
})();

/** The name of the block at level column `bx`, row `by`, in what the engine is playing. */
function at(bot: StarterBot, bx: number, by: number): string {
  return names[bot.sim.w.map[(ORIGIN + by) * 100 + ORIGIN + bx]] ?? '?';
}

function expect(bot: StarterBot, bx: number, by: number, want: string, what: string): void {
  const got = at(bot, bx, by);
  if (got !== want) throw new Error(`${what}: block ${bx},${by} is ${got}, expected ${want}`);
}

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

/** Every coin is 10 points: the score a level should have given. */
function score(bot: StarterBot, from: number, want: number, what: string): void {
  const got = bot.sim.ci.score - from;
  if (got !== want) throw new Error(`${what}: scored ${got}, expected ${want}`);
  bot.say(`${what}: scored ${got}`);
}

/** Presses and lets go of Enter, the way a person taps it. */
async function tapEnter(bot: StarterBot): Promise<Result> {
  bot.sim.press(ENTER_SCAN);
  const r = await bot.wait(3);
  bot.sim.release(ENTER_SCAN);
  return r ?? (await bot.wait(1));
}

/** The voice playing now, or nothing. */
const playing = (bot: StarterBot): string => bot.sim.clip?.name ?? '';

function clipIs(bot: StarterBot, want: string, what: string): void {
  if (playing(bot) !== want) throw new Error(`${what}: the clip playing is "${playing(bot)}", expected "${want}"`);
}

/** Waits for the clip to end; anything but carrying on is an error. */
async function listen(bot: StarterBot, what: string): Promise<void> {
  const out = await bot.sim.waitForClip();
  if (out) throw new Error(`${what}: ${out}`);
}

/** 1. Say Hello: Enter plays the HELLO clip, and again starts it over. */
export async function sayHello(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(9, 'the first sign'), 'to the first sign');
  await must(bot, tapEnter(bot), 'Enter');
  clipIs(bot, 'HELLO', 'Enter says hello');
  const first = bot.sim.clip!.until;
  await must(bot, bot.wait(6), 'half the clip');
  await must(bot, tapEnter(bot), 'Enter again');
  clipIs(bot, 'HELLO', 'Enter again');
  if (bot.sim.clip!.until <= first) throw new Error('A second Enter should start the voice over, later than the first');
  await listen(bot, 'the hello');
  await must(bot, bot.walk(L1.coins[2] + 1, 'the coins'), 'the coins');
  await must(bot, bot.walk(43, 'the last coins'), 'the last coins');
  score(bot, from, 60, 'level 1 before the exit');
  await leave(bot, bot.walk(L1.exit + 1, 'the exit'), 'the exit');
}

/** 2. Two Speakers: the counter that goes up and the one that goes down. */
export async function twoSpeakers(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(16, 'the sign and the coins'), 'to the coins');
  await must(bot, bot.walk(L2.up - 1, 'the first speaker'), 'to the first speaker');
  expect(bot, L2.up, GROUND - 1, 'speaker', 'before the touch');
  await must(bot, bot.walk(L2.up + 1, 'into the first speaker'), 'into the first speaker');
  clipIs(bot, 'WELCOME', 'the counter went up');
  expect(bot, L2.up, GROUND - 1, 'hush', 'a speaker says it once');
  if (bot.sim.meter(22) !== 3) throw new Error(`counter 22 should be 3, is ${bot.sim.meter(22)}`);
  // a second voice cuts the first (tried on a copy of the run: a person would wait)
  const saved = bot.snapshot();
  await must(bot, bot.wait(10), 'part of the first voice');
  await must(bot, tapEnter(bot), 'Enter over the voice');
  clipIs(bot, 'HELLO', 'a new voice cuts the old one');
  bot.restore(saved);
  await listen(bot, 'the first speaker');
  await must(bot, bot.walk(L2.down - 1, 'the second speaker'), 'to the second speaker');
  expect(bot, L2.down, GROUND - 1, 'lower', 'before the touch');
  await must(bot, bot.walk(L2.down + 1, 'into the second speaker'), 'into the second speaker');
  clipIs(bot, 'DEEPER', 'the counter went down');
  expect(bot, L2.down, GROUND - 1, 'hush', 'a speaker says it once');
  if (bot.sim.meter(23) !== 1) throw new Error(`counter 23 should be 1, is ${bot.sim.meter(23)}`);
  await listen(bot, 'the second speaker');
  await must(bot, bot.walk(43, 'the coins'), 'the coins');
  score(bot, from, 70, 'level 2 before the exit');
  await leave(bot, bot.walk(49, 'the exit'), 'the exit');
}

/** 3. Let It Finish: the speaker's line ends well before the door. */
export async function letItFinish(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(14, 'the coins'), 'the coins');
  await must(bot, bot.walk(L3.speaker - 1, 'the speaker'), 'to the speaker');
  await must(bot, bot.walk(L3.speaker + 1, 'into the speaker'), 'into the speaker');
  clipIs(bot, 'BYE', 'the goodbye');
  const heard = bot.sim.clipTicksLeft;
  await must(bot, bot.walk(41, 'the last coins'), 'the last coins');
  if (bot.sim.clipTicksLeft > 0) throw new Error(`The goodbye (${heard} ticks) should be over before the door; ${bot.sim.clipTicksLeft} left`);
  score(bot, from, 90, 'level 3 before the exit');
  await leave(bot, bot.walk(49, 'the exit'), 'the exit');
}
