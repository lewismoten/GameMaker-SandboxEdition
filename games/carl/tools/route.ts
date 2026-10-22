// The way through the game, as orders for the bot.
import { EARS, HOURS, MON, SMILES, SNACKS } from '../src/ids';
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

/** Runs the last order of a level: it must take Carl into the next scene (or the ending). */
async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const left = loot(bot);
  const out = await r;
  if (process.env.BOT_LOOT) console.log(`loot left in scene ${bot.sim.scene - 0}: ${left.length ? left.join(' ') : 'none'}`);
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** Collectibles still in the level (a pickup that changes when touched and gives something; gates are solid, so left out). */
export function loot(bot: Bot): string[] {
  const out: string[] = [];
  for (let y = ORIGIN; y < ORIGIN + 16; y++)
    for (let x = ORIGIN; x < ORIGIN + 70; x++) {
      const n = bot.sim.blockAt(x, y);
      const b = bot.sim.shown(x, y);
      if (b.solid || b.touchBl === (bot.sim.w.blkmap[n] ?? n)) continue;
      if (b.scorePts > 0 || b.chHitPt > 0 || b.eamt > 0) out.push(`${x - ORIGIN},${y - ORIGIN}`);
    }
  return out;
}

/**
 * Plays a stretch where moving things can catch Carl out: if it costs a life or more than
 * `maxLoss` hit points (or goes wrong), it is taken back and played again after a short wait, so
 * Carl sets out at a better moment.
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
      bot.say(`${label}: waited ${wait} ticks, lost ${loss} hit points`);
      return;
    }
    why = `lost ${loss} hit points, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})\n${bot.log.slice(-10).join('\n')}`);
}

const count = (bot: Bot, k: number) => bot.sim.meter(k) - 1;
const need = (bot: Bot, k: number, n: number, what: string) => {
  if (count(bot, k) < n) throw new Error(`only ${count(bot, k)} ${what}`);
};

type Pt = [number, number];
const go = (bot: Bot, pts: Pt[], what: string) => must(bot, bot.path(pts, what), what);

/** Up against the ceiling (or a ledge above), then a nudge `dir`, then a barrel roll that way: the whoosh flies ahead. */
async function rollAhead(bot: Bot, dir: 'left' | 'right', align: 'up' | 'down' = 'up'): Promise<void> {
  await must(bot, bot.hold(align, 6), `align ${align}`);
  await must(bot, bot.hold(dir, 1), 'face');
  await must(bot, bot.tap('space', 6), 'roll');
}

/** 1. The couch: eight snacks, past the towel in the bookcase gap, onto the lamp. */
export async function theCouch(bot: Bot): Promise<void> {
  expect(bot, 2, 'the couch');
  await carefully(bot, 'the bookshelf', 10, () => go(bot, [[6, 4], [7, 4], [10, 2]], 'candy on the shelf'));
  await carefully(bot, 'the coffee table', 10, () =>
    go(
      bot,
      [
        [21, 4],
        [22, 8],
        [24, 8],
        [26, 8],
        [27, 8],
        [28, 8],
      ],
      'popcorn, Loaf #13, chips, soda, salsa',
    ),
  );
  await carefully(bot, 'over Teddy', 10, () =>
    go(
      bot,
      [
        [29, 6],
        [30, 2],
        [30, 4],
        [31, 4],
        [33, 4],
        [35, 5],
        [35, 6],
      ],
      'the pizzas',
    ),
  );
  await carefully(bot, 'under the towels', 10, () =>
    go(
      bot,
      [
        [37, 7],
        [41, 7],
        [41, 1],
        [41, 4],
        [44, 4],
        [45, 7],
        [46, 9],
      ],
      'the donut and the candy',
    ),
  );
  need(bot, SNACKS, 8, 'snacks');
  await carefully(bot, 'the towel in the bookcase gap', 10, async () => {
    await go(bot, [[46, 1]], 'the gap');
    await rollAhead(bot, 'right');
    await go(bot, [[50, 1], [51, 10], [53, 4]], 'through, and the pizza on the floor');
  });
  await carefully(bot, 'the lamp', 10, () => leave(bot, bot.fly(55, 4, 'the shade'), 'the lamp'));
}

/** 2. The walls: smiles from the kitchen walls, past the clap at the floor and the swatter over the fridge, to the door. */
export async function theWalls(bot: Bot): Promise<void> {
  expect(bot, 3, 'the walls');
  await carefully(bot, 'over the counter', 10, () =>
    go(
      bot,
      [
        [4, 6],
        [6, 4],
        [7, 4],
        [8, 6],
        [13, 6],
        [13, 7],
        [14, 4],
        [17, 2],
        [18, 2],
        [18, 6],
      ],
      'a recipe, a calendar, a clock',
    ),
  );
  await carefully(bot, 'the clap at the floor', 12, async () => {
    await go(bot, [[21, 10]], 'the gap');
    await rollAhead(bot, 'right', 'down');
    await go(bot, [[25, 10]], 'through');
  });
  await carefully(bot, 'the middle wall', 10, () =>
    go(
      bot,
      [
        [27, 7],
        [28, 5],
        [31, 8],
        [33, 6],
        [33, 3],
        [27, 3],
        [27, 2],
        [33, 6],
        [35, 10],
      ],
      'a picture, a recipe, a calendar, a crumb, the donut',
    ),
  );
  await carefully(bot, 'the swatter over the fridge', 12, async () => {
    await go(bot, [[35, 2], [36, 1]], 'the gap');
    await rollAhead(bot, 'right');
    await go(bot, [[41, 1]], 'over the fridge');
  });
  await carefully(bot, 'the far wall', 10, () =>
    go(
      bot,
      [
        [43, 4],
        [44, 7],
        [45, 7],
        [44, 9],
        [42, 9],
        [48, 9],
      ],
      'a clock, a picture, a calendar',
    ),
  );
  need(bot, SMILES, 6, 'smiles');
  await carefully(bot, 'the kitchen door', 10, () => leave(bot, bot.fly(50, 9, 'the door'), 'the door'));
}

