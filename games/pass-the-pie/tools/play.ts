// The bot's whole game on the built disk, level after level, without losing a life, ending at the last door
// (check.ts and walkthrough.ts run it). `from` starts at a later level (the title's link points there instead): try.ts.
import { parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { fileURLToPath } from 'node:url';
import { StarterBot } from '../../kit/starter/bot';
import { playLevels } from '../../kit/levelRun';
import { LEVELS } from './route';
import { GameSim } from './sim';

export const SEED = 1;

export async function play(seed = SEED, upTo = LEVELS.length, from = 0): Promise<{ sim: GameSim; bot: StarterBot }> {
  let files: Map<string, Uint8Array> | undefined;
  if (from > 0) {
    files = readDisk(fileURLToPath(new URL('../disk', import.meta.url)));
    const gam = [...files.keys()].find((n) => n.endsWith('.gam'))!;
    const game = parseGame(files.get(gam)!);
    game.scenes[0].links[0] = { ...game.scenes[0].links[0], toScene: from + 2, to: game.scenes[from + 1].links[0].to };
    files.set(gam, serializeGame(game));
  }
  const sim = new GameSim(files, seed);
  const bot = new StarterBot(sim);
  await playLevels(bot, LEVELS.slice(from), upTo - from);
  return { sim, bot };
}
