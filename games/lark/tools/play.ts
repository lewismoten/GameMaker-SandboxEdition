// Plays the built disk all the way through (tools/route.ts), for check.ts and walkthrough.ts.
// BOT_LOG=1 prints the bot's log (it prints the end of it on a failure anyway).
import { compile } from '../src/game';
import { playThrough, type Ids } from './route';
import { GameSim } from './sim';

/** The timed blocks the route waits for: the escapement's bridges and the comb's teeth. */
export function bridgeIds(): Ids {
  const { tower, box, snow } = compile().sets;
  return {
    tick: tower.id('tick'),
    tock: tower.id('tock'),
    toothA: box.id('toothA'),
    toothB: box.id('toothB'),
    drifts: [snow.id('driftWalk'), snow.id('driftSide')],
  };
}

export async function play(seed = 1) {
  const sim = new GameSim(undefined, seed);
  const bot = await playThrough(sim, bridgeIds());
  if (process.env.BOT_LOG) console.log(bot.log.join('\n'));
  return { sim, bot };
}
