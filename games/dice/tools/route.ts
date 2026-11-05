// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, taking every coin on the way. It acts out the lesson once, the mistake included:
//   read the signs, walk into the rolling die and keep what it shows, then try the wrong door
//   first (it stays shut), go to the right one (gold on the ground for odd, silver up the ladder
//   for even), and through to the coins and the exit.
// Every tick is checked: the die's face changes on the tick its block says, in order, and the
// face it stopped on is the face it gave a key for.
import { SCAN } from '../../kit/starter/ids';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { DIE_X, FACES, GROUND, LADDER_X, LEDGE, WALL_X, WIDTH, buildLevels, rolling, stopped } from '../src/levels';
import { FACE } from '../src/timing';

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

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 28;
/** Every coin is 10 points (the keys give none). */
const COIN = 10;

const { levels } = buildLevels();

/** The face the die shows now (1 to 6), or 0 if it has been stopped. */
function shown(bot: StarterBot): number {
  const l = levels[0];
  const now = bot.sim.w.blkmap[l.book.n(rolling(1))];
  for (const n of FACES) if (l.book.n(rolling(n)) === now) return n;
  return 0;
}

/** Walks into a door that is still shut, as a person would to see what it does, and checks it did not open. */
async function bump(bot: StarterBot, col: number, what: string): Promise<void> {
  await must(bot, bot.walk(col - 1, `the ${what}`), `to the ${what}`);
  bot.sim.press(SCAN.right);
  const r = await bot.wait(30);
  bot.sim.release(SCAN.right);
  if (r) throw new Error(`bumping the ${what}: ${r}`);
  if (bot.px.x >= col * 20) throw new Error(`the ${what} let the hero through without its key`);
  bot.say(`bumped the ${what}, still shut`);
}

/** Roll the Dice. */
export async function rollTheDice(bot: StarterBot): Promise<void> {
  const l = levels[0];
  const score = bot.sim.ci.score;
  // follow the ring: every change of face must be the next one, FACE ticks after the last
  const seen: [number, number][] = [[shown(bot), bot.sim.ticks]];
  const sim = bot.sim as unknown as { tick: () => Promise<unknown> };
  const orig = sim.tick.bind(sim);
  sim.tick = async () => {
    const r = await orig();
    const v = shown(bot);
    if (v && seen[seen.length - 1][0] !== v) seen.push([v, bot.sim.ticks]);
    return r;
  };
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(45), 'reading the sign');
  await must(bot, bot.walk(11, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(45), 'reading the sign');
  // the lesson: walk into the rolling die; it stops on the face it shows
  await must(bot, bot.walk(DIE_X - 2, 'the die'), 'up to the die');
  await must(bot, bot.wait(LOOK + 10), 'watching it roll');
  await must(bot, bot.walk(DIE_X, 'into the die'), 'into the die');
  await must(bot, bot.wait(LOOK), 'looking at what came up');
  const cell = bot.sim.blockAt(ORIGIN + DIE_X, ORIGIN + GROUND - 1);
  const n = FACES.find((f) => cell === l.book.n(stopped(f)));
  if (!n) throw new Error('touching the die should have stopped it on a face');
  const odd = n % 2 === 1;
  bot.say(`the die stopped on ${n} at tick ${bot.sim.ticks}: ${odd ? 'gold, the ground door' : 'silver, the ladder door'}`);
  // the mistake, on purpose: try the other door first, with the wrong key (the silver one is up the ladder, so for an odd roll he bumps the gold door only after the ladder)
  const goldDoor = async () => {
    await must(bot, bot.walk(WALL_X - 1, 'the gold door'), 'to the gold door');
    await must(bot, bot.walk(WALL_X + 2, 'through the gold door'), 'through the gold door');
  };
  const silverDoor = async () => {
    await must(bot, bot.walk(LADDER_X - 1, 'the ladder'), 'to the ladder');
    await must(bot, bot.walk(LADDER_X, 'the ladder'), 'onto the ladder');
    await must(bot, bot.climb('up', LEDGE - 1, 'up the ladder'), 'climb');
    await must(bot, bot.walk(WALL_X - 1, 'the silver door'), 'to the silver door');
    await must(bot, bot.walk(WALL_X + 2, 'through the silver door'), 'through the silver door');
  };
  if (odd) {
    // gold is right; first he climbs to the silver door by mistake and finds it shut
    await silverBump(bot);
    await must(bot, bot.climb('down', GROUND - 2, 'down the ladder'), 'down the ladder');
    await goldDoor();
  } else {
    await bump(bot, WALL_X, 'gold door');
    await silverDoor();
  }
  // the ring turned face by face, each FACE ticks, in order
  seen.forEach(([f, t], i) => {
    if (i === 0) return;
    const [pf, pt] = seen[i - 1];
    if (f !== (pf % 6) + 1) throw new Error(`face ${pf} was followed by ${f}`);
    if (Math.abs(t - pt - FACE) > 2) throw new Error(`face ${pf} showed ${t - pt} ticks, wanted ${FACE}`);
  });
  await must(bot, bot.walk(WALL_X + 6, 'the coins'), 'to the coins');
  if (bot.sim.ci.score - score !== 4 * COIN) throw new Error(`the level should give 4 coins, not ${(bot.sim.ci.score - score) / COIN}`);
  await leave(bot, bot.walk(WIDTH - 3, 'the exit'), 'the exit');
}

/** Climbs the ladder and bumps the silver door with no silver key, then stays on the ledge for the climb down. */
async function silverBump(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(LADDER_X - 1, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(LADDER_X, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', LEDGE - 1, 'up the ladder'), 'climb');
  await bump(bot, WALL_X, 'silver door');
  await must(bot, bot.walk(LADDER_X + 1, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(LADDER_X, 'the ladder'), 'onto the ladder');
}
