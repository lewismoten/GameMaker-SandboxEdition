// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level, with a look at each sign. The checks here fail if a charm is missed, a hazard hurts when it should not,
// or a door opens without its key.
import type { StarterBot } from '../../kit/starter/bot';
import { ONE } from '../src/levels/one';
import { FIVE } from '../src/levels/five';
import { FOUR } from '../src/levels/four';
import { SIX } from '../src/levels/six';
import { THREE } from '../src/levels/three';
import { OPEN_TICKS } from '../src/meter';
import { TWO } from '../src/levels/two';
import { READ, climbUp, hop, leave, mirrored, monsterY, must, readAt, score, watchFor } from './routeKit';

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

/** 2. Mirror Maze: every walk is on the other key. Pillars, a ladder, the ladybug and the hand mirror, the gate, the wishbone. */
export async function mirrorMaze(bot: StarterBot): Promise<void> {
  await mirrored(bot, async () => {
    const from = bot.sim.ci.score;
    const hp = bot.sim.ci.hitpts;
    await readAt(bot, 6, 'the mirror sign');
    await readAt(bot, 11, 'the pillar sign');
    await must(bot, bot.walk(TWO.pillars - 1, 'the pillars'), 'to the pillars');
    await must(bot, bot.walk(TWO.pillars + 3, 'over the pillars'), 'over the pillars');
    await readAt(bot, 19, 'the key sign');
    await climbUp(bot, TWO.ladder, 4, 'the mezzanine ladder');
    await must(bot, bot.walk(TWO.ladybug, 'the ladybug'), 'to the ladybug');
    await must(bot, bot.walk(TWO.key, 'the hand mirror'), 'to the hand mirror');
    await must(bot, bot.walk(TWO.planksEnd + 2, 'the end of the mezzanine'), 'off the mezzanine');
    await readAt(bot, 36, 'the gate sign');
    await must(bot, bot.walk(TWO.wall + 2, 'through the gate'), 'through the shining gate');
    await must(bot, bot.walk(45, 'the second pillars'), 'over the second pillars');
    await readAt(bot, 49, 'the wish sign');
    await climbUp(bot, TWO.ladder2, 4, 'the second ladder');
    await must(bot, bot.walk(TWO.wishbone, 'the wishbone'), 'to the wishbone');
    await must(bot, bot.walk(TWO.wishbone + 4, 'the end of the mezzanine'), 'off the mezzanine');
    score(bot, from, 2, 25, 'level 2');
    if (bot.sim.ci.hitpts !== hp) throw new Error(`level 2 cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
    await must(bot, bot.wait(READ / 2), 'a breath');
    await leave(bot, bot.walk(TWO.exit + 1, 'the exit'), 'the exit');
  });
}

/** 3. Town Hall: float up on the umbrellas, take the acorn and the shaker, toss the salt, take the sock. */
export async function townHall(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await readAt(bot, 6, 'the umbrella sign');
  await readAt(bot, 11, 'the ride sign');
  await must(bot, bot.walk(THREE.lift - 1, 'the umbrellas'), 'to the umbrellas');
  bot.say(`before the lift y=${bot.px.y / 20}`);
  await must(bot, bot.walk(THREE.lift, 'into the umbrellas'), 'into the umbrellas');
  await must(bot, bot.wait(30), 'rising');
  bot.say(`in the lift y=${bot.px.y / 20}`);
  await must(bot, bot.walk(THREE.lift + 2, 'off the umbrellas'), 'onto the gallery');
  bot.say(`on the gallery y=${bot.px.y / 20}`);
  await must(bot, bot.walk(THREE.acorn, 'the acorn'), 'to the acorn');
  await must(bot, bot.walk(THREE.shaker - 4, 'the shaker sign'), 'to the shaker sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  await must(bot, bot.walk(THREE.shaker, 'the shaker'), 'to the shaker');
  await must(bot, bot.walk(THREE.gallery[1] + 1, 'the end of the gallery'), 'off the gallery');
  await readAt(bot, 48, 'the salt sign');
  await must(bot, bot.walk(THREE.wall + 2, 'through the salt'), 'through the salt');
  await must(bot, bot.walk(THREE.sock, 'the sock'), 'to the sock');
  score(bot, from, 2, 25, 'level 3');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`level 3 cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await must(bot, bot.wait(READ / 2), 'a breath');
  await leave(bot, bot.walk(THREE.exit + 1, 'the exit'), 'the exit');
}

/** 4. Race to the Fair: the bells go dark one by one; the gate shuts when the last one does. A person runs it in about half the time. */
export async function raceToTheFair(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await readAt(bot, 6, 'the race sign');
  await hop(bot, FOUR.cracks, 2, 'the first cracks');
  // under the stepladder: a drip of paint is bad luck (5 hit points), but it is the quick way
  await must(bot, bot.walk(FOUR.ladder - 1, 'the stepladder'), 'to the stepladder');
  await must(bot, bot.walk(FOUR.ladder + 5, 'under the stepladder'), 'under the stepladder');
  if (bot.sim.ci.hitpts !== hp - 5) throw new Error(`the drip should cost 5: ${hp} -> ${bot.sim.ci.hitpts}`);
  await must(bot, bot.walk(FOUR.wall[0] - 6, 'the wall sign'), 'to the wall sign');
  await must(bot, bot.wait(READ / 2), 'a quick look');
  await climbUp(bot, FOUR.wallLadder, 6, 'the wall ladder');
  await must(bot, bot.walk(FOUR.star, 'the star'), 'to the star');
  await must(bot, bot.walk(FOUR.wall[1] + 2, 'the far side of the wall'), 'down the far side');
  await hop(bot, FOUR.cracks2, 2, 'the cracks by the wall');
  await must(bot, bot.walk(FOUR.crates - 1, 'the crates'), 'to the crates');
  await must(bot, bot.walk(FOUR.crates + 3, 'over the crates'), 'over the crates');
  await must(bot, bot.walk(FOUR.dice, 'the dice'), 'to the dice');
  bot.say(`at the gate after ${bot.sim.ticks} ticks of ${OPEN_TICKS}`);
  if (bot.sim.ticks > OPEN_TICKS * 0.8) throw new Error(`the run is too slow for the fair: ${bot.sim.ticks} ticks of ${OPEN_TICKS}`);
  score(bot, from, 2, 0, 'level 4');
  if (bot.sim.ci.hitpts !== hp - 5) throw new Error(`level 4 cost more than the drip: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(FOUR.exit + 1, 'the exit'), 'the exit');
}

/** 5. Knock on Wood: watch each crow fly up and slip by, knock on the boxes, climb to the rainbow. */
export async function knockOnWood(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  const up = (x0: number, row: number) => () => monsterY(bot, x0) <= row * 20 + 4;
  await readAt(bot, 5, 'the crow sign');
  await must(bot, bot.walk(FIVE.crowA - 3, 'before the first crow'), 'to the first crow');
  await watchFor(bot, up(FIVE.crowA, FIVE.crowRow), 'the first crow flying up');
  await must(bot, bot.walk(FIVE.crowA + 3, 'past the first crow'), 'past the first crow');
  await readAt(bot, 23, 'the knock sign');
  await must(bot, bot.walk(FIVE.wood - 1, 'the wooden boxes'), 'to the boxes');
  await must(bot, bot.walk(FIVE.wood + 2, 'through the boxes'), 'knocking through the boxes');
  await must(bot, bot.walk(FIVE.feather, 'the feather'), 'to the feather');
  await must(bot, bot.walk(FIVE.crowD - 3, 'before the next crow'), 'to the next crow');
  await watchFor(bot, up(FIVE.crowD, FIVE.crowRow), 'the next crow flying up');
  await must(bot, bot.walk(FIVE.crowD + 3, 'past the next crow'), 'past the next crow');
  await readAt(bot, 44, 'the roof sign');
  await climbUp(bot, FIVE.ladder, 4, 'the roof ladder');
  await must(bot, bot.walk(FIVE.rainbow, 'the rainbow'), 'to the rainbow');
  await must(bot, bot.walk(FIVE.planksEnd + 2, 'the end of the roof'), 'off the roof');
  await must(bot, bot.walk(FIVE.crowC - 3, 'before the last crow'), 'to the last crow');
  await watchFor(bot, up(FIVE.crowC, FIVE.crowRow), 'the last crow flying up');
  await must(bot, bot.walk(FIVE.crowC + 3, 'past the last crow'), 'past the last crow');
  score(bot, from, 2, 10, 'level 5');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`level 5 cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(FIVE.exit + 1, 'the exit'), 'the exit');
}

/** 6. Rascal's Roof: the cracks, the umbrella lift, the bell and the shaker, the salt, the ribbon, the crow, the marble, and Rascal. */
export async function rascalsRoof(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await readAt(bot, 6, 'the roof sign');
  await hop(bot, SIX.cracks, 2, 'the cracks');
  await must(bot, bot.walk(SIX.lift - 1, 'the umbrellas'), 'to the umbrellas');
  await must(bot, bot.walk(SIX.lift, 'into the umbrellas'), 'into the umbrellas');
  await must(bot, bot.wait(30), 'rising');
  await must(bot, bot.walk(SIX.lift + 2, 'off the umbrellas'), 'onto the gallery');
  await must(bot, bot.walk(SIX.bell, 'the bell'), 'to the bell');
  await must(bot, bot.walk(SIX.shaker - 4, 'the shaker sign'), 'to the shaker sign');
  await must(bot, bot.wait(READ), 'reading the sign');
  await must(bot, bot.walk(SIX.shaker, 'the shaker'), 'to the shaker');
  await must(bot, bot.walk(SIX.gallery[1] + 1, 'the end of the gallery'), 'off the gallery');
  await readAt(bot, 44, 'the salt sign');
  await must(bot, bot.walk(SIX.wall + 2, 'through the salt'), 'through the salt');
  await must(bot, bot.walk(SIX.ribbon, 'the ribbon'), 'to the ribbon');
  await must(bot, bot.walk(SIX.crow - 3, 'before the crow'), 'to the crow');
  await watchFor(bot, () => monsterY(bot, SIX.crow) <= 5 * 20 + 4, 'the crow flying up');
  await must(bot, bot.walk(SIX.crow + 3, 'past the crow'), 'past the crow');
  await must(bot, bot.walk(SIX.marble, 'the marble'), 'to the marble');
  await readAt(bot, 63, 'the last sign');
  await must(bot, bot.walk(SIX.rascal - 2, 'Rascal'), 'up to Rascal');
  await must(bot, bot.wait(READ), 'a hello');
  score(bot, from, 3, 25, 'level 6');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`level 6 cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(SIX.exit + 1, 'the exit'), 'the exit');
}
