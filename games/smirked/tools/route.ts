// The way through the game, as orders for the bot: the fog hall's batteries (and its dollars)
// to the dark hallway's door; the crypt's five papier-mache witches tackled (GET DOWN!) and
// said sorry to, out the STAFF ONLY door; the fake woods' dollars, through the webs, to the
// gift shop's register for the $12 souvenir sword; and the last hall: the foam sword at the
// cardboard knight, his helmet, and the emergency exit. What it sees lying on the way it picks up
// (bot.ts, grab()).
import { BATTERIES, BATTERIES_NEEDED, MON, MONEY, SCAN, SORRY, SORRY_NEEDED, SWORD_PRICE, HELMET } from '../src/ids';
import { ORIGIN, WITCHES } from '../src/levels/maps';
import { Bot, type Dir } from './bot';

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
async function through(bot: Bot, x: number, y: number, side: Dir, what: string): Promise<void> {
  const r = await bot.take(x, y, side, what);
  if (r === 'link' || r === 'end') return;
  if (r) throw new Error(`${what}: ${r}\n${bot.log.slice(-8).join('\n')}`);
  await leave(bot, bot.goto(x, y, `through ${what}`), what);
}

/**
 * Plays a stretch where moving monsters can catch you out: if it costs a life or more than
 * `maxLoss` nerve (or goes wrong), it is taken back and played again after a short wait, so
 * you set out at a better moment.
 */
export async function carefully(bot: Bot, label: string, maxLoss: number, stretch: () => Promise<void>): Promise<void> {
  const start = bot.snapshot();
  const hp = bot.sim.ci.hitpts;
  const deaths = bot.sim.deaths;
  let why = '';
  for (let wait = 0; wait <= 360; wait += 6) {
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
      bot.say(`${label}: waited ${wait} ticks, lost ${loss} nerve`);
      return;
    }
    why = `lost ${loss} nerve, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})\n${bot.log.slice(-10).join('\n')}`);
}

/** Where the monsters numbered `n` are now (level coordinates, fractions of a block). */
function mons(bot: Bot, n: number): { x: number; y: number }[] {
  const w = bot.sim.w;
  return w.mi.map((mi, i) => ({ mi, m: w.mm[i]?.monnum })).filter((o) => o.m === n).map(({ mi }) => ({ x: mi.curx[0] - ORIGIN + mi.curx[1] / 20, y: mi.cury[0] - ORIGIN + mi.cury[1] / 20 }));
}

const STEP: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** Walks to (x, y) arriving with a step `dir` (so you face that way), from the block behind it. */
async function arrive(bot: Bot, x: number, y: number, dir: Dir, what: string): Promise<void> {
  const [dx, dy] = STEP[dir];
  await must(bot, bot.goto(x - dx, y - dy, what), what);
  bot.greedy = false;
  try {
    await must(bot, bot.goto(x, y, what), what);
  } finally {
    bot.greedy = !process.env.NO_LOOT;
  }
}

/** SPACE: the tackle (or the sword) flies off the way you face. */
async function tackle(bot: Bot): Promise<void> {
  bot.sim.press(SCAN.space);
  if (await bot.wait(2)) throw new Error('a scene change while tackling');
  bot.sim.release(SCAN.space);
  bot.say('GET DOWN!');
  if (await bot.wait(14)) throw new Error('a scene change after tackling');
}

/** Picks up a row of things, one stretch each. */
async function gather(bot: Bot, stops: [number, number, string][], maxLoss = 12): Promise<void> {
  for (const [x, y, what] of stops)
    await carefully(bot, what, maxLoss, async () => {
      await must(bot, bot.goto(x, y, what), what);
    });
}

/** 1. The fog hall: five batteries (four will do) and the dollars, to the dark hallway's door. */
export async function fogHall(bot: Bot): Promise<void> {
  expect(bot, 2, 'the fog hall');
  await gather(bot, [
    [8, 12, 'a battery'],
    [3, 13, 'a dollar'],
    [2, 11, 'a battery'],
    [6, 6, 'a dollar'],
    [3, 2, 'a battery'],
    [17, 6, 'a battery'],
    [22, 2, 'a dollar'],
    [26, 8, 'a battery'],
    [25, 11, 'a dollar'],
  ]);
  if (bot.count(BATTERIES) < BATTERIES_NEEDED) throw new Error(`only ${bot.count(BATTERIES)} batteries`);
  await carefully(bot, 'the dark hallway', 12, async () => {
    await through(bot, 29, 2, 'left', 'the door to the dark hallway');
  });
}

