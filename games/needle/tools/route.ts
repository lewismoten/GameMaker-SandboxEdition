// The way through the game, as orders for the bot.
import { GOLD, GRACE, THREAD } from '../src/ids';
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

/** Runs the last order of a level: it must take the seed into the next scene (or the ending). */
async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/**
 * Plays a stretch where moving monsters can catch the seed out: if it costs a life or more
 * than `maxLoss` hit points (or goes wrong), it is taken back and played again after a short
 * wait, so the camel sets out at a better moment.
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
      bot.say(`${label}: waited ${wait} ticks, lost ${loss} hit points`);
      return;
    }
    why = `lost ${loss} hit points, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})\n${bot.log.slice(-10).join('\n')}`);
}

/** Something picked up on the way (level block x, y): it must be gone, not still lying there giving points. */
function picked(bot: Bot, x: number, y: number, what: string): void {
  const b = bot.sim.shown(x + ORIGIN, y + ORIGIN);
  if (b.scorePts > 0 || b.chHitPt > 0) throw new Error(`missed ${what} at ${x},${y}`);
}

const gold = (bot: Bot) => bot.sim.meter(GOLD) - 1;
const grace = (bot: Bot) => bot.sim.meter(GRACE) - 1;
const thread = (bot: Bot) => bot.sim.meter(THREAD) - 1;

/** 1. The city gate: the market, the poor, over the roofs, out the needle gate on his knees. */
export async function theCity(bot: Bot): Promise<void> {
  expect(bot, 2, 'the city gate');
  await carefully(bot, 'past the rich man', 12, async () => {
    await must(bot, bot.walk(17, 'past the rich man'), 'rich man');
  });
  await carefully(bot, 'the first stall', 12, async () => {
    await must(bot, bot.walk(23, 'the beggar'), 'beggar');
    // up the crates and a sideways hop onto the stall's awning for the coin glinting there
    await must(bot, bot.walk(26, 'up the crates'), 'crates');
    await must(bot, bot.hop('left', 18, 'left', 20.5), 'onto the awning');
    picked(bot, 20, 5, 'the coin on the awning');
    await must(bot, bot.walk(28, 'the widow'), 'widow');
  });
  await carefully(bot, 'over the roofs', 12, async () => {
    await must(bot, bot.walk(34, 'the children on the roof'), 'roofs');
    await must(bot, bot.walk(39, 'down from the roofs'), 'down');
  });
  await carefully(bot, 'the well and the cart', 12, async () => {
    await must(bot, bot.walk(43, 'the blind man and the well'), 'well');
    await must(bot, bot.walk(53, 'past the cart and the guard'), 'cart');
  });
  await carefully(bot, 'the second stall and the dog', 12, async () => {
    await must(bot, bot.walk(58, 'the end of the stall'), 'stall');
    await must(bot, bot.hop('right', 12, 'right', 63), 'over the dog');
  });
  await carefully(bot, 'the crates', 12, async () => {
    await must(bot, bot.walk(66, 'up the crates to the lamp'), 'crates');
    await must(bot, bot.walk(67.2, 'down to the jar'), 'jar');
    picked(bot, 67, 9, 'the jar by the crates');
    await must(bot, bot.walk(69, 'the needle gate'), 'gate');
  });
  if (gold(bot) !== 6 || grace(bot) !== 4) throw new Error(`gold ${gold(bot)}, grace ${grace(bot)} at the needle gate`);
  await carefully(bot, 'through the needle gate', 10, async () => {
    await must(bot, bot.crawl('right', 72, 'through the needle gate'), 'crawl');
    await leave(bot, bot.walk(77, 'the road'), 'the road');
  });
}

