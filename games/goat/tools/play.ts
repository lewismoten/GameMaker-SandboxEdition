// The bot's whole game on the built disk: the field, Bethlehem, the caravan and the stable,
// without losing a life, ending at the manger (check.ts and walkthrough.ts run it).
import { Bot } from './bot';
import { bethlehem, theCaravan, theField, theStable } from './route';
import { GameSim } from './sim';

export const SEED = 1;
export const LEVELS = [theField, bethlehem, theCaravan, theStable];

export async function play(seed = SEED): Promise<{ sim: GameSim; bot: Bot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim);
  for (const level of LEVELS) {
    try {
      await level(bot);
    } finally {
      if (process.env.BOT_LOG) console.log(bot.log.join('\n'));
      bot.log.length = 0;
    }
    bot.say(`${level.name} done`);
  }
  if (sim.ended !== 'won') throw new Error('The bot did not win');
  if (sim.deaths) throw new Error(`The bot lost ${sim.deaths} lives`);
  return { sim, bot };
}

