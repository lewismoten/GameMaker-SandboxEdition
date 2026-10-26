// The way through the game, as orders for the bot.
import { SEQ, WATER } from '../src/ids';
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
 * wait, so the seed sets out at a better moment.
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

/**
 * Loot in sight on the way (sunbeams, dew, water, a golden flower): a short detour, tried from a
 * snapshot and kept only if it takes every pickup at the level cells `cells` within `ticks` (a
 * few seconds, counting any wait for a beetle or an ant to wander off first, up to `wait`) and
 * without losing a life or more than `loss` hit points; otherwise the seed is put back where it
 * was and carries on without it, as a player leaves what's too far or too risky.
 */
async function grab(
  bot: Bot,
  label: string,
  cells: [number, number][],
  stretch: () => Promise<void>,
  { ticks = 90, loss = 6, wait = 30 } = {},
): Promise<boolean> {
  const start = bot.snapshot();
  const t0 = bot.sim.ticks;
  const { deaths } = bot.sim;
  const hp = bot.sim.ci.hitpts;
  const before = cells.map(([x, y]) => bot.sim.blockAt(x + ORIGIN, y + ORIGIN));
  let why = '';
  for (let w = 0; w <= wait; w += 6) {
    bot.restore(start);
    try {
      if (w && (await bot.wait(w))) throw new Error('a scene change while waiting');
      await stretch();
      const left = cells.filter(([x, y], i) => bot.sim.blockAt(x + ORIGIN, y + ORIGIN) === before[i]);
      if (left.length) why = `missed ${left.map((c) => c.join(',')).join(' ')}`;
      else if (bot.sim.deaths !== deaths || hp - bot.sim.ci.hitpts > loss) why = `lost ${hp - bot.sim.ci.hitpts} hit points`;
      else if (bot.sim.ticks - t0 > ticks) why = `${bot.sim.ticks - t0} ticks`;
      else why = '';
    } catch (e) {
      why = String(e).split('\n')[0];
    }
    if (!why) {
      bot.say(`grabbed ${label} (waited ${w}, ${bot.sim.ticks - t0} ticks)`);
      return true;
    }
    if (process.env.BOT_GRAB) console.log(`left ${label} (wait ${w}): ${why}\n${bot.log.slice(start.log).join('\n')}`);
  }
  bot.restore(start);
  bot.say(`left ${label}: ${why}`);
  return false;
}

/** Throws unless the seed stands on level row `row`. */
const onRow = (bot: Bot, row: number, what: string) => {
  if (bot.at.y !== row) throw new Error(`not on ${what} (row ${bot.at.y})`);
};

const water = (bot: Bot) => bot.sim.meter(WATER) - 1;
/** Laced up: the faster walks are on (the laces are carried). */
const laced = (bot: Bot) => !!bot.sim.ci.seqon[SEQ.fastRight];

