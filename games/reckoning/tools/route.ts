// The way through the game, as orders for the bot. Like a player, it picks up what it can see on
// the way when the detour is short (the coins on the dresser, the couch and the bookshelf, the
// glasses of water, the TV remote, the milk in the reckoning), and hops over everything noisy.
import { MON, ROLLS, SEQ, STRAW, WILL } from '../src/ids';
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

export const will = (bot: Bot) => bot.sim.meter(WILL) - 1;
export const rolls = (bot: Bot) => bot.sim.meter(ROLLS) - 1;
export const straws = (bot: Bot) => bot.sim.meter(STRAW) - 1;
export const milk = (bot: Bot) => bot.sim.meter(SEQ.throw);

/** I. 3:17 a.m.: out of bed, past the creaky board, the dogs, the basket and the Lego, through the living room to the kitchen. */
export async function bedroom(bot: Bot): Promise<void> {
  expect(bot, 2, 'the bedroom');
  await carefully(bot, 'out of bed', 0, async () => {
    await must(bot, bot.walk(8, 'the night stand'), 'stand');
    await must(bot, bot.hop('right', 10, 'right', 12), 'over the creaky board');
    await must(bot, bot.walk(13, 'by the dresser'), 'dresser');
    await must(bot, bot.hop('up', 12), 'up on the dresser');
    await must(bot, bot.walk(15, 'the coins on the dresser'), 'coins');
    await must(bot, bot.walk(19, 'into the hall'), 'hall');
  });
  await carefully(bot, 'past Teddy and the squeaky toy', 0, async () => {
    await must(bot, bot.walk(20.5, 'before Teddy'), 'teddy');
    await must(bot, bot.hop('right', 12, 'right', 24), 'over Teddy');
    await must(bot, bot.walk(24.8, 'under the shelf'), 'shelf');
    await must(bot, bot.hop('up', 12), 'the coins on the hall shelf');
    await must(bot, bot.walk(26.4, 'along the shelf'), 'along');
    await must(bot, bot.hop('right', 6, 'right', 29.8), 'off the shelf, over the squeaky toy');
  });
  await carefully(bot, 'the basket and the Lego', 0, async () => {
    await must(bot, bot.walk(30, 'by the basket'), 'basket');
    await must(bot, bot.hop('right', 12, 'right', 33), 'over the basket');
    await must(bot, bot.walk(34, 'the coins by the Lego'), 'coins');
    await must(bot, bot.hop('right', 12, 'right', 37.6), 'over the Lego');
  });
  await carefully(bot, 'past Gwinn', 0, async () => {
    await must(bot, bot.walk(38, 'before Gwinn'), 'gwinn');
    await must(bot, bot.hop('right', 12, 'right', 41.5), 'over Gwinn');
    await must(bot, bot.walk(46, 'the glass of water, into the living room'), 'living room');
  });
  await carefully(bot, 'the couch, the remote', 0, async () => {
    await must(bot, bot.hop('right', 12, 'right', 48), 'up on the couch');
    await must(bot, bot.walk(49, 'on the couch'), 'couch');
    await must(bot, bot.hop('up', 8), 'the coins on the couch back');
    await must(bot, bot.walk(53, 'the remote down the side of the couch'), 'remote');
    await must(bot, bot.hop('right', 12, 'right', 56.6), 'over the creaky board');
  });
  await carefully(bot, 'the bookshelf', 0, async () => {
    await must(bot, bot.walk(60.5, 'by the bookshelf'), 'shelf');
    await must(bot, bot.hop('up', 12, 'right', 61.2), 'up on the first shelf');
    await must(bot, bot.hop('up', 12), 'up on the top shelf');
    await must(bot, bot.walk(62, 'the glass of water on top'), 'water');
    await must(bot, bot.hop('right', 6, 'right', 65.6), 'off the shelf, over the Lego');
  });
  await carefully(bot, 'into the kitchen', 0, async () => {
    await leave(bot, bot.walk(68, 'the kitchen door'), 'the kitchen');
  });
}

