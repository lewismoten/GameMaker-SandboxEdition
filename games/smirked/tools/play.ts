// The bot's whole game on the built disk, level after level, without losing a life, ending on
// the emergency exit (check.ts and walkthrough.ts run it).
import { playLevels } from '../../kit/levelRun';
import { Bot } from './bot';
import { fakeWoods, fogHall, lastHall, zombieParade } from './route';
import { GameSim } from './sim';
import { keepToPaths, readWalkPaths } from '../../kit/walkPaths';

export const SEED = 1;
const LEVELS = [fogHall, zombieParade, fakeWoods, lastHall];

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: Bot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim);
  // along the foyer's runner, as a person walks (walkPaths.json, written by the build)
  bot.keepTo = keepToPaths(sim, readWalkPaths('smirked'));
  await playLevels(bot, LEVELS, upTo);
  return { sim, bot };
}
