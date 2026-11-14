// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level, with a look at each of the few signs. The checks here fail if a charm is missed, a hazard hurts when it should not,
// or a door opens without its key.
import type { StarterBot } from '../../kit/starter/bot';
import { ONE } from '../src/levels/one';
import { FIVE } from '../src/levels/five';
import { FOUR } from '../src/levels/four';
import { SIX } from '../src/levels/six';
import { THREE } from '../src/levels/three';
import { FLOORS, TOWER } from '../src/levels/tower';
import { MORNING } from '../src/levels/morning';
import { BAD_LUCK, CHORE_POINTS } from '../src/props';
import { OPEN_TICKS } from '../src/meter';
import { TWO } from '../src/levels/two';
import { READ, climbUp, hop, leave, mirrored, lifting, must, readAt, score, watchFor } from './routeKit';

/** 1. Ladder Lane: around the ladder by the scaffold (the clover), the cracks, the horseshoe, the crates. */
export async function ladderLane(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await readAt(bot, 5, 'the first sign');
  await climbUp(bot, ONE.ladderUp, 5, 'the scaffold');
  await must(bot, bot.walk(ONE.clover, 'the clover'), 'to the clover');
  await must(bot, bot.walk(ONE.roadEnd + 1, 'the end of the awning'), 'off the awning');
  await hop(bot, ONE.cracks, 3, 'the cracks');
  await climbUp(bot, ONE.scaffoldLadder, 5, 'the second scaffold');
  await must(bot, bot.walk(ONE.horseshoe, 'the horseshoe'), 'to the horseshoe');
  await must(bot, bot.walk(ONE.horseshoe + 4, 'the end of the awning'), 'off the awning');
  await must(bot, bot.walk(ONE.crates - 1, 'the crates'), 'to the crates');
  await must(bot, bot.walk(ONE.crates + 3, 'over the crates'), 'over the crates');
  await readAt(bot, 50, 'the blame sign');
  await hop(bot, ONE.cracks2, 2, 'the last cracks');
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
    await must(bot, bot.walk(TWO.pillars - 1, 'the pillars'), 'to the pillars');
    await must(bot, bot.walk(TWO.pillars + 3, 'over the pillars'), 'over the pillars');
    await climbUp(bot, TWO.ladder, 4, 'the mezzanine ladder');
    await must(bot, bot.walk(TWO.ladybug, 'the ladybug'), 'to the ladybug');
    await must(bot, bot.walk(TWO.key, 'the hand mirror'), 'to the hand mirror');
    await must(bot, bot.walk(TWO.planksEnd + 2, 'the end of the mezzanine'), 'off the mezzanine');
    await hop(bot, TWO.cracks, 2, 'the cracks before the gate');
    await must(bot, bot.walk(TWO.wall + 2, 'through the gate'), 'through the shining gate');
    await must(bot, bot.walk(45, 'the second pillars'), 'over the second pillars');
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
  await must(bot, bot.walk(THREE.lift - 1, 'the umbrellas'), 'to the umbrellas');
  bot.say(`before the lift y=${bot.px.y / 20}`);
  await must(bot, bot.walk(THREE.lift, 'into the umbrellas'), 'into the umbrellas');
  await must(bot, bot.wait(30), 'rising');
  bot.say(`in the lift y=${bot.px.y / 20}`);
  await must(bot, bot.walk(THREE.lift + 2, 'off the umbrellas'), 'onto the gallery');
  bot.say(`on the gallery y=${bot.px.y / 20}`);
  await must(bot, bot.walk(THREE.acorn, 'the acorn'), 'to the acorn');
  await must(bot, bot.walk(THREE.shaker, 'the shaker'), 'to the shaker');
  await must(bot, bot.walk(THREE.gallery[1] + 1, 'the end of the gallery'), 'off the gallery');
  await readAt(bot, 48, 'the salt sign');
  await must(bot, bot.walk(THREE.wall + 2, 'through the salt'), 'through the salt');
  await must(bot, bot.walk(THREE.sock, 'the sock'), 'to the sock');
  await hop(bot, THREE.cracks, 2, 'the cracks by the door');
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
  await hop(bot, FOUR.cracks, 3, 'the first cracks');
  // under the stepladder: a drip of paint costs a fifth of her luck, but it is the quick way
  await must(bot, bot.walk(FOUR.ladder - 1, 'the stepladder'), 'to the stepladder');
  await must(bot, bot.walk(FOUR.ladder + 5, 'under the stepladder'), 'under the stepladder');
  if (bot.sim.ci.hitpts !== hp + BAD_LUCK) throw new Error(`the drip should cost ${-BAD_LUCK}: ${hp} -> ${bot.sim.ci.hitpts}`);
  await climbUp(bot, FOUR.wallLadder, 6, 'the wall ladder');
  await must(bot, bot.walk(FOUR.star, 'the star'), 'to the star');
  await must(bot, bot.walk(FOUR.wall[1] + 2, 'the far side of the wall'), 'down the far side');
  await hop(bot, FOUR.cracks2, 3, 'the cracks by the wall');
  await must(bot, bot.walk(FOUR.crates - 1, 'the crates'), 'to the crates');
  await must(bot, bot.walk(FOUR.crates + 3, 'over the crates'), 'over the crates');
  await must(bot, bot.walk(FOUR.dice, 'the dice'), 'to the dice');
  bot.say(`at the gate after ${bot.sim.ticks} ticks of ${OPEN_TICKS}`);
  if (bot.sim.ticks > OPEN_TICKS * 0.85) throw new Error(`the run is too slow for the fair: ${bot.sim.ticks} ticks of ${OPEN_TICKS}`);
  score(bot, from, 2, 0, 'level 5');
  if (bot.sim.ci.hitpts !== hp + BAD_LUCK) throw new Error(`level 5 cost more than the drip: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(FOUR.exit + 1, 'the exit'), 'the exit');
}

/** 6. Knock on Wood: watch each crow fly up and slip by, knock on the boxes, climb to the rainbow. */
export async function knockOnWood(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(FIVE.crowA - 3, 'before the first crow'), 'to the first crow');
  await watchFor(bot, lifting(bot, FIVE.crowA, FIVE.crowRow), 'the first crow flying up');
  await must(bot, bot.walk(FIVE.crowA + 3, 'past the first crow'), 'past the first crow');
  await must(bot, bot.walk(FIVE.wood - 1, 'the wooden boxes'), 'to the boxes');
  await must(bot, bot.walk(FIVE.wood + 2, 'through the boxes'), 'knocking through the boxes');
  await must(bot, bot.walk(FIVE.feather, 'the feather'), 'to the feather');
  await must(bot, bot.walk(FIVE.crowD - 3, 'before the next crow'), 'to the next crow');
  await watchFor(bot, lifting(bot, FIVE.crowD, FIVE.crowRow), 'the next crow flying up');
  await must(bot, bot.walk(FIVE.crowD + 4, 'past the next crows'), 'past the next crow');
  await readAt(bot, 44, 'the roof sign');
  await climbUp(bot, FIVE.ladder, 4, 'the roof ladder');
  await must(bot, bot.walk(FIVE.rainbow, 'the rainbow'), 'to the rainbow');
  await must(bot, bot.walk(FIVE.planksEnd + 2, 'the end of the roof'), 'off the roof');
  await must(bot, bot.walk(FIVE.crowC - 3, 'before the last crow'), 'to the last crow');
  await watchFor(bot, lifting(bot, FIVE.crowC, FIVE.crowRow), 'the last crow flying up');
  await must(bot, bot.walk(FIVE.crowC + 3, 'past the last crow'), 'past the last crow');
  score(bot, from, 2, 10, 'level 7');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`level 7 cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(FIVE.exit + 1, 'the exit'), 'the exit');
}

