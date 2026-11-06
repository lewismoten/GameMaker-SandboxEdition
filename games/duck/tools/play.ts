// The bot's whole game on the built disk, level after level, ending at the last door (check.ts,
// walkthrough.ts and gendemo.ts run it). It walks into one flier on purpose in each level, so it loses hit points but never a life.
import { StarterBot } from '../../kit/starter/bot';
import { headHeight, highOrLow } from './route';
import { GameSim } from './sim';

export const SEED = 1;
const LEVELS = [headHeight, highOrLow];

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: StarterBot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new StarterBot(sim);
  for (const level of LEVELS.slice(0, upTo)) {
    try {
      await level(bot);
    } finally {
      if (process.env.BOT_LOG) console.log(bot.log.join('\n'));
      bot.log.length = 0;
    }
    bot.say(`${level.name} done`);
  }
  if (upTo === LEVELS.length) {
    if (sim.ended !== 'won') throw new Error('The bot did not win');
    if (sim.deaths !== 0) throw new Error(`The bot lost ${sim.deaths} lives; a duck or a hop should never cost one`);
  }
  return { sim, bot };
}