/** 1. The mound and the garden. */
export async function theMound(bot: Bot): Promise<void> {
  expect(bot, 2, 'the mound');
  await carefully(bot, 'out of the mound', 10, async () => {
    await must(bot, bot.hop('right', 8, 'right', 7), 'hop out');
    await must(bot, bot.walk(13, 'the flower bed'), 'flower bed');
  });
  await carefully(bot, 'the flowerpots and the leaves', 12, async () => {
    await must(bot, bot.walk(15, 'onto the first pot'), 'first pot');
    // the laces on the pot: Enter picks them up ("...got the greatest feet!"), and the seed hustles
    await must(bot, bot.hold('enter', 2), 'pick up the laces');
    await must(bot, bot.sim.waitForClip(), 'the greatest feet');
    if (!laced(bot)) throw new Error(`no laces (at ${bot.at.x},${bot.at.y})`);
    await must(bot, bot.walk(17, 'up the flowerpots'), 'pots');
    for (const x of [20, 23, 26, 29]) await must(bot, bot.hop('right', 8, 'right', x + 0.5), `leaf ${x}`);
    await must(bot, bot.walk(31, 'the dandelion'), 'dandelion');
  });
  await carefully(bot, 'over the wall', 12, async () => {
    await must(
      bot,
      bot.until('right', () => bot.px.x >= 33 * 20, 'into the fluff', 60),
      'fluff',
    );
    await must(
      bot,
      bot.until(undefined, () => bot.px.y <= 3 * 20, 'up on the fluff', 120),
      'fluff',
    );
    await must(bot, bot.hop('right', 4, 'right', 37), 'onto the wall');
    await must(bot, bot.walk(39, 'the top of the wall'), 'wall');
    await grab(bot, 'the sunbeam over the wall', [[39, 3]], () => must(bot, bot.hop('up', 6), 'hop'));
    await must(bot, bot.walk(48, 'the vegetable patch'), 'vegetables');
  });
  await carefully(bot, 'the vegetable patch', 12, async () => {
    await grab(bot, 'the sunbeam over the first leaf', [[50, 4]], async () => {
      await must(bot, bot.walk(50.5, 'under the leaf'), 'leaf');
      await must(bot, bot.hop('up', 14), 'up on the leaf');
      await must(bot, bot.hop('up', 10), 'the sunbeam');
    });
    await grab(bot, 'the dewdrop', [[53, 4]], () => must(bot, bot.hop('right', 8, 'right', 53.5), 'the dew'));
    await must(bot, bot.walk(54, 'the thistle'), 'thistle');
    await must(bot, bot.hop('right', 10, 'right', 57), 'over the thistle');
    await must(bot, bot.walk(56.5, 'under the leaf'), 'leaf');
    await must(bot, bot.hop('up', 14), 'up on the leaf');
    await must(bot, bot.hop('right', 8, 'right', 59.5), 'the tall pots');
    await must(bot, bot.walk(60.5, 'the tall pots'), 'the tall pots');
    // up the flowerpot tower, and onto the leaf high over the garden for the golden flower
    await must(bot, bot.walk(61.3, 'up the flowerpot tower'), 'the tower');
    if (bot.at.y !== 3) throw new Error(`not on the flowerpot tower (${bot.at.y})`);
    await grab(bot, 'the golden flower', [[62, 1]], () => must(bot, bot.hop('right', 10, 'right', 62.2), 'onto the leaf'));
    // (the sunbeam over the sunny patch is caught on the way down from the leaf)
    await leave(bot, bot.walk(68, 'the sunny patch'), 'the sunny patch');
  });
}

/** A hop in a cave three blocks high: just up to what's on its ceiling, not into the dust. */
const CAVE_HOP = 5;

/** 2. Deep down in the dust: five drops of water, then up through the crack. */
export async function theDust(bot: Bot): Promise<void> {
  expect(bot, 3, 'the dust');
  const go = (dir: 'left' | 'right' | 'up' | 'down', to: number, label = '') => must(bot, bot.dig(dir, to, label), label || `${dir} to ${to}`);
  await carefully(bot, 'the first cave', 10, async () => {
    await go('right', 14);
    // an ant patrols the cave floor under its sunbeam: roots along the cave's roof brush the
    // sunbeam, then drop down onto the drop of water
    const over = await grab(
      bot,
      'the sunbeam in the first cave',
      [
        [5, 7],
        [7, 8],
      ],
      async () => {
        await go('down', 6);
        await go('left', 5, 'over the sunbeam');
        await go('right', 7, 'over the drop of water');
        await go('down', 8, 'down onto the drop of water');
        await must(bot, bot.walk(10.5, 'back to the roots'), 'back');
      },
      { ticks: 220, loss: 10 },
    );
    if (!over) {
      await go('down', 8);
      await go('left', 10, 'into the first cave');
      await must(bot, bot.walk(7, 'its drop of water'), 'water 1');
      await must(bot, bot.walk(10.5, 'back to the roots'), 'back');
    }
  });
  await carefully(bot, 'under the rocks', 10, async () => {
    await go('right', 23);
    await go('down', 14);
    await go('left', 19, 'into the second cave');
    await must(bot, bot.walk(15, 'its drop of water'), 'water 2');
    await grab(
      bot,
      'the sunbeam in the second cave',
      [[13, 13]],
      async () => {
        await must(bot, bot.walk(13, 'under the sunbeam'), 'sunbeam');
        await must(bot, bot.hop('up', CAVE_HOP), 'the sunbeam');
      },
      { ticks: 130 },
    );
    await must(bot, bot.walk(18, 'the golden flower'), 'flower');
    await grab(bot, 'the golden flower', [[18, 13]], () => must(bot, bot.hop('up', CAVE_HOP), 'the flower'));
    await must(bot, bot.walk(19, 'back to the roots'), 'back');
  });
  await carefully(bot, "the mole's cave", 10, async () => {
    // roots along the mole's ceiling brush its sunbeam, out of the mole's way
    const roof = await grab(
      bot,
      "the sunbeam in the mole's cave",
      [[34, 13]],
      async () => {
        await go('up', 12);
        await must(
          bot,
          bot.until('down', () => bot.px.y > 12 * 20, 'on the cave roof', 20),
          'roof',
        );
        await go('right', 34, "along the mole's ceiling");
        await go('left', 32, 'under the groundwater');
        await go('up', 4, 'the groundwater');
      },
      { ticks: 210, loss: 10 },
    );
    if (!roof) {
      await go('right', 26, "into the mole's cave");
      await must(bot, bot.walk(30, 'its drop of water'), 'water 3');
      await must(bot, bot.walk(32, 'under the groundwater'), 'under');
      await go('up', 4, 'the groundwater');
    }
  });
  await carefully(bot, 'the last cave', 10, async () => {
    await go('right', 38);
    await go('down', 10);
    await go('right', 39, 'into the last cave');
    await must(bot, bot.walk(41, 'its drop of water'), 'water 5');
    // the worm pacing the cave is solid at its sides and pushes the seed back: dig up over it
    await go('up', 8, 'up out of the worm’s way');
    await go('right', 43, 'over the worm to the far wall');
  });
  if (water(bot) < 5) throw new Error(`only ${water(bot)} drops of water`);
  await carefully(bot, 'up to the crack', 10, async () => {
    // the groundwater down past the last cave's far wall, on the way up to the crack
    const deep = await grab(
      bot,
      'the groundwater past the last cave',
      [[45, 15]],
      async () => {
        await go('right', 45, 'out of the last cave');
        await go('down', 15, 'the groundwater');
        await go('up', 1, 'under the sidewalk');
        await go('left', 44);
      },
      { ticks: 110 },
    );
    if (!deep) {
      await go('up', 1, 'under the sidewalk');
      await go('right', 44);
    }
    // up through the crack (five drops of water open it: "Keep on hustlin'") and along the
    // sidewalk to the sunny spot, while the clip plays
    await must(
      bot,
      bot.until('up', () => bot.px.y <= -20, 'up through the crack', 40),
      'the crack',
    );
    await leave(bot, bot.walk(40, 'the sunny spot'), 'the sunny spot');
  });
}

