// The bot's whole game on the built disk, level after level, ending at the shop's exit door (check.ts, walkthrough.ts
// and gendemo.ts run it). Nothing in this game can hurt Kit, so no life may be lost.
import { StarterBot } from '../../kit/starter/bot';
import { journey } from './route';
import { GameSim } from './sim';

export const SEED = 1;
const LEVELS = [journey];

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
    if (sim.deaths !== 0) throw new Error(`The bot lost ${sim.deaths} lives; nothing here hurts`);
  }
  return { sim, bot };
}
