// The bot's whole game on the built disk, scene after scene, without losing a life, ending at the last door
// (check.ts, walkthrough.ts and gendemo.ts run it).
import { StarterBot } from '../../kit/starter/bot';
import { playLevels } from '../../kit/levelRun';
import { buildLevels } from '../src/levels';
import { routeFor } from './route';
import { GameSim } from './sim';

export const SEED = 1;

/** Ticks the bot spent in each scene (filled in as it plays). */
export const LEVEL_TICKS: number[] = [];

export const LEVELS = buildLevels().levels.map((l, i) => {
  const route = routeFor(l);
  return async (bot: StarterBot) => {
    const t0 = bot.sim.w.clock;
    try {
      await route(bot);
    } finally {
      LEVEL_TICKS[i] = bot.sim.w.clock - t0;
    }
  };
});

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: StarterBot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new StarterBot(sim);
  await playLevels(bot, LEVELS, upTo);
  return { sim, bot };
}
