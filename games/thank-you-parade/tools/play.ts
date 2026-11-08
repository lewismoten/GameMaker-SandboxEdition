// The bot's whole game on the built disk, level after level, without losing a life (check.ts and walkthrough.ts run it).
import { StarterBot } from '../../kit/starter/bot';
import { playLevels } from '../../kit/levelRun';
import { airstrip, bakeryRow, millCreek, callTime, drumOff, gust, stepOff, theFloat, theRoute } from './route';
import { GameSim } from './sim';

export const SEED = 1;
const LEVELS = [callTime, gust, bakeryRow, airstrip, millCreek, theFloat, drumOff, theRoute, stepOff];

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: StarterBot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new StarterBot(sim);
  await playLevels(bot, LEVELS, upTo);
  return { sim, bot };
}
