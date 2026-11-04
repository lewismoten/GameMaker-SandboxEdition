// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press,
// level by level, with a person's pauses. It acts out each lesson once, the trouble included:
//   level 1: step onto the ice, let go of every key, and slide on (further than a step) into the spike;
//            later jump straight up through the ledge and land on top
//   level 2: step onto the belt and stand still; it carries Kit along into the spike at its end
//   level 3: bounce on the spring up to the ledge; then walk into the wind, which lifts him up through the
//            shelf, and walk on into the spike up there
import { SCAN } from '../../kit/starter/ids';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { BELT, ICE, ICE_SPIKE, SHELF_SPIKE, SPRING } from '../src/levels';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** Hit points a spike takes (slick.ts SPIKE_HURT). */
const SPIKE_COST = 10;
/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const hp = (bot: StarterBot) => bot.sim.ci.hitpts;
const col = (bot: StarterBot) => bot.px.x / 20;
const row = (bot: StarterBot) => bot.px.y / 20;

/** Every coin is 10 points: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

/** Holds a key until `done()` (or `max` ticks); returns what stopped the hero, if anything. */
async function hold(bot: StarterBot, key: 'left' | 'right', done: () => boolean, max = 300): Promise<Result> {
  bot.sim.press(SCAN[key]);
  for (let t = 0; t < max && !done(); t++) {
    const r = await bot.tick();
    if (r) return (bot.sim.releaseAll(), r);
  }
  bot.sim.release(SCAN[key]);
  return undefined;
}

/** 1. Ice: walk on, let go, slide into the spike; later jump up through the ledge. */
export async function ice(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const hp0 = hp(bot);
  await must(bot, bot.walk(10, 'the ice sign'), 'to the ice sign');
  await must(bot, bot.wait(LOOK), 'reading the ice sign');
  await must(bot, bot.walk(ICE[0] - 1, 'the edge of the ice'), 'to the ice');
  // what the ICE sign teaches, once, on purpose: step on, let go of every key, and keep sliding
  await must(bot, hold(bot, 'right', () => col(bot) >= ICE[0] + 4.2), 'onto the ice');
  const letGo = col(bot);
  if (letGo < ICE[0] + 3 || letGo > ICE[1]) throw new Error(`should let go on the ice, not at ${letGo.toFixed(1)}`);
  await must(bot, bot.wait(90), 'sliding');
  const slid = col(bot) - letGo;
  if (slid < 3) throw new Error(`with no key held Kit should slide on 3 blocks or more; he slid ${slid.toFixed(1)}`);
  if (hp(bot) !== hp0 - SPIKE_COST) throw new Error(`the slide should end in the spike (cost ${SPIKE_COST}); hit points ${hp0} -> ${hp(bot)}`);
  bot.say(`let go at ${letGo.toFixed(1)}, slid ${slid.toFixed(1)} blocks to ${col(bot).toFixed(1)} and hit the spike at ${ICE_SPIKE}: ${hp0} -> ${hp(bot)}`);
  await must(bot, bot.wait(LOOK), 'watching the hit points drop');
  // the ledge: straight up through it, and a walk along the top
  await must(bot, bot.walk(26, 'the ledge sign'), 'to the ledge sign');
  await must(bot, bot.wait(LOOK), 'reading the ledge sign');
  await must(bot, bot.walk(31, 'under the ledge'), 'under the ledge');
  await must(bot, bot.jump(), 'up through the ledge');
  if (row(bot) > 6.1 || row(bot) < 5.9) throw new Error(`Kit should be standing on the ledge (row 6), not at ${row(bot).toFixed(2)}`);
  bot.say(`up through the ledge: standing on top at row ${row(bot).toFixed(1)}`);
  await must(bot, bot.wait(20), 'standing on the ledge');
  await must(bot, bot.walk(36, 'off the ledge'), 'along the ledge');
  await must(bot, bot.walk(43, 'past the coins'), 'past the coins');
  coins(bot, score, 7, 'level 1 coins');
  await leave(bot, bot.walk(46, 'the exit'), 'the exit');
}

