// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level, with a look at each sign and a stop to watch whatever is happening. The checks here fail if a treasure is
// missed, a bump hurts when it should not, or a scene moves on before it has been watched.
import type { StarterBot } from '../../kit/starter/bot';
import { G2, GATES_AT } from '../src/levels/gates';
import { NEXT_AT } from '../src/levels/next';
import { G3, PRINTS_AT } from '../src/levels/prints';
import { G4, STREAM_AT } from '../src/levels/stream';
import { buildLevels } from '../src/levels';
import { GROUND } from '../src/level';
import { PROLOGUE } from '../src/monsters';
import { POINTS } from '../src/props';
import { READ, climbUp, hop, leave, must, readAt, score, shownAt, solidNow, watchFor } from './routeKit';

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

/** 3. Footprints in the Park: every post and tree blazed, the oak's acorns, the deep prints hopped. */
export async function footprints(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const P = PRINTS_AT;
  const at = P.signs;
  const [p1, p2, p3, p4, p5] = P.posts;
  const [h1, h2, h3] = P.holes;
  await readAt(bot, at.follow + 1, 'the footprints sign');
  await take(bot, p1, POINTS.blaze, 'the first post');
  await take(bot, P.trees[0], POINTS.blaze, 'the first tree');
  await hop(bot, h1, 2, 'the first deep print');
  await readAt(bot, at.blaze + 2, 'the blaze sign');
  await take(bot, p2, POINTS.blaze, 'the second post');
  await readAt(bot, at.nut + 1, 'the Nutmeg sign');
  await climbUp(bot, P.oak.ladder, P.oak.row - 1, "the oak's ladder");
  await take(bot, P.oak.acorns[0], POINTS.acorn, 'the first acorn');
  await take(bot, P.oak.acorns[1], POINTS.acorn, 'the second acorn');
  await must(bot, bot.walk(P.oak.to + 3, 'past the oak'), 'off the branch');
  await must(bot, bot.land(), 'landing');
  await take(bot, P.oak.to + 1, POINTS.blaze, "the oak's trunk");
  await take(bot, p3, POINTS.blaze, 'the third post');
  await must(bot, bot.walk(P.trees[1] - 1, 'over the log'), 'over the log');
  await take(bot, P.trees[1], POINTS.blaze, 'the second tree');
  await hop(bot, h2, 2, 'the second deep print');
  await must(bot, bot.walk(P.pie, 'the pie'), 'to the pie');
  await take(bot, p4, POINTS.blaze, 'the fourth post');
  await take(bot, P.trees[2], POINTS.blaze, 'the third tree');
  await hop(bot, h3, 2, 'the third deep print');
  await take(bot, p5, POINTS.blaze, 'the fifth post');
  await readAt(bot, at.mist + 1, 'the mist sign');
  score(bot, from, 9 * POINTS.blaze + 2 * POINTS.acorn, 'level 3');
  void G3;
  await leave(bot, bot.walk(P.exit + 1, 'the exit'), 'the exit');
}

/** Block numbers by name in a level's own set. */
const blocks = (file: string) => {
  const l = buildLevels().levels.find((x) => x.file === file);
  if (!l) throw new Error(`no level ${file}`);
  return l.book;
};

/**
 * Crosses a stream on its runs of stones like a person: waits on the bank (or the last stone) until the next run
 * has just come up, then walks across it.
 */
async function cross(bot: StarterBot, runs: readonly (readonly [number, number, string])[], ground: number, what: string): Promise<void> {
  const up = blocks('stream').n('stoneUp');
  const isUp = (x: number) => shownAt(bot, x, ground) === up;
  await must(bot, bot.walk(runs[0][0] - 1, what), `to ${what}`);
  const dry = () => {
    if (bot.px.y / 20 > ground - 1) throw new Error(`fell in at ${what} (x ${bot.px.x / 20})`);
  };
  for (const [i, [a, b]] of runs.entries()) {
    if (i === 0) {
      // from the bank: wait for a fresh rise, so there is time to cross
      if (isUp(a)) await watchFor(bot, () => !isUp(a), `the stones at ${a} going down`, 400);
      await watchFor(bot, () => isUp(a), `the stones at ${a} coming up`, 400);
    } else await watchFor(bot, () => isUp(a), `the stones at ${a} coming up`, 400);
    await must(bot, bot.walk(b, `across ${what}`), `across ${what}`);
    dry();
  }
  await must(bot, bot.walk(runs[runs.length - 1][1] + 2, `out of ${what}`), `out of ${what}`);
  if (bot.px.y / 20 > ground - 1) throw new Error(`fell in at ${what}`);
}

/** 4. Stepping Stones: four crossings on the wobbly stones, the trees on the banks, the footbridge. */
export async function steppingStones(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const S = STREAM_AT;
  const at = S.signs;
  const [c1, c2, c3, c4] = S.crossings;
  await readAt(bot, at.stones + 1, 'the stones sign');
  await cross(bot, c1, G4, 'the first crossing');
  await take(bot, S.trees[0], POINTS.blaze, 'the first tree');
  await readAt(bot, at.two + 2, 'the rise-and-sink sign');
  await cross(bot, c2, G4, 'the second crossing');
  await must(bot, bot.walk(S.pie, 'the pie'), 'to the pie');
  await take(bot, S.trees[1], POINTS.blaze, 'the second tree');
  await take(bot, S.acorns[0], POINTS.acorn, 'an acorn');
  await cross(bot, c3, G4, 'the third crossing');
  await readAt(bot, at.socks + 2, 'the wet socks sign');
  await take(bot, S.trees[2], POINTS.blaze, 'the third tree');
  await take(bot, S.acorns[1], POINTS.acorn, 'an acorn');
  await cross(bot, c4, G4, 'the fourth crossing');
  await take(bot, S.trees[3], POINTS.blaze, 'the fourth tree');
  await must(bot, bot.walk(S.bridge[1] + 2, 'over the footbridge'), 'over the footbridge');
  await readAt(bot, at.hill + 1, 'the hill sign');
  score(bot, from, 4 * POINTS.blaze + 2 * POINTS.acorn, 'level 4');
  await leave(bot, bot.walk(S.exit + 1, 'the exit'), 'the exit');
}
