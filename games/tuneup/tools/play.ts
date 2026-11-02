// The bot's whole game on the built disk, level after level, without losing a life, ending
// with the dream's end and the real tune-up so far (check.ts and walkthrough.ts run it).
import { playLevels } from '../../kit/levelRun';
import { Bot } from './bot';
import { jumpStart, oilsWell, sparkPlucks, timingBeat } from './route';
import { REAL_LEVELS } from './route2';
import { LEVELS_10_13 } from './route3';
import { LEVELS_15_16 } from './route4';
import { beltway } from './route5';
import { GameSim } from './sim';

export const SEED = 1;
const LEVELS = [jumpStart, sparkPlucks, timingBeat(0), timingBeat(1), timingBeat(2), oilsWell, ...REAL_LEVELS, ...LEVELS_10_13, beltway, ...LEVELS_15_16];

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: Bot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim, seed);
  await playLevels(bot, LEVELS, upTo);
  return { sim, bot };
}
