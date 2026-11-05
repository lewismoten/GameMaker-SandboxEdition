// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press,
// level by level, digging every nugget on the way. It acts out each lesson once, and the checks here fail
// unless the soil does what its sign says:
//   level 1: walk into the hill's foot: the rock stops Kit and the soil above it does not; he jumps, digs over the rock
//            and tunnels on through the hill, taking the gold flecks
//   level 2: step onto the soil trapdoor and sink; tunnel right under the spikes (they stay unharmed overhead); climb the
//            ladder out to the surface; no life lost and no hit point lost
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { L1, L2 } from '../src/levels';

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

/** Every nugget is 10 points: the score a level should have given. */
function score(bot: StarterBot, from: number, want: number, what: string): void {
  const got = bot.sim.ci.score - from;
  if (got !== want) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10 && b.solid);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: scored ${got}, expected ${want}; coins left at ${left.join(' ')}`);
  }
  if (got !== want) throw new Error(`${what}: scored ${got}, expected ${want}`);
  bot.say(`${what}: scored ${got}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const col = (bot: StarterBot) => bot.px.x / 20;
const row = (bot: StarterBot) => bot.px.y / 20;
const hp = (bot: StarterBot) => bot.sim.ci.hitpts;

/** 1. The Tunnel: the rock stops him, so he jumps and digs over it, then tunnels on. */
export async function theTunnel(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp0 = hp(bot);
  await must(bot, bot.walk(5, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the signs');
  await must(bot, bot.walk(9, 'the rock sign'), 'to the second sign');
  await must(bot, bot.wait(LOOK), 'reading the rock sign');
  await must(bot, bot.walk(13, 'the gold sign'), 'to the third sign');
  await must(bot, bot.wait(LOOK), 'reading the gold sign');
  await must(bot, bot.walk(L1.rock - 1, 'the hill'), 'to the foot of the hill');
  // the lesson: the rock stops him where soil would not
  await must(bot, bot.wait(15), 'a look at the rock');
  if (col(bot) > L1.rock - 0.4) throw new Error(`the rock should stop Kit at column ${L1.rock - 1}; he is at ${col(bot).toFixed(1)}`);
  // now over it: the walk jumps when a wall stops him
  await must(bot, bot.walk(L1.rock + 3, 'over the rock'), 'over the rock');
  await must(bot, bot.walk(L1.hill[1] + 2, 'out of the hill'), 'through the hill');
  if (hp(bot) !== hp0) throw new Error('digging must not hurt');
  score(bot, from, 10 * L1.nuggets.length, 'level 1');
  await must(bot, bot.walk(L1.exit - 1, 'the exit'), 'to the exit');
  await leave(bot, bot.walk(L1.exit, 'the exit'), 'the exit');
}

/** 2. Under the Spikes: sink through the trapdoor, tunnel under the spikes and climb the steps out. */
export async function theSink(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp0 = hp(bot);
  const [s0] = L2.shaft;
  await must(bot, bot.walk(5, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(9, 'the spikes sign'), 'to the second sign');
  await must(bot, bot.wait(LOOK), 'reading the spikes sign');
  await must(bot, bot.walk(s0 - 1, 'the trapdoor'), 'to the trapdoor');
  // step onto the soil: it gives way and Kit sinks to the tunnel floor
  await must(bot, bot.walk(s0 + 0.5, 'onto the soil'), 'onto the soil');
  await must(bot, bot.wait(LOOK), 'sinking');
  if (row(bot) < L2.floor - 1) throw new Error(`Kit should have sunk to the tunnel floor (row ${L2.floor - 1}); he is at row ${row(bot).toFixed(1)}`);
  bot.say(`Kit sank to row ${row(bot).toFixed(1)}`);
  await must(bot, bot.walk(L2.ladder - 1, 'the foot of the ladder'), 'tunnelling under the spikes');
  if (hp(bot) !== hp0) throw new Error('the spikes must not be touched; Kit goes under them');
  await must(bot, bot.walk(L2.ladder, 'the ladder'), 'to the ladder');
  await must(bot, bot.climb('up', L2.surface - 1, 'up the ladder'), 'up the ladder');
  await must(bot, bot.walk(L2.exit - 1, 'the exit'), 'to the exit');
  score(bot, from, 10 * L2.nuggets.length, 'level 2');
  await leave(bot, bot.walk(L2.exit, 'the exit'), 'the exit');
}
