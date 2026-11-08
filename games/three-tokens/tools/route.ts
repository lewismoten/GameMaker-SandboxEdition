// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is shown once,
// including the mistake: in level 1 the gate is tried with two tokens and stays shut.
import { SCAN } from '../../kit/starter/ids';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { TOKENS } from '../src/tokenBlocks';

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

/** Tokens carried now (the counter holds one more than it shows). */
const carried = (bot: StarterBot): number => bot.sim.ci.meter[TOKENS] - 1;

/** Every coin is 10 points and every token 25: a level that should give `n` coins (and `tokens` tokens) must have. */
function coins(bot: StarterBot, from: number, n: number, what: string, tokens: number): void {
  const got = (bot.sim.ci.score - from - tokens * 25) / 10;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** Walks into a gate that is still shut, as a person would to see what it does, and checks it did not open or take anything. */
async function bump(bot: StarterBot, col: number, held: number, what: string): Promise<void> {
  await must(bot, bot.walk(col - 1, `the ${what}`), `to the ${what}`);
  bot.sim.press(SCAN.right);
  const r = await bot.wait(30);
  bot.sim.release(SCAN.right);
  if (r) throw new Error(`bumping the ${what}: ${r}`);
  if (bot.px.x >= col * 20) throw new Error(`the ${what} let the hero through with too few tokens`);
  if (carried(bot) !== held) throw new Error(`the ${what} took tokens it should not have (${carried(bot)} of ${held})`);
  bot.say(`bumped the ${what} with ${held} tokens, still shut`);
}

/** 1. Three for the Gate: two tokens on the way, a bump (not enough), up the ladder for the third, then the gate. */
export async function threeForTheGate(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(11, 'the first token'), 'to the first token');
  await must(bot, bot.walk(15, 'the second token'), 'to the second token');
  if (carried(bot) !== 2) throw new Error(`expected 2 tokens, have ${carried(bot)}`);
  await bump(bot, 28, 2, 'gate');
  await must(bot, bot.walk(20, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(19, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(26, 'the third token'), 'along the ledge to the third token');
  if (carried(bot) !== 3) throw new Error(`expected 3 tokens, have ${carried(bot)}`);
  await must(bot, bot.walk(20, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(19, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(27, 'the gate'), 'to the gate');
  await must(bot, bot.walk(29, 'through the gate'), 'through the gate');
  if (carried(bot) !== 0) throw new Error(`the gate should take all 3 (have ${carried(bot)})`);
  await must(bot, bot.walk(37, 'the coins'), 'the coins');
  coins(bot, score, 8, 'level 1 before the exit', 3);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. The Gate Is the Exit: two tokens on the ground, three on the ledge, then the gate that is the door. */
export async function gateIsTheExit(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  if (carried(bot) !== 0) throw new Error(`level 2 should start with no tokens (have ${carried(bot)})`);
  await must(bot, bot.walk(12, 'the ground tokens'), 'to the ground tokens');
  await must(bot, bot.walk(22, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(23, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(16, 'the ledge tokens'), 'along the ledge');
  await must(bot, bot.walk(21, 'the ledge tokens'), 'along the ledge');
  if (carried(bot) !== 5) throw new Error(`expected 5 tokens, have ${carried(bot)}`);
  await must(bot, bot.walk(22, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(23, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(34, 'the coins'), 'the coins');
  coins(bot, score, 6, 'level 2 before the exit', 5);
  await must(bot, bot.walk(39, 'the gate'), 'to the gate');
  await leave(bot, bot.walk(41, 'through the gate'), 'the gate that is the exit');
}
