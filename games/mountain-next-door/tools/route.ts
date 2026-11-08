// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level, with a look at each sign and a stop to watch whatever is happening. The checks here fail if a treasure is
// missed, a bump hurts when it should not, or a scene moves on before it has been watched.
import type { StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { G2, GATES_AT } from '../src/levels/gates';
import { NEXT_AT } from '../src/levels/next';
import { G3, PRINTS_AT } from '../src/levels/prints';
import { G4, STREAM_AT } from '../src/levels/stream';
import { FLOORS, SIGNS_AT } from '../src/levels/signs';
import { HOLLOW_AT, STARS } from '../src/levels/hollow';
import { G7, LEDGES, RIDGE_AT } from '../src/levels/ridge';
import { TUNNEL_AT, UPPER } from '../src/levels/tunnel';
import { ZFLOORS, ZIGZAG_AT } from '../src/levels/zigzag';
import { PICNIC_AT, TOP } from '../src/levels/picnic';
import { buildLevels } from '../src/levels';
import { GROUND } from '../src/level';
import { FOG_WAVES, PICNIC, PICNIC_WALK, PROLOGUE, WISP_HOME } from '../src/monsters';
import { POINTS } from '../src/props';
import { READ, climbUp, hop, hopLeft, leave, lookAt, must, readAt, score, shownAt, solidNow, watchFor } from './routeKit';

/** Ticks since the scene began. */
const since = (bot: StarterBot, t0: number) => bot.sim.w.clock - t0;

/** 1. Next Door: along the street while the fog lifts, watch the mountain wake and lift its toe, hear it, then go. */
export async function nextDoor(bot: StarterBot): Promise<void> {
  const t0 = bot.sim.w.clock;
  const at = NEXT_AT.signs;
  await lookAt(bot, at.up + 1, 'the street');
  await readAt(bot, at.fog + 1, 'the fog sign');
  await must(bot, bot.walk(at.not + 4, 'the mountain'), 'to the mountain');
  await watchFor(bot, () => since(bot, t0) > FOG_WAVES[3] + 160, 'the fog lifting', 1200);
  await lookAt(bot, at.not + 1, 'the mountain');
  await lookAt(bot, at.gates + 1, 'the gates caught on it');
  await must(bot, bot.walk(NEXT_AT.toe - 2, 'the toe'), 'to the toe');
  if (since(bot, t0) > PROLOGUE.wake) throw new Error('the mountain woke before Tess got to watch');
  await watchFor(bot, () => !solidNow(bot, NEXT_AT.toe, GROUND - 1), 'the mountain lifting its toe', 900);
  await must(bot, bot.wait(READ / 2), 'a look up at the mountain');
  // under the lifted toe the mountain says its line; Tess stops to hear it out
  await must(bot, bot.walk(NEXT_AT.toe + 1, 'under the toe'), 'under the toe');
  if (!bot.sim.clipTicksLeft) throw new Error('the mountain said nothing as Tess passed under its toe');
  await must(bot, bot.sim.waitForClip(), 'the mountain saying excuse me');
  await lookAt(bot, at.polite + 1, 'Mrs. Okoro on her step', READ / 2);
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
export async function take(bot: StarterBot, x: number, points: number, what: string): Promise<void> {
  const before = bot.sim.ci.score;
  await must(bot, bot.walk(x, what), `to ${what}`);
  score(bot, before, points, what);
}

/** 2. Gate Hunt: four gates off the mountain's ledges, each carried home to its garden. */
export async function gateHunt(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const [a, b, c, d] = GATES_AT.climbs;
  const at = GATES_AT.signs;
  await must(bot, bot.walk(at.four + 1, 'the four gates spot'), 'to the four gates spot');
  await fetchGate(bot, a, 'the white gate');
  await must(bot, bot.walk(at.carry + 1, 'the one-at-a-time spot'), 'to the one-at-a-time spot');
  await returnGate(bot, a.way, 'the first garden');
  await take(bot, GATES_AT.acorns[0], POINTS.acorn, 'acorn 1');
  await must(bot, bot.walk(at.hens + 1, 'the hens spot'), 'to the hens spot');
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
  await must(bot, bot.walk(at.follow + 1, 'the footprints spot'), 'to the footprints spot');
  await take(bot, p1, POINTS.blaze, 'the first post');
  await take(bot, P.trees[0], POINTS.blaze, 'the first tree');
  await hop(bot, h1, 2, 'the first deep print');
  await must(bot, bot.walk(at.blaze + 2, 'the blaze spot'), 'to the blaze spot');
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
  await must(bot, bot.walk(at.mist + 1, 'the mist spot'), 'to the mist spot');
  const c = P.canopy;
  await climbUp(bot, c.ladder, c.row - 1, 'the ladder to the canopy walk');
  await must(bot, bot.walk(at.canopy + 2, 'the canopy spot'), 'to the canopy spot');
  const stops = [...c.posts.map((x) => [x, POINTS.blaze] as const), ...c.acorns.map((x) => [x, POINTS.acorn] as const)].sort((a, b) => b[0] - a[0]);
  for (const [x, pts] of stops) await take(bot, x, pts, 'something on the canopy walk');
  score(bot, from, 13 * POINTS.blaze + 5 * POINTS.acorn, 'level 3');
  void G3;
  await leave(bot, bot.walk(P.exit - 1, 'the exit'), 'the exit');
}

/** Block numbers by name in a level's own set. */
export const blocks = (file: string) => {
  const l = buildLevels().levels.find((x) => x.file === file);
  if (!l) throw new Error(`no level ${file}`);
  return l.book;
};

/**
 * Crosses a stream on its runs of stones like a person: waits on the bank (or the last stone) until the next run
 * has just come up, then walks across it.
 */
export async function cross(
  bot: StarterBot,
  runs: readonly (readonly [number, number, ...unknown[]])[],
  ground: number,
  what: string,
  file = 'stream',
  upName = 'stoneUp',
): Promise<void> {
  const up = blocks(file).n(upName);
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
  await must(bot, bot.walk(at.stones + 1, 'the stones spot'), 'to the stones spot');
  await cross(bot, c1, G4, 'the first crossing');
  await take(bot, S.trees[0], POINTS.blaze, 'the first tree');
  await must(bot, bot.walk(at.two + 2, 'the rise-and-sink spot'), 'to the rise-and-sink spot');
  await cross(bot, c2, G4, 'the second crossing');
  await must(bot, bot.walk(S.pie, 'the pie'), 'to the pie');
  await take(bot, S.trees[1], POINTS.blaze, 'the second tree');
  await take(bot, S.acorns[0], POINTS.acorn, 'an acorn');
  await cross(bot, c3, G4, 'the third crossing');
  await readAt(bot, at.socks + 2, 'the wet socks sign');
  await take(bot, S.trees[2], POINTS.blaze, 'the third tree');
  await take(bot, S.acorns[1], POINTS.acorn, 'an acorn');
  await cross(bot, c4, G4, 'the fourth crossing');
  await readAt(bot, at.ripple + 2, 'the ripple sign');
  await take(bot, S.trees[3], POINTS.blaze, 'the fourth tree');
  await rippleCross(bot);
  await take(bot, S.trees[4], POINTS.blaze, 'the fifth tree');
  await must(bot, bot.walk(S.bridge[1] + 2, 'over the footbridge'), 'over the footbridge');
  score(bot, from, 5 * POINTS.blaze + 2 * POINTS.acorn + S.ripple.stones.length * POINTS.acorn, 'level 4');
  await leave(bot, bot.walk(S.exit, 'the exit'), 'the exit');
}

/**
 * The ripple: single stones that come up one after another. Waits on the bank for the first to rise fresh, then hops from
 * stone to stone as each comes up (a person goes with the wave, and waits on a stone when she gets ahead of it).
 */
async function rippleCross(bot: StarterBot): Promise<void> {
  const { water, stones } = STREAM_AT.ripple;
  const book = blocks('stream');
  const up = (x: number) => shownAt(bot, x, G4) === book.n('rUpA') || shownAt(bot, x, G4) === book.n('rUpB');
  const dry = (what: string) => {
    if (bot.px.y / 20 > G4 - 1) throw new Error(`fell in at ${what} (x ${bot.px.x / 20})`);
  };
  await must(bot, bot.walk(water[0] - 1, 'the ripple bank'), 'to the ripple bank');
  if (up(stones[0])) await watchFor(bot, () => !up(stones[0]), 'the first ripple stone going down', 400);
  await watchFor(bot, () => up(stones[0]), 'the first ripple stone coming up', 400);
  for (const [i, x] of [...stones, water[1] + 1].entries()) {
    if (i > 0 && i < stones.length) await watchFor(bot, () => up(x), `the ripple stone at ${x} coming up`, 400);
    await must(bot, bot.jump('right', x), `to the ripple stone at ${x}`);
    dry(`the ripple stone at ${x}`);
  }
}

/** Climbs from where Tess stands on ladder column `col` up or down until her feet are on row `row` + 1's floor. */
export async function ladder(bot: StarterBot, col: number, dir: 'up' | 'down', row: number, what: string): Promise<void> {
  await must(bot, bot.walk(col, what), `onto ${what}`);
  await must(bot, bot.climb(dir, row, `${dir} ${what}`), `${dir} ${what}`);
}

/** 5. Nutmeg's Signposts: three switchbacks; at each fork, a look at the turning arrow, Nutmeg's stash, then the blazed way. */
export async function signposts(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const S = SIGNS_AT;
  const at = S.signs;
  const feet = (t: number) => FLOORS[t] - 1;
  const post = (t: number) => S.posts.filter(([, k]) => k === t).map(([x]) => x);
  // the bottom path, to the right
  await must(bot, bot.walk(at.turned + 1, 'the turned-signs spot'), 'to the turned-signs spot');
  await take(bot, post(0)[0], POINTS.blaze, 'a post');
  await must(bot, bot.walk(at.trust + 1, 'the trust spot'), 'to the trust spot');
  await take(bot, post(0)[1], POINTS.blaze, 'a post');
  await must(bot, bot.walk(S.pie[0], 'the pie'), 'to the pie');
  await must(bot, bot.walk(S.fork1.arrow - 1, 'the first signpost'), 'to the signpost');
  await must(bot, bot.wait(READ), 'watching the arrow turn');
  await readAt(bot, at.stash + 1, "Nutmeg's sign");
  for (const x of S.fork1.stash) await take(bot, x, POINTS.acorn, 'an acorn from the stash');
  await climbUp(bot, S.fork1.ladder, feet(1), 'the blazed ladder');
  // the middle path, to the left
  await readAt(bot, at.noon + 1, 'the noon sign');
  await take(bot, post(1)[0], POINTS.blaze, 'a post');
  await take(bot, post(1)[1], POINTS.blaze, 'a post');
  await must(bot, bot.walk(S.fork2.arrow + 1, 'the second signpost'), 'to the signpost');
  await must(bot, bot.wait(READ / 2), 'watching the arrow turn');
  await ladder(bot, S.fork2.nookLadder, 'up', feet(2), 'the ladder into the nook');
  for (const x of S.fork2.stash) await take(bot, x, POINTS.acorn, 'an acorn in the nook');
  await ladder(bot, S.fork2.nookLadder, 'down', feet(1), 'the ladder out of the nook');
  await ladder(bot, S.fork2.ladder, 'up', feet(2), 'the blazed ladder');
  // the top path, to the right
  await must(bot, bot.walk(at.top + 1, 'the nearly-there spot'), 'to the nearly-there spot');
  await take(bot, post(2)[0], POINTS.blaze, 'a post');
  await must(bot, bot.walk(S.fork3.arrow + 1, 'the third signpost'), 'to the signpost');
  await must(bot, bot.wait(READ / 2), 'watching the arrow turn');
  await ladder(bot, S.fork3.bad.ladder, 'up', FLOORS[2] - 6, 'the ladder to the left planks');
  for (const x of [...S.fork3.stash].reverse()) await take(bot, x, POINTS.acorn, 'an acorn on the planks');
  await ladder(bot, S.fork3.bad.ladder, 'down', feet(2), 'back down');
  await ladder(bot, S.fork3.good.ladder, 'up', FLOORS[2] - 6, 'the blazed ladder over the hedge');
  await must(bot, bot.walk(S.fork3.good.plank[1] + 2, 'over the hedge'), 'over the hedge');
  await must(bot, bot.land(), 'landing');
  await take(bot, post(2)[1], POINTS.blaze, 'a post');
  score(bot, from, 6 * POINTS.blaze + 6 * POINTS.acorn, 'level 5');
  await leave(bot, bot.walk(S.exit + 1, 'the exit'), 'the exit');
}

/** 6. The Empty Spot: down into the hollow, every sign read while the sun goes down, then the stars, then on. */
export async function emptySpot(bot: StarterBot): Promise<void> {
  const t0 = bot.sim.w.clock;
  const at = HOLLOW_AT.signs;
  await lookAt(bot, at.hole + 1, 'the hole view');
  await must(bot, bot.wait(READ / 2), 'a look at Nutmeg on the rim');
  await lookAt(bot, at.here + 1, 'the stood-here view');
  await lookAt(bot, at.puddles + 1, 'the puddles view');
  await readAt(bot, at.wisp + 1, 'the Wisp sign');
  await readAt(bot, at.gone + 1, 'the gone sign');
  await must(bot, bot.walk(HOLLOW_AT.puddles[5], 'the last puddle in the hollow'), 'along the puddles');
  await watchFor(bot, () => since(bot, t0) > STARS[2] + 60, 'the last stars coming out', 1400);
  await leave(bot, bot.walk(HOLLOW_AT.exit + 1, 'the exit'), 'the exit');
}

/** Holds an arrow key for `ticks` (a step into the wind, where walking to a spot would never land). */
export async function step(bot: StarterBot, dir: 'left' | 'right', ticks: number, what: string): Promise<void> {
  const key = dir === 'left' ? SCAN.left : SCAN.right;
  bot.sim.press(key);
  try {
    await must(bot, bot.wait(ticks), what);
  } finally {
    bot.sim.release(key);
  }
}

/** Steps into an updraft at column `x`, rides it up, and steps off onto the ledge to the right (feet on row `row` - 1). */
export async function rideUp(bot: StarterBot, x: number, row: number, what: string): Promise<void> {
  await must(bot, bot.walk(x - 1, what), `to ${what}`);
  await step(bot, 'right', 5, `into ${what}`);
  await watchFor(bot, () => bot.px.y / 20 <= row - 1.5, `riding ${what}`, 300);
  await must(bot, bot.walk(x + 2, `off ${what}`), `off ${what}`);
  await must(bot, bot.land(), 'landing');
  if (Math.round(bot.px.y / 20) !== row - 1) throw new Error(`${what}: not on the ledge (row ${bot.px.y / 20})`);
}

/** 7. Windy Ridge: up on the updraft, across on the gust, up again; every post blazed. */
export async function windyRidge(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const R = RIDGE_AT;
  const at = R.signs;
  const posts = R.posts.map(([x]) => x);
  await must(bot, bot.walk(at.puddles + 2, 'the puddles spot'), 'to the puddles spot');
  await take(bot, posts[0], POINTS.blaze, 'a post');
  await hop(bot, R.hole, 2, 'the deep print');
  await take(bot, posts[1], POINTS.blaze, 'a post');
  await must(bot, bot.walk(at.lift + 2, 'the lift spot'), 'to the lift spot');
  await rideUp(bot, R.lift1.x, LEDGES.mid, 'the first updraft');
  await must(bot, bot.walk(at.gust + 2, 'the gust spot'), 'to the gust spot');
  await take(bot, posts[2], POINTS.blaze, 'a post');
  await must(bot, bot.walk(R.mid[1], 'the edge'), 'to the edge');
  await must(bot, bot.wait(READ / 4), 'a breath at the edge');
  await step(bot, 'right', 6, 'into the gust');
  await watchFor(bot, () => bot.px.x / 20 >= R.mid2[0], 'the gust carrying Tess over', 200);
  await must(bot, bot.wait(20), 'landing after the gust');
  if (bot.px.x / 20 < R.mid2[0] || Math.round(bot.px.y / 20) !== LEDGES.mid - 1) throw new Error(`the gust left Tess at ${bot.px.x / 20}, ${bot.px.y / 20}`);
  await take(bot, posts[3], POINTS.blaze, 'a post');
  await must(bot, bot.walk(R.pie[0], 'the pie'), 'to the pie');
  await rideUp(bot, R.lift2.x, LEDGES.top, 'the second updraft');
  await take(bot, posts[4], POINTS.blaze, 'a post');
  await readAt(bot, at.town + 1, 'the town sign');
  await take(bot, posts[5], POINTS.blaze, 'a post');
  score(bot, from, 6 * POINTS.blaze, 'level 7');
  void G7;
  await leave(bot, bot.walk(R.exit + 1, 'the exit'), 'the exit');
}

/** 8. The Low Tunnel: in along the low road and back along the mill race, every lantern lit, a look up at the glow-worms, and Wisp found. */
export async function lowTunnel(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const T = TUNNEL_AT;
  const at = T.signs;
  const lower = T.lanterns.filter(([, k]) => k === 'lower').map(([x]) => x);
  const upper = T.lanterns.filter(([, k]) => k === 'upper').map(([x]) => x);
  await must(bot, bot.walk(at.dark + 1, 'the dark spot'), 'to the dark spot');
  await take(bot, lower[0], POINTS.lantern, 'a lantern');
  await readAt(bot, at.low + 2, 'the low sign');
  await take(bot, lower[1], POINTS.lantern, 'a lantern');
  await must(bot, bot.walk(at.worms + 1, 'the glow-worm spot'), 'to the glow-worm spot');
  await must(bot, bot.wait(READ), 'watching the glow-worms');
  for (const x of lower.slice(2)) await take(bot, x, POINTS.lantern, 'a lantern');
  await must(bot, bot.walk(at.race + 1, 'the mill race spot'), 'to the mill race spot');
  await must(bot, bot.walk(T.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', UPPER.floor - 1, 'up the ladder'), 'up the ladder');
  for (const x of upper) await take(bot, x, POINTS.lantern, 'a lantern on the mill race');
  await readAt(bot, at.wisp + 2, 'the Wisp sign');
  await must(bot, bot.walk(T.wisp + 1, 'Wisp'), 'to Wisp');
  await must(bot, bot.wait(READ), 'a moment with Wisp');
  score(bot, from, T.lanterns.length * POINTS.lantern, 'level 8');
  await leave(bot, bot.walk(T.exit - 1, 'the exit'), 'the exit');
}

/** 9. The Zigzag Home: five paths, a blaze on every turn, the ruts hopped, Wisp following behind. */
export async function zigzagHome(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const Z = ZIGZAG_AT;
  const at = Z.signs;
  const feet = (k: number) => ZFLOORS[k] - 1;
  /** One path: everything on it in the order Tess meets it, going `dir`. */
  const path = async (k: number, dir: 'left' | 'right', extra: [number, () => Promise<void>][]) => {
    const p = Z.paths[k];
    const stops: [number, () => Promise<void>][] = [
      ...p.posts.map((x): [number, () => Promise<void>] => [x, () => take(bot, x, POINTS.blaze, `a post on path ${k + 1}`)]),
      ...p.acorns.map((x): [number, () => Promise<void>] => [x, () => take(bot, x, POINTS.acorn, `an acorn on path ${k + 1}`)]),
      ...p.ruts.map((x): [number, () => Promise<void>] => [
        x + (dir === 'right' ? -0.5 : 2.5),
        () => (dir === 'right' ? hop(bot, x, 2, 'a rut') : hopLeft(bot, x, 2, 'a rut')),
      ]),
      ...extra,
    ];
    stops.sort((a, b) => (dir === 'right' ? a[0] - b[0] : b[0] - a[0]));
    for (const [, go] of stops) await go();
  };
  const up = (k: number) => async () => {
    const x = Z.ladders[k];
    await must(bot, bot.walk(x, 'the ladder'), 'onto the ladder');
    await must(bot, bot.climb('up', feet(k + 1), 'up the ladder'), 'up the ladder');
  };
  await path(0, 'right', [[at.follow + 1, () => readAt(bot, at.follow + 1, 'the follow sign')]]);
  await up(0)();
  await path(1, 'left', []);
  await up(1)();
  await path(2, 'right', [[Z.pie[1], async () => must(bot, bot.walk(Z.pie[1], 'the pie'), 'to the pie')]]);
  await up(2)();
  await path(3, 'left', []);
  await up(3)();
  await path(4, 'right', []);
  score(bot, from, 10 * POINTS.blaze + 6 * POINTS.acorn, 'level 9');
  await leave(bot, bot.walk(Z.exit + 1, 'the exit'), 'the exit');
}

/** 10. Summit Picnic: the doormat, up the steps, then watch the neighbors arrive and Wisp come home. */
export async function summitPicnic(bot: StarterBot): Promise<void> {
  const t0 = bot.sim.w.clock;
  const P = PICNIC_AT;
  const at = P.signs;
  await lookAt(bot, at.home + 1, 'the home view');
  await readAt(bot, at.mat + 1, 'the doormat sign');
  await must(bot, bot.walk(P.steps[0] - 1, 'the steps'), 'to the steps');
  await must(bot, bot.walk(P.top[0] + 1, 'up the steps'), 'up the steps');
  if (Math.round(bot.px.y / 20) !== TOP - 1) throw new Error(`not on top of the mountain (row ${bot.px.y / 20})`);
  const arrived = PICNIC.okoro0 + PICNIC_WALK.okoro.reduce((t, [dx, dy]) => t + Math.max(Math.abs(dx), Math.abs(dy)) * 20, 0);
  await watchFor(bot, () => since(bot, t0) > arrived + 60, 'the neighbors arriving for the picnic', 1600);
  await readAt(bot, at.end + 1, 'the last sign');
  await watchFor(bot, () => since(bot, t0) > WISP_HOME + 40, 'Wisp floating home', 1600);
  await must(bot, bot.wait(READ / 2), 'a last look');
  await leave(bot, bot.walk(P.exit, 'the picnic door'), 'the end');
}
