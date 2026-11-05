// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press,
// one scene at a time, taking every coin on the way. The scenes, in order:
//   level 1: the street, house 1 (red), the street, house 2 (blue), the street, house 3 (green), the street
//   level 2: the square, wood room, the square, ice room, the square, lava room, the square
// While it plays, each scene's palette is checked: the scene loads the palette file it should, that file
// holds the palette, and the three rooms of a level are the same map and blocks (the headless engine
// draws nothing, so it never loads a palette).
import { readFileSync } from 'node:fs';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { PLAZA_DOORS, PLAZA_END, STREET_DOORS, STREET_END, buildLevels } from '../src/levels';
import type { PalName } from '../src/palettes';

const { pals } = buildLevels();

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a scene: it must take the hero through a link (to another scene or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

const disk = new URL('../disk/', import.meta.url);
const game = parseGame(new Uint8Array(readFileSync(new URL('samehs.gam', disk))));

/** The scene the hero is in must list `pal`'s file (the .GAM and the .PAL on the disk are what is checked), and that file must hold the palette. */
function atPal(bot: StarterBot, pal: PalName, map: string): void {
  const n = bot.sim.trail[bot.sim.trail.length - 1];
  const scene = game.scenes[n];
  if (scene.files[0] !== `${pal}.pal`) throw new Error(`scene ${n} should load ${pal}.pal, not ${scene.files[0]}`);
  if (scene.files[1] !== `${map}.map` || scene.files[2] !== `${map}.bbl`)
    throw new Error(`scene ${n} should load ${map}.map and ${map}.bbl, not ${scene.files[1]} and ${scene.files[2]}`);
  const bytes = new Uint8Array(readFileSync(new URL(scene.files[0], disk)));
  for (let i = 0; i < 768; i++) if (bytes[i] !== pals.files[pal][i]) throw new Error(`${pal}.pal on the disk differs from the palette at byte ${i}`);
  bot.say(`scene ${n} loads ${scene.files[0]}, map ${scene.files[1]}, blocks ${scene.files[2]}`);
}

/** Reads a sign: walks to its column and stays a moment (a person reads in about three seconds). */
async function read(bot: StarterBot, col: number, what: string): Promise<void> {
  await must(bot, bot.walk(col, what), `to ${what}`);
  await must(bot, bot.wait(50), `reading ${what}`);
}

/** Walks to a hub's door and goes in, checking the coins on the way. */
async function door(bot: StarterBot, col: number, coins: number, what: string): Promise<void> {
  const before = bot.sim.ci.score;
  await must(bot, bot.walk(col - 1, `before ${what}`), `to ${what}`);
  if (bot.sim.ci.score - before !== coins) throw new Error(`the way to ${what} should give ${coins} points, not ${bot.sim.ci.score - before}`);
  await leave(bot, bot.walk(col + 1, what), what);
}

/** A room: four coins, then the way out. */
async function room(bot: StarterBot, pal: PalName, map: string, exit: number, sign: boolean): Promise<void> {
  atPal(bot, pal, map);
  const before = bot.sim.ci.score;
  if (sign) await read(bot, 8, 'the sign');
  else await must(bot, bot.wait(60), 'looking around');
  await must(bot, bot.walk(exit - 1, 'the far side'), 'across the room');
  if (bot.sim.ci.score - before !== 40) throw new Error(`the room should give 4 coins (40), not ${bot.sim.ci.score - before}`);
  await leave(bot, bot.walk(exit + 1, 'the door'), 'the door');
}

type Stage = (bot: StarterBot) => Promise<void>;
const HOUSES: PalName[] = ['red', 'blue', 'green'];
const TOWERS: PalName[] = ['wood', 'ice', 'lava'];

/** Level 1's street, the visit before house `k` (0 to 2) and, for k = 3, the walk on. */
const streetVisit =
  (k: number): Stage =>
  async (bot) => {
    atPal(bot, 'street', 'street');
    if (k === 0) await read(bot, 4, 'the first sign');
    if (k < 3) await door(bot, STREET_DOORS[k], k === 0 ? 0 : 10, `door ${k + 1}`);
    else {
      await read(bot, 38, 'the last sign');
      await leave(bot, bot.walk(STREET_END + 1, 'the end door'), 'the end door');
    }
  };

const plazaVisit =
  (k: number): Stage =>
  async (bot) => {
    atPal(bot, 'street', 'plaza');
    if (k === 0) await read(bot, 4, 'the first label');
    if (k < 3) await door(bot, PLAZA_DOORS[k], k === 0 ? 0 : 10, `door ${k + 1}`);
    else {
      await read(bot, 34, 'the last sign');
      await leave(bot, bot.walk(PLAZA_END + 1, 'the end door'), 'the end door');
    }
  };

const houseVisit =
  (k: number): Stage =>
  (bot) =>
    room(bot, HOUSES[k], 'house', 20, k === 0);
const towerVisit =
  (k: number): Stage =>
  (bot) =>
    room(bot, TOWERS[k], 'tower', 20, k === 0);

/** Every scene of the game, in the order they are played. */
export const STAGES: Stage[] = [
  streetVisit(0),
  houseVisit(0),
  streetVisit(1),
  houseVisit(1),
  streetVisit(2),
  houseVisit(2),
  streetVisit(3),
  plazaVisit(0),
  towerVisit(0),
  plazaVisit(1),
  towerVisit(1),
  plazaVisit(2),
  towerVisit(2),
  plazaVisit(3),
];