/** II. The enemy-lover: up onto the counter (Loaf #13, celery), the cabinets, into the fridge and up its shelves for seven sticks of celery, to the cheesecake. */
export async function fridge(bot: Bot): Promise<void> {
  expect(bot, 3, 'the kitchen');
  const start = will(bot);
  await carefully(bot, 'the counter', 0, async () => {
    await must(bot, bot.hop('right', 12, 'right', 4.5), 'up on the counter');
    await must(bot, bot.walk(12, 'the celery by the sink'), 'celery');
    await must(bot, bot.walk(8, 'under the cabinets'), 'cabinets');
    await must(bot, bot.hop('up', 12), 'up on the cabinets');
    await must(bot, bot.walk(12.5, 'along the cabinets'), 'along');
  });
  await carefully(bot, 'the floor, to the fridge', 8, async () => {
    await must(bot, bot.hop('right', 6, 'right', 17), 'down to the floor');
    await must(bot, bot.walk(22, 'the glass of water, to the fridge'), 'fridge');
    await must(bot, bot.hop('right', 6, 'right', 23.5), 'up on the crisper');
    await must(bot, bot.walk(25, 'the celery on the crisper'), 'crisper');
    await must(bot, bot.walk(24, 'under the shelf'), 'under');
    await must(bot, bot.hop('up', 12), 'up through the bottom shelf');
    await must(bot, bot.walk(31, 'along the bottom shelf'), 'shelf');
  });
  await carefully(bot, 'the middle shelf, past the butter', 10, async () => {
    await must(bot, bot.walk(32, 'under the middle shelf'), 'under');
    await must(bot, bot.hop('up', 12), 'up through the middle shelf');
    await must(bot, bot.hop('right', 3, 'right', 39), 'over the butter');
    await must(bot, bot.walk(39, 'the celery on the middle shelf'), 'celery');
  });
  await carefully(bot, 'the top shelf', 10, async () => {
    await must(bot, bot.hop('up', 12), 'up through the top shelf');
    await must(bot, bot.walk(35, 'the celery on the top shelf'), 'celery');
    if (will(bot) - start < 7) throw new Error(`only ${will(bot) - start} celery`);
    await leave(bot, bot.walk(42, 'the cheesecake'), 'the cheesecake');
  });
}

/** III. Oh no: the dash down the hall, the gurgle right behind him, three rolls of toilet paper, the bathroom door. */
export async function dash(bot: Bot): Promise<void> {
  expect(bot, 4, 'the hall');
  const start = rolls(bot);
  /** An E hop over the hazard at column `h`, from wherever he is, landing past it. */
  const over = (h: number, what: string, to = h + 1.6) => must(bot, bot.hop('right', 12, 'right', to), `over ${what}`);
  await carefully(bot, 'the kitchen chairs', 12, async () => {
    await must(bot, bot.walk(7.8, 'by the first chair'), 'chair');
    await over(9, 'the first chair', 10.4);
    await must(bot, bot.walk(11.8, 'by the second chair'), 'chair 2');
    await over(13, 'the second chair', 14.4);
    await must(bot, bot.walk(18, 'before the Lego'), 'lego');
    await over(19, 'the Lego', 20.8);
  });
  await carefully(bot, 'past Teddy, the basket, the squeaky toy', 16, async () => {
    await must(bot, bot.walk(21, 'before Teddy'), 'teddy');
    await over(25, 'Teddy', 28.6);
    await must(bot, bot.walk(28.8, 'by the basket'), 'basket');
    await over(30, 'the basket', 31.6);
    await must(bot, bot.walk(32.8, 'before the squeaky toy'), 'toy');
    await over(34, 'the squeaky toy', 35.8);
  });
  await carefully(bot, 'the linen closet', 16, async () => {
    await must(bot, bot.walk(40, 'under the linen closet'), 'closet');
    await must(bot, bot.hop('up', 12), 'up on the towels');
    await must(bot, bot.walk(41, 'the roll on the shelf'), 'roll');
    await must(bot, bot.hop('right', 6, 'right', 47), 'down off the shelf');
    await must(bot, bot.walk(47, 'the roll on the floor'), 'roll 2');
  });
  await carefully(bot, 'past Gwinn, the creaky board, the Lego, the chair', 16, async () => {
    await must(bot, bot.walk(48.6, 'before Gwinn'), 'gwinn');
    await over(51, 'Gwinn', 54.8);
    await must(bot, bot.walk(55.8, 'before the creaky board'), 'board');
    await over(57, 'the creaky board', 58.6);
    await must(bot, bot.walk(59.8, 'before the Lego'), 'lego');
    await over(61, 'the Lego', 62.6);
    await must(bot, bot.walk(63.8, 'before the chair'), 'chair');
    await over(65, 'the chair', 66.4);
    await must(bot, bot.walk(70.8, 'the glass of water, by the basket'), 'water');
  });
  await carefully(bot, 'the roll on the basket, the last of the noisy things', 16, async () => {
    await must(bot, bot.hop('right', 12, 'right', 72), 'up on the basket');
    await must(bot, bot.walk(72, 'the roll on the basket'), 'roll 3');
    await must(bot, bot.hop('right', 6, 'right', 75), 'down off the basket');
    await must(bot, bot.walk(76.8, 'before the squeaky toy'), 'toy');
    await over(78, 'the squeaky toy', 79.6);
    await must(bot, bot.walk(80.8, 'before the creaky board'), 'board');
    await over(82, 'the creaky board', 83.6);
  });
  if (rolls(bot) - start < 3) throw new Error(`only ${rolls(bot) - start} rolls`);
  await carefully(bot, 'the bathroom door', 16, async () => {
    await leave(bot, bot.walk(93, 'the bathroom door'), 'the bathroom');
  });
}

