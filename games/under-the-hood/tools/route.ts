// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level
// by level, taking every coin on the way. Each sign's lesson is shown once, including the mistake: in level 2
// the hero tries START in the four-byte slot first, and it jams.
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { BACKUP, BYTES } from '../src/hoodBlocks';
import { buildLevels, GROUND, LEDGE } from '../src/levels';

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

/** What a counter holds now (it holds one more than it shows). */
const held = (bot: StarterBot, counter: number): number => bot.sim.ci.meter[counter] - 1;

/** Every coin is 10 points and every byte or disk 25: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, what: string, pickups: number): void {
  const got = (bot.sim.ci.score - from - pickups * 25) / 10;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

const { levels } = buildLevels();
/** The block number of `name` in level `i`'s block set. */
const block = (i: number, name: string) => levels[i].book.n(name);

/** Walks right into a solid block at `col` for half a second, as a person would to try it. */
async function bump(bot: StarterBot, col: number, what: string): Promise<void> {
  await must(bot, bot.walk(col - 1, `the ${what}`), `to the ${what}`);
  bot.sim.press(SCAN.right);
  const r = await bot.wait(30);
  bot.sim.release(SCAN.right);
  if (r) throw new Error(`bumping the ${what}: ${r}`);
}

/** 1. What Is an EXE: the four bytes of Play, then the gate that wants all four. */
export async function whatIsAnExe(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(26, 'the four bytes'), 'along the signs and the bytes');
  if (held(bot, BYTES) !== 4) throw new Error(`expected 4 bytes, have ${held(bot, BYTES)}`);
  await must(bot, bot.walk(32, 'the coins'), 'to the gate');
  await must(bot, bot.walk(34, 'through the Play gate'), 'through the gate');
  if (held(bot, BYTES) !== 0) throw new Error(`the gate should take all 4 (have ${held(bot, BYTES)})`);
  coins(bot, score, 5, 'level 1 before the exit', 4);
  await leave(bot, bot.walk(41, 'the exit'), 'the exit');
}

/** 2. Same Size: START jams the lower door; up the ladder, GO and two spaces opens the upper one. */
export async function sameSize(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await bump(bot, 25, 'START slot');
  if (bot.sim.blockAt(25 + ORIGIN, GROUND - 1 + ORIGIN) !== block(1, 'jamPlate')) throw new Error('START should jam the four-byte slot');
  if (bot.px.x >= 25 * 20) throw new Error('START let the hero through');
  bot.say('START jammed the slot: no room for the T');
  await must(bot, bot.walk(18, 'the ladder'), 'back to the ladder');
  await must(bot, bot.climb('up', LEDGE - 1, 'up the ladder'), 'climb');
  await bump(bot, 25, 'GO slot');
  if (bot.sim.blockAt(25 + ORIGIN, LEDGE - 1 + ORIGIN) !== block(1, 'sky')) throw new Error('GO and two spaces should open the slot');
  await must(bot, bot.walk(31, 'off the ledge'), 'through the GO door and off the ledge');
  await must(bot, bot.walk(37, 'the coins'), 'the last coins');
  coins(bot, score, 5, 'level 2 before the exit', 0);
  await leave(bot, bot.walk(42, 'the exit'), 'the exit');
}

/** 3. Ask First: the backup disk, the gate that wants it, then the signs to the exit. */
export async function askFirst(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(10, 'the backup disk'), 'to the disk');
  if (held(bot, BACKUP) !== 1) throw new Error(`expected the backup, have ${held(bot, BACKUP)}`);
  await must(bot, bot.walk(17, 'through the backup gate'), 'through the gate');
  if (held(bot, BACKUP) !== 0) throw new Error('the gate should take the backup');
  await must(bot, bot.walk(38, 'the signs and coins'), 'along the signs');
  coins(bot, score, 6, 'level 3 before the exit', 1);
  await leave(bot, bot.walk(42, 'the exit'), 'the exit');
}
