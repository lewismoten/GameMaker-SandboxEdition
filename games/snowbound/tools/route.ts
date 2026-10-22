// The way through the game, as orders for the bot: the paper route and every driveway on
// Gale Street and Leota Street, the sled run down Jamie Street, the driveways along Bowden
// Drive, and LaVale Mall's lot until there is $89 for the pink box at Bits & Bytes. It keeps
// to the streets: the park behind Gale Street (and what lies in the pines) is left alone.
import { Bot } from './bot';
import { sledRun } from './sled';

const expect = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
};

/** Shovels a list of cells in order (each a deep-snow block, or just a place to step). */
async function cells(bot: Bot, list: [number, number][], label: string): Promise<void> {
  for (const [x, y] of list) {
    const r = await bot.goto(x, y, label);
    if (r) throw new Error(`${label}: ${r} at ${x},${y}`);
  }
}

/**
 * Plays a stretch where traffic and Big Pete can catch the kid out: if it costs a life or
 * more than `maxLoss` hit points, it is taken back and played again after a short wait, so
 * the kid steps out at a better moment.
 */
async function carefully(bot: Bot, label: string, maxLoss: number, stretch: (pause: () => Promise<void>) => Promise<void>): Promise<void> {
  const start = bot.snapshot();
  const hp = bot.sim.ci.hitpts;
  const deaths = bot.sim.deaths;
  let why = '';
  for (let wait = 0; wait <= 180; wait += 6) {
    bot.restore(start);
    try {
      await stretch(async () => {
        if (wait && (await bot.wait(wait))) throw new Error('a scene change while waiting');
      });
    } catch (e) {
      why = String(e);
      continue;
    }
    const loss = hp - bot.sim.ci.hitpts;
    if (bot.sim.deaths === deaths && loss <= maxLoss) {
      bot.say(`${label}: waited ${wait} ticks, lost ${loss} hit points`);
      return;
    }
    why = `lost ${loss} hit points, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})`);
}

/** A driveway two blocks wide, dug from the street end (the bottom row) up to the garage. */
const drive = (garage: number, top: number, bottom: number): [number, number][] => {
  const out: [number, number][] = [];
  for (const x of [garage + 1, garage]) for (let y = bottom; y >= top; y--) out.push([x, y]);
  return out;
};
/** A front walk up to the door, and the porch mat at the top (where a paper goes). */
const walk = (door: number, top: number, bottom: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = bottom; y >= top; y--) out.push([door, y]);
  return out;
};

/** Gale Street: the bundle, then every customer's walk (a paper on the mat) and driveway. */
export async function galeStreet(bot: Bot): Promise<void> {
  const { sim } = bot;
  await cells(bot, [[12, 16]], 'the paper bundle');
  // the Gale Street houses' mats are at row 14, Leota Street's at row 8
  await cells(bot, [...walk(24, 14, 16), ...drive(21, 14, 16)], 'the blue house');
  await cells(bot, [...walk(31, 14, 16), ...drive(33, 14, 16)], 'the yellow house');
  await cells(bot, [...walk(32, 8, 9), ...drive(29, 8, 9)], 'Leota Street, the blue house');
  await cells(bot, [...walk(41, 8, 9), ...drive(43, 8, 9)], 'Leota Street, the yellow house');
  await cells(bot, [...walk(42, 14, 16), [43, 14], ...drive(39, 14, 16)], 'the red house (and its tip)');
  await cells(bot, [...walk(50, 14, 16), ...drive(52, 14, 16)], 'the last blue house');
  if (sim.meter(20) !== 1) throw new Error(`Papers left over: ${sim.meter(20) - 1}`);
  bot.say('every paper delivered');
  const r = await bot.goto(66, 17, 'Leon Drive');
  if (r !== 'link') throw new Error(`No way onto Jamie Street: ${r}`);
  expect(bot, 3, 'Jamie Street');
}

export async function jamieStreet(bot: Bot): Promise<void> {
  const r = await sledRun(bot);
  if (r !== 'link') throw new Error(`The sled run ended with ${r}`);
  expect(bot, 4, 'Bowden Drive');
}

/** Bowden Drive: the driveways and front walks along the north side, then east to LaVale. */
export async function bowdenDrive(bot: Bot): Promise<void> {
  // [door, garage] of each house with snow in its drive (two have theirs plowed already)
  const houses: [number, number][] = [
    [9, 11],
    [18, 15],
    [30, 32],
    [37, 39],
    [53, 50],
    [61, 58],
  ];
  await carefully(bot, 'Bowden Drive', 20, async (pause) => {
    for (const [i, [door, garage]] of houses.entries()) {
      await cells(bot, [[door, 24], ...drive(garage, 24, 25)], `Bowden Drive, house ${i + 1}`);
      if (i === 2) await cells(bot, [[30, 25]], "the Kellers' tip");
    }
    await pause();
    const r = await bot.goto(80, 27, 'the road to LaVale');
    if (r !== 'link') throw new Error(`No way to LaVale: ${r}`);
  });
  expect(bot, 5, 'LaVale Mall');
}

/** LaVale Mall: dig out the walk and the lot until there is $89, then the door of Bits & Bytes. */
export async function lavaleMall(bot: Bot): Promise<void> {
  const { sim } = bot;
  const door: [number, number] = [50, 13];
  await carefully(bot, 'LaVale Mall', 30, async (pause) => {
    await pause();
    while (sim.money < 89) {
      const next = bot.nearestDig(door);
      if (!next) throw new Error(`Only $${sim.money} and nothing left to shovel`);
      await cells(bot, [next], `the lot ($${sim.money})`);
    }
    const r = await bot.goto(door[0], door[1], 'Bits & Bytes');
    if (r !== 'end' || sim.ended !== 'won') throw new Error(`The store did not open: ${r}, $${sim.money}`);
  });
}
