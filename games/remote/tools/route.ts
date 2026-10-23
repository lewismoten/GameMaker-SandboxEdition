// The way through the game, as orders for the bot: search the living room (the cushions, the
// afghan, Teddy, the cat, the magazines, the laundry) and ask the Voice-O-Matic, through the
// baby gate; gather Mom's number off the kitchen floor, open the fridge and call her; gather
// ten pennies in the void and pay the TV; ride the living room ride to the VCR, press PLAY,
// get off at the EXIT and sit back down.
import { DIGITS, DIGITS_NEEDED, MONEY, PENNIES_NEEDED, PLAY, SPOTS, SPOTS_NEEDED } from '../src/ids';
import { Bot } from './bot';

const expect = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
};

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** Runs the last order of a level: it must take you into the next scene (or the ending). */
async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** Opens a solid door at (x, y) by pushing into it from `side`, and steps through it into the next scene. */
async function through(bot: Bot, x: number, y: number, side: 'up' | 'down' | 'left' | 'right', what: string): Promise<void> {
  const r = await bot.take(x, y, side, what);
  if (r === 'link' || r === 'end') return;
  if (r) throw new Error(`${what}: ${r}\n${bot.log.slice(-8).join('\n')}`);
  await leave(bot, bot.goto(x, y, `through ${what}`), what);
}

/**
 * Plays a stretch where moving monsters can catch you out: if it costs a life or more than
 * `maxLoss` patience (or goes wrong), it is taken back and played again after a short wait, so
 * you set out at a better moment.
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
      bot.say(`${label}: waited ${wait} ticks, lost ${loss} patience`);
      return;
    }
    why = `lost ${loss} patience, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})\n${bot.log.slice(-10).join('\n')}`);
}

/** 1. The living room: six spots searched (eight, to be thorough), and through the baby gate. */
export async function theLivingRoom(bot: Bot): Promise<void> {
  expect(bot, 2, 'the living room');
  await carefully(bot, 'the cushions', 6, async () => {
    for (const x of [7, 8, 9]) await must(bot, bot.take(x, 7, 'up', 'a couch cushion'), 'cushion');
    await must(bot, bot.goto(10, 2, 'the game controller (NOPE)'), 'pad');
  });
  await carefully(bot, 'Teddy and the afghan', 10, async () => {
    await must(bot, bot.goto(6, 13, 'a penny'), 'penny');
    await must(bot, bot.take(3, 10, 'right', "Teddy's bed"), 'Teddy');
    await must(bot, bot.goto(11, 11, 'the afghan'), 'blanket');
  });
  await carefully(bot, 'the cat and the magazines', 14, async () => {
    await must(bot, bot.goto(19, 5, 'a penny'), 'penny');
    await must(bot, bot.take(23, 3, 'down', 'the magazines'), 'mags');
    await must(bot, bot.take(25, 1, 'down', 'the Voice-O-Matic'), 'gadget');
    await must(bot, bot.take(25, 5, 'left', "the cat's chair"), 'cat');
  });
  await carefully(bot, 'the laundry', 10, async () => {
    await must(bot, bot.take(24, 10, 'up', 'the laundry'), 'laundry');
    await must(bot, bot.goto(25, 14, 'a penny'), 'penny');
  });
  if (bot.count(SPOTS) < SPOTS_NEEDED) throw new Error(`only ${bot.count(SPOTS)} spots searched`);
  await carefully(bot, 'the baby gate', 10, async () => {
    await through(bot, 29, 10, 'left', 'the baby gate');
  });
}

/** 2. The kitchen: seven magnets, the fridge, the drawer, and the phone. */
export async function theKitchen(bot: Bot): Promise<void> {
  expect(bot, 3, 'the kitchen');
  await carefully(bot, 'the west side', 10, async () => {
    await must(bot, bot.goto(6, 2, 'a 5'), '5');
    await must(bot, bot.goto(3, 6, 'the 0'), '0');
    await must(bot, bot.goto(6, 9, 'cold pizza'), 'pizza');
    await must(bot, bot.goto(14, 10, 'a 5'), '5');
  });
  await carefully(bot, 'the drawer and the fridge', 10, async () => {
    await must(bot, bot.take(12, 1, 'down', 'the junk drawer'), 'drawer');
    await must(bot, bot.take(17, 2, 'down', 'the fridge'), 'fridge');
    await must(bot, bot.take(17, 1, 'left', 'the freezer'), 'freezer');
  });
  await carefully(bot, 'the east side', 12, async () => {
    await must(bot, bot.goto(16, 8, 'the 3'), '3');
    await must(bot, bot.goto(21, 6, 'a 5'), '5');
    await must(bot, bot.goto(23, 9, 'a 1'), '1');
    await must(bot, bot.goto(23, 2, 'a 1'), '1');
  });
  if (bot.count(DIGITS) < DIGITS_NEEDED) throw new Error(`only ${bot.count(DIGITS)} digits`);
  await carefully(bot, 'calling Mom', 10, async () => {
    await must(bot, bot.take(26, 2, 'left', 'the phone'), 'the phone');
    await leave(bot, bot.goto(30, 2, 'down the hall'), 'the phone');
  });
}

/** 3. The void between the cushions: pennies, junk, and the pay TV. */
export async function theVoid(bot: Bot): Promise<void> {
  expect(bot, 4, 'the void');
  const stops: [number, number, string][] = [
    [5, 1, 'a penny'],
    [1, 4, 'a penny'],
    [3, 6, 'a pen'],
    [4, 9, 'a penny'],
    [9, 10, 'the TV listings'],
    [2, 13, 'a pen'],
    [2, 15, 'a penny'],
    [5, 15, 'a candy bar'],
    [11, 13, 'a handheld game (NOPE)'],
    [14, 13, 'a penny'],
    [19, 18, 'a penny'],
    [20, 16, 'a pog'],
    [22, 16, 'a penny'],
    [9, 5, 'a calculator (NOPE)'],
    [14, 2, 'a penny'],
    [16, 4, 'a pog'],
    [15, 9, 'the sock from Christmas'],
    [19, 11, 'a penny'],
    [26, 10, 'a spoon'],
    [31, 12, 'a holy crumb (a loaf was here)'],
  ];
  for (const [x, y, what] of stops)
    await carefully(bot, what, 12, async () => {
      await must(bot, bot.goto(x, y, what), what);
    });
  if (bot.count(MONEY) < PENNIES_NEEDED) throw new Error(`only ${bot.count(MONEY)} pennies`);
  await carefully(bot, 'the pay TV', 12, async () => {
    await must(bot, bot.take(31, 17, 'left', 'the pay TV'), 'the pay TV');
    await leave(bot, bot.goto(33, 17, 'through the pay TV'), 'the pay TV');
  });
}

/** 4. The living room ride: in at the gap, up through the ride to the VCR, PLAY, off at the EXIT and along to the couch. */
export async function theRide(bot: Bot): Promise<void> {
  expect(bot, 5, 'the ride');
  await carefully(bot, 'up through the ride', 14, async () => {
    await must(bot, bot.goto(13, 11, 'the gap in the bulbs'), 'gap');
    await must(bot, bot.goto(14, 2, 'the VCR'), 'VCR');
    await must(bot, bot.push('up'), 'PLAY');
  });
  if (bot.count(PLAY) < 1) throw new Error('PLAY never pressed');
  await carefully(bot, 'back down to the couch', 14, async () => {
    await must(bot, bot.take(16, 10, 'up', 'the EXIT'), 'the EXIT');
    await through(bot, 21, 12, 'up', 'the couch');
  });
}
