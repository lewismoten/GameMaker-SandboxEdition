// The way through the game, as orders for the bot. Like a player, it picks up what it can see on
// the way when the detour is short (the quarter in the soap dish, the rubber duck, the dry
// washcloths, the spare coin and candle, every sprig of rosemary), says hello to the friends from
// other songs it passes, and hops over everything that hurts.
import { CANDLES, COINS, MON, PINK, SALT, SEQ } from '../src/ids';
import { ORIGIN } from '../src/levels/maps';
import { Bot } from './bot';

const expect = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
};

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** Runs the last order of an act: it must take the man into the next scene (or the ending). */
async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/**
 * Plays a stretch where moving things can catch the man out: if it costs a life or more than
 * `maxLoss` dignity (or goes wrong), it is taken back and played again after a short wait, so
 * he sets out at a better moment.
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
      bot.say(`${label}: waited ${wait} ticks, lost ${loss} dignity`);
      return;
    }
    why = `lost ${loss} dignity, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})\n${bot.log.slice(-10).join('\n')}`);
}

export const salt = (bot: Bot) => bot.sim.meter(SALT) - 1;
export const coins = (bot: Bot) => bot.sim.meter(COINS) - 1;
export const candles = (bot: Bot) => bot.sim.meter(CANDLES) - 1;
export const pink = (bot: Bot) => bot.sim.meter(PINK) - 1;
export const brine = (bot: Bot) => bot.sim.meter(SEQ.throw);

/** I. Cursed in the Shower: up the steam to the rack, over the towel, through the tub, the toilet, the sink's shelf, the hamper, the bucket. */
export async function bathroom(bot: Bot): Promise<void> {
  expect(bot, 2, 'the bathroom');
  await carefully(bot, 'up the steam to the silver rack', 0, async () => {
    await must(bot, bot.walk(2, 'into the steam'), 'steam');
    await must(bot, bot.until(undefined, () => bot.px.y <= 4 * 20 + 4, 'lifted by the steam', 120), 'lift');
    await must(bot, bot.hop('up', 8, 'right', 3), 'onto the rack');
    if (salt(bot) < 1) throw new Error(`no salt on the rack (${salt(bot)})`);
  });
  await carefully(bot, 'past the drips, over the towel', 0, async () => {
    await must(bot, bot.walk(8, 'before the towel'), 'towel');
    await must(bot, bot.hop('right', 12, 'right', 10.4), 'over the towel');
  });
  await carefully(bot, 'the tub', 0, async () => {
    await must(bot, bot.hop('right', 10, 'right', 12.5), 'into the bathwater');
    await must(bot, bot.walk(15, 'the rubber duck'), 'duck');
    await must(bot, bot.hop('up', 12, 'right', 15.2), 'up to the shelf');
    await must(bot, bot.walk(17, 'the quarter in the soap dish'), 'quarter');
    if (salt(bot) < 2) throw new Error(`no salt on the shelf (${salt(bot)})`);
    await must(bot, bot.walk(18.6, 'the end of the shelf'), 'end');
  });
  await carefully(bot, 'over the soap, the toilet', 0, async () => {
    await must(bot, bot.hop('right', 8, 'right', 24), 'over the grapefruit soap');
    await must(bot, bot.hop('right', 12, 'right', 26), 'up on the tank');
    if (salt(bot) < 3) throw new Error(`no salt on the tank (${salt(bot)})`);
    await must(bot, bot.walk(28, 'down by the sink'), 'sink');
  });
  await carefully(bot, 'the sink and the shelf over the mirror', 0, async () => {
    await must(bot, bot.hop('up', 12, 'right', 29), 'up on the sink');
    await must(bot, bot.hop('up', 12, 'left', 28.4), 'up to the shelf');
    await must(bot, bot.walk(28, 'the jar'), 'jar');
    if (salt(bot) < 4) throw new Error(`no salt over the mirror (${salt(bot)})`);
    await must(bot, bot.hop('right', 12, 'right', 34.5), 'over the mango soap, off the shelf, over the cracked tile');
  });
  await carefully(bot, 'the hamper, the washcloth, the bucket', 0, async () => {
    await must(bot, bot.walk(36, 'by the hamper'), 'hamper');
    await must(bot, bot.hop('right', 12, 'right', 37), 'up on the hamper');
    if (salt(bot) < 5) throw new Error(`only ${salt(bot)} salt`);
    await must(bot, bot.walk(40, 'the dry washcloth'), 'cloth');
    await must(bot, bot.hop('right', 12, 'right', 42.8), 'over the cracked tile');
    await leave(bot, bot.walk(45, 'the mop bucket'), 'the bucket');
  });
}

