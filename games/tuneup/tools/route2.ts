// The way through the later neighborhoods, as orders for the bot (route.ts has the first
// ones and the helpers): every instrument picked up, every note rung, out by each door.
import { expectScene as expect } from '@lewismoten/gamemaker-sandbox-tools/kit/routeChecks';
import { BASSES_AT, DUCT_ROW, LIFTS } from '../src/levels/basement';
import { LOFT_ROW, RAIL_X, ROPE_X, VOICES_AT } from '../src/levels/choir';
import { BELL_DOORS, MALLETS_AT } from '../src/levels/clock';
import type { Bot } from './bot';
import { climb, found, leave, must, picked } from './route';

/** Walks to an instrument at level (x, y) from a list of [id, x, y], and checks it was taken. */
async function take(bot: Bot, list: [string, number, number][], id: string): Promise<void> {
  const [, x, y] = list.find(([w]) => w === id)!;
  await must(bot, bot.walk(x, `to the ${id}`), id);
  picked(bot, x, y, `the ${id}`);
}

/** 4. The Choir Loft: two voices among the pews, one on the landing, up the bell rope, the rail, the last voice, out. */
export async function theChoirLoft(bot: Bot): Promise<void> {
  expect(bot, 7, 'the choir loft');
  await must(bot, bot.land(), 'on the floor');
  await take(bot, VOICES_AT, 'aah');
  await take(bot, VOICES_AT, 'ooh');
  // up the two steps, a hymn note on each, to the soprano on the landing
  await take(bot, VOICES_AT, 'soprano');
  await must(bot, bot.walk(ROPE_X, 'back to the bell rope'), 'rope');
  await climb(bot, LOFT_ROW, 'the bell rope');
  await must(bot, bot.walk(RAIL_X, 'along the loft to the rail'), 'loft');
  if (bot.shown(RAIL_X, LOFT_ROW).scorePts) throw new Error('the loft rail did not sing');
  await take(bot, VOICES_AT, 'choir');
  if (found(bot) < 4) throw new Error(`found ${found(bot)} voices, not 4`);
  await leave(bot, bot.walk(0, 'out the loft door'), 'the loft door');
}

/** Stands in a speaker column until its pulses have lifted Teddy to the duct row. */
async function ride(bot: Bot, what: string): Promise<void> {
  await must(
    bot,
    bot.until(undefined, () => bot.px.y <= DUCT_ROW * 20, `up ${what}`, 200),
    what,
  );
}

/** 5. The Basement: up the speaker columns, along the ducts, seven basses, out the door. */
export async function theBasement(bot: Bot): Promise<void> {
  expect(bot, 9, 'the basement');
  await must(bot, bot.land(), 'on the floor');
  await take(bot, BASSES_AT, 'sub-bass');
  await must(bot, bot.walk(LIFTS[0], 'into the first speaker column'), 'speaker');
  await ride(bot, 'the first speaker column');
  await take(bot, BASSES_AT, 'upright-bass');
  // off the end of the duct, down onto the finger bass
  await take(bot, BASSES_AT, 'finger-bass');
  await must(bot, bot.walk(10, 'back along the notes'), 'notes');
  await take(bot, BASSES_AT, 'slap-bass');
  await must(bot, bot.walk(LIFTS[1], 'into the second speaker column'), 'speaker');
  await ride(bot, 'the second speaker column');
  await take(bot, BASSES_AT, 'fretless');
  await take(bot, BASSES_AT, 'punch-bass');
  await take(bot, BASSES_AT, 'sub-round');
  if (found(bot) < 7) throw new Error(`found ${found(bot)} basses, not 7`);
  await leave(bot, bot.walk(32, 'out the door'), 'the door');
}

/**
 * Waits by a door that opens and shuts by itself (a curtain of bells, a drum channel's gate) at
 * level column `x` for it to open (if it is open already, for the next time, as a person waits
 * rather than dash through as it shuts), a person's reaction, then walks through to `to`.
 */
async function throughBells(bot: Bot, x: number, to: number): Promise<void> {
  const open = () => !bot.shown(x, 8).solid;
  let waited = 0;
  while (open()) if ((await bot.tick()) || ++waited > 100) throw new Error(`the bells at ${x} never closed`);
  while (!open()) if ((await bot.tick()) || ++waited > 200) throw new Error(`the bells at ${x} never opened`);
  await must(bot, bot.wait(1 + Math.floor(bot.hand() * 2)), 'reacting');
  await must(bot, bot.walk(to, `through the door at ${x}`), 'door');
}

/** 10. The Clock Tower: ten mallets and bells, three bell curtains that open on the clock, out the top door. */
export async function theClockTower(bot: Bot): Promise<void> {
  expect(bot, 19, 'the clock tower');
  await must(bot, bot.land(), 'on the floor');
  const get = (id: string) => take(bot, MALLETS_AT, id);
  await get('glockenspiel');
  await get('celesta');
  await must(bot, bot.walk(BELL_DOORS[0] - 1, 'to the first bells'), 'door');
  await throughBells(bot, BELL_DOORS[0], 12);
  await get('music-box');
  await get('vibraphone');
  await get('marimba');
  await must(bot, bot.walk(BELL_DOORS[1] - 1, 'to the second bells'), 'door');
  await throughBells(bot, BELL_DOORS[1], 22);
  await get('xylophone');
  await get('chimes');
  await get('steel-drum');
  await must(bot, bot.walk(BELL_DOORS[2] - 1, 'to the third bells'), 'door');
  await throughBells(bot, BELL_DOORS[2], 31);
  await get('tubular-bells');
  await get('vibes-wobbly');
  if (found(bot) < 10) throw new Error(`found ${found(bot)} mallets, not 10`);
  await leave(bot, bot.walk(40, 'out the tower door'), 'the tower door');
}
