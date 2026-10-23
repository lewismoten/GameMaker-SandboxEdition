// The way through the game, as orders for the bot. Like a player, it picks up what it can see on
// the way when the detour is short (coins, figs and olives, grapes and cups, the wreaths, the
// eagle standards, the strigil, the comic mask), bows to Lady Flavia and says hello to Doc Leo
// and the cheering mice, tells jokes at what's in its way, and hops over the rest.
import { AIR, CHEESE, CROWN, LAUGHS, MON, SCALES, TITLES } from '../src/ids';
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

/** Runs the last order of a level: it must take the hero into the next scene (or the ending). */
async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/**
 * Plays a stretch where moving things can catch the hero out: if it costs a life or more than
 * `maxLoss` dignity (or goes wrong), it is taken back and played again after a short wait, so
 * he sets out at a better moment. `maxWait` keeps the horde from catching up while he waits.
 */
export async function carefully(bot: Bot, label: string, maxLoss: number, stretch: () => Promise<void>, maxWait = 300): Promise<void> {
  const start = bot.snapshot();
  const hp = bot.sim.ci.hitpts;
  const deaths = bot.sim.deaths;
  let why = '';
  for (let wait = 0; wait <= maxWait; wait += 6) {
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

const count = (n: number) => (bot: Bot) => bot.sim.meter(n) - 1;
export const air = count(AIR);
export const cheese = count(CHEESE);
export const titles = count(TITLES);
export const scales = count(SCALES);
export const laughs = count(LAUGHS);
export const crown = count(CROWN);

/** Where the monsters numbered `n` are (level blocks, their left edges). */
export function where(bot: Bot, n: number): { x: number; y: number }[] {
  const w = bot.sim.w;
  return w.mi.map((mi, i) => ({ mi, n: w.mm[i]?.monnum })).filter((m) => m.n === n).map(({ mi }) => ({ x: mi.curx[0] - ORIGIN + mi.curx[1] / 20, y: mi.cury[0] - ORIGIN + mi.cury[1] / 20 }));
}

/** Is any of these monsters still about? */
const alive = (bot: Bot, mons: number[]) => bot.sim.w.mm.some((m) => mons.includes(m.monnum));

/** Tells a joke (Space: right, Z: left) and lets it fly. */
async function joke(bot: Bot, dir: 'right' | 'left' = 'right', fly = 10): Promise<void> {
  await must(bot, bot.hold(dir === 'right' ? 'space' : 'z', 2), 'a joke');
  await must(bot, bot.wait(fly), 'the joke flies');
}

/** Hops straight up where he stands (for a shutter, a titulus, something on a shelf). */
const up = (bot: Bot, what: string, hold = 12) => must(bot, bot.hop('up', hold), what);

/** I. The banquet: five shutters, the figs, Teddy, Flavia, Rufus's table, Gwinn, the amphora, the servus, the door. */
export async function banquet(bot: Bot): Promise<void> {
  expect(bot, 2, 'the banquet');
  await carefully(bot, 'the first shutter, the coin, the figs', 0, async () => {
    await must(bot, bot.walk(5, 'under the first shutter'), 'shutter');
    await up(bot, 'the first shutter');
    if (air(bot) < 1) throw new Error(`the shutter is shut (${air(bot)})`);
    await must(bot, bot.walk(10, 'under the coin'), 'coin');
    await up(bot, 'the coin');
    await must(bot, bot.walk(12, 'by the table'), 'table');
    await up(bot, 'the figs', 8);
  });
  await carefully(bot, 'over Teddy, the second shutter, a bow to Lady Flavia', 0, async () => {
    await must(bot, bot.hop('right', 12, 'right', 16), 'over Teddy');
    await up(bot, 'the second shutter');
    if (air(bot) < 2) throw new Error(`only ${air(bot)} shutters`);
    await must(bot, bot.walk(19, 'a bow to Lady Flavia'), 'Flavia');
  });
  await carefully(bot, "Rufus's table, the bust", 0, async () => {
    await must(bot, bot.walk(21, 'before the head table'), 'table');
    if (where(bot, MON.gas).some((g) => g.x > 20 && g.x < 30 && g.y > 7)) await joke(bot);
    await must(bot, bot.hop('right', 8, 'right', 23), 'up on the head table');
    await must(bot, bot.walk(24.6, 'the end of the table'), 'end');
    await must(bot, bot.hop('right', 12, 'right', 28), 'over the bust');
    await must(bot, bot.walk(29, 'under the third shutter'), 'shutter');
    await up(bot, 'the third shutter');
    if (air(bot) < 3) throw new Error(`only ${air(bot)} shutters`);
  });
  await carefully(bot, 'over Gwinn, the grapes on the shelf', 0, async () => {
    await must(bot, bot.hop('right', 12, 'right', 33.4), 'over Gwinn');
    await must(bot, bot.walk(32, 'under the shelf'), 'shelf');
    await up(bot, 'the grapes on the shelf');
    await must(bot, bot.hop('right', 6, 'right', 35), 'down off the shelf');
  });
  await carefully(bot, 'over the amphora, the fourth shutter', 0, async () => {
    await must(bot, bot.walk(35.6, 'before the amphora'), 'amphora');
    await must(bot, bot.hop('right', 12, 'right', 39), 'over the amphora');
    await up(bot, 'the fourth shutter');
    if (air(bot) < 4) throw new Error(`only ${air(bot)} shutters`);
  });
  await carefully(bot, 'over the servus, the wreath, the cup, the last shutter', 0, async () => {
    await must(bot, bot.hop('right', 12, 'right', 46), 'over the servus');
    await up(bot, 'the wreath on the lararium');
    await must(bot, bot.hop('right', 6, 'right', 48), 'down to the cup');
    await up(bot, 'the cup', 8);
    await must(bot, bot.walk(49, 'under the last shutter'), 'shutter');
    await up(bot, 'the last shutter');
    if (air(bot) < 5) throw new Error(`only ${air(bot)} shutters`);
  });
  await leave(bot, bot.walk(52, 'the door'), 'the door');
}

/** II. The battle: run. Up the ladder, over the palisade, past the archers, through the ditch, to the gate. */
export async function battle(bot: Bot): Promise<void> {
  expect(bot, 3, 'the battle');
  // the horde is right behind: no waiting about
  const W = 24;
  await carefully(bot, 'the rocks, the eagle, the cup', 0, async () => {
    await must(bot, bot.walk(6, 'before the first rock'), 'rock');
    await must(bot, bot.hop('right', 10, 'right', 9), 'over the first rock');
    await must(bot, bot.walk(10, 'the eagle standard'), 'eagle');
    await must(bot, bot.walk(11, 'before the second rock'), 'rock');
    await must(bot, bot.hop('right', 10, 'right', 14), 'over the second rock');
    await must(bot, bot.walk(17, 'the cup'), 'cup');
  }, W);
  await carefully(bot, 'up the ladder, over the palisade', 0, async () => {
    await must(bot, bot.walk(19, 'the foot of the ladder'), 'ladder');
    await must(bot, bot.dig('up', 5, 'up the ladder'), 'climb');
    await must(bot, bot.walk(21, 'along the top of the palisade'), 'top');
    await up(bot, 'the coin over the palisade', 8);
    await must(bot, bot.walk(23, 'down off the palisade'), 'down');
  }, W);
  await carefully(bot, 'the rock, the bush, the coin, the tower', 0, async () => {
    await must(bot, bot.walk(24, 'before the rock'), 'rock');
    await must(bot, bot.hop('right', 10, 'right', 27), 'over the rock');
    await must(bot, bot.walk(29, 'the coin, before the tower'), 'coin');
    await must(bot, bot.hop('right', 12, 'right', 33.4), 'over the archers\' tower');
  }, W);
  await carefully(bot, 'the wreath, the last rock, the eagle, the ditch', 0, async () => {
    await must(bot, bot.walk(36, 'the wreath, before the rock'), 'wreath');
    await must(bot, bot.hop('right', 10, 'right', 39), 'over the rock');
    await must(bot, bot.walk(44, 'the eagle, down into the ditch'), 'into the ditch');
    await must(bot, bot.walk(45.6, 'along the bottom of the ditch'), 'ditch');
    await must(bot, bot.hop('right', 12, 'right', 47.4), 'out of the ditch');
  }, W);
  await leave(bot, bot.walk(52, 'the gate'), 'the gate');
}

export async function roofs(bot: Bot): Promise<void> {
  expect(bot, 4, 'the rooftops');
  throw new Error('todo');
}

export async function kitchen(bot: Bot): Promise<void> {
  expect(bot, 5, 'the kitchen');
  throw new Error('todo');
}

export async function baths(bot: Bot): Promise<void> {
  expect(bot, 6, 'the baths');
  throw new Error('todo');
}

const GRAVIS = [MON.gravisA0, MON.gravisA1, MON.gravisA2, MON.gravisA3, MON.gravisB0, MON.gravisB1, MON.gravisB2, MON.gravisB3];
export async function theater(bot: Bot): Promise<void> {
  expect(bot, 7, 'the theater');
  void alive(bot, GRAVIS);
  throw new Error('todo');
}