/** Where the monsters numbered `n` are (level blocks, their left edges). */
export function where(bot: Bot, n: number): { x: number; y: number }[] {
  const w = bot.sim.w;
  return w.mi.map((mi, i) => ({ mi, n: w.mm[i]?.monnum })).filter((m) => m.n === n).map(({ mi }) => ({ x: mi.curx[0] - ORIGIN + mi.curx[1] / 20, y: mi.cury[0] - ORIGIN + mi.cury[1] / 20 }));
}

/** Throws brine to the right until no wild loofah is left between columns `x0` and `x1` on row `y`. */
async function tame(bot: Bot, x0: number, x1: number, y: number, what: string): Promise<void> {
  for (let k = 0; k < 6; k++) {
    if (!where(bot, MON.feral).some((m) => m.x >= x0 && m.x <= x1 && Math.abs(m.y - y) < 0.6)) {
      bot.say(`${what} tamed`);
      return;
    }
    if (brine(bot) <= 0) throw new Error(`out of brine at ${what}`);
    await must(bot, bot.hold('space', 2), 'a throw');
    await must(bot, bot.wait(10), 'the splash flies');
  }
  throw new Error(`${what} still wild`);
}

/** II. The forest-dark aisle: shelves, trees and vines; rosemary, seven coins, four wild loofahs, the checkout. */
export async function aisle(bot: Bot): Promise<void> {
  expect(bot, 3, 'the aisle');
  const start = coins(bot);
  await carefully(bot, 'the first shelving', 0, async () => {
    await must(bot, bot.walk(6.4, 'by the shelves'), 'shelves');
    await must(bot, bot.hop('up', 12, 'right', 8), 'up on the bottom shelf');
    await must(bot, bot.walk(9, 'the coin'), 'coin');
    await must(bot, bot.hop('up', 12, 'right', 10.6), 'up on the top shelf');
    await must(bot, bot.walk(11, 'the rosemary'), 'rosemary');
    if (brine(bot) < 3) throw new Error(`no brine (${brine(bot)})`);
  });
  await carefully(bot, 'up the vine, over the first tree', 0, async () => {
    await must(bot, bot.hop('right', 4, 'right', 13), 'onto the vine');
    await must(bot, bot.dig('up', 3, 'up the vine'), 'climb');
    await must(bot, bot.walk(14, 'the coin on the tree'), 'coin');
    await must(bot, bot.walk(16, 'down off the tree'), 'down');
    await must(bot, bot.hop('right', 12, 'right', 19.6), 'over the brambles');
  });
  await carefully(bot, 'the second shelving, a wild loofah on it', 0, async () => {
    await must(bot, bot.hop('up', 12, 'right', 20), 'up on the shelf');
    await tame(bot, 19, 24, 8, 'the wild loofah on the shelf');
    await must(bot, bot.walk(22, 'the coin'), 'coin');
    await must(bot, bot.walk(23, 'the tame loofah'), 'tame');
    await must(bot, bot.hop('up', 12, 'right', 24), 'up on the top shelf');
    if (brine(bot) < 4) throw new Error(`no rosemary up top (${brine(bot)})`);
  });
  await carefully(bot, 'the bakery bin, Loaf #13', 0, async () => {
    await must(bot, bot.hop('right', 6, 'right', 27), 'down off the shelves');
    await must(bot, bot.walk(27.2, 'by the bin'), 'bin');
    await must(bot, bot.hop('up', 12, 'right', 28), 'hello, Loaf #13');
    await must(bot, bot.walk(30, 'the coin by the bin'), 'coin');
  });
  await carefully(bot, 'up the gourd vine, over the second tree', 0, async () => {
    await must(bot, bot.walk(33, 'into the gourd vine'), 'vine');
    await must(bot, bot.dig('up', 2, 'up to the coin'), 'climb');
    await must(bot, bot.dig('down', 3.9, 'back down to the treetop'), 'down');
    await must(bot, bot.walk(34, 'on the treetop'), 'top');
    await must(bot, bot.walk(36, 'down off the tree'), 'down');
  });
  await carefully(bot, 'the wild loofah in the spices', 0, async () => {
    await tame(bot, 36, 42, 11, 'the wild loofah by the spices');
    const t = where(bot, MON.tame).find((m) => m.x > 36 && m.x < 43 && Math.round(m.y) === 11);
    if (t) await must(bot, bot.walk(Math.min(41, t.x + 0.6), 'the tame loofah'), 'tame');
    await must(bot, bot.walk(38.4, 'by the spice rack'), 'spices');
    await must(bot, bot.hop('up', 12, 'right', 39), 'up on the spice rack');
    await must(bot, bot.walk(42, 'the rosemary by the mustard seed'), 'rosemary');
  });
  await carefully(bot, 'over the brambles, up the third tree', 0, async () => {
    await must(bot, bot.hop('right', 10, 'right', 46), 'over the brambles onto the vine');
    await must(bot, bot.dig('up', 4.9, 'up the vine'), 'climb');
    await must(bot, bot.walk(47, 'the coin on the tree'), 'coin');
    await must(bot, bot.walk(48.6, 'down off the tree'), 'down');
    await must(bot, bot.hop('right', 12, 'right', 51.6), 'over the brambles');
  });
  await carefully(bot, 'the last shelving', 0, async () => {
    await tame(bot, 52, 60, 11, 'the last wild loofah');
    await must(bot, bot.walk(52.4, 'by the shelves'), 'shelves');
    await must(bot, bot.hop('up', 12, 'right', 53), 'up on the shelf');
    await must(bot, bot.hop('up', 12, 'right', 55), 'up on the top shelf');
    await must(bot, bot.hop('right', 6, 'right', 56), 'down to the tame loofah');
    await must(bot, bot.walk(59, 'the spare coin'), 'coin');
    if (coins(bot) - start < 6) throw new Error(`only ${coins(bot) - start} coins`);
  });
  await carefully(bot, 'the checkout', 0, async () => {
    await leave(bot, bot.walk(62, 'the checkout'), 'the checkout');
  });
}

