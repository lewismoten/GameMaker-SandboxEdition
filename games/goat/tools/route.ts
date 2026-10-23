// The way through the game, as orders for the bot: out of the fold with the wool, past the
// cousin in the wall, through Bethlehem's alley (laundry, census), across the caravan's
// camel lanes and past the cousin on the ridge, and into the stable to the empty place,
// third from the left.
import { ORIGIN } from '../src/levels/maps';
import { BLOCK, Bot } from './bot';

const expect = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
};

/**
 * A level's first few ticks, then standing still while any clip it starts with plays out (in
 * the fold a lamb bumps her on the third tick: "Yay"), so the bot's first sound doesn't cut
 * it off.
 */
async function hearTheStart(bot: Bot): Promise<void> {
  if ((await bot.wait(5)) || (await bot.sim.waitForClip())) throw new Error('a scene change at the start');
}

async function must(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/**
 * Plays a stretch where moving monsters can catch the goat out: if it costs a life or more
 * than `maxLoss` hit points (or gets stuck), it is taken back and played again after a short
 * wait, so she steps out at a better moment.
 */
export async function carefully(bot: Bot, label: string, maxLoss: number, stretch: () => Promise<void>): Promise<void> {
  const start = bot.snapshot();
  const hp = bot.sim.ci.hitpts;
  const deaths = bot.sim.deaths;
  let why = '';
  // first picking up the loot on the way; if no moment is safe for that, sticking to the way
  for (const forage of [true, false])
    for (let wait = 0; wait <= 240; wait += 6) {
      bot.restore(start);
      bot.forage = forage;
      try {
        if (wait && (await bot.wait(wait))) throw new Error('a scene change while waiting');
        await stretch();
      } catch (e) {
        why = String(e).split('\n')[0];
        if (process.env.BOT_WHY) console.log(`${label} forage ${forage} wait ${wait}: ${String(e).split('\n')[0]}\n${bot.log.slice(-40).join('\n')}`);
        continue;
      } finally {
        bot.forage = true;
      }
      const loss = hp - bot.sim.ci.hitpts;
      if (bot.sim.deaths === deaths && loss <= maxLoss) {
        bot.say(`${label}: waited ${wait} ticks${forage ? '' : ' (no detours)'}, lost ${loss} hit points`);
        return;
      }
      why = `lost ${loss} hit points, ${bot.sim.deaths - deaths} lives`;
    }
  throw new Error(`${label}: no safe moment (${why})`);
}

/** 1. The shepherds' field. */
export async function theField(bot: Bot): Promise<void> {
  expect(bot, 2, "the shepherds' field");
  await hearTheStart(bot);
  await carefully(bot, 'the fold', 10, async () => {
    await must(bot, bot.goto(2, 2, 'wool'), 'wool');
    await must(bot, bot.goto(3, 5, 'wool'), 'wool');
    await must(bot, bot.goto(8, 4, 'through the rope'), 'gate');
  });
  await carefully(bot, 'the field', 12, async () => {
    await must(bot, bot.take(11, 4, 'down', 'a thistle'), 'thistle');
    await must(bot, bot.take(19, 4, 'left', 'wool on the thorns'), 'wool');
    await must(bot, bot.take(13, 13, 'left', 'wool on the thorns'), 'wool');
    await must(bot, bot.goto(4, 14, 'the thistles and the star in the lower field'), 'lower field');
    await must(bot, bot.take(17, 9, 'down', 'hay'), 'hay');
    await must(bot, bot.goto(24, 8, 'the gap in the wall'), 'gap');
  });
  await carefully(bot, 'the cousin in the gap', 10, async () => {
    await must(bot, bot.scream('right'), 'scream');
    await must(bot, bot.goto(27, 8, 'past the fainted cousin'), 'past');
  });
  await carefully(bot, 'beyond the wall', 12, async () => {
    await must(bot, bot.take(31, 9, 'left', 'wool on the thorns'), 'wool');
    await must(bot, bot.take(28, 16, 'up', 'wool on the thorns'), 'wool');
    await must(bot, bot.goto(36, 13, 'the goat bell'), 'bell');
    await must(bot, bot.take(35, 1, 'down', 'wool on the thorns'), 'wool');
  });
  await carefully(bot, 'the double wall', 10, async () => {
    await must(bot, bot.goto(37, 8, 'the double wall'), 'wall');
    await must(bot, bot.goto(38, 8, 'nose to nose'), 'wall');
    await must(bot, bot.scream('right'), 'scream');
    await must(bot, bot.scream('right'), 'scream again');
    await must(bot, bot.goto(41, 8, 'over two fainted cousins'), 'past');
  });
  await carefully(bot, "the shepherds' camp", 12, async () => {
    await must(bot, bot.take(42, 5, 'down', 'wool on the thorns'), 'wool');
    await must(bot, bot.goto(43, 16, 'hay and a thistle by the camp'), 'hay');
    await must(bot, bot.take(50, 14, 'left', 'wool on the thorns'), 'wool');
  });
  if (bot.wool < 5) throw new Error(`only ${bot.wool} wool`);
  const r = await bot.goto(51, 8, 'the road to Bethlehem');
  if (r !== 'link') throw new Error(`the field's exit: ${r}`);
}

/** 2. Bethlehem. */
export async function bethlehem(bot: Bot): Promise<void> {
  expect(bot, 3, 'Bethlehem');
  await hearTheStart(bot);
  await carefully(bot, 'the market', 20, async () => {
    await must(bot, bot.take(9, 6, 'down', 'a cabbage'), 'cabbage');
    await must(bot, bot.goto(2, 4, 'the sandal'), 'sandal');
  });
  await carefully(bot, 'across the square', 20, async () => {
    await must(bot, bot.goto(25, 10, 'a star in the square'), 'star');
    await must(bot, bot.goto(38, 4, 'another sandal, and a star'), 'sandal');
    await must(bot, bot.goto(38, 10, 'and another'), 'sandal');
    await must(bot, bot.goto(33, 12, 'the alley'), 'alley');
  });
  await carefully(bot, 'the alley', 10, async () => {
    // the laundry and the census are the way itself; no detours past the sleeping cousin
    bot.forage = false;
    await must(bot, bot.goto(33, 13, 'the cousin in the alley'), 'alley');
    await must(bot, bot.scream('down'), 'scream');
    await must(bot, bot.goto(33, 16, 'past the cousin and the laundry'), 'laundry');
    await must(bot, bot.goto(33, 20, 'past the laundry and the census'), 'census');
  });
  const r = await bot.goto(33, 21, 'out to the caravan');
  if (r !== 'link') throw new Error(`Bethlehem's exit: ${r}`);
}

/** 3. The caravan. */
export async function theCaravan(bot: Bot): Promise<void> {
  expect(bot, 4, 'the caravan');
  await hearTheStart(bot);
  // the kneeling camels' lines of spit
  for (let x = 30; x <= 38; x++) bot.avoid.set(`${x + 2},${18 + 2}`, 30);
  for (let x = 1; x <= 9; x++) bot.avoid.set(`${x + 2},${20 + 2}`, 30);
  await carefully(bot, 'the north camp', 15, async () => {
    await must(bot, bot.take(9, 3, 'up', 'hay'), 'hay');
    await must(bot, bot.goto(18, 2, 'wool'), 'wool');
    await must(bot, bot.take(31, 3, 'left', 'wool on the thorns'), 'wool');
    await must(bot, bot.goto(37, 1, 'a star'), 'star');
  });
  await carefully(bot, 'across the camel lanes', 15, async () => {
    await must(bot, bot.goto(25, 11, 'a star by the tents'), 'star');
    await must(bot, bot.goto(31, 12, 'past the camels'), 'lanes');
  });
  await carefully(bot, 'the gifts', 15, async () => {
    await must(bot, bot.goto(19, 13, 'above the ridge'), 'ridge');
    await must(bot, bot.goto(19, 14, 'the gap in the ridge'), 'ridge');
  });
  await carefully(bot, 'the cousin on the ridge', 10, async () => {
    await must(bot, bot.scream('down'), 'scream');
    await must(bot, bot.goto(19, 17, 'past the fainted cousin'), 'past');
  });
  await carefully(bot, 'the spitting camels', 15, async () => {
    await must(bot, bot.goto(13, 16, 'wool'), 'wool');
    await must(bot, bot.goto(38, 21, 'the stable door'), 'door');
  });
  bot.avoid.clear();
  const r = await bot.goto(39, 21, 'into the stable');
  if (r !== 'link') throw new Error(`the caravan's exit: ${r}`);
}

/** 4. The stable. */
export async function theStable(bot: Bot): Promise<void> {
  expect(bot, 5, 'the stable');
  await hearTheStart(bot);
  await carefully(bot, 'the stable', 20, async () => {
    await must(bot, bot.take(3, 13, 'up', 'hay in the corner'), 'hay');
    await must(bot, bot.goto(2, 6, 'wool'), 'wool');
    await must(bot, bot.take(9, 3, 'down', 'the dusty straw by Joseph'), 'dust');
    await must(bot, bot.goto(12, 9, 'the rope at the foot of the aisle'), 'aisle');
  });
  if (bot.wool < 5) throw new Error(`only ${bot.wool} wool at the manger`);
  // five wool drops the rope ("Hey..."), she walks up the aisle, and at its head she waits,
  // as a player would, until the line is open and nobody leans in, then steps into her place
  await carefully(bot, 'the gap in the line', 12, async () => {
    const r = await bot.push('up', 4);
    if (r) throw new Error(`the rope: ${r}`);
    bot.say('offered the wool');
    await must(bot, bot.goto(12, 5, 'the head of the aisle'), 'aisle');
    const place = bot.sim.blockAt(12 + ORIGIN, 4 + ORIGIN);
    const open = BLOCK.get('placeOpen')!;
    let waited = 0;
    while (bot.sim.w.blkmap[place] !== open || bot.sim.w.nxtchg[place] - bot.sim.w.clock < 8) {
      if (await bot.tick()) throw new Error('a scene change while waiting for the gap');
      if (++waited > 200) throw new Error('the gap never opened');
    }
    bot.say(`the gap opened (waited ${waited} ticks at the head of the aisle)`);
    const end = await bot.goto(12, 4, 'third from the left');
    if (end !== 'end') throw new Error(`the stable's end: ${end}`);
  });
}
