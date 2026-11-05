// The bot's whole game on the built disk, level after level, ending at the last door (check.ts,
// walkthrough.ts and gendemo.ts run it). Nothing in this game hurts, so it must not lose a life.
// `hero` is the door it picks: Fast Feet (left) or Big Hops (right).
import { StarterBot } from '../../kit/starter/bot';
import { openRoad, theClimb, twoDoors, type Hero } from './route';
import { GameSim } from './sim';

export const SEED = 1;

export async function play(seed = SEED, hero: Hero = 'big', upTo = 3): Promise<{ sim: GameSim; bot: StarterBot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new StarterBot(sim);
  const levels = [twoDoors(hero), theClimb(hero), openRoad(hero)];
  for (const level of levels.slice(0, upTo)) {
    try {
      await level(bot);
    } finally {
      if (process.env.BOT_LOG) console.log(bot.log.join('\n'));
      bot.log.length = 0;
    }
  }
  if (upTo === levels.length) {
    if (sim.ended !== 'won') throw new Error('The bot did not win');
    if (sim.deaths !== 0) throw new Error(`The bot lost ${sim.deaths} lives; nothing here should cost one`);
  }
  return { sim, bot };
}
