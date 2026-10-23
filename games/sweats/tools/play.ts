// The bot's whole game on the built disk, scene after scene, without losing a life, ending with
// the bow (check.ts and walkthrough.ts run it). SWEATS_UPTO=<scene name> stops after that scene;
// SWEATS_FROM=<scene name> jumps straight into that scene (a quick try, not the real run).
import { SCENES } from '../src/scenes';
import { Bot } from './bot';
import { ROUTES } from './routes';
import { GameSim } from './sim';

export const SEED = 1;

/**
 * A monologue starts with its opening line (a few seconds long), spoken as the poet steps into
 * the spotlight a block on: the bot steps in and stands there until it has played out, so its
 * first sip, clink or hop doesn't cut it off.
 */
async function opening(bot: Bot): Promise<void> {
  const r = await bot.until('right', () => bot.sim.clipTicksLeft > 0, 'into the spotlight', 40);
  if (r) throw new Error(`${r}\n${bot.log.slice(-4).join('\n')}`);
  if (await bot.sim.waitForClip()) throw new Error('left the scene during the opening line');
  bot.say('the opening line played out');
}

export async function play(seed = SEED, upTo = process.env.SWEATS_UPTO, from = process.env.SWEATS_FROM): Promise<{ sim: GameSim; bot: Bot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim);
  const first = from ? SCENES.findIndex((d) => d.name === from) : 0;
  if (first < 0) throw new Error(`No scene ${from}`);
  if (from) sim.jumpTo(first + 2);
  for (const def of SCENES.slice(first)) {
    const route = ROUTES[def.name];
    if (!route) throw new Error(`No route for ${def.name}`);
    try {
      if (def.monologue) await opening(bot);
      await route(bot);
    } finally {
      if (process.env.BOT_LOG) console.log(bot.log.join('\n'));
      bot.log.length = 0;
    }
    bot.say(`${def.name} done`);
    if (def.name === upTo) return { sim, bot };
  }
  if (from) return { sim, bot };
  if (sim.ended !== 'won') throw new Error('The bot did not win');
  if (sim.deaths) throw new Error(`The bot lost ${sim.deaths} lives`);
  return { sim, bot };
}
