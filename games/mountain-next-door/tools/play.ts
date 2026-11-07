// The bot's whole game on the built disk, level after level, without losing a life, ending at the last door
// (check.ts, walkthrough.ts and gendemo.ts run it).
import { StarterBot } from '../../kit/starter/bot';
import { playLevels } from '../../kit/levelRun';
import { emptySpot, footprints, gateHunt, nextDoor, signposts, steppingStones, windyRidge } from './route';
import { GameSim } from './sim';

export const SEED = 1;
const ROUTES = [nextDoor, gateHunt, footprints, steppingStones, signposts, emptySpot, windyRidge];

/** Ticks the bot spent in each level (filled in as it plays). */
export const LEVEL_TICKS: number[] = [];

export const LEVELS = ROUTES.map((route, i) => async (bot: StarterBot) => {
  const t0 = bot.sim.w.clock;
  try {
    await route(bot);
  } finally {
    LEVEL_TICKS[i] = bot.sim.w.clock - t0;
  }
});

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: StarterBot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new StarterBot(sim);
  await playLevels(bot, LEVELS, upTo);
  return { sim, bot };
}
