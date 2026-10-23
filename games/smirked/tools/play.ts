// The bot's whole game on the built disk, level after level, without losing a life, ending on
// the emergency exit (check.ts and walkthrough.ts run it).
import { playLevels } from '../../kit/levelRun';
import { Bot } from './bot';
import { fakeWoods, fogHall, lastHall, zombieParade } from './route';
import { GameSim } from './sim';

export const SEED = 1;
export const LEVELS = [fogHall, zombieParade, fakeWoods, lastHall];

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: Bot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim);
  await playLevels(bot, LEVELS, upTo);
  return { sim, bot };
}
