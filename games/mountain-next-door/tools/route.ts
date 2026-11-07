// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level, with a look at each sign and a stop to watch whatever is happening. The checks here fail if a treasure is
// missed, a bump hurts when it should not, or a scene moves on before it has been watched.
import type { StarterBot } from '../../kit/starter/bot';
import { G2, GATES_AT } from '../src/levels/gates';
import { NEXT_AT } from '../src/levels/next';
import { GROUND } from '../src/level';
import { PROLOGUE } from '../src/monsters';
import { POINTS } from '../src/props';
import { READ, climbUp, leave, must, readAt, score, solidNow, watchFor } from './routeKit';

/** Ticks since the scene began. */
const since = (bot: StarterBot, t0: number) => bot.sim.w.clock - t0;

/** 1. Next Door: read along the street while the fog lifts, watch the mountain wake and lift its toe, then go. */
export async function nextDoor(bot: StarterBot): Promise<void> {
  const t0 = bot.sim.w.clock;
  const at = NEXT_AT.signs;
  await readAt(bot, at.up + 1, 'the first sign');
  await readAt(bot, at.fog + 1, 'the fog sign');
  await must(bot, bot.walk(at.not - 1, 'the mountain'), 'to the mountain');
  await watchFor(bot, () => since(bot, t0) > 560, 'the fog lifting', 900);
  await readAt(bot, at.not + 1, 'the not-fog sign');
  await readAt(bot, at.gates + 1, 'the gates sign');
  await must(bot, bot.walk(NEXT_AT.toe - 2, 'the toe'), 'to the toe');
  if (since(bot, t0) > PROLOGUE.wake) throw new Error('the mountain woke before Tess got to watch');
  await watchFor(bot, () => !solidNow(bot, NEXT_AT.toe, GROUND - 1), 'the mountain lifting its toe', 900);
  await must(bot, bot.wait(READ / 2), 'a look up at the mountain');
  await readAt(bot, at.polite + 1, 'the polite sign');
  await leave(bot, bot.walk(NEXT_AT.exit + 1, 'the exit'), 'the exit');
}

/** Takes a gate off a ledge: up the ladder, along to the gate, on to the ledge's end and down. */
async function fetchGate(bot: StarterBot, c: { ladder: number; row: number; end: number; gate: number }, what: string, fromLedge = false): Promise<void> {
  const before = bot.sim.ci.score;
  if (fromLedge) {
    await must(bot, bot.walk(c.ladder, `the ladder to ${what}`), `onto the ladder to ${what}`);
    await must(bot, bot.climb('up', c.row - 1, `up to ${what}`), `up to ${what}`);
  } else await climbUp(bot, c.ladder, c.row - 1, `the ladder to ${what}`);
  await must(bot, bot.walk(c.gate, what), `to ${what}`);
  await must(bot, bot.walk(c.end + 1, 'the end of the ledge'), 'off the ledge');
  await must(bot, bot.land(), 'landing');
  score(bot, before, POINTS.gate, what);
}

/** Puts a gate back: walks into the wheelbarrow in the gateway (the gate takes its place) and on through. */
async function returnGate(bot: StarterBot, way: number, what: string): Promise<void> {
  const before = bot.sim.ci.score;
  await must(bot, bot.walk(way + 2, what), `through ${what}`);
  score(bot, before, POINTS.home, what);
}

/** Walks to an acorn (or any treasure) at column `x` and checks it scored `points`. */
async function take(bot: StarterBot, x: number, points: number, what: string): Promise<void> {
  const before = bot.sim.ci.score;
  await must(bot, bot.walk(x, what), `to ${what}`);
  score(bot, before, points, what);
}

/** 2. Gate Hunt: four gates off the mountain's ledges, each carried home to its garden. */
export async function gateHunt(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const [a, b, c, d] = GATES_AT.climbs;
  const at = GATES_AT.signs;
  await readAt(bot, at.four + 1, 'the four gates sign');
  await fetchGate(bot, a, 'the white gate');
  await readAt(bot, at.carry + 1, 'the one-at-a-time sign');
  await returnGate(bot, a.way, 'the first garden');
  await take(bot, GATES_AT.acorns[0], POINTS.acorn, 'acorn 1');
  await readAt(bot, at.hens + 1, 'the hens sign');
  await fetchGate(bot, b, 'the blue gate');
  await returnGate(bot, b.way, 'the second garden');
  await must(bot, bot.walk(GATES_AT.pie, 'the pie'), 'to the pie');
  await readAt(bot, at.pie + 1, 'the pie sign');
  await climbUp(bot, c.ladder, c.row - 1, 'the low ledge');
  await fetchGate(bot, c.upper, 'the green gate', true);
  await returnGate(bot, c.way, 'the third garden');
  await take(bot, GATES_AT.acorns[1], POINTS.acorn, 'acorn 2');
  await fetchGate(bot, d, 'the red gate');
  await returnGate(bot, d.way, 'the fourth garden');
  await take(bot, GATES_AT.acorns[2], POINTS.acorn, 'acorn 3');
  await readAt(bot, at.sorry + 1, 'the sorry sign');
  score(bot, from, 4 * (POINTS.gate + POINTS.home) + 3 * POINTS.acorn, 'level 2');
  if (bot.sim.ci.hitpts < 50) throw new Error(`level 2 cost hit points: ${bot.sim.ci.hitpts}`);
  void G2;
  await leave(bot, bot.walk(GATES_AT.exit + 1, 'the exit'), 'the exit');
}
