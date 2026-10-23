// The bot's whole game on the built disk, level after level, without losing a life, ending at the
// altar on the stage (check.ts and walkthrough.ts run it).
import { playLevels } from '../../kit/levelRun';
import { Bot } from './bot';
import { banquet, battle, roofs, kitchen, baths, theater } from './route';
import { GameSim } from './sim';

export const SEED = 1;
export const LEVELS = [banquet, battle, roofs, kitchen, baths, theater];

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: Bot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim);
  await playLevels(bot, LEVELS, upTo);
  return { sim, bot };
}
