// The way through the levels added for the hour-long cut (2.0 -> 3.0), as orders for the bot (see route.ts).
import type { StarterBot } from '../../kit/starter/bot';
import { ALLEY } from '../src/levels/alley';
import { GLASS } from '../src/levels/glass';
import { LAUNDRY, STAIR_W } from '../src/levels/laundry';
import { MARKET } from '../src/levels/market';
import { OPEN_TICKS } from '../src/meter';
import { SHOP } from '../src/levels/shop';
import { RIGGING } from '../src/levels/rigging';
import { STEPS } from '../src/levels/steps';
import { GROUND } from '../src/level';
import { CHORE_POINTS } from '../src/props';
import { READ, climbUp, mirrored, hop, leave, monsterY, must, readAt, score, watchFor } from './routeKit';

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

/** A crow of column `x0` is up (above where the cat's head would be). */
const crowUp = (bot: StarterBot, x0: number) => () => monsterY(bot, x0) <= MARKET.crowRow * 20 + 4;

/** 12. The Night Market: ahead of the 13th chime, through three stalls' boxes, three open shutters, two watchman crows. */
export async function nightMarket(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await readAt(bot, 6, 'the closing sign');
  await must(bot, bot.walk(MARKET.boxes[0] - 1, 'the first stall'), 'to the first stall');
  await must(bot, bot.walk(MARKET.boxes[0] + 2, 'through the first stall'), 'knocking through the first stall');
  await hop(bot, MARKET.cracks, 2, 'the cracks');
  await must(bot, bot.walk(MARKET.gates[0] + 2, 'through the first shutter'), 'through the first shutter');
  await must(bot, bot.walk(31, 'the watchman sign'), 'to the watchman sign');
  await must(bot, bot.wait(READ / 2), 'a quick look');
  await must(bot, bot.walk(MARKET.crows[0] - 3, 'before the first crow'), 'to the first crow');
  await watchFor(bot, crowUp(bot, MARKET.crows[0]), 'the first crow flying up');
  await must(bot, bot.walk(MARKET.crows[0] + 3, 'past the first crow'), 'past the first crow');
  await must(bot, bot.walk(MARKET.boxes[1] - 1, 'the second stall'), 'to the second stall');
  await must(bot, bot.walk(MARKET.boxes[1] + 2, 'through the second stall'), 'knocking through the second stall');
  await hop(bot, MARKET.cracks2, 2, 'the cracks by the shutter');
  await must(bot, bot.walk(MARKET.gates[1] + 2, 'through the second shutter'), 'through the second shutter');
  await must(bot, bot.walk(MARKET.crows[1] - 3, 'before the second crow'), 'to the second crow');
  await watchFor(bot, crowUp(bot, MARKET.crows[1]), 'the second crow flying up');
  await must(bot, bot.walk(MARKET.crows[1] + 3, 'past the second crow'), 'past the second crow');
  await must(bot, bot.walk(MARKET.crates - 1, 'the crates'), 'to the crates');
  await must(bot, bot.walk(MARKET.crates + 3, 'over the crates'), 'over the crates');
  await must(bot, bot.walk(MARKET.boxes[2] - 1, 'the last stall'), 'to the last stall');
  await must(bot, bot.walk(MARKET.boxes[2] + 2, 'through the last stall'), 'knocking through the last stall');
  await readAt(bot, 70, 'the last shutter sign');
  await must(bot, bot.walk(MARKET.gates[2] + 2, 'through the last shutter'), 'through the last shutter');
  bot.say(`through the last shutter after ${bot.sim.ticks} ticks of ${OPEN_TICKS}`);
  if (bot.sim.ticks > OPEN_TICKS * 0.9) throw new Error(`the run is too slow for the market: ${bot.sim.ticks} ticks of ${OPEN_TICKS}`);
  score(bot, from, 0, 30, 'The Night Market');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`The Night Market cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(MARKET.exit + 1, 'the exit'), 'the exit');
}

/** The Other Side: every walk on the other key, from the right-hand end to the left: pillars, a ladder, a hand mirror, gate one, the crow, a second ladder and hand mirror, gate two. */
export async function theOtherSide(bot: StarterBot): Promise<void> {
  await mirrored(bot, async () => {
    const from = bot.sim.ci.score;
    const hp = bot.sim.ci.hitpts;
    await readAt(bot, GLASS.start - 3, 'the first sign');
    await must(bot, bot.walk(GLASS.pillars[0] + 3, 'the display'), 'to the display');
    await must(bot, bot.walk(GLASS.pillars[2] - 2, 'over the display'), 'over the display');
    await readAt(bot, GLASS.ladder + 3, 'the ladder sign');
    await must(bot, bot.walk(GLASS.ladder + 1, 'the ladder'), 'beside the ladder');
    await must(bot, bot.walk(GLASS.ladder, 'the ladder'), 'onto the ladder');
    await must(bot, bot.climb('up', 4, 'up the ladder'), 'up the ladder');
    await must(bot, bot.walk(GLASS.key1, 'the first hand mirror'), 'to the first hand mirror');
    await must(bot, bot.walk(GLASS.mezzanine[0] - 2, 'the end of the mezzanine'), 'off the mezzanine');
    await readAt(bot, GLASS.gate1 + 3, 'the gate sign');
    await must(bot, bot.walk(GLASS.gate1 - 2, 'through gate one'), 'through gate one');
    await must(bot, bot.walk(GLASS.crow + 3, 'before the crow'), 'to the crow');
    await watchFor(bot, () => monsterY(bot, GLASS.crow) <= GLASS.crowRow * 20 + 4, 'the crow flying up');
    await must(bot, bot.walk(GLASS.crow - 3, 'past the crow'), 'past the crow');
    await must(bot, bot.walk(GLASS.ladder2 + 1, 'the second ladder'), 'beside the second ladder');
    await must(bot, bot.walk(GLASS.ladder2, 'the second ladder'), 'onto the second ladder');
    await must(bot, bot.climb('up', 4, 'up the second ladder'), 'up the second ladder');
    await must(bot, bot.walk(GLASS.key2, 'the second hand mirror'), 'to the second hand mirror');
    await must(bot, bot.walk(GLASS.mezzanine2[0] - 2, 'the end of the mezzanine'), 'off the second mezzanine');
    await must(bot, bot.walk(GLASS.gate2 - 2, 'through gate two'), 'through gate two');
    score(bot, from, 0, 50, 'The Other Side');
    if (bot.sim.ci.hitpts !== hp) throw new Error(`The Other Side cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
    await readAt(bot, GLASS.exit + 2, 'the last sign');
    await leave(bot, bot.walk(GLASS.exit - 1, 'the exit'), 'the exit');
  });
}