/** Up to a point, a nudge `dir` (so the buzz goes that way), and a buzz. */
async function buzzAt(bot: Bot, at: Pt, dir: 'left' | 'right' | 'up' | 'down'): Promise<void> {
  await go(bot, [at], 'buzzing spot');
  await must(bot, bot.hold(dir, 1), 'face');
  await must(bot, bot.tap('b', 14), 'buzz');
}

/** 3. In bed: buzz his ear, then Teddy's twice, flying into each as it twitches; the window. */
export async function theBed(bot: Bot): Promise<void> {
  expect(bot, 4, 'the bed');
  await carefully(bot, 'his ear', 10, async () => {
    await go(bot, [[9, 3], [13, 7], [13, 8], [16, 4]], 'the soda on the nightstand, over his head');
    await buzzAt(bot, [16, 4], 'down');
    await go(bot, [[16, 7]], 'into his ear');
    need(bot, EARS, 1, 'ears');
    await go(bot, [[16, 2]], 'back up');
  });
  await carefully(bot, 'over the bed', 10, () => go(bot, [[24, 3], [29, 2], [30, 3], [33, 2], [38, 2], [38, 9], [39, 9]], 'to Teddy'));
  for (const n of [2, 3])
    await carefully(bot, `Teddy's ear (${n})`, 10, async () => {
      for (let t = 0; t < 40 && !bot.sim.w.mm.some((m) => m.monnum === MON.dogEar); t++) await must(bot, bot.wait(6), 'his ear asleep');
      await buzzAt(bot, [39, 9], 'left');
      await go(bot, [[36, 9], [39, 9]], "into Teddy's ear");
      need(bot, EARS, n, 'ears');
    });
  await carefully(bot, 'the window', 10, async () => {
    await go(bot, [[42, 8], [43, 4]], 'the window');
    await leave(bot, bot.fly(45, 4, 'out'), 'the window');
  });
}

/** 4. The open window: through the gusts, over the clothesline, along the branch, the pie, the tall grass. */
export async function theWindow(bot: Bot): Promise<void> {
  expect(bot, 5, 'the window');
  await carefully(bot, 'through the gusts', 12, () => go(bot, [[10, 8], [17, 8], [18, 5]], 'the gusts'));
  await carefully(bot, 'over the clothesline', 12, () => go(bot, [[31, 5]], 'the clothesline'));
  await carefully(bot, 'along the branch', 12, () => go(bot, [[41, 5], [41, 8], [43, 9], [45, 9]], 'the pie and the lemonade'));
  await carefully(bot, 'into the wild', 12, async () => {
    await go(bot, [[47, 9], [55, 9]], 'the gusts again');
    await leave(bot, bot.fly(57, 9, 'the tall grass'), 'the wild');
  });
}

/** 5. Carl has seen things: fourteen hourglasses (twenty-eight hours), past the frog, the dragonflies and the spider, to the clock. */
export async function theWild(bot: Bot): Promise<void> {
  expect(bot, 6, 'the wild');
  await carefully(bot, 'the grass and the pond', 12, () => go(bot, [[4, 3], [8, 5], [12, 10], [12, 11], [15, 2], [17, 7], [22, 9]], 'hourglasses by the pond'));
  await carefully(bot, 'under the dragonfly', 12, () => go(bot, [[27, 4], [31, 7], [35, 9]], 'hourglasses by the mushrooms'));
  await carefully(bot, 'by the spider', 12, () => go(bot, [[38, 4], [43, 7], [42, 10], [42, 11], [47, 2]], 'hourglasses by the web'));
  await carefully(bot, 'the desert', 12, () => go(bot, [[51, 7], [55, 9], [58, 4]], 'hourglasses by Brother Camel'));
  need(bot, HOURS, 24, 'hours');
  await carefully(bot, 'the clock', 12, async () => {
    await go(bot, [[60, 6]], 'the clock');
    await leave(bot, bot.fly(62, 6, 'broken time'), 'the clock');
  });
}

/** 6. The aux cord: over the sage and the oils, the donut, a roll past the clap in the bookcase gap, the stereo. */
export async function theAux(bot: Bot): Promise<void> {
  expect(bot, 7, 'the aux cord');
  await carefully(bot, 'over the sage and the oils', 12, () => go(bot, [[19, 3], [26, 2], [26, 8], [27, 2], [36, 2], [36, 3]], 'the crumbs and the donut'));
  await carefully(bot, 'the clap in the bookcase gap', 12, async () => {
    await go(bot, [[38, 1]], 'the gap');
    await rollAhead(bot, 'right');
    await go(bot, [[42, 1]], 'through');
  });
  await carefully(bot, 'the aux cord', 12, async () => {
    await go(bot, [[42, 6], [47, 7], [49, 8]], 'the stereo');
    await leave(bot, bot.fly(50, 8, 'the aux cord'), 'the aux cord');
  });
}

export const counts = { snacks: (b: Bot) => count(b, SNACKS), smiles: (b: Bot) => count(b, SMILES), ears: (b: Bot) => count(b, EARS), hours: (b: Bot) => count(b, HOURS) };
