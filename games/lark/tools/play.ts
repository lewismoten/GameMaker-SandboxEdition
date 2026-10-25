// Plays the built disk all the way through (tools/route.ts), for check.ts and walkthrough.ts.
// BOT_LOG=1 prints the bot's log (it prints the end of it on a failure anyway).
import { compile } from '../src/game';
import { playThrough } from './route';
import { GameSim } from './sim';

/** The escapement's bridge blocks, as the route waits for them. */
export function bridgeIds(): { tick: number; tock: number } {
  const { tower } = compile().sets;
  return { tick: tower.id('tick'), tock: tower.id('tock') };
}

export async function play(seed = 1) {
  const sim = new GameSim(undefined, seed);
  const bot = await playThrough(sim, bridgeIds());
  if (process.env.BOT_LOG) console.log(bot.log.join('\n'));
  return { sim, bot };
}
