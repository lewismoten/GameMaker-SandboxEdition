// The bot's whole game on the built disk, level after level, ending at the last door (check.ts,
// walkthrough.ts and gendemo.ts run it). Unlike the other Starters it is allowed to lose exactly one
// life: the red planks in level 2 are the lesson, and the bot steps onto them once before the red lever is pulled. Anything else
// that costs a life is an error, and so is a game over.
import { StarterBot } from '../../kit/starter/bot';
import { pullTheLever, redAndBlue } from './route';
import { GameSim } from './sim';

export const SEED = 1;
const LEVELS = [pullTheLever, redAndBlue];
/** Lives lost on purpose in a whole run: the one fall into the pool. */
export const LESSON_DEATHS = 1;

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
    if (sim.deaths !== LESSON_DEATHS) throw new Error(`The bot lost ${sim.deaths} lives; the pool should cost exactly ${LESSON_DEATHS}`);
    if (sim.ci.lives < 1) throw new Error('No lives left');
  }
  return { sim, bot };
}