/** 7. Rascal's Roof: the cracks, the umbrella lift, the bell and the shaker, the salt, the ribbon, the crow, the marble, and Rascal. */
export async function rascalsRoof(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await hop(bot, SIX.cracks, 3, 'the cracks');
  await must(bot, bot.walk(SIX.lift - 1, 'the umbrellas'), 'to the umbrellas');
  await must(bot, bot.walk(SIX.lift, 'into the umbrellas'), 'into the umbrellas');
  await must(bot, bot.wait(30), 'rising');
  await must(bot, bot.walk(SIX.lift + 2, 'off the umbrellas'), 'onto the gallery');
  await must(bot, bot.walk(SIX.shaker, 'the shaker'), 'to the shaker');
  await must(bot, bot.walk(SIX.gallery[1] + 1, 'the end of the gallery'), 'off the gallery');
  await must(bot, bot.walk(SIX.wall + 2, 'through the salt'), 'through the salt');
  await must(bot, bot.walk(SIX.ribbon, 'the ribbon'), 'to the ribbon');
  await must(bot, bot.walk(SIX.crow - 3, 'before the crow'), 'to the crow');
  await watchFor(bot, lifting(bot, SIX.crow, 5), 'the crow flying up');
  await must(bot, bot.walk(SIX.crow + 3, 'past the crow'), 'past the crow');
  await must(bot, bot.walk(SIX.marble, 'the marble'), 'to the marble');
  await readAt(bot, 63, 'the last sign');
  await must(bot, bot.walk(SIX.rascal - 2, 'Rascal'), 'up to Rascal');
  await must(bot, bot.wait(READ), 'a hello');
  score(bot, from, 2, 25, 'level 8');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`level 8 cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(SIX.exit + 1, 'the exit'), 'the exit');
}

/** 5. The Clock Tower: ladder, long plank and the first umbrella lift; knock through the boxes and climb; wait for the crow; the last lift; the bell. */
export async function clockTower(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  const [f1, f2, f3, f4] = FLOORS;
  const lift = async (floorRow: number, what: string): Promise<void> => {
    await must(bot, bot.walk(TOWER.liftRight - 1, `the ${what} lift`), `to the ${what} lift`);
    await must(bot, bot.walk(TOWER.liftRight, `into the ${what} lift`), `into the ${what} lift`);
    await must(bot, bot.wait(40), 'rising');
    await must(bot, bot.walk(TOWER.liftRight - 2, `off the ${what} lift`), `onto floor ${floorRow}`);
  };
  await climbUp(bot, TOWER.ladder, f1 - 1, 'the tower ladder');
  await must(bot, bot.walk(TOWER.liftRight - 1, 'the end of the first floor'), 'along the first floor');
  await lift(f2, 'first');
  await must(bot, bot.walk(TOWER.box + 3, 'the wooden boxes'), 'to the boxes');
  await must(bot, bot.walk(TOWER.box - 2, 'through the boxes'), 'knocking through the boxes');
  await must(bot, bot.walk(TOWER.ladder + 1, 'the second ladder'), 'to the second ladder');
  await must(bot, bot.walk(TOWER.ladder, 'onto the second ladder'), 'onto the second ladder');
  await must(bot, bot.climb('up', f3 - 1, 'up the second ladder'), 'up the second ladder');
  await must(bot, bot.walk(TOWER.crow - 3, 'before the crow'), 'to the crow');
  await watchFor(bot, lifting(bot, TOWER.crow, TOWER.crowRow), 'the crow flying up');
  await must(bot, bot.walk(TOWER.crow + 3, 'past the crow'), 'past the crow');
  await must(bot, bot.walk(TOWER.liftRight - 1, 'the end of the third floor'), 'along the third floor');
  await lift(f4, 'second');
  await must(bot, bot.walk(TOWER.bell, 'the bell'), 'to the bell');
  score(bot, from, 1, 10, 'level 6');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`level 6 cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(TOWER.exit - 1, 'the exit'), 'the exit');
}

