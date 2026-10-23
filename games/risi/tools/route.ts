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
      if (process.env.BOT_WHY) console.log(`${label} wait ${wait}: ${why}`);
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

/** Jokes at the monsters numbered `mons` while any is within `range` blocks ahead on his rows. */
async function clear(bot: Bot, mons: number[], range = 6, dir: 'right' | 'left' = 'right'): Promise<void> {
  for (let k = 0; k < 6; k++) {
    const me = bot.px;
    const ahead = mons.flatMap((n) => where(bot, n)).filter((m) => (dir === 'right' ? m.x - me.x / 20 : me.x / 20 - m.x) > -0.5 && Math.abs(m.x - me.x / 20) < range && Math.abs(m.y - me.y / 20) < 1.5);
    if (!ahead.length) return;
    await joke(bot, dir);
  }
}

/** III. The rooftops: eight tituli (seven needed), three heaps of SAXA, Doc Leo, the wise man's spells, the tavern. */
export async function roofs(bot: Bot): Promise<void> {
  expect(bot, 4, 'the rooftops');
  await carefully(bot, 'the first house', 0, async () => {
    await must(bot, bot.walk(5, 'past the first titulus'), 'titulus');
    if (titles(bot) < 1) throw new Error('the first titulus untouched');
    await must(bot, bot.hop('right', 12, 'right', 7.6), 'over the chimney');
    await must(bot, bot.walk(9, 'into the alley ladder'), 'alley');
    await must(bot, bot.dig('up', 5.9, 'up the ladder'), 'climb');
    await must(bot, bot.walk(11, 'onto the second house'), 'house');
  });
  await carefully(bot, 'the pigeon, SAXA', 0, async () => {
    await clear(bot, [MON.pigeon]);
    await must(bot, bot.walk(15, 'the titulus, up to SAXA'), 'saxa');
    if (titles(bot) < 2) throw new Error('the second titulus untouched');
    await must(bot, bot.walk(16, 'through SAGA'), 'saga');
    await must(bot, bot.walk(18, 'down onto the third house'), 'down');
  });
  await carefully(bot, 'Doc Leo, the titulus, the cup', 0, async () => {
    await must(bot, bot.walk(21, 'Doc Leo, the titulus'), 'leo');
    await must(bot, bot.walk(22, 'under the cup'), 'cup');
    await up(bot, 'the cup');
    await must(bot, bot.walk(25, 'into the alley ladder'), 'alley');
    await must(bot, bot.dig('up', 6.9, 'up the ladder'), 'climb');
    await must(bot, bot.walk(27, 'onto the fourth house, the titulus'), 'house');
    if (titles(bot) < 4) throw new Error(`only ${titles(bot)} tituli`);
  });
  await carefully(bot, "the wise man's spells, his chimney", 0, async () => {
    await clear(bot, [MON.spell], 5);
    await must(bot, bot.walk(29.6, 'before the chimney'), 'chimney');
    await clear(bot, [MON.spell], 3);
    await must(bot, bot.hop('right', 12, 'right', 32.6), 'over the wise man');
    await must(bot, bot.walk(33, 'the coin'), 'coin');
  });
  await carefully(bot, 'the tall house: SAXA, a titulus, the wreath', 0, async () => {
    await must(bot, bot.hop('right', 12, 'right', 34), 'up onto the tall house');
    await must(bot, bot.walk(36, 'through SAXA'), 'saxa');
    await must(bot, bot.walk(39, 'the titulus, under the wreath'), 'wreath');
    if (titles(bot) < 5) throw new Error(`only ${titles(bot)} tituli`);
    await up(bot, 'the wreath');
    await must(bot, bot.walk(41, 'into the alley'), 'alley');
    await must(bot, bot.land(), 'land');
    await must(bot, bot.dig('up', 6.9, 'up the ladder'), 'climb');
    await must(bot, bot.walk(44.6, 'onto the next house, the titulus'), 'house');
  });
  await carefully(bot, 'the chimney, the pigeon, the grapes, the titulus', 0, async () => {
    await must(bot, bot.walk(45, 'before the chimney'), 'chimney');
    await clear(bot, [MON.pigeon], 5);
    await must(bot, bot.hop('right', 12, 'right', 48), 'over the chimney');
    await up(bot, 'the grapes');
    await must(bot, bot.walk(50, 'the titulus'), 'titulus');
    if (titles(bot) < 7) throw new Error(`only ${titles(bot)} tituli`);
  });
  await carefully(bot, 'the last house, SAXA, the tavern', 0, async () => {
    await must(bot, bot.hop('right', 12, 'right', 51.4), 'up onto the last house');
    await must(bot, bot.walk(54, 'the titulus, through SAXA'), 'saxa');
    await leave(bot, bot.walk(58, "Titus's tavern"), 'the tavern');
  });
}

