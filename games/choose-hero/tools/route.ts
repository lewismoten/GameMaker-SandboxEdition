// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press,
// level by level, taking every coin the chosen hero can reach. The checks here fail unless each hero does
// what its sign says:
//   level 1: read the signs, walk into the left door (Fast Feet) or the right one (Big Hops)
//   level 3: the scene names no character file, so the hero is still the one picked (the jump push proves it); both finish
//   level 2: Fast Feet takes both steps and passes under the high coins; Big Hops skips the first step with one hop and
//            takes the high coins; either walks to the exit
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { BIG_PUSH, FAST_PUSH } from '../src/hero';
import { SEQ } from '../../kit/starter/ids';
import { L1, L2, L3 } from '../src/levels';

export type Hero = 'fast' | 'big';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (process.env.BOT_LOG) bot.say(`${what}: score ${bot.sim.ci.score}`);
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** Every coin is 10 points: the score a level should have given. */
function score(bot: StarterBot, from: number, want: number, what: string): void {
  const got = bot.sim.ci.score - from;
  if (got !== want) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: scored ${got}, expected ${want}; coins left at ${left.join(' ')}`);
  }
  bot.say(`${what}: scored ${got}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const col = (bot: StarterBot) => bot.px.x / 20;
const row = (bot: StarterBot) => bot.px.y / 20;

/** 1. Two Doors: read the signs, then walk into the door of the chosen hero. */
export function twoDoors(hero: Hero) {
  return async (bot: StarterBot): Promise<void> => {
    const from = bot.sim.ci.score;
    await must(bot, bot.walk(13, 'the middle sign'), 'to the middle sign');
    await must(bot, bot.wait(LOOK), 'reading the sign');
    await must(bot, bot.walk(7, 'the Fast Feet sign'), 'to the Fast Feet sign');
    await must(bot, bot.wait(LOOK), 'reading the sign');
    await must(bot, bot.walk(25, 'the Big Hops sign'), 'to the Big Hops sign');
    await must(bot, bot.wait(LOOK), 'reading the sign');
    await must(bot, bot.walk(L1.coins[L1.coins.length - 1][0] + 1, 'the last coin'), 'to the last coin');
    score(bot, from, 10 * L1.coins.length, 'level 1');
    await leave(bot, bot.walk(L1.doors[hero === 'big' ? 1 : 0], 'its door'), 'the door');
  };
}

/** 2. The Same Climb: the steps for Fast Feet; one skipped step and the high coins for Big Hops. */
export function theClimb(hero: Hero) {
  return async (bot: StarterBot): Promise<void> => {
    const from = bot.sim.ci.score;
    const [s1, s2] = L2.steps;
    const G = L2.ground;
    const stepFeet = (h: number) => G - h - 1;
    await must(bot, bot.walk(5, 'the steps sign'), 'to the sign');
    await must(bot, bot.wait(LOOK), 'reading the sign');
    await must(bot, bot.walk(9, 'the skip sign'), 'to the sign');
    await must(bot, bot.wait(LOOK), 'reading the sign');
    await must(bot, bot.walk(L2.low[0][0], 'the first coin'), 'to the first coin');
    if (hero === 'big') {
      // one hop from the ground lands him on the second step, skipping the first
      await must(bot, bot.walk(s1.cols[0] - 1, 'the foot of the steps'), 'to the steps');
      await must(bot, bot.jump('right', s2.cols[0] + 1), 'skipping a step');
      bot.say(`Big Hops skipped a step: column ${col(bot).toFixed(1)}, row ${row(bot).toFixed(1)}`);
      if (row(bot) > stepFeet(s2.height) + 0.2 || row(bot) < stepFeet(s2.height) - 0.4)
        throw new Error(`Big Hops should stand on the second step (row ${stepFeet(s2.height)}); he is at ${col(bot).toFixed(1)}, ${row(bot).toFixed(1)}`);
    } else {
      await must(bot, bot.walk(s2.cols[0] + 1, 'the second step'), 'up the steps');
      if (row(bot) > stepFeet(s2.height) + 0.2) throw new Error(`Fast Feet should stand on the second step; he is at ${row(bot).toFixed(1)}`);
    }
    await must(bot, bot.walk(L2.plateau.cols[0] + 1, 'the plateau'), 'onto the plateau');
    await must(bot, bot.walk(22, 'the plateau sign'), 'to the plateau sign');
    await must(bot, bot.wait(LOOK), 'reading the sign');
    if (hero === 'big') {
      // hop for the three high coins, one jump each
      for (const [x] of L2.high) {
        await must(bot, bot.walk(x, 'under a high coin'), 'under a coin');
        await must(bot, bot.jump(), 'hopping for a coin');
      }
    } else {
      // Fast Feet jumps beneath them and cannot reach: a person would try once
      await must(bot, bot.walk(L2.high[1][0], 'under the high coins'), 'under the coins');
      await must(bot, bot.jump(), 'a jump that falls short');
      if (row(bot) < G - L2.plateau.height - 2) throw new Error('Fast Feet should land back on the plateau');
    }
    await must(bot, bot.walk(L2.plateau.cols[1] + 3, 'off the plateau'), 'off the plateau');
    await must(bot, bot.walk(L2.low[4][0] + 1, 'the last coin'), 'to the last coin');
    const coins = L2.low.length + (hero === 'big' ? L2.high.length : 0);
    score(bot, from, 10 * coins, 'level 2');
    await leave(bot, bot.walk(L2.exit, 'the exit'), 'the exit');
  };
}

/** 3. The Open Road: this scene lists no character file, so the engine keeps the hero of the last scene. */
export function openRoad(hero: Hero) {
  return async (bot: StarterBot): Promise<void> => {
    const from = bot.sim.ci.score;
    const push = -bot.sim.w.chr.sequences[SEQ.jump].frames[0].y;
    const want = hero === 'big' ? BIG_PUSH : FAST_PUSH;
    if (push !== want) throw new Error(`The road should keep ${hero}'s jump (push ${want}); the hero here has push ${push}`);
    bot.say(`the road kept the ${hero} hero (jump push ${push})`);
    await must(bot, bot.walk(7, 'the first sign'), 'to the sign');
    await must(bot, bot.wait(LOOK), 'reading the sign');
    await must(bot, bot.walk(L3.coins[1][0], 'the second coin'), 'to the coins');
    await must(bot, bot.walk(L3.hill.cols[0] + 2, 'the hill'), 'up the hill');
    await must(bot, bot.walk(L3.coins[3][0], 'the hilltop coins'), 'along the hilltop');
    await must(bot, bot.walk(L3.coins[5][0], 'the last coin'), 'to the last coin');
    score(bot, from, 10 * L3.coins.length, 'level 3');
    await leave(bot, bot.walk(L3.exit, 'the exit'), 'the exit');
  };
}
