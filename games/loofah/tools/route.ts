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
async function carefully(bot: Bot, label: string, maxLoss: number, stretch: () => Promise<void>): Promise<void> {
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

const salt = (bot: Bot) => bot.sim.meter(SALT) - 1;
const coins = (bot: Bot) => bot.sim.meter(COINS) - 1;
const candles = (bot: Bot) => bot.sim.meter(CANDLES) - 1;
const pink = (bot: Bot) => bot.sim.meter(PINK) - 1;
const brine = (bot: Bot) => bot.sim.meter(SEQ.throw);

/** I. Cursed in the Shower: up the steam to the rack, over the towel, through the tub, the toilet, the sink's shelf, the hamper, the bucket. */
export async function bathroom(bot: Bot): Promise<void> {
  expect(bot, 2, 'the bathroom');
  await carefully(bot, 'up the steam to the silver rack', 0, async () => {
    await must(bot, bot.walk(2, 'into the steam'), 'steam');
    await must(
      bot,
      bot.until(undefined, () => bot.px.y <= 4 * 20 + 4, 'lifted by the steam', 120),
      'lift',
    );
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
    await must(bot, bot.hop('right', 12, 'right', 24), 'over the grapefruit soap');
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
    await leave(bot, bot.walk(50, 'the door past the mop bucket'), 'the bucket');
  });
}

/** Where the monsters numbered `n` are (level blocks, their left edges). */
function where(bot: Bot, n: number): { x: number; y: number }[] {
  const w = bot.sim.w;
  return w.mi
    .map((mi, i) => ({ mi, n: w.mm[i]?.monnum }))
    .filter((m) => m.n === n)
    .map(({ mi }) => ({ x: mi.curx[0] - ORIGIN + mi.curx[1] / 20, y: mi.cury[0] - ORIGIN + mi.cury[1] / 20 }));
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
    await must(bot, bot.walk(15, 'the coin by the treetop'), 'coin');
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
    await must(bot, bot.walk(48, 'the coin by the treetop'), 'coin');
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

/** III. You Crossed a Line: the candles on the night stand and the dresser, the hall table past a screaming towel, over the next towel to the stairs, up them, and back along the landing for the shelf, the table and the linen closet, to the bathroom door. */
export async function home(bot: Bot): Promise<void> {
  expect(bot, 4, 'home');
  const start = candles(bot);
  await carefully(bot, 'the bedroom', 0, async () => {
    await must(bot, bot.walk(8, 'the candle on the night stand'), 'stand');
    await must(bot, bot.hop('right', 12, 'right', 12.2), 'onto the dresser');
    await must(bot, bot.walk(13, 'the candle on the dresser'), 'dresser');
    await must(bot, bot.walk(15, 'down off the dresser'), 'down');
  });
  await carefully(bot, 'past the towel, the hall table', 0, async () => {
    await must(bot, bot.walk(17.4, 'by the doorway'), 'doorway');
    await must(bot, bot.hop('right', 12, 'right', 23), 'over the screaming towel');
    await must(bot, bot.walk(24.2, 'by the hall table'), 'table');
    await must(bot, bot.hop('up', 12, 'right', 25), 'the candle on the hall table');
  });
  await carefully(bot, 'over the towel, up the stairs', 0, async () => {
    await must(bot, bot.hop('right', 12, 'right', 32), 'over the screaming towel');
    if (candles(bot) - start < 3) throw new Error(`only ${candles(bot) - start} candles downstairs`);
    await must(bot, bot.walk(39, 'under the first stair'), 'stairs');
    await must(bot, bot.hop('up', 12), 'the first stair');
    await must(bot, bot.hop('left', 12, 'left', 37), 'the second stair');
    await must(bot, bot.hop('left', 12, 'left', 35), 'the third stair');
    await must(bot, bot.hop('left', 12, 'left', 32.6), 'up onto the landing');
    if (bot.at.y !== 6) throw new Error(`not up on the landing (${bot.at.y})`);
  });
  await carefully(bot, 'the shelf, over the towel to the landing table', 0, async () => {
    await must(bot, bot.walk(29.2, 'under the shelf'), 'shelf');
    await must(bot, bot.hop('up', 12), 'up on the shelf');
    await must(bot, bot.walk(28, 'the candle on the shelf'), 'candle');
    await must(bot, bot.hop('left', 6, 'left', 21.6), 'down off the shelf, over the towel');
    await must(bot, bot.walk(20.8, 'by the landing table'), 'table');
    await must(bot, bot.hop('up', 12, 'left', 20), 'the candle on the landing table');
    if (bot.at.y !== 5) throw new Error(`not up on the landing table (${bot.at.y})`);
  });
  await carefully(bot, 'over a towel, the linen closet', 0, async () => {
    await must(bot, bot.hop('left', 12, 'left', 14.4), 'off the table, over the towel');
    await must(bot, bot.hop('up', 12), 'up through the linen closet');
    await must(bot, bot.walk(13, 'the candle on the linen closet'), 'candle');
    if (candles(bot) - start < 6) throw new Error(`only ${candles(bot) - start} candles`);
  });
  await carefully(bot, 'over the last towel', 0, async () => {
    await must(bot, bot.hop('left', 12, 'left', 7), 'over the screaming towel');
  });
  await carefully(bot, 'the bathroom door', 0, async () => {
    await leave(bot, bot.walk(1, 'through the bathroom door'), 'the bathroom');
  });
}

/** Is any of these monsters still about? */
const alive = (bot: Bot, mons: number[]) => bot.sim.w.mm.some((m) => mons.includes(m.monnum));
const SPONGE_A = [MON.spongeA0, MON.spongeA1, MON.spongeA2, MON.spongeA3, MON.spongeA1m, MON.spongeA2m, MON.spongeA3m];
const SPONGE_B = [MON.spongeB0, MON.spongeB1, MON.spongeB2, MON.spongeB3, MON.spongeB1m, MON.spongeB2m, MON.spongeB3m];
/** IV. Scrubbus Maximus: the rosemary on the caddy, over the drain, up the steam to the perch, the demon sponge cleansed top and bottom while the suds float by, the pink one off the rim, her rack. */
export async function shower(bot: Bot): Promise<void> {
  expect(bot, 5, 'the shower');
  await carefully(bot, 'the rosemary on the caddy', 0, async () => {
    if (process.env.BOT_THROW) bot.say(`brine ${brine(bot)} at the start`);
    await must(bot, bot.walk(5, 'under the first shelf'), 'shelf');
    await must(bot, bot.hop('up', 12), 'the rosemary on the caddy');
    await must(bot, bot.walk(6, 'the end of the shelf'), 'end');
    await must(bot, bot.hop('right', 10, 'right', 9), 'the rosemary up on the next shelf');
    if (bot.at.y !== 4) throw new Error(`not up on the caddy (${bot.at.y})`);
  });
  await carefully(bot, 'over the drain, the shelf past it', 0, async () => {
    await must(bot, bot.hop('right', 6, 'right', 13.6), 'down off the shelf, over the drain');
    await must(bot, bot.land(), 'land');
    await must(bot, bot.walk(14.2, 'under the shelf'), 'shelf');
    await must(bot, bot.hop('up', 12), 'the rosemary on the shelf');
    await must(bot, bot.walk(15, 'the rosemary'), 'rosemary');
  });
  await carefully(bot, 'up the steam to the perch', 0, async () => {
    await must(bot, bot.walk(17.2, 'down off the shelf'), 'down');
    await must(
      bot,
      bot.until('right', () => bot.px.x >= 18 * 20, 'into the steam', 40),
      'steam',
    );
    await must(
      bot,
      bot.until(undefined, () => bot.px.y <= 3 * 20 + 4, 'lifted by the steam', 160),
      'lift',
    );
    await must(bot, bot.hop('up', 8, 'right', 19.4), 'onto the perch');
    await must(bot, bot.walk(20, 'the rosemary on the perch'), 'rosemary');
    if (bot.at.y !== 3) throw new Error(`not up on the perch (${bot.at.y})`);
  });
  if (process.env.BOT_THROW) bot.say(`brine ${brine(bot)} before the sponge`);
  await carefully(bot, 'Scrubbus Maximus', 20, async () => {
    // Like a player, it watches the suds: before each throw it picks a spot on the perch (staying
    // put if that's safe), or a moment's wait, where the next stretch costs no dignity.
    const PLANS: { d: number; wait: number }[] = [
      { d: 0, wait: 0 },
      { d: -1, wait: 0 },
      { d: 1, wait: 0 },
      { d: 0, wait: 8 },
      { d: -1, wait: 8 },
      { d: 0, wait: 16 },
    ];
    for (let k = 0; k < 60 && (alive(bot, SPONGE_A) || alive(bot, SPONGE_B)); k++) {
      if (brine(bot) <= 0) throw new Error('out of brine');
      const snap = bot.snapshot();
      const here = bot.px.x / 20;
      let best: { loss: number; plan: (typeof PLANS)[number] } | undefined;
      for (const plan of PLANS) {
        const to = here + plan.d;
        if (to < 19 || to > 21) continue;
        bot.restore(snap);
        const hp = bot.sim.ci.hitpts;
        if (plan.d && (await bot.walk(to, 'a safe spot'))) continue;
        if (plan.wait && (await bot.wait(plan.wait))) continue;
        if (await bot.hold('space', 2)) continue;
        if (await bot.wait(14)) continue;
        if (bot.at.y !== 3) continue;
        const loss = hp - bot.sim.ci.hitpts;
        if (!best || loss < best.loss) best = { loss, plan };
        if (!loss) break;
      }
      if (!best) throw new Error('nowhere to throw from');
      bot.restore(snap);
      if (best.plan.d) await must(bot, bot.walk(here + best.plan.d, 'a safe spot'), 'a safe spot');
      if (best.plan.wait) await must(bot, bot.wait(best.plan.wait), 'a moment');
      await must(bot, bot.hold('space', 2), 'a throw');
      await must(bot, bot.wait(14), 'the splash flies');
    }
    if (alive(bot, SPONGE_A) || alive(bot, SPONGE_B)) throw new Error('the demon sponge still stands');
    bot.say('Scrubbus Maximus cleansed');
  });
  await carefully(bot, 'the pink one', 10, async () => {
    const i = bot.sim.w.mm.findIndex((m) => m.monnum === MON.pink);
    const px = i >= 0 ? bot.sim.w.mi[i].curx[0] - ORIGIN + bot.sim.w.mi[i].curx[1] / 20 : 28;
    await must(bot, bot.hop('right', 12, 'right', 24.6), 'across the gap onto the rim');
    if (bot.at.y !== 3) throw new Error(`not up on the rim (${bot.at.y})`);
    await must(bot, bot.walk(px, 'under the pink one'), 'pink');
    await must(bot, bot.hop('up', 6), 'the pink one');
    if (pink(bot) < 1) throw new Error('no pink one');
    await must(bot, bot.walk(30, 'the end of the rim'), 'end');
    // over the soap dish and down: he may land right at her rack, and that ends it
    const off = await bot.hop('right', 12, 'right', 32.4);
    if (off === 'end' || off === 'link') return;
    if (off) throw new Error(`over the soap dish: ${off}`);
    await leave(bot, bot.walk(34, 'her silver rack'), 'her rack');
  });
}
