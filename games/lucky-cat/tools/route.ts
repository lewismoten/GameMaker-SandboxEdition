// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level, with a look at each sign. The checks here fail if a charm is missed, a hazard hurts when it should not,
// or a door opens without its key.
import type { StarterBot } from '../../kit/starter/bot';
import { ONE } from '../src/levels/one';
import { THREE } from '../src/levels/three';
import { TWO } from '../src/levels/two';
import { READ, climbUp, hop, leave, mirrored, must, readAt, score } from './routeKit';

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
