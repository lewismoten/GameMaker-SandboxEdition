// The bot's whole game on the built disk, level after level, without losing a life, ending
// through the eye of the needle (check.ts and walkthrough.ts run it).
import { Bot } from './bot';
import { theCity } from './route';
import { GameSim } from './sim';

export const SEED = 1;
export const LEVELS = [theCity];

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: Bot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim);
  for (const level of LEVELS.slice(0, upTo)) {
    try {
      await level(bot);
    } finally {
      if (process.env.BOT_LOG) console.log(bot.log.join('\n'));
      bot.log.length = 0;
    }
    bot.say(`${level.name} done`);
  }
  if (upTo === LEVELS.length && sim.ended !== 'won') throw new Error('The bot did not win');
  if (sim.deaths) throw new Error(`The bot lost ${sim.deaths} lives`);
  return { sim, bot };
}
