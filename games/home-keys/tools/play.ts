// The bot's whole game on the built disk, level after level, ending at the last door (check.ts,
// walkthrough.ts and gendemo.ts run it). Nothing in this game hurts, so it must not lose a life.
import { StarterBot } from '../../kit/starter/bot';
import { arrowsSpaceEnter, leapShelves, noDiagonal } from './route';
import { GameSim } from './sim';

export const SEED = 1;
const LEVELS = [arrowsSpaceEnter, noDiagonal, leapShelves];

/** `detour`: also take level 3's extra coins with E and Q (the walkthrough does; check.ts also plays without). */
export async function play(seed = SEED, upTo = LEVELS.length, detour = true): Promise<{ sim: GameSim; bot: StarterBot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new StarterBot(sim);
  for (const level of LEVELS.slice(0, upTo)) {
    try {
      await (level === leapShelves ? leapShelves(bot, { detour }) : level(bot));
    } finally {
      if (process.env.BOT_LOG) console.log(bot.log.join('\n'));
      bot.log.length = 0;
    }
    bot.say(`${level.name} done`);
  }
  if (upTo === LEVELS.length) {
    if (sim.ended !== 'won') throw new Error('The bot did not win');
    if (sim.deaths !== 0) throw new Error(`The bot lost ${sim.deaths} lives; nothing here should cost one`);
  }
  return { sim, bot };
}