/** 3. The mountain: faith on the way up, and each wall of boulders moved with it. */
export async function theMountain(bot: Bot): Promise<void> {
  expect(bot, 4, 'the mountain');
  const glimmer = async (x: number, label: string) => {
    await must(bot, bot.walk(x, label), label);
    await must(bot, bot.hop('up', 12), `up for ${label}`);
  };
  await carefully(bot, 'the meadow', 10, async () => {
    await glimmer(5, 'a glimmer of faith');
    await must(bot, bot.walk(10, 'the first terrace'), 'meadow');
  });
  await carefully(bot, 'the first terraces', 10, async () => {
    await glimmer(14, 'faith past the goat');
    await grab(bot, 'the sunbeam over the second terrace', [[16, 10]], async () => {
      await must(bot, bot.walk(16, 'under the sunbeam'), 'sunbeam');
      await must(bot, bot.hop('up', 12), 'the sunbeam');
    });
    await must(bot, bot.walk(22, 'the first wall'), 'terrace');
  });
  await carefully(bot, 'the first wall', 10, async () => {
    await must(bot, bot.walk(26, 'through the first wall'), 'wall A');
    await glimmer(29, 'faith on the high terrace');
  });
  await carefully(bot, 'the second wall', 12, async () => {
    await must(bot, bot.walk(33, 'through the second wall'), 'wall B');
    await grab(bot, 'the first sunbeam over the peak', [[36, 4]], async () => {
      await must(bot, bot.walk(36, 'under the sunbeam'), 'sunbeam');
      await must(bot, bot.hop('up', 12), 'the sunbeam');
    });
    await glimmer(38, 'faith on the peak');
    await must(bot, bot.walk(44, 'down from the peak'), 'peak');
  });
  await carefully(bot, 'the last wall', 12, async () => {
    await must(bot, bot.walk(48, 'through the last wall'), 'wall C');
    await grab(
      bot,
      'the sunbeam by the pass',
      [[60, 9]],
      async () => {
        await must(bot, bot.walk(59.4, 'under the sunbeam'), 'sunbeam');
        await must(bot, bot.hop('up', 12), 'the sunbeam');
      },
      { ticks: 130 },
    );
    await leave(bot, bot.walk(62, 'the pass'), 'the pass');
  });
}

