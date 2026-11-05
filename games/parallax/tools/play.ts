// The bot's whole game on the built disk, level after level, without losing a life, ending
// at the second door (check.ts, walkthrough.ts and gendemo.ts run it).
import { StarterBot } from '../../kit/starter/bot';
import { playLevels } from '../../kit/levelRun';
import { driftingClouds, threeSpeeds } from './route';
import { GameSim } from './sim';

export const SEED = 1;
const LEVELS = [threeSpeeds, driftingClouds];

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: StarterBot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new StarterBot(sim);
  await playLevels(bot, LEVELS, upTo);
  return { sim, bot };
}
