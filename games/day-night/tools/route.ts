// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, one stage (scene) at a time, taking every coin on the way. It acts out each lesson
// once:
//   level 1, day:    read the three signs under a day sky (the stars are in the sky but you cannot
//                    see them), take the coins on the porch, and go in the door
//   level 1, night:  the same room again, in the night palette: read nothing new, take the coins,
//                    and go in the door (it goes on)
//   level 2, day / dusk / night: walk through the first gate, then the second; at dusk, walk back
//                    through the first gate once, to see that it does not take you back to the day
//                    (a link goes one way), then forward again; and at night go home
// While it plays, each stage's palette is checked: the scene loads the palette file for its hour, and
// that file holds the palette (the headless engine draws nothing, so it never loads one).
import { readFileSync } from 'node:fs';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { DOOR_ONE, DOOR_TWO, GATES, buildLevels, type Hour } from '../src/levels';

const { pals } = buildLevels();

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a stage: it must take the hero through a link (to the next stage or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

const disk = new URL('../disk/', import.meta.url);
const game = parseGame(new Uint8Array(readFileSync(new URL('dayngt.gam', disk))));

/** The scene the hero is in must list the palette file for `hour` (the headless engine does not load palettes, so the .GAM and the .PAL on the disk are what is checked), and that file must hold the palette. */
function atHour(bot: StarterBot, hour: Hour): void {
  const scene = game.scenes[bot.sim.trail[bot.sim.trail.length - 1]];
  if (scene.files[0] !== `${hour}.pal`) throw new Error(`scene ${bot.sim.trail[bot.sim.trail.length - 1]} should load ${hour}.pal, not ${scene.files[0]}`);
  const bytes = new Uint8Array(readFileSync(new URL(scene.files[0], disk)));
  const want = pals[hour];
  for (let i = 0; i < 768; i++) if (bytes[i] !== want[i]) throw new Error(`${hour}.pal on the disk differs from the palette at byte ${i}`);
  bot.say(`scene ${bot.sim.trail[bot.sim.trail.length - 1]} loads ${scene.files[0]}, map ${scene.files[1]}, blocks ${scene.files[2]}`);
}

/** Reads a sign: walks to its column and stays a moment (a person reads in about three seconds). */
async function read(bot: StarterBot, col: number, what: string): Promise<void> {
  await must(bot, bot.walk(col, what), `to ${what}`);
  await must(bot, bot.wait(50), `reading ${what}`);
}

/** The porch and its coins, then the door: the end of both stages of level 1. */
async function porch(bot: StarterBot, coins: number): Promise<void> {
  const before = bot.sim.ci.score;
  await must(bot, bot.walk(20, 'the porch'), 'to the porch');
  await must(bot, bot.walk(24, 'the end of the porch'), 'along the porch');
  if (bot.sim.ci.score - before !== coins) throw new Error(`the porch should give ${coins} points, not ${bot.sim.ci.score - before}`);
  await leave(bot, bot.walk(DOOR_ONE + 1, 'the door'), 'the door');
}

/** 1. One Map, Two Looks, by day. */
export async function dayOne(bot: StarterBot): Promise<void> {
  atHour(bot, 'day');
  await read(bot, 6, 'the first sign');
  await read(bot, 11, 'the second sign');
  await read(bot, 16, 'the third sign');
  await porch(bot, 40);
}

/** 1. The same map, in the night palette. */
export async function nightOne(bot: StarterBot): Promise<void> {
  atHour(bot, 'night');
  await must(bot, bot.wait(60), 'looking at the night sky');
  await porch(bot, 40);
}

/** 2. Sundown Street, by day: one coin, then the first gate. */
export async function dayTwo(bot: StarterBot): Promise<void> {
  atHour(bot, 'day');
  await read(bot, 5, 'the first sign');
  await leave(bot, bot.walk(GATES[0] + 1, 'the first gate'), 'the first gate');
}

/** 2. At dusk: the sign, three coins, a walk back through the first gate (nothing happens), and the second gate. */
export async function duskTwo(bot: StarterBot): Promise<void> {
  atHour(bot, 'dusk');
  const before = bot.sim.ci.score;
  await must(bot, bot.walk(GATES[0] - 2, 'back past the first gate'), 'back through the first gate');
  if (bot.px.x > (GATES[0] - 2) * 20) throw new Error('the hero should be past the first gate');
  bot.say(`back past the first gate and still at dusk (tick ${bot.sim.ticks})`);
  atHour(bot, 'dusk');
  await read(bot, 16, 'the second sign');
  await must(bot, bot.walk(GATES[1] - 1, 'the second gate'), 'to the second gate');
  if (bot.sim.ci.score - before !== 30) throw new Error(`dusk should give 3 coins (30), not ${bot.sim.ci.score - before}`);
  await leave(bot, bot.walk(GATES[1] + 1, 'the second gate'), 'the second gate');
}

/** 2. At night: the last sign, and home. */
export async function nightTwo(bot: StarterBot): Promise<void> {
  atHour(bot, 'night');
  await read(bot, 28, 'the third sign');
  await leave(bot, bot.walk(DOOR_TWO, 'the cottage door'), 'the cottage door');
}