/** 4. Earlier That Morning, as Rascal: the chores (three ropes, three saucers), the crates, the awning and the key, the cracks, the crow, the padlock. */
export async function earlierThatMorning(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(MORNING.cleat1, 'the first rope'), 'tying off the first rope');
  await readAt(bot, 14, 'the to-do list');
  await must(bot, bot.walk(MORNING.step1, 'the first doorstep'), 'setting out the first saucer');
  await must(bot, bot.walk(MORNING.crates - 1, 'the crates'), 'to the crates');
  await must(bot, bot.walk(MORNING.crates + 3, 'over the crates'), 'over the crates');
  await climbUp(bot, MORNING.ladder, 5, 'the awning ladder');
  await must(bot, bot.walk(MORNING.cleat2, 'the awning rope'), 'tying off the awning rope');
  await must(bot, bot.walk(MORNING.key, 'the bin key'), 'to the bin key');
  await must(bot, bot.walk(MORNING.awning[1] + 2, 'the end of the awning'), 'off the awning');
  await hop(bot, MORNING.cracks, 3, 'the cracks');
  await must(bot, bot.walk(MORNING.step2, 'the second doorstep'), 'setting out the second saucer');
  await must(bot, bot.walk(MORNING.crow - 3, 'before the crow'), 'to the crow');
  await watchFor(bot, lifting(bot, MORNING.crow, MORNING.crowRow), 'the crow flying up');
  await must(bot, bot.walk(MORNING.crow + 3, 'past the crow'), 'past the crow');
  await must(bot, bot.walk(MORNING.cleat3, 'the last rope'), 'tying off the last rope');
  await must(bot, bot.walk(MORNING.wall + 2, 'through the padlock'), 'through the padlock');
  await must(bot, bot.walk(MORNING.step3, 'the last doorstep'), 'setting out the last saucer');
  score(bot, from, 0, 6 * CHORE_POINTS + 25, 'level 4');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`level 4 cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await must(bot, bot.wait(READ / 2), 'a look back at the work');
  await leave(bot, bot.walk(MORNING.exit + 1, 'the exit'), 'the exit');
}
