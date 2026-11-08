// The way through the levels added for the hour-long cut (2.0 -> 3.0), as orders for the bot (see route.ts).
import type { StarterBot } from '../../kit/starter/bot';
import { ALLEY } from '../src/levels/alley';
import { CHORE_POINTS } from '../src/props';
import { READ, climbUp, hop, leave, monsterY, must, readAt, score, watchFor } from './routeKit';

/** 2. Saucer Alley: five saucers of cream, the crates, the cracks, the fire escape and its key, the crow, the padlock. */
export async function saucerAlley(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await readAt(bot, 5, 'the lane sign');
  await must(bot, bot.walk(ALLEY.saucer1, 'the first saucer'), 'to the first saucer');
  await readAt(bot, 14, 'the cream sign');
  await must(bot, bot.walk(ALLEY.crates - 1, 'the crates'), 'to the crates');
  await must(bot, bot.walk(ALLEY.crates + 3, 'over the crates'), 'over the crates');
  await must(bot, bot.walk(ALLEY.saucer2, 'the second saucer'), 'to the second saucer');
  await hop(bot, ALLEY.cracks, 2, 'the cracks');
  await readAt(bot, 31, 'the fire escape sign');
  await climbUp(bot, ALLEY.ladder, 5, 'the fire escape');
  await must(bot, bot.walk(ALLEY.key, 'the gate key'), 'to the gate key');
  await must(bot, bot.walk(ALLEY.awning[1] + 2, 'the end of the awning'), 'off the awning');
  await must(bot, bot.walk(ALLEY.saucer3, 'the third saucer'), 'to the third saucer');
  await readAt(bot, 49, 'the crow sign');
  await must(bot, bot.walk(ALLEY.crow - 3, 'before the crow'), 'to the crow');
  await watchFor(bot, () => monsterY(bot, ALLEY.crow) <= ALLEY.crowRow * 20 + 4, 'the crow flying up');
  await must(bot, bot.walk(ALLEY.crow + 3, 'past the crow'), 'past the crow');
  await must(bot, bot.walk(ALLEY.saucer4, 'the fourth saucer'), 'to the fourth saucer');
  await readAt(bot, 60, 'the gate sign');
  await must(bot, bot.walk(ALLEY.wall + 2, 'through the padlock'), 'through the padlock');
  await must(bot, bot.walk(ALLEY.saucer5, 'the last saucer'), 'to the last saucer');
  score(bot, from, 0, 5 * CHORE_POINTS + 25, 'Saucer Alley');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`Saucer Alley cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await must(bot, bot.wait(READ / 2), 'a thoughtful look at the empty saucer');
  await leave(bot, bot.walk(ALLEY.exit + 1, 'the exit'), 'the exit');
}