/** 2. The desert road: the sandstorm, the canyon's eye gates on his knees, the oasis, the tent. */
export async function theDesert(bot: Bot): Promise<void> {
  expect(bot, 3, 'the desert road');
  await carefully(bot, 'the dunes', 12, async () => {
    await must(bot, bot.walk(13, 'before the cactus'), 'dunes');
    await must(bot, bot.hop('right', 12, 'right', 16.5), 'over the cactus');
  });
  await carefully(bot, 'the scorpion', 12, async () => {
    await must(bot, bot.hop('right', 12, 'right', 23), 'over the scorpion');
    await must(bot, bot.walk(23, 'the traveler'), 'traveler');
  });
  // the sandstorm: cross each stretch in a calm
  for (const [x, label] of [
    [30, 'the first gusts'],
    [36, 'the second gusts'],
  ] as const) {
    await carefully(bot, label, 12, async () => {
      if (x === 36) {
        // a hop in the calm for the coin glinting over the sand
        await must(bot, bot.walk(33, 'under the coin'), label);
        await must(bot, bot.hop('up'), 'up for the coin');
        picked(bot, 33, 6, 'the coin in the sandstorm');
      }
      await must(bot, bot.walk(x - 0.1, label), label);
      if (bot.px.x < (x - 1) * 20) throw new Error(`blown back to ${bot.px.x / 20}`);
    });
  }
  await carefully(bot, 'the children', 12, async () => {
    await must(bot, bot.walk(40, 'the canyon'), 'children');
  });
  await carefully(bot, 'the slot canyon', 10, async () => {
    await must(bot, bot.crawl('right', 46, 'into the canyon'), 'canyon');
    await must(bot, bot.crawl('right', 50, 'through the first eye gate'), 'gate 1');
    await must(bot, bot.crawl('right', 55, 'through the second eye gate'), 'gate 2');
  });
  await carefully(bot, 'the oasis', 12, async () => {
    await must(bot, bot.walk(58, 'the pool'), 'pool');
    await must(bot, bot.walk(63, 'the traveler at the oasis'), 'traveler');
    // a sideways hop back up onto the goat's ledge for the coin and the dates
    await must(bot, bot.hop('left', 18, 'left', 59), 'onto the ledge');
    picked(bot, 59, 5, 'the coin on the ledge');
    picked(bot, 60, 5, 'the dates on the ledge');
  });
  // up the great dune's steps to the golden lamp on top, under the circling vulture, and down
  await carefully(bot, 'the great dune', 12, async () => {
    await must(bot, bot.walk(66, 'up the dune steps'), 'steps');
    picked(bot, 66, 6, 'the coin on the dune');
    await must(bot, bot.walk(68, 'the top of the dune'), 'top');
    if (bot.at.y !== 4) throw new Error(`not on top of the dune (${bot.at.y})`);
    picked(bot, 68, 4, 'the golden lamp on the dune');
    await must(bot, bot.walk(70, 'down the far side'), 'down');
  });
  if (gold(bot) !== 3 || grace(bot) !== 5) throw new Error(`gold ${gold(bot)}, grace ${grace(bot)} at the tent`);
  await carefully(bot, 'to the tent', 12, async () => {
    await leave(bot, bot.walk(81, "the tailor's tent"), 'the tent');
  });
}

/** 3. The tailor's shop: spools, up the threads (mending the frays), through the needles' eyes. */
export async function theTailor(bot: Bot): Promise<void> {
  expect(bot, 4, "the tailor's shop");
  const climb = async (x: number, row: number, label: string) => {
    await must(bot, bot.walk(x, `the thread at ${x}`), label);
    await must(bot, bot.dig('up', row, label), label);
  };
  await carefully(bot, 'the first thread', 12, async () => {
    // the seamstress's "Drop that gold and run your race!" (gold.voc, 3.55 s) is the level's
    // first sound: stand by her till it is sung out, before the spool's chime would cut it
    await must(bot, bot.walk(5, 'the seamstress'), 'seamstress');
    await must(bot, bot.sim.waitForClip(), 'the song');
    await must(bot, bot.wait(3), 'the song');
    await must(bot, bot.walk(7, 'a spool'), 'spool');
    await climb(8, 6, 'up the first thread');
    await must(bot, bot.walk(13, 'the widow on the shelf'), 'shelf');
  });
  await carefully(bot, 'the first shelf', 12, async () => {
    await must(bot, bot.walk(14.6, 'before the pincushion'), 'pins');
    await must(bot, bot.hop('right', 12, 'right', 17.4), 'over the pincushion');
    await must(bot, bot.walk(21, 'a spool, to the great needle'), 'needle');
    await must(bot, bot.crawl('right', 24, "through the needle's eye"), 'eye');
  });
  await carefully(bot, 'the sewing table', 12, async () => {
    await must(bot, bot.walk(29, 'a spool on the table'), 'table');
    await must(bot, bot.crawl('right', 33, 'under the sewing needle'), 'under');
    await must(bot, bot.walk(37, 'the beggar, down to the floor'), 'floor');
  });
  await carefully(bot, 'the floor', 12, async () => {
    await must(bot, bot.walk(43, 'past the thimble'), 'thimble');
    if (thread(bot) < 2) throw new Error(`only ${thread(bot)} spools for the last two threads`);
    await climb(46, 7, 'up the second thread');
    await must(bot, bot.walk(50, 'the middle shelf'), 'middle shelf');
    await climb(51, 2, 'up the third thread');
    await must(bot, bot.walk(51.6, 'before the pincushion'), 'pins');
    await must(bot, bot.hop('right', 12, 'right', 54.4), 'over the pincushion to the lamp');
    await must(bot, bot.walk(56, 'along the high shelf'), 'high shelf');
  });
  if (gold(bot) !== 0 || grace(bot) !== 7) throw new Error(`gold ${gold(bot)}, grace ${grace(bot)} at the back door`);
  await carefully(bot, 'the back door', 12, async () => {
    await must(bot, bot.walk(58, 'down to the last needle'), 'down');
    await leave(bot, bot.crawl('right', 62, "through the last needle's eye"), 'the back door');
  });
}

