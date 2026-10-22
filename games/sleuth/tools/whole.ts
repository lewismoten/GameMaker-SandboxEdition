// Plays the whole case on the built disk with the bot (used by check.ts and walkthrough.ts).
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameSim } from './sim';
import { Bot } from './bot';
import { act1, act2, accuse, findEgg, greenRoom } from './route';
import { buildGame } from '../src/game';
import { buildActs } from '../src/levels/acts';
import { buildTheatreBlocks } from '../src/blocks/tiles';
import { buildParlorBlocks, buildParlorMap } from '../src/levels/parlor';

export function sceneIndex() {
  return buildGame(buildActs(buildTheatreBlocks()), buildParlorMap(buildParlorBlocks()).links).ix;
}

export function loadDisk(): Map<string, Uint8Array> {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'disk');
  return new Map(readdirSync(dir).map((n) => [n, new Uint8Array(readFileSync(join(dir, n)))]));
}

export async function playWhole(files: Map<string, Uint8Array>, opts: { quick?: boolean; wrong?: string; egg?: boolean } = {}): Promise<Bot> {
  const ix = sceneIndex();
  const bot = new Bot(new GameSim(files));
  try {
    await act1(bot);
    if (bot.sim.scene !== ix.gr1a) throw new Error(`Act One led to scene ${bot.sim.scene}`);
    await greenRoom(bot, 1, { hub: ix.gr1, ivs: ix.iv1, evs: ix.ev1 }, !opts.quick);
    if (bot.sim.scene !== ix.act2) throw new Error(`The green room led to scene ${bot.sim.scene}`);
    await act2(bot);
    if (bot.sim.scene !== ix.gr2a) throw new Error(`Act Two led to scene ${bot.sim.scene}`);
    if (opts.egg) await findEgg(bot, ix.egg);
    await greenRoom(bot, 2, { hub: ix.gr2, ivs: ix.iv2, evs: ix.ev2 }, !opts.quick);
    if (bot.sim.scene !== ix.acca) throw new Error(`The green room led to scene ${bot.sim.scene}`);
    await accuse(bot, ix, opts.wrong);
  } catch (e) {
    console.log(bot.log.join('\n'));
    throw e;
  }
  return bot;
}