/** Meows a mouse within `range` ahead into dropping its cheese, then walks to the cheese and eats it. */
async function mouse(bot: Bot, range: number, what: string): Promise<void> {
  const before = cheese(bot);
  await clear(bot, [MON.mouse], range);
  const crumb = where(bot, MON.crumb).filter((m) => Math.abs(m.x - bot.px.x / 20) < range + 1 && Math.abs(m.y - bot.px.y / 20) < 1);
  if (!crumb.length) throw new Error(`${what}: no cheese dropped`);
  await must(bot, bot.walk(Math.round(crumb[0].x * 5) / 5, `${what}'s cheese`), 'cheese');
  if (cheese(bot) <= before) throw new Error(`${what}: the cheese is still on the floor`);
}

/** IV. The kitchen, as Felix: three mice, four cupboards, the scrolls and the lamp, the will, the crown of cheese. */
export async function kitchen(bot: Bot): Promise<void> {
  expect(bot, 5, 'the kitchen');
  await carefully(bot, 'the first mouse', 0, async () => {
    await mouse(bot, 6, 'the first mouse');
  });
  await carefully(bot, 'the table: the bones, a cupboard', 0, async () => {
    await must(bot, bot.walk(10.4, 'by the table'), 'table');
    await must(bot, bot.hop('up', 10, 'right', 11), 'up on the table');
    await must(bot, bot.walk(14, 'the fish bones, the cupboard'), 'cupboard');
    await must(bot, bot.walk(15, 'the end of the table'), 'end');
    if (cheese(bot) < 2) throw new Error(`only ${cheese(bot)} cheese`);
  });
  await carefully(bot, 'the scrolls, the lamp, the shelf', 0, async () => {
    await must(bot, bot.hop('right', 6, 'right', 18), 'onto the scrolls');
    await must(bot, bot.hop('right', 12, 'right', 20), 'into the lamp');
    await must(bot, bot.hop('right', 8, 'right', 22), 'onto the shelf');
    await must(bot, bot.walk(26, 'the cupboard, the will (oops)'), 'will');
    if (cheese(bot) < 3) throw new Error(`only ${cheese(bot)} cheese`);
    await must(bot, bot.walk(28, 'down off the shelf'), 'down');
  });
  await carefully(bot, 'the second mouse, the cupboard down low', 0, async () => {
    await mouse(bot, 6, 'the second mouse');
    await must(bot, bot.walk(35, 'through the cupboard down low'), 'cupboard');
    if (cheese(bot) < 5) throw new Error(`only ${cheese(bot)} cheese`);
  });
  await carefully(bot, 'the shelf of jars: the ants, a cupboard', 0, async () => {
    await must(bot, bot.walk(35.6, 'by the shelf of jars'), 'jars');
    await must(bot, bot.hop('up', 12, 'right', 36), 'up on the shelf');
    await clear(bot, [MON.ant], 4);
    await must(bot, bot.walk(39, 'the cupboard on the shelf'), 'cupboard');
    if (cheese(bot) < 6) throw new Error(`only ${cheese(bot)} cheese`);
    await must(bot, bot.walk(40.4, 'down off the shelf'), 'down');
  });
  await carefully(bot, 'the third mouse', 0, async () => {
    await must(bot, bot.walk(37, 'the milk'), 'milk');
    await must(bot, bot.walk(40.4, 'back'), 'back');
    await mouse(bot, 6, 'the third mouse');
  });
  await leave(bot, bot.walk(48, 'the crown of cheese'), 'the crown of cheese');
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