/** III. You Crossed a Line: home in the dark, seven candles lit (six needed), the bathroom door. */
export async function home(bot: Bot): Promise<void> {
  expect(bot, 4, 'home');
  const start = candles(bot);
  await carefully(bot, 'the bedroom', 0, async () => {
    await must(bot, bot.walk(8, 'the candle on the night stand'), 'stand');
    await must(bot, bot.hop('right', 12, 'right', 12.2), 'over the creaky board onto the dresser');
    await must(bot, bot.walk(13, 'the candle on the dresser'), 'dresser');
    await must(bot, bot.walk(15, 'down off the dresser'), 'down');
  });
  await carefully(bot, 'past Teddy, the shelf, the hall table', 0, async () => {
    await must(bot, bot.walk(19.4, 'before Teddy'), 'teddy');
    await must(bot, bot.hop('right', 12, 'right', 23), 'over Teddy');
    await must(bot, bot.walk(25.4, 'under the shelf'), 'shelf');
    await must(bot, bot.hop('up', 12, 'right', 26), 'the candle on the shelf');
    await must(bot, bot.hop('right', 6, 'right', 29), 'down off the shelf');
    await must(bot, bot.walk(30.2, 'by the hall table'), 'table');
    await must(bot, bot.hop('up', 12, 'right', 31), 'the candle on the hall table');
  });
  await carefully(bot, 'the linen closet, the screaming towel, Gwinn', 0, async () => {
    await must(bot, bot.hop('right', 4, 'right', 34.4), 'down off the table');
    await must(bot, bot.hop('up', 12, 'right', 36), 'up on the linen closet');
    if (candles(bot) - start < 5) throw new Error(`only ${candles(bot) - start} candles by the linen closet`);
    await must(bot, bot.hop('right', 12, 'right', 41.6), 'over the screaming towel');
    await must(bot, bot.hop('right', 12, 'right', 45), 'over Gwinn');
    await must(bot, bot.walk(45.8, 'before the creaky board'), 'board');
    await must(bot, bot.hop('right', 12, 'right', 48.6), 'over the creaky board');
  });
  await carefully(bot, 'the bookcase', 0, async () => {
    await must(bot, bot.walk(49.4, 'by the bookcase'), 'bookcase');
    await must(bot, bot.hop('up', 12, 'right', 50), 'up on the bottom shelf');
    await must(bot, bot.hop('up', 12, 'right', 51), 'the candle on the top shelf');
  });
  await carefully(bot, 'over the last towel, the candle on the floor', 0, async () => {
    await must(bot, bot.hop('right', 12, 'right', 58), 'over the screaming towel');
    if (candles(bot) - start < 6) throw new Error(`only ${candles(bot) - start} candles`);
  });
  await carefully(bot, 'the bathroom door', 0, async () => {
    await leave(bot, bot.walk(67, 'the bathroom door'), 'the bathroom');
  });
}

