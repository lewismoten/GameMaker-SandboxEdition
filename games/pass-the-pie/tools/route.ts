// The way through PASS THE PIE, as orders for the bot (kit/starter/bot.ts): the keys a person would press, street by
// street. Every street: take the dish at the start, read the signs (a look of about two seconds each), cross, and hand
// the dish over at the neighbor's door. The bot waits for a gap rather than running into things, and any bump it takes
// is counted against a small budget.
//   1 Pumpkin Yard    scuff through every leaf pile, hop the fences, let the squirrels hop away
//   2 Gravy Slide     hop each robot vacuum
//   3 Windy Park      cross when a football is high or low, hop the ones in the way
//   4 Cranberry Roll  hop the rolling berries
//   5 Hungry Dog      climb for the bone, give it to the dog, then the rolls go through
//   6 Parade Dash     run: the town hall doors shut when the bar is empty
import type { Result, StarterBot } from '../../kit/starter/bot';
import { AT } from '../src/levels';

/** A person's look at a sign, in ticks (about two seconds). */
const READ = 36;
/** Hit points the whole walkthrough may lose to bumps (a person is allowed a few). */
export const BUMP_BUDGET = 40;

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take Rory through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

async function read(bot: StarterBot, x: number, what: string): Promise<void> {
  await must(bot, bot.walk(x, `the ${what} sign`), `to the ${what} sign`);
  await must(bot, bot.wait(READ), `reading the ${what} sign`);
}

/** Walks to `x`, jumping when something stops it, and notes the hit points it cost. */
async function cross(bot: StarterBot, x: number, what: string): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(x, what, 900, { jumpWhenJittering: true }), what);
  if (bot.sim.ci.hitpts < hp) bot.say(`${what}: bumped, hit points ${hp} -> ${bot.sim.ci.hitpts}`);
}

/** Hops over a hazard block at column `at` (and `at + width - 1`), as over spikes: takes off two blocks before it and lands past it. */
async function hop(bot: StarterBot, at: number, what: string, width = 1): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(at - 2, `${what}`), `to ${what}`);
  await must(bot, bot.jump('right', at + width + 2), `over ${what}`);
  if (bot.sim.ci.hitpts < hp) throw new Error(`${what} hurt: hit points ${hp} -> ${bot.sim.ci.hitpts}`);
}

/** Climbs the ladder to a shelf of coins, walks along it and comes back down (a treat a person would take). */
async function shelfTrip(bot: StarterBot, [ladder, , to]: readonly [number, number, number]): Promise<void> {
  await must(bot, bot.walk(ladder + 1, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'up the ladder');
  await must(bot, bot.walk(to, 'the end of the shelf'), 'along the shelf');
  await must(bot, bot.walk(ladder + 1, 'the ladder again'), 'back along the shelf');
  await must(bot, bot.walk(ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
}

/** The dish counter must have been taken: the neighbor's door opens only for it. */
async function door(bot: StarterBot, gate: number, exit: number, what: string): Promise<void> {
  await cross(bot, gate - 1, `${what}'s door`);
  await must(bot, bot.wait(20), `knocking at ${what}'s door`);
  await cross(bot, gate + 2, `through ${what}'s door`);
  await leave(bot, bot.walk(exit + 1, 'the exit'), 'the exit');
}

/** 1. Pumpkin Yard. */
export async function pumpkinYard(bot: StarterBot): Promise<void> {
  await read(bot, 8, 'oven');
  await cross(bot, AT.yard.dish + 1, 'the pie');
  await read(bot, 15, 'leaf');
  await cross(bot, AT.yard.fences[0] - 1, 'the first fence');
  await cross(bot, AT.yard.fences[0] + 3, 'over the first fence');
  await shelfTrip(bot, AT.yard.shelf);
  await read(bot, 37, 'squirrel');
  await cross(bot, AT.yard.fences[1] + 3, 'the squirrels and the second fence');
  await cross(bot, AT.yard.fences[2] + 3, 'the third fence');
  await cross(bot, AT.yard.gate - 7, 'the last leaf piles');
  await door(bot, AT.yard.gate, AT.yard.exit, 'Mrs. Pettigrew');
}

/** 2. Gravy Slide. */
export async function gravySlide(bot: StarterBot): Promise<void> {
  await read(bot, 8, 'gravy');
  await cross(bot, AT.gravy.dish + 1, 'the gravy boat');
  await read(bot, 16, 'vacuum');
  await hop(bot, AT.gravy.vacuums[0], 'the first vacuum');
  await shelfTrip(bot, AT.gravy.shelf);
  for (const v of AT.gravy.vacuums.slice(1)) await hop(bot, v, `the vacuum at ${v}`);
  await door(bot, AT.gravy.gate, AT.gravy.exit, 'Mr. Okafor');
}

/** 3. Windy Park. */
export async function windyPark(bot: StarterBot): Promise<void> {
  await read(bot, 8, 'park');
  await cross(bot, AT.park.dish + 1, 'the casserole');
  await read(bot, 21, 'football');
  await hop(bot, AT.park.balls[0], 'the first football');
  await shelfTrip(bot, AT.park.shelf);
  for (const b of AT.park.balls.slice(1)) await hop(bot, b, `the football at ${b}`);
  await door(bot, AT.park.gate, AT.park.exit, 'the Lopez family');
}

/** 4. Cranberry Roll. */
export async function cranberryRoll(bot: StarterBot): Promise<void> {
  await read(bot, 8, 'cranberry');
  await cross(bot, AT.berry.dish + 1, 'the cranberry sauce');
  await read(bot, 19, 'rolling');
  await hop(bot, AT.berry.berries[0], 'the first berry', 2);
  await shelfTrip(bot, AT.berry.shelf);
  for (const b of AT.berry.berries.slice(1)) await hop(bot, b, `the berry at ${b}`, 2);
  await door(bot, AT.berry.gate, AT.berry.exit, 'Ms. Tanaka');
}

/** 5. Hungry Dog. */
export async function hungryDog(bot: StarterBot): Promise<void> {
  await read(bot, 8, 'dog');
  await cross(bot, AT.dog.dish + 1, 'the rolls');
  await read(bot, 16, 'bone');
  // the dog will not let the rolls pass: bump him once, as a person would, then go for the bone
  await cross(bot, AT.dog.dog - 1, 'the dog');
  await must(bot, bot.wait(30), 'looking at the dog');
  await must(bot, bot.walk(AT.dog.ladder + 1, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(AT.dog.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(AT.dog.bone, 'the bone'), 'along the shelf to the bone');
  await must(bot, bot.walk(AT.dog.ladder + 1, 'the ladder again'), 'back along the shelf');
  await must(bot, bot.walk(AT.dog.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await read(bot, AT.dog.dog - 5, 'dog');
  await cross(bot, AT.dog.dog + 2, 'the dog, with the bone');
  await must(bot, bot.wait(40), 'watching him chew');
  await door(bot, AT.dog.gate, AT.dog.exit, 'the Abels');
}

/** 6. Parade Dash. */
export async function paradeDash(bot: StarterBot): Promise<void> {
  await cross(bot, AT.dash.dish + 1, 'the rolls');
  await cross(bot, 14, 'the signs');
  for (const f of AT.dash.floats) await hop(bot, f, `the float at ${f}`);
  await cross(bot, AT.dash.hall + 2, 'the town hall');
  await door(bot, AT.dash.gate, AT.dash.exit, 'the long table');
}
