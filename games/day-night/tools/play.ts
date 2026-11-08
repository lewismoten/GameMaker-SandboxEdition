// The bot's whole game on the built disk, stage after stage, without losing a life, ending
// at the last door (check.ts, walkthrough.ts and gendemo.ts run it).
import { StarterBot } from '../../kit/starter/bot';
import { playLevels } from '../../kit/levelRun';
import { dayOne, dayTwo, duskTwo, nightOne, nightTwo } from './route';
import { GameSim } from './sim';

export const SEED = 1;
const STAGES = [dayOne, nightOne, dayTwo, duskTwo, nightTwo];

export async function play(seed = SEED, upTo = STAGES.length): Promise<{ sim: GameSim; bot: StarterBot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new StarterBot(sim);
  await playLevels(bot, STAGES, upTo);
  return { sim, bot };
}