/** 4. Up the great plant, on the breeze, past the clouds and into the palm of God's hand. */
export async function theSky(bot: Bot): Promise<void> {
  expect(bot, 5, 'the sky');
  const rise = (row: number, label: string) =>
    must(
      bot,
      bot.until(undefined, () => bot.px.y <= row * 20, label, 160),
      label,
    );
  await carefully(bot, 'the lower branches', 10, async () => {
    await must(bot, bot.walk(14, 'under the branches'), 'start');
    // what's on each branch: along it and back to the stalk
    const along: Record<number, [string, number, number]> = {
      39: ['the dewdrop on the first branch', 10, 39],
      36: ['the sunbeam by the nest', 16, 36],
      33: ['the sunbeam on the long branch', 9, 32],
    };
    for (const row of [39, 36, 33]) {
      await must(bot, bot.hop('up', 14), `up to ${row}`);
      if (bot.at.y !== row) throw new Error(`not on the branch at ${row} (${bot.at.y})`);
      const [label, x, y] = along[row];
      const back = bot.px.x / 20;
      await grab(bot, label, [[x, y]], async () => {
        await must(bot, bot.walk(x, label), label);
        await must(bot, bot.walk(back, 'back by the stalk'), 'back');
      });
    }
    // the side branches up to the left: two sunbeams, and down again
    await grab(
      bot,
      'the side branches',
      [
        [6, 26],
        [3, 27],
      ],
      async () => {
        await must(bot, bot.walk(10, 'under the side branch'), 'side branch');
        await must(bot, bot.hop('up', 14), 'up to the side branch');
        onRow(bot, 30, 'the side branch');
        await must(bot, bot.walk(6, 'under the high side branch'), 'high side branch');
        await must(bot, bot.hop('up', 14), 'up to the high side branch and its sunbeam');
        onRow(bot, 27, 'the high side branch');
        await must(bot, bot.walk(3, 'the sunbeam'), 'the sunbeam');
        await must(bot, bot.walk(9, 'off the high side branch'), 'off');
        await must(bot, bot.walk(14, 'back by the stalk'), 'back');
        onRow(bot, 33, 'the long branch');
      },
      { ticks: 300, loss: 10 },
    );
  });
  await carefully(bot, 'the evening breeze', 10, async () => {
    await must(
      bot,
      bot.until('right', () => bot.px.x >= 22 * 20, 'into the breeze', 120),
      'breeze',
    );
    // the sunbeam just off the breeze: lean out for it on the way up (the breeze carries the
    // seed on up while it does), and back in
    await grab(bot, 'the sunbeam by the breeze', [[20, 23]], async () => {
      await rise(28.5, 'below the sunbeam');
      await must(
        bot,
        bot.until('left', () => bot.px.x <= 20.9 * 20, 'out to the sunbeam', 30),
        'out',
      );
      await must(
        bot,
        bot.until('right', () => bot.px.x >= 22 * 20, 'back into the breeze', 40),
        'back',
      );
    });
    await rise(20, 'up on the breeze');
    await must(bot, bot.hop('left', 4, 'left', 18.5), 'onto the nest branch');
    if (bot.at.y !== 19) throw new Error(`not on the nest branch (${bot.at.y})`);
  });
  await must(bot, bot.walk(14.5, 'under the next branch'), 'branch');
  // the top branch, where the breeze gusts on a rhythm and blows the plant off its right end:
  // watch it from the branch below, hop up as a gust dies down and cross while it's calm
  await carefully(bot, 'the gusts on the top branch', 10, async () => {
    for (const row of [16, 13]) {
      await must(bot, bot.hop('up', 14), `up to ${row}`);
      if (bot.at.y !== row) throw new Error(`not on the branch at ${row} (${bot.at.y})`);
    }
    const t0 = bot.sim.ticks;
    await must(bot, bot.walk(6, 'the left breeze'), 'breeze');
    if (bot.at.y !== 13) throw new Error(`blown off the top branch (${bot.at.y})`);
    if (bot.sim.ticks - t0 > 70) throw new Error(`blown back along the top branch (${bot.sim.ticks - t0} ticks)`);
  });
  await carefully(bot, 'the breeze to the clouds', 10, async () => {
    await must(
      bot,
      bot.until('left', () => bot.px.x <= 5 * 20, 'into the breeze', 60),
      'breeze',
    );
    await rise(6, 'up on the breeze');
    // over the clouds, into the light that lifts into the palm, and across it to the middle
    const toPalm = async () =>
      (await bot.hop('right', 4, 'right', 9.5)) ??
      (await bot.hop('up', 14)) ??
      (await bot.hop('right', 6)) ??
      (await bot.until('right', () => false, 'the palm', 200));
    await leave(bot, toPalm(), "the palm of God's hand");
  });
}
