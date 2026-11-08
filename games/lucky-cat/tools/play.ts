// The bot's whole game on the built disk, level after level, without losing a life, ending at the last door
// (check.ts, walkthrough.ts and gendemo.ts run it).
import { StarterBot } from '../../kit/starter/bot';
import { playLevels } from '../../kit/levelRun';
import { ladderLane, mirrorMaze, townHall, earlierThatMorning, raceToTheFair, clockTower, knockOnWood, rascalsRoof } from './route';
import { GameSim } from './sim';

export const SEED = 1;
export const LEVELS = [ladderLane, mirrorMaze, townHall, earlierThatMorning, raceToTheFair, clockTower, knockOnWood, rascalsRoof];

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: StarterBot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new StarterBot(sim);
  await playLevels(bot, LEVELS, upTo);
  return { sim, bot };
}
