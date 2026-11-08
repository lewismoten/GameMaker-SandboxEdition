// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each level acts out its lesson once:
// level 1 goes through a door and then through an archway; level 2 meets a shut door, fetches the key
// from another room, comes back, and returns to a room to see it start over; level 3 picks one of two doors.
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import type { Result, StarterBot } from '../../kit/starter/bot';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** An order that must take the hero through a link (or to the ending): the scene it leaves is the last it acts in. */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
  bot.say(`through ${what}`);
}

/** Every coin is 10 points and every key 25: points taken since `from` must be `n` coins (and `keys` keys). */
function coins(bot: StarterBot, from: number, n: number, what: string, keys = 0): void {
  const got = (bot.sim.ci.score - from - keys * 25) / 10;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** The scene the hero is in now. */
const here = (bot: StarterBot): number => bot.sim.trail[bot.sim.trail.length - 1];

/** Walks into the gold door while it is still shut, and checks it did not open. */
async function bump(bot: StarterBot, col: number, what: string): Promise<void> {
  await must(bot, bot.walk(col - 1, `the ${what}`), `to the ${what}`);
  bot.sim.press(SCAN.right);
  const r = await bot.wait(30);
  bot.sim.release(SCAN.right);
  if (r) throw new Error(`bumping the ${what}: ${r}`);
  if (bot.px.x >= col * 20) throw new Error(`the ${what} let the hero through with no key`);
  bot.say(`bumped the ${what}, still shut`);
}

/** The block at level (x, y) of the scene now playing. */
const cell = (bot: StarterBot, x: number, y: number): number => bot.sim.w.map[(y + ORIGIN) * MLEN + x + ORIGIN];

/** 1. Out the Door: through a door into another room, then out through the archway in that room's right wall. */
export async function outTheDoor(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(12, 'the coins'), 'the coins');
  const first = here(bot);
  await leave(bot, bot.walk(19, 'the door'), 'the door');
  if (here(bot) === first) throw new Error('the door did not change the scene');
  await must(bot, bot.walk(16, 'the coins'), 'the second room: coins');
  coins(bot, score, 10, 'level 1 before the archway');
  const second = here(bot);
  await leave(bot, bot.walk(26, 'the archway'), 'the archway');
  if (here(bot) === second) throw new Error('the archway did not change the scene');
}

/** 2. There and Back: the shut door, the kitchen and its key, the hall again, the bedroom twice, then the gold door. */
export async function thereAndBack(bot: StarterBot): Promise<void> {
  const hall = here(bot);
  // up to the gold door: shut, and the sign says the key is in the kitchen
  await must(bot, bot.walk(20, 'the ladder'), 'to the ladder');
  await must(bot, bot.climb('up', 4, 'up the ladder'), 'climb');
  await bump(bot, 31, 'gold door');
  await must(bot, bot.walk(21, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(20, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 9, 'down the ladder'), 'down the ladder');
  // the kitchen: the key, and the door back
  await leave(bot, bot.walk(3, 'the kitchen door'), 'the kitchen door');
  const kitchen = here(bot);
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(21, 'the key'), 'to the key');
  coins(bot, score, 0, 'the kitchen', 1);
  await leave(bot, bot.walk(3, 'the door back'), 'the door back to the hall');
  if (here(bot) !== hall) throw new Error(`the door back led to scene ${here(bot)}, not the hall (${hall}), after the kitchen (${kitchen})`);
  // the key came along: the bedroom's coins, then a second visit to see them back
  await leave(bot, bot.walk(29, 'the bedroom door'), 'the bedroom door');
  const before = bot.sim.ci.score;
  await must(bot, bot.walk(3, 'the coins'), 'the bedroom coins');
  coins(bot, before, 5, 'the bedroom');
  if (cell(bot, 3, 9) !== cell(bot, 9, 9)) throw new Error('a coin is still there after taking it');
  const kept = bot.sim.ci.score;
  await leave(bot, bot.walk(22, 'the door back'), 'the door back to the hall');
  await leave(bot, bot.walk(29, 'the bedroom door again'), 'the bedroom door again');
  if (bot.sim.ci.score !== kept) throw new Error('the score did not stay when the hero came back');
  if (cell(bot, 3, 9) !== cell(bot, 9, 9)) bot.say('the coins are back, the score stayed');
  else throw new Error('the room did not start over');
  await must(bot, bot.walk(21, 'the sign'), 'to the sign');
  await leave(bot, bot.walk(22, 'the door back'), 'the door back to the hall');
  // the gold door opens with the key from the kitchen
  await must(bot, bot.walk(20, 'the ladder'), 'to the ladder');
  await must(bot, bot.climb('up', 4, 'up the ladder'), 'climb');
  await must(bot, bot.walk(30, 'the gold door'), 'to the gold door');
  await must(bot, bot.walk(32, 'through the gold door'), 'through the gold door');
  await leave(bot, bot.walk(35, 'the exit door'), 'the exit door');
}

/** 3. Two Doors: the right door, to the attic and its plank, then the way out. */
export async function twoDoors(bot: StarterBot): Promise<void> {
  const fork = here(bot);
  await leave(bot, bot.walk(26, 'the right door'), 'the right door');
  if (here(bot) === fork) throw new Error('the right door did not change the scene');
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(11, 'the plank'), 'to the plank');
  await must(bot, bot.jump('right', 12), 'jump up');
  await must(bot, bot.walk(16, 'the plank coins'), 'the plank coins');
  await must(bot, bot.walk(17, 'the ground'), 'off the plank');
  await must(bot, bot.walk(22, 'the ground coins'), 'the ground coins');
  coins(bot, score, 7, 'level 3 before the exit');
  await leave(bot, bot.walk(24, 'the exit'), 'the exit');
}