/** 2. The zombie parade: tackle the witches, say sorry, and out the STAFF ONLY door. */
export async function zombieParade(bot: Bot): Promise<void> {
  expect(bot, 3, 'the zombie parade');
  await gather(bot, [[3, 2, 'a dollar']]);
  for (const [i, [x, y]] of WITCHES.entries()) {
    if (bot.count(SORRY) >= SORRY_NEEDED + 1) break;
    await carefully(bot, `witch ${i + 1}`, 14, async () => {
      await arrive(bot, x - 2, y, 'right', `beside witch ${i + 1}`);
      const before = bot.count(SORRY);
      await tackle(bot);
      // she topples back a block, then lies flat
      const flat = () => mons(bot, MON.witchFlat).find((m) => m.x > x - 0.5 && m.x < x + 3 && Math.abs(m.y - y) < 0.5);
      for (let t = 0; t < 60 && !flat(); t++) {
        if (await bot.wait(1)) throw new Error('a scene change');
      }
      if (!flat()) throw new Error(`witch ${i + 1} still standing`);
      const lying = flat()!;
      await must(bot, bot.goto(Math.round(lying.x), y, `sorry, witch ${i + 1}`), 'sorry');
      if (await bot.wait(4)) throw new Error('a scene change');
      if (bot.count(SORRY) <= before) throw new Error(`no sorry to witch ${i + 1}`);
    });
  }
  await gather(bot, [
    [9, 13, 'a dollar'],
    [3, 11, 'a dollar'],
    [25, 9, 'a dollar'],
    [29, 1, 'a dollar'],
  ]);
  if (bot.count(SORRY) < SORRY_NEEDED) throw new Error(`only ${bot.count(SORRY)} sorries`);
  await carefully(bot, 'the STAFF ONLY door', 12, async () => {
    await through(bot, 31, 8, 'left', 'the STAFF ONLY door');
  });
}

/** 3. The fake woods: the dollars, through the webs, to the register. */
export async function fakeWoods(bot: Bot): Promise<void> {
  expect(bot, 4, 'the fake woods');
  await gather(
    bot,
    [
      [2, 2, 'a dollar'],
      [10, 5, 'a dollar'],
      [13, 2, 'a wall of fake spiderwebs (strategic repositioning; achoo)'],
      [3, 9, 'a dollar'],
      [6, 12, 'a dollar'],
      [16, 14, 'a dollar'],
      [16, 2, 'a dollar'],
      [25, 6, 'a dollar'],
      [31, 4, 'a dollar'],
      [23, 9, 'a dollar'],
      [31, 12, 'a dollar'],
    ],
    16,
  );
  if (bot.count(MONEY) < SWORD_PRICE) throw new Error(`only $${bot.count(MONEY)}`);
  await carefully(bot, 'the register', 16, async () => {
    await through(bot, 33, 13, 'left', 'the gift shop register');
  });
}

/** 4. The last hall: the foam sword at the cardboard knight, his helmet, the emergency exit. */
export async function lastHall(bot: Bot): Promise<void> {
  expect(bot, 5, 'the last hall');
  await carefully(bot, 'the knight\'s helmet', 20, async () => {
    for (let tries = 0; tries < 30 && !mons(bot, MON.helmet).length && bot.count(HELMET) < 1; tries++) {
      const kid = mons(bot, MON.knight)[0];
      if (!kid) break;
      const ky = Math.round(kid.y);
      const kx = Math.round(kid.x);
      const me = bot.sim.pos;
      const from = me.x - ORIGIN < kx ? -3 : 3;
      const sx = Math.max(1, Math.min(28, kx + from));
      const dir: Dir = sx < kx ? 'right' : 'left';
      await arrive(bot, sx, ky, dir, 'facing the kid');
      await tackle(bot);
    }
    const helmet = mons(bot, MON.helmet)[0];
    if (!helmet && bot.count(HELMET) < 1) throw new Error('the helmet is still on');
    if (helmet) await must(bot, bot.goto(Math.round(helmet.x), Math.round(helmet.y), 'the cardboard helmet'), 'helmet');
    if (await bot.wait(4)) throw new Error('a scene change');
    if (bot.count(HELMET) < 1) throw new Error('no helmet');
  });
  await gather(bot, [[3, 3, 'Loaf #13'], [25, 3, 'a lost TV remote'], [28, 10, 'a juice box']], 16);
  await carefully(bot, 'the emergency exit', 16, async () => {
    await through(bot, 14, 1, 'down', 'the emergency exit');
  });
}