/** 4. The eye of the needle: up the golden thread, the Spirit's updraft, through the shaft's gate, up the clouds to the eye. */
export async function theEye(bot: Bot): Promise<void> {
  expect(bot, 5, 'the eye of the needle');
  await carefully(bot, 'the golden thread', 12, async () => {
    await must(bot, bot.walk(5, 'the golden thread'), 'thread');
    await must(bot, bot.dig('up', 29.5, 'up the golden thread'), 'climb');
    await must(bot, bot.walk(9, 'the cloud'), 'cloud');
  });
  await carefully(bot, 'the updraft', 12, async () => {
    await must(
      bot,
      bot.until('left', () => bot.px.x <= 3 * 20, "into the Spirit's updraft", 80),
      'updraft',
    );
    await must(
      bot,
      bot.until(undefined, () => bot.px.y <= 13 * 20, 'up on the updraft', 200),
      'rise',
    );
    await must(bot, bot.hop('right', 4, 'right', 6), 'onto the cloud by the needle');
    await must(bot, bot.walk(11, 'the golden lamp, to the shaft'), 'lamp');
  });
  // out of the shaft's gate onto the thimble's cloud: set out as it rolls away, and hop it
  await carefully(bot, "through the needle's shaft, past the thimble", 3, async () => {
    await must(bot, bot.crawl('right', 14, 'through the eye gate in the shaft'), 'gate');
    await must(bot, bot.walk(17, 'the dates'), 'dates');
    picked(bot, 17, 13, 'the dates past the shaft');
    if (bot.at.y !== 13) throw new Error(`not on the thimble's cloud (${bot.at.y})`);
  });
  await carefully(bot, 'up the clouds', 12, async () => {
    const row = () => bot.at.y;
    await must(bot, bot.hop('up', 14), 'up a cloud');
    if (row() !== 10) throw new Error(`not on the cloud at 10 (${bot.at.y})`);
    await must(bot, bot.hop('right', 10, 'right', 20), 'up the next cloud');
    if (row() !== 7) throw new Error(`not on the cloud at 7 (${bot.at.y})`);
    await must(bot, bot.walk(21, "the dove's olive branch"), 'olive');
    picked(bot, 21, 7, "the dove's olive branch");
    await must(bot, bot.hop('left', 10, 'left', 16), 'up to the eye');
    if (row() !== 5) throw new Error(`not on the cloud at 5 (${bot.at.y})`);
  });
  if (grace(bot) < 4) throw new Error(`only ${grace(bot)} grace at the eye`);
  await carefully(bot, 'the eye of the needle', 12, async () => {
    await must(bot, bot.walk(14, 'the eye of the needle'), 'eye');
    await leave(bot, bot.crawl('left', 8, 'through the eye of the needle and on through the clouds'), 'the eye');
  });
}
