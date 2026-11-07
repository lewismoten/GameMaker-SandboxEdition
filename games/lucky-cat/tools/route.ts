// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level, with a look at each sign. The checks here fail if a charm is missed, a hazard hurts when it should not,
// or a door opens without its key.
import type { StarterBot } from '../../kit/starter/bot';
import { ONE } from '../src/levels/one';
import { READ, climbUp, hop, leave, must, readAt, score } from './routeKit';

/** 1. Ladder Lane: around the ladder by the scaffold (the clover), the cracks, the horseshoe, the crates. */
export async function ladderLane(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await readAt(bot, 5, 'the first sign');
  await readAt(bot, 9, 'the ladder sign');
  await climbUp(bot, ONE.ladderUp, 5, 'the scaffold');
  await must(bot, bot.walk(ONE.clover, 'the clover'), 'to the clover');
  await must(bot, bot.walk(ONE.roadEnd + 1, 'the end of the awning'), 'off the awning');
  await readAt(bot, 23, 'the cracks sign');
  await hop(bot, ONE.cracks, 2, 'the cracks');
  await readAt(bot, 31, 'the horseshoe sign');
  await climbUp(bot, ONE.scaffoldLadder, 5, 'the second scaffold');
  await must(bot, bot.walk(ONE.horseshoe, 'the horseshoe'), 'to the horseshoe');
  await must(bot, bot.walk(ONE.horseshoe + 4, 'the end of the awning'), 'off the awning');
  await must(bot, bot.walk(ONE.crates - 1, 'the crates'), 'to the crates');
  await must(bot, bot.walk(ONE.crates + 3, 'over the crates'), 'over the crates');
  await readAt(bot, 50, 'the blame sign');
  await hop(bot, ONE.cracks2, 1, 'the last crack');
  score(bot, from, 2, 0, 'level 1');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`level 1 cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await must(bot, bot.wait(READ / 2), 'a breath');
  await leave(bot, bot.walk(ONE.exit + 1, 'the exit'), 'the exit');
}