/** Is any of these monsters still about? */
const alive = (bot: Bot, mons: number[]) => bot.sim.w.mm.some((m) => mons.includes(m.monnum));
const SPONGE_A = [MON.spongeA0, MON.spongeA1, MON.spongeA2, MON.spongeA3];
const SPONGE_B = [MON.spongeB0, MON.spongeB1, MON.spongeB2, MON.spongeB3];
/** IV. Scrubbus Maximus: the rosemary and the washcloth on the way, over the drain, the demon sponge cleansed top and bottom, the pink one, her rack. */
export async function shower(bot: Bot): Promise<void> {
  expect(bot, 5, 'the shower');
  expect(bot, 5, 'the reckoning');
  await carefully(bot, 'the rosemary on the caddy', 20, async () => {
    if (process.env.BOT_THROW) bot.say(`brine ${brine(bot)} at the start`);
    await must(bot, bot.walk(5, 'under the first tiles'), 'tiles');
    await must(bot, bot.hop('up', 12), 'the rosemary on the caddy');
    await must(bot, bot.walk(6, 'the end of the tiles'), 'end');
    await must(bot, bot.hop('right', 10, 'right', 9), 'the rosemary up on the next shelf');
    if (bot.at.y !== 4) throw new Error(`not up on the caddy (${bot.at.y})`);
    await must(bot, bot.walk(7.2, 'off the tiles'), 'off');
    await must(bot, bot.walk(8, 'the dry washcloth'), 'washcloth');
  });
  await carefully(bot, 'over the drain', 20, async () => {
    await must(bot, bot.walk(10.8, 'the edge of the drain'), 'edge');
    await must(bot, bot.hop('right', 12, 'right', 16), 'over the drain');
    await must(bot, bot.land(), 'land');
    if (bot.at.y === 9) await must(bot, bot.hop('up', 12), 'up to the rosemary on the caddy');
    await must(bot, bot.walk(17, 'the end of the tiles'), 'end');
    await must(bot, bot.hop('right', 4, 'right', 20), 'the rosemary on the last shelf');
    if (bot.at.y !== 6) throw new Error(`not up on the last shelf (${bot.at.y})`);
    await must(bot, bot.walk(21, 'down off the tiles'), 'down');
  });
  if (process.env.BOT_THROW) bot.say(`brine ${brine(bot)} before the sponge`);
  await carefully(bot, 'Scrubbus Maximus', 60, async () => {
    for (let k = 0; k < 40 && (alive(bot, SPONGE_A) || alive(bot, SPONGE_B)); k++) {
      if (brine(bot) <= 0) throw new Error('out of brine');
      await must(bot, bot.hold('space', 2), 'a throw');
      await must(bot, bot.wait(12), 'the splash flies');
      if (process.env.BOT_THROW) bot.say(`threw: brine ${brine(bot)} sponge ${bot.sim.w.mm.filter((m) => m.monnum >= MON.spongeA0 && m.monnum <= MON.spongeB3).map((m) => m.monnum).join(',')} splash ${bot.sim.w.mm.filter((m) => m.monnum === MON.brine).length}`);
    }
    if (alive(bot, SPONGE_A) || alive(bot, SPONGE_B)) throw new Error('the demon sponge still stands');
    bot.say('Scrubbus Maximus cleansed');
  });
  await carefully(bot, 'the pink one', 30, async () => {
    await must(bot, bot.walk(23.6, 'under the pink one'), 'pink');
    await must(bot, bot.hop('up', 6), 'the pink one');
    if (pink(bot) < 1) throw new Error('no pink one');
    await leave(bot, bot.walk(31, 'her silver rack'), 'her rack');
  });
}
