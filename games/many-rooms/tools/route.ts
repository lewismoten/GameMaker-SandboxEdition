// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level
// by level, taking every coin on the way. Each level acts out its lesson once. Level 1 goes red, blue, green,
// then takes green's door back to blue (a door that goes back is a link too) and on again to gold; every
// door lands the hero on the middle cell of the next room. Level 2 lands in the hub twice and checks it is the
// very same cell, and that the hub's coins are back (and the score stayed).
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN } from '../../kit/starter/map';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { FLOOR, HUB_COINS, LAND_X } from '../src/levels';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The scene the hero is in now. */
const here = (bot: StarterBot): number => bot.sim.trail[bot.sim.trail.length - 1];

/** An order that must take the hero through a link; then he settles on the cell it lands him on, which must be the middle of the room whose left and top blocks are `room`. */
async function leave(bot: StarterBot, r: Promise<Result>, what: string, room: [number, number] | 'end'): Promise<void> {
  const from = here(bot);
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
  bot.say(`through ${what}`);
  if (room === 'end') return;
  if (here(bot) === from) throw new Error(`${what} did not change the scene`);
  await must(bot, bot.land(), `landing after ${what}`);
  const want = { x: (room[0] + LAND_X) * 20, y: (room[1] + FLOOR - 1) * 20 };
  const got = bot.px;
  if (got.x !== want.x || got.y !== want.y) throw new Error(`after ${what} the hero stood at ${got.x},${got.y}, not at the room's middle ${want.x},${want.y}`);
}

/** Every coin is 10 points: points taken since `from` must be `n` coins. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** The block at level (x, y) of the map now playing. */
const cell = (bot: StarterBot, x: number, y: number): number => bot.sim.w.map[(y + ORIGIN) * MLEN + x + ORIGIN];

/** 1. Four Rooms: red, blue, green, then back to blue by green's other door, then green again and on to gold. */
export async function fourRooms(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(6, 'the red coins'), 'the red coins');
  await leave(bot, bot.walk(13, 'the red door'), 'the red door', [16, 0]);
  await must(bot, bot.walk(19, 'the blue coins'), 'the blue coins');
  await leave(bot, bot.walk(29, 'the blue door'), 'the blue door', [0, 10]);
  coins(bot, score, 4, 'the red and blue rooms');
  // the mistake, once: green's back door goes back to blue, which is not where we want to be
  await leave(bot, bot.walk(2, 'green back door'), 'green back door', [16, 0]);
  await leave(bot, bot.walk(29, 'the blue door again'), 'the blue door again', [0, 10]);
  await leave(bot, bot.walk(13, 'green on door'), 'green on door', [16, 10]);
  await must(bot, bot.walk(19, 'the gold coins'), 'the gold coins');
  coins(bot, score, 8, 'level 1');
  await leave(bot, bot.walk(29, 'the gold door'), 'the gold door', [16, 0]);
}

/** 2. One Landing Cell: the hub's coins, the west room and back (same cell, coins back), then the east room and out. */
export async function oneLandingCell(bot: StarterBot): Promise<void> {
  const { from, to, row } = HUB_COINS;
  const first = bot.px;
  const hub = here(bot);
  const score = bot.sim.ci.score;
  if (cell(bot, from, row) === cell(bot, from - 1, row)) throw new Error('the hub has no coins to take');
  await must(bot, bot.walk(from, 'the hub coins'), 'the hub coins');
  coins(bot, score, to - from + 1, 'the hub');
  if (cell(bot, from, row) !== cell(bot, from - 1, row)) throw new Error('a coin is still there after taking it');
  await leave(bot, bot.walk(18, 'the west door'), 'the west door', [0, 0]);
  await leave(bot, bot.walk(13, 'the west room door back'), 'the west room door back', [16, 0]);
  if (here(bot) !== hub) throw new Error('the door back did not lead to the hub');
  const again = bot.px;
  if (again.x !== first.x || again.y !== first.y) throw new Error('the hub was not entered on the same cell both times');
  const kept = bot.sim.ci.score;
  if (kept !== score + (to - from + 1) * 10) throw new Error('the score did not stay');
  if (cell(bot, from, row) === cell(bot, from - 1, row)) throw new Error('the hub coins did not come back');
  bot.say('the coins are back, the score stayed');
  await must(bot, bot.walk(from, 'the hub coins again'), 'the hub coins again');
  coins(bot, kept, to - from + 1, 'the hub again');
  await leave(bot, bot.walk(29, 'the east door'), 'the east door', [32, 0]);
  await leave(bot, bot.walk(45, 'the exit door'), 'the exit door', 'end');
}
