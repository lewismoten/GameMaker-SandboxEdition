// The bot's whole game on the built disk: the field, Bethlehem, the caravan and the stable,
// without losing a life, ending at the manger (check.ts and walkthrough.ts run it).
import { playLevels } from '../../kit/levelRun';
import { Bot } from './bot';
import { bethlehem, theCaravan, theField, theStable } from './route';
import { GameSim } from './sim';
import { keepToPaths, readWalkPaths } from '../../kit/walkPaths';

export const SEED = 1;
export const LEVELS = [theField, bethlehem, theCaravan, theStable];

export async function play(seed = SEED): Promise<{ sim: GameSim; bot: Bot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim);
  // along the paths, as a person walks (walkPaths.json, written by the build)
  bot.keepTo = keepToPaths(sim, readWalkPaths('goat'));
  await playLevels(bot, LEVELS);
  return { sim, bot };
}