/** 2. The Belt: step on, stand still, and be carried into the spike. */
export async function belt(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const hp0 = hp(bot);
  await must(bot, bot.walk(8, 'the belt sign'), 'to the belt sign');
  await must(bot, bot.wait(LOOK), 'reading the belt sign');
  await must(bot, bot.walk(BELT[0] - 1, 'the edge of the belt'), 'to the belt');
  // what the BELT sign teaches, once, on purpose: step on, then stand still
  await must(bot, hold(bot, 'right', () => col(bot) >= BELT[0] + 0.4), 'onto the belt');
  const from = col(bot);
  await must(bot, bot.wait(80), 'riding the belt');
  const rode = col(bot) - from;
  if (rode < 8) throw new Error(`standing still on the belt, Kit should be carried 8 blocks or more; he went ${rode.toFixed(1)}`);
  if (hp(bot) !== hp0 - SPIKE_COST) throw new Error(`the belt should carry Kit into the spike (cost ${SPIKE_COST}); hit points ${hp0} -> ${hp(bot)}`);
  bot.say(`stood still at ${from.toFixed(1)} and rode ${rode.toFixed(1)} blocks to ${col(bot).toFixed(1)}: ${hp0} -> ${hp(bot)}`);
  await must(bot, bot.wait(LOOK), 'watching the hit points drop');
  await must(bot, bot.walk(30, 'past the coins'), 'on past the coins');
  coins(bot, score, 5, 'level 2 coins');
  await leave(bot, bot.walk(40, 'the exit'), 'the exit');
}

/** 3. Wind: bounce up to the ledge, then ride the wind up through the shelf, and walk into the spike up there. */
export async function wind(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const hp0 = hp(bot);
  await must(bot, bot.walk(7, 'the spring sign'), 'to the spring sign');
  await must(bot, bot.wait(LOOK), 'reading the spring sign');
  await must(bot, bot.walk(SPRING[0] - 1, 'the spring'), 'to the spring');
  // the spring: step on, bounce, steer right onto the ledge
  await must(bot, hold(bot, 'right', () => col(bot) >= 13.3 && row(bot) >= 4.9 && row(bot) <= 5.05, 200), 'bouncing up to the ledge');
  await must(bot, bot.land(), 'landing on the ledge');
  if (row(bot) > 5.1) throw new Error(`the spring should put Kit on the ledge (row 5), not at row ${row(bot).toFixed(2)}`);
  bot.say(`bounced onto the ledge at ${col(bot).toFixed(1)}, row ${row(bot).toFixed(1)}`);
  await must(bot, bot.wait(20), 'standing on the ledge');
  await must(bot, bot.walk(18.5, 'off the ledge'), 'along the ledge');
  await must(bot, bot.walk(21, 'the wind sign'), 'to the wind sign');
  await must(bot, bot.wait(LOOK), 'reading the wind sign');
  await must(bot, bot.walk(23.4, 'the fan'), 'to the fan');
  // the wind: walk in, and it lifts him up through the one-way shelf and sets him down on top
  await must(bot, hold(bot, 'right', () => col(bot) >= 25.2, 60), 'into the wind');
  await must(bot, bot.land(), 'landing on the shelf');
  if (row(bot) > 2.1 || row(bot) < 1.9) throw new Error(`the wind should leave Kit on the shelf (row 2), not at ${row(bot).toFixed(2)}`);
  bot.say(`blown up through the shelf: standing on top at row ${row(bot).toFixed(1)}`);
  await must(bot, bot.wait(LOOK), 'looking around on the shelf');
  // and what a walk across the shelf runs into
  await must(bot, bot.walk(SHELF_SPIKE + 1, 'past the spike'), 'along the shelf');
  if (hp(bot) !== hp0 - SPIKE_COST) throw new Error(`the shelf spike should cost ${SPIKE_COST}; hit points ${hp0} -> ${hp(bot)}`);
  await must(bot, bot.wait(LOOK), 'watching the hit points drop');
  await must(bot, bot.walk(35.5, 'past the coins'), 'on past the coins');
  coins(bot, score, 8, 'level 3 coins');
  await leave(bot, bot.walk(37, 'the exit'), 'the exit');
}
