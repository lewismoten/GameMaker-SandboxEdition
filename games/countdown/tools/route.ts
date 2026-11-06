// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. It acts out each lesson once,
// the mistake included:
//   level 1: read the signs, walk up to the door while the number is still above 0 and push on
//            into it (it is solid), wait for the 0, and go in
//   level 2: read the signs, take the coins, then just wait: the floor flashes and opens, and
//            the drop takes the hero out
// While it waits, every tick is checked: each digit changes at the right tick, the tens and
// ones digits agree, and the door and the floor change on the tick the number reaches zero.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { DOOR_X, buildLevels, type Level } from '../src/levels';
import { DOOR_AT, FLOOR_AT, SECOND, WARN } from '../src/timing';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

const { levels } = buildLevels();

/** What block kind a map cell of `name` is showing right now. */
function showing(bot: StarterBot, l: Level, name: string): string {
  const shown = bot.sim.w.blkmap[l.book.n(name)];
  for (const [n, i] of l.book.index) if (i === shown) return n;
  return '?';
}
const doorIs = (bot: StarterBot, l: Level) => (showing(bot, l, 'door.shut.bl') === 'door.open.bl' ? 'open' : 'shut');
const digitOne = (bot: StarterBot, l: Level) => Number(showing(bot, l, 'big9.tl').slice(3, 4));
/** The number level 2 shows, read from the tens digit and the ones digit, and whether they agree. */
function numberTwo(bot: StarterBot, l: Level): number {
  const tens = Number(showing(bot, l, 'ten9').slice(3));
  const ones = showing(bot, l, 'one99').slice(3);
  if (Number(ones[0]) !== tens) throw new Error(`the tens digit shows ${tens} but the ones digit is in the ${ones[0]}0s (tick ${bot.sim.ticks})`);
  return tens * 10 + Number(ones[1]);
}

/** Calls `look` after every tick of the sim (the bot's walks and waits tick it too) and records each change of its answer: [value, tick]. */
function watch(bot: StarterBot, look: () => number): [number, number][] {
  const seen: [number, number][] = [];
  const sim = bot.sim as unknown as { tick: () => Promise<unknown> };
  const orig = sim.tick.bind(sim);
  sim.tick = async () => {
    const r = await orig();
    const v = look();
    if (!seen.length || seen[seen.length - 1][0] !== v) seen.push([v, bot.sim.ticks]);
    return r;
  };
  return seen;
}

/** Every change must come a second (SECOND ticks, give or take 2) after the last, going down by one from `top`. */
function checkCount(seen: [number, number][], top: number, to: number, what: string): void {
  const want = top - to;
  if (seen.length !== want + 1 || seen[0][0] !== top) throw new Error(`${what}: saw ${seen.map((s) => s[0]).join(' ')}, wanted ${top} down to ${to}`);
  seen.forEach(([v, t]) => {
    const at = (top - v) * SECOND;
    if (Math.abs(t - at) > 2) throw new Error(`${what}: ${v} came at tick ${t}, wanted about ${at}`);
  });
}

/** Pushes right for a second and a half: the hero must not get past `col`. */
async function pushOn(bot: StarterBot, col: number, what: string): Promise<void> {
  bot.sim.press(77);
  await must(bot, bot.wait(28), what);
  bot.sim.release(77);
  if (bot.px.x >= (col + 1) * 20) throw new Error(`${what}: the hero got past column ${col}`);
}

/** 1. Nine to Zero: the door is shut until the number is 0. */
export async function nineToZero(bot: StarterBot): Promise<void> {
  const l = levels[0];
  const seen = watch(bot, () => digitOne(bot, l));
  if (digitOne(bot, l) !== 9 || doorIs(bot, l) !== 'shut') throw new Error('the level should start at 9 with the door shut');
  await must(bot, bot.walk(7, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(20), 'reading the sign');
  await must(bot, bot.walk(12, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(15), 'reading the sign');
  await must(bot, bot.walk(19, 'the porch'), 'to the porch');
  if (doorIs(bot, l) !== 'shut') throw new Error(`the door should still be shut at tick ${bot.sim.ticks}; the bot got there too late`);
  bot.say(`the door is shut and the number is ${digitOne(bot, l)} at tick ${bot.sim.ticks}`);
  // the door is solid until the 0
  await pushOn(bot, DOOR_X - 1, 'pushing on into the shut door');
  if (doorIs(bot, l) !== 'shut') throw new Error('the door opened early');
  for (let i = 0; i < DOOR_AT + 40 && digitOne(bot, l) !== 0; i++) await must(bot, bot.wait(1), 'waiting for the 0');
  if (digitOne(bot, l) !== 0) throw new Error('the number never reached 0');
  if (doorIs(bot, l) !== 'open') throw new Error('the 0 is up but the door is still shut');
  if (Math.abs(bot.sim.ticks - DOOR_AT) > 2) throw new Error(`the 0 came at tick ${bot.sim.ticks}, wanted about ${DOOR_AT}`);
  bot.say(`the number is 0 and the door has opened at tick ${bot.sim.ticks}`);
  await must(bot, bot.wait(30), 'looking at the open door');
  checkCount(seen, 9, 0, 'level 1');
  if (bot.sim.ci.score !== 40) throw new Error(`level 1 should give 4 coins (40), not ${bot.sim.ci.score}`);
  // going in takes the hero on. He may go: nothing makes him.
  await leave(bot, bot.walk(DOOR_X + 1, 'the open door'), 'the door');
}

/** 2. Ninety-Nine: the whole count, then the drop. */
export async function ninetyNine(bot: StarterBot): Promise<void> {
  const l = levels[1];
  const seen = watch(bot, () => numberTwo(bot, l));
  const floor = () => showing(bot, l, 'trap.shut');
  if (numberTwo(bot, l) !== 99 || floor() !== 'trap.shut') throw new Error('the level should start at 99 with the floor shut');
  await must(bot, bot.walk(5, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(50), 'reading the sign');
  await must(bot, bot.walk(14, 'the coins'), 'to the coins');
  await must(bot, bot.walk(10, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(50), 'reading the sign');
  if (bot.sim.ci.score !== 80) throw new Error(`level 2 should add 4 coins (80 in all), not ${bot.sim.ci.score}`);
  // now wait it out, watching the floor
  for (let i = 0; i < FLOOR_AT && floor() === 'trap.shut'; i++) await must(bot, bot.wait(1), 'waiting for the floor to flash');
  const warnAt = bot.sim.ticks;
  if (floor() !== 'trap.warn' || Math.abs(warnAt - (FLOOR_AT - WARN)) > 2)
    throw new Error(`the floor should flash at tick ${FLOOR_AT - WARN}, not ${warnAt} (${floor()})`);
  bot.say(`the floor flashes at tick ${warnAt}, number ${numberTwo(bot, l)}`);
  if (numberTwo(bot, l) !== 3) throw new Error(`the floor should flash at 03, not ${numberTwo(bot, l)}`);
  for (let i = 0; i < WARN + 10 && numberTwo(bot, l) !== 0; i++) await must(bot, bot.wait(1), 'the floor flashing');
  if (numberTwo(bot, l) !== 0) throw new Error('the number never reached 00');
  if (floor() === 'trap.warn' || floor() === 'trap.shut') throw new Error('the number is 00 but the floor is still there');
  checkCount(seen, 99, 0, 'level 2');
  // the floor opens on the tick the number reaches 00, and the drop takes the hero out
  await leave(bot, bot.wait(300), 'the drop');
  bot.say(`dropped out at tick ${bot.sim.ticks} of the last room`);
}