/** Is any of these monsters still about? */
const alive = (bot: Bot, mons: number[]) => bot.sim.w.mm.some((m) => mons.includes(m.monnum));
const DEVIL_A = [MON.devilA0, MON.devilA1, MON.devilA2, MON.devilA3];
const DEVIL_B = [MON.devilB0, MON.devilB1, MON.devilB2, MON.devilB3];

/** IV. The reckoning: the almond milk, the oat milk and the Lactaid on the way, over the pit, the Devil splashed top and bottom, his last straw, the porcelain throne. */
export async function reckoning(bot: Bot): Promise<void> {
  expect(bot, 5, 'the reckoning');
  await carefully(bot, 'the milk on the tiles', 20, async () => {
    if (process.env.BOT_THROW) bot.say(`milk ${milk(bot)} at the start`);
    await must(bot, bot.walk(5, 'under the first tiles'), 'tiles');
    await must(bot, bot.hop('up', 12), 'the almond milk on the tiles');
    await must(bot, bot.walk(6, 'the end of the tiles'), 'end');
    await must(bot, bot.hop('right', 10, 'right', 9), 'the oat milk up on the next tiles');
    if (bot.at.y !== 4) throw new Error(`not up on the tiles (${bot.at.y})`);
    await must(bot, bot.walk(7.2, 'off the tiles'), 'off');
    await must(bot, bot.walk(8, 'the Lactaid'), 'lactaid');
  });
  await carefully(bot, 'over the pit', 20, async () => {
    await must(bot, bot.walk(10.8, 'the edge of the pit'), 'edge');
    await must(bot, bot.hop('right', 12, 'right', 16), 'over the pit');
    await must(bot, bot.land(), 'land');
    if (bot.at.y === 9) await must(bot, bot.hop('up', 12), 'up to the almond milk on the tiles');
    await must(bot, bot.walk(17, 'the end of the tiles'), 'end');
    await must(bot, bot.hop('right', 4, 'right', 20), 'the oat milk on the last tiles');
    if (bot.at.y !== 6) throw new Error(`not up on the last tiles (${bot.at.y})`);
    await must(bot, bot.walk(21, 'down off the tiles'), 'down');
  });
  if (process.env.BOT_THROW) bot.say(`milk ${milk(bot)} before the Devil`);
  await carefully(bot, 'the Devil', 60, async () => {
    for (let k = 0; k < 40 && (alive(bot, DEVIL_A) || alive(bot, DEVIL_B)); k++) {
      if (milk(bot) <= 0) throw new Error('out of almond milk');
      await must(bot, bot.hold('space', 2), 'a throw');
      await must(bot, bot.wait(12), 'the splash flies');
      if (process.env.BOT_THROW) bot.say(`threw: milk ${milk(bot)} devil ${bot.sim.w.mm.filter((m) => m.monnum >= MON.devilA0 && m.monnum <= MON.devilB3).map((m) => m.monnum).join(',')} splash ${bot.sim.w.mm.filter((m) => m.monnum === MON.splash).length}`);
    }
    if (alive(bot, DEVIL_A) || alive(bot, DEVIL_B)) throw new Error('the Devil still stands');
    bot.say('the Devil splashed away');
  });
  await carefully(bot, 'his last straw', 30, async () => {
    await must(bot, bot.walk(23.6, 'under the straw'), 'straw');
    await must(bot, bot.hop('up', 6), 'the straw');
    if (straws(bot) < 1) throw new Error('no straw');
    await leave(bot, bot.walk(31, 'the porcelain throne'), 'the throne');
  });
}
