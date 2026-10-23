// The bot's whole game on the built disk, scene after scene, without losing a life, ending with
// the bow (check.ts and walkthrough.ts run it). SWEATS_UPTO=<scene name> stops after that scene.
import { SCENES } from '../src/scenes';
import { Bot } from './bot';
import { ROUTES } from './routes';
import { GameSim } from './sim';

export const SEED = 1;

export async function play(seed = SEED, upTo = process.env.SWEATS_UPTO): Promise<{ sim: GameSim; bot: Bot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim);
  for (const def of SCENES) {
    const route = ROUTES[def.name];
    if (!route) throw new Error(`No route for ${def.name}`);
    try {
      await route(bot);
    } finally {
      if (process.env.BOT_LOG) console.log(bot.log.join('\n'));
      bot.log.length = 0;
    }
    bot.say(`${def.name} done`);
    if (def.name === upTo) return { sim, bot };
  }
  if (sim.ended !== 'won') throw new Error('The bot did not win');
  if (sim.deaths) throw new Error(`The bot lost ${sim.deaths} lives`);
  return { sim, bot };
}
