// The way through the levels added for the hour-long cut (2.0 -> 3.0), as orders for the bot (see route.ts).
import type { StarterBot } from '../../kit/starter/bot';
import { ALLEY } from '../src/levels/alley';
import { SHOP } from '../src/levels/shop';
import { RIGGING } from '../src/levels/rigging';
import { STEPS } from '../src/levels/steps';
import { GROUND } from '../src/level';
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

/** 4. Thirteen Steps: up the stairs (a person jumps each tread), the sign, the crow, the cracks, the shaker, down the ladder, the salt. */
export async function thirteenSteps(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await readAt(bot, 5, 'the stairs sign');
  await must(bot, bot.walk(STEPS.landing[0], 'the top of the stairs'), 'up the thirteen steps');
  await readAt(bot, STEPS.landing[0] + 1, 'the landing sign');
  await hop(bot, STEPS.cracks, 2, 'the cracks');
  await must(bot, bot.walk(STEPS.shaker, 'the shaker'), 'to the shaker');
  await watchFor(bot, () => monsterY(bot, STEPS.crow) <= STEPS.crowRow * 20 + 4, 'the crow flying up');
  await must(bot, bot.walk(STEPS.ladder - 1, 'past the crow'), 'past the crow');
  await must(bot, bot.walk(STEPS.ladder, 'the ladder'), 'to the ladder');
  await must(bot, bot.climb('down', GROUND - 1, 'down the ladder'), 'down the ladder');
  await readAt(bot, 53, 'the salt sign');
  await must(bot, bot.walk(STEPS.wall + 2, 'through the salt'), 'through the salt');
  score(bot, from, 0, 25, 'Thirteen Steps');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`Thirteen Steps cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(STEPS.exit + 1, 'the exit'), 'the exit');
}

/** 7. Earlier Still, as Rascal: two umbrella lifts, three ropes, the key in the rafters, three saucers, the cracks, the crow, the padlock. */
export async function earlierStill(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await readAt(bot, 5, 'the Committee notice');
  await must(bot, bot.walk(RIGGING.cleat1, 'the first rope'), 'tying off the first rope');
  await must(bot, bot.walk(RIGGING.step1, 'the first doorstep'), 'setting out the first saucer');
  await must(bot, bot.walk(RIGGING.crates - 1, 'the crates'), 'to the crates');
  await must(bot, bot.walk(RIGGING.crates + 3, 'over the crates'), 'over the crates');
  await must(bot, bot.walk(RIGGING.lift - 1, 'the first umbrellas'), 'to the first umbrellas');
  await must(bot, bot.walk(RIGGING.lift, 'into the umbrellas'), 'into the first umbrellas');
  await must(bot, bot.wait(30), 'rising');
  await must(bot, bot.walk(RIGGING.lift + 2, 'off the umbrellas'), 'onto the gallery');
  await readAt(bot, RIGGING.lift + 3, 'the trust sign');
  await must(bot, bot.walk(RIGGING.cleatA, 'the gallery rope'), 'tying off the gallery rope');
  await must(bot, bot.walk(RIGGING.lift2 - 1, 'the second umbrellas'), 'to the second umbrellas');
  await must(bot, bot.walk(RIGGING.lift2, 'into the second umbrellas'), 'into the second umbrellas');
  await must(bot, bot.wait(45), 'rising to the rafters');
  await must(bot, bot.walk(RIGGING.lift2 + 2, 'off the umbrellas'), 'onto the rafters');
  await must(bot, bot.walk(RIGGING.cleatB, 'the rafter rope'), 'tying off the rafter rope');
  await readAt(bot, RIGGING.cleatB + 3, 'the rafters sign');
  await must(bot, bot.walk(RIGGING.key, 'the bin key'), 'to the bin key');
  await must(bot, bot.walk(RIGGING.rafters[1] + 2, 'the end of the rafters'), 'off the rafters');
  await must(bot, bot.walk(RIGGING.step2, 'the second doorstep'), 'setting out the second saucer');
  await hop(bot, RIGGING.cracks, 2, 'the cracks');
  await readAt(bot, 55, 'the crow sign');
  await must(bot, bot.walk(RIGGING.crow - 3, 'before the crow'), 'to the crow');
  await watchFor(bot, () => monsterY(bot, RIGGING.crow) <= RIGGING.crowRow * 20 + 4, 'the crow flying up');
  await must(bot, bot.walk(RIGGING.wall + 2, 'through the padlock'), 'through the padlock');
  await must(bot, bot.walk(RIGGING.step3, 'the last doorstep'), 'setting out the last saucer');
  score(bot, from, 0, 6 * CHORE_POINTS + 25, 'Earlier Still');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`Earlier Still cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(RIGGING.exit + 1, 'the exit'), 'the exit');
}

/** 6. The Mirror Shop: the display, the ladder and the first hand mirror, gate one, the umbrella lift, the second hand mirror, gate two. */
export async function mirrorShop(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await readAt(bot, 5, 'the window sign');
  await readAt(bot, 9, 'the display sign');
  await must(bot, bot.walk(SHOP.pillars[0] - 1, 'the display'), 'to the display');
  await must(bot, bot.walk(SHOP.pillars[2] + 3, 'over the display'), 'over the display');
  await climbUp(bot, SHOP.ladder, 5, 'the mezzanine ladder');
  await must(bot, bot.walk(SHOP.key1, 'the first hand mirror'), 'to the first hand mirror');
  await must(bot, bot.walk(SHOP.mezzanine[1] + 2, 'the end of the mezzanine'), 'off the mezzanine');
  await readAt(bot, 36, 'the gate sign');
  await must(bot, bot.walk(SHOP.gate1 + 2, 'through gate one'), 'through gate one');
  await must(bot, bot.walk(SHOP.lift - 1, 'the umbrellas'), 'to the umbrellas');
  await must(bot, bot.walk(SHOP.lift, 'into the umbrellas'), 'into the umbrellas');
  await must(bot, bot.wait(30), 'rising');
  await must(bot, bot.walk(SHOP.lift + 3, 'onto the shelf'), 'onto the shelf');
  await readAt(bot, SHOP.shelf[0] + 2, 'the shelf sign');
  await must(bot, bot.walk(SHOP.key2, 'the second hand mirror'), 'to the second hand mirror');
  await must(bot, bot.walk(SHOP.shelf[1] + 2, 'the end of the shelf'), 'off the shelf');
  await readAt(bot, 56, 'the second gate sign');
  await must(bot, bot.walk(SHOP.gate2 + 2, 'through gate two'), 'through gate two');
  score(bot, from, 0, 50, 'The Mirror Shop');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`The Mirror Shop cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(SHOP.exit + 1, 'the exit'), 'the exit');
}
