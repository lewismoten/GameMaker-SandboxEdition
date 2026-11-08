// The bot's whole game on the built disk, level after level, without losing a life, ending at the last door
// (check.ts, walkthrough.ts and gendemo.ts run it).
import { StarterBot } from '../../kit/starter/bot';
import { playLevels } from '../../kit/levelRun';
import { emptySpot, footprints, lowTunnel, gateHunt, nextDoor, signposts, steppingStones, summitPicnic, windyRidge, zigzagHome } from './route';
import { library, mossbackBack } from './routeMore';
import { lookout, rooftops } from './routeLate';
import { excuseMe, gatheringMist, theFord } from './routeNew';
import { theSurveyLine } from './routeGrow';
import { theSpillway } from './routeSpill';
import { theClockTower } from './routeClock';
import { halesOrchard } from './routeHour';
import { GameSim } from './sim';

export const SEED = 1;
const ROUTES = [
  nextDoor,
  gateHunt,
  mossbackBack,
  footprints,
  library,
  steppingStones,
  gatheringMist,
  signposts,
  theSurveyLine,
  halesOrchard,
  emptySpot,
  lookout,
  windyRidge,
  theSpillway,
  rooftops,
  lowTunnel,
  excuseMe,
  theClockTower,
  theFord,
  zigzagHome,
  summitPicnic,
];

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