/** Wash Day, as Rascal: a saucer, the cracks, three awnings up like stairs, the line, the key, the lock, the last steps. */
export async function washDay(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await readAt(bot, 5, 'the banner sign');
  await must(bot, bot.walk(LAUNDRY.step1 + 1, 'the first doorstep'), 'to the first doorstep');
  await hop(bot, LAUNDRY.cracks, 2, 'the cracks');
  for (const { x } of LAUNDRY.stairs) {
    await must(bot, bot.walk(x - 2, 'the next awning'), 'to the next awning');
    await must(bot, bot.jump('right', x + 1), 'onto the awning');
    await must(bot, bot.walk(x + STAIR_W - 1, 'the awning'), 'along the awning');
  }
  await must(bot, bot.jump('right', LAUNDRY.line[0] + 1), 'up onto the line');
  await readAt(bot, LAUNDRY.line[0] + 2, 'the line sign');
  await must(bot, bot.walk(LAUNDRY.cleatLine + 1, 'the fourth cleat'), 'to the fourth cleat');
  await must(bot, bot.walk(LAUNDRY.key + 1, 'the key'), 'to the key');
  await must(bot, bot.walk(LAUNDRY.line[1] + 2, 'the end of the line'), 'off the line');
  await must(bot, bot.walk(LAUNDRY.step2 + 1, 'the second doorstep'), 'to the second doorstep');
  await readAt(bot, 59, 'the bins sign');
  await hop(bot, LAUNDRY.cracks2, 2, 'the last cracks');
  await must(bot, bot.walk(LAUNDRY.wall + 2, 'through the padlock'), 'through the padlock');
  await must(bot, bot.walk(LAUNDRY.step3 + 1, 'the last doorstep'), 'to the last doorstep');
  score(bot, from, 0, 7 * CHORE_POINTS + 25, 'Wash Day');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`Wash Day cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(LAUNDRY.exit + 1, 'the exit'), 'the exit');
}
