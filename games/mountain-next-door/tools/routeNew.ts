// The way through the three levels added to the middle of the game (routeLate.ts has the ones before): Gathering Mist,
// Excuse Me and The Ford. The same human orders: read every sign, take every treasure, wait for anything on a clock
// (the mist steps, the yard gates, the river's waves) and listen to the mountain say its line to the end.
import type { StarterBot } from '../../kit/starter/bot';
import { STREET_AT, STREET_ROWS, type Street } from '../src/levels/excuse';
import { FORD_AT, G9, GU } from '../src/levels/ford';
import { DELLS, G8, MIST_AT, floorOf, stepOf } from '../src/levels/mist';
import { FORD_RINGS, POINTS } from '../src/props';
import { blocks, step, take } from './route';
import { waitUp } from './routeLate';
import { READ, leave, must, readAt, score, shownAt, watchFor } from './routeKit';

/** What a stop on the way is: a column to walk to and the order to carry out there. */
type Stop = [number, () => Promise<void>];

/** Runs the stops from left to right. */
async function inOrder(stops: Stop[]): Promise<void> {
  stops.sort((a, b) => a[0] - b[0]);
  for (const [, go] of stops) await go();
}

/** 7. Gathering Mist: the rim's beads, and in each dell its floor's beads, then up the mist steps (waiting for the first to come up) taking a bead or two on the way. */
export async function gatheringMist(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const A = MIST_AT;
  const at = A.signs;
  const bead = (x: number, what: string) => take(bot, x, POINTS.bead, `${what} at ${x}`);
  const stops: Stop[] = [
    [at.weather, () => readAt(bot, at.weather + 1, 'the mist sign')],
    [at.steps, () => readAt(bot, at.steps + 1, 'the steps sign')],
    [at.deeper, () => readAt(bot, at.deeper + 1, 'the deeper dell sign')],
    [at.wisp, () => readAt(bot, at.wisp + 1, 'the Wisp sign')],
    ...A.rimBeads.map((x): Stop => [x, () => bead(x, 'a bead on the rim')]),
  ];
  DELLS.forEach((d, i) => {
    const feet = floorOf(d) - 1;
    stops.push([
      d.a,
      async () => {
        // off the rim and down into the dell, along its floor taking the beads, and to the foot of the steps
        await must(bot, bot.walk(d.a + 1, 'into the dell'), 'into the dell');
        await must(bot, bot.land(), 'landing in the dell');
        if (Math.round(bot.px.y / 20) !== feet) throw new Error(`dell ${i + 1}: not on the floor (row ${bot.px.y / 20})`);
        for (const x of A.floorBeads[i]) await bead(x, 'a bead on the floor');
        const s0 = stepOf(d, 0);
        await must(bot, bot.walk(s0.x[0] - 2, 'the foot of the steps'), 'to the foot of the steps');
        await must(bot, bot.wait(READ / 2), 'a look up the steps');
        for (let k = 0; k < d.depth - 1; k++) {
          const { x, row } = stepOf(d, k);
          await waitUp(bot, 'mist', `mist${k}u`, x[0], row, k === 0, `mist step ${k + 1}`);
          await must(bot, bot.jump('right', x[0]), `onto mist step ${k + 1}`);
          if (Math.round(bot.px.y / 20) !== row - 1) throw new Error(`dell ${i + 1}: missed mist step ${k + 1} (row ${bot.px.y / 20}, wanted ${row - 1})`);
          await must(bot, bot.walk(x[1], `across mist step ${k + 1}`), `across mist step ${k + 1}`);
        }
        // the last step is level with the rim: walk off it onto the grass
        await must(bot, bot.walk(d.b + 1, 'out of the dell'), 'out of the dell');
        if (Math.round(bot.px.y / 20) !== G8 - 1) throw new Error(`dell ${i + 1}: not back on the rim (row ${bot.px.y / 20})`);
      },
    ]);
  });
  await inOrder(stops);
  score(bot, from, (A.rimBeads.length + A.floorBeads.flat().length + A.stepBeads.flat().length) * POINTS.bead, 'gathering mist');
  await leave(bot, bot.walk(A.exit + 1, 'the exit'), 'the exit');
}

/** 14. Excuse Me: along the street and then back along the lane above, clearing what stands in the mountain's way, waiting for each gate to swing open, and hearing it say its line. */
export async function excuseMe(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const A = STREET_AT;
  const at = A.signs;
  const book = blocks('excuse');
  let cleared = 0;
  let want = 0;
  /** One street: `dir` 1 walks it rightward on ground row `g`, -1 leftward; `signs` are [column, what] to read on the way. */
  const street = async (st: Street, g: number, dir: 1 | -1, signs: [number, string][]) => {
    const stops: Stop[] = [
      ...signs.map(([x, what]): Stop => [x, () => readAt(bot, x + 1, what)]),
      ...st.posts.map((x): Stop => [x, () => take(bot, x, POINTS.blaze, `a lamp post at ${x}`)]),
      ...st.acorns.map((x): Stop => [x, () => take(bot, x, POINTS.acorn, `an acorn at ${x}`)]),
    ];
    want += st.posts.length * POINTS.blaze + st.acorns.length * POINTS.acorn;
    if (st.pie) {
      const pie = st.pie;
      stops.push([pie, () => must(bot, bot.walk(pie, 'the pie'), 'to the pie')]);
    }
    for (const o of st.obstacles) {
      // the stop is two blocks before it, on the side Tess comes from
      stops.push([
        o.x - 2 * dir,
        async () => {
          if (o.kind === 'gate') {
            const open = book.n('swingOpen1');
            const isOpen = () => shownAt(bot, o.x, g - 1) === open;
            await must(bot, bot.walk(o.x - dir, 'the yard gate'), 'to the yard gate');
            if (isOpen()) await watchFor(bot, () => !isOpen(), 'the yard gate swinging shut', 400);
            await watchFor(bot, isOpen, 'the yard gate swinging open', 400);
            await must(bot, bot.walk(o.x + 2 * dir, 'through the yard gate'), 'through the yard gate');
          } else {
            const before = bot.sim.ci.score;
            await must(bot, bot.walk(o.x - dir, 'what is in the way'), 'to what is in the way');
            await must(bot, bot.wait(READ / 4), 'a look at what is in the way');
            await must(bot, bot.walk(o.x + 2 * dir, 'through what was in the way'), 'through what was in the way');
            score(bot, before, 2 * POINTS.clear, `clearing the ${o.kind} at ${o.x}`);
            want += 2 * POINTS.clear;
            cleared++;
            if (o.kind === 'bins') {
              if (!bot.sim.clipTicksLeft) throw new Error('the mountain said nothing as Tess went through the bins');
              await must(bot, bot.sim.waitForClip(), 'the mountain saying excuse me');
            }
          }
        },
      ]);
    }
    stops.sort((x, y) => (x[0] - y[0]) * dir);
    for (const [, go] of stops) await go();
  };
  await street(A.low, STREET_ROWS.low, 1, [
    [at.quiet, 'the quiet hours sign'],
    [at.gate, 'the gate sign'],
    [at.hale, "Mr. Hale's sign"],
  ]);
  // up the ladder at the end of the street to the lane
  await must(bot, bot.walk(A.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', STREET_ROWS.up - 1, 'up the ladder'), 'up the ladder');
  await street(A.up, STREET_ROWS.up, -1, [[at.ford, 'the ford sign']]);
  if (cleared !== 5) throw new Error(`cleared ${cleared} obstacles, not 5`);
  score(bot, from, want, 'excuse me');
  await leave(bot, bot.walk(A.exit - 1, 'the exit'), 'the exit');
}

/**
 * 15. The Ford: five reaches, each crossed by waiting on the bank for the swell to come up leaning the right way and
 * stepping in; the islands' posts and acorns taken between. Then the ladder up to the upper ford, and four more
 * reaches crossed leftward (a quick wave, one that leans right first, one in between), its posts and acorns taken, to the door.
 */
export async function theFord(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const A = FORD_AT;
  const U = A.upper;
  const at = A.signs;
  const book = blocks('ford');
  /** Crosses reach `x0` of ring `ring`: right (`dir` 1) from the bank before it, or left (-1) from the bank after it. */
  const wave = async (x0: number, ring: number, dir: 1 | -1, row: number, what: string) => {
    const x1 = x0 + A.width - 1;
    // the swell's first picture in the direction wanted (states 1 and 2 are the ring's first way, 3 and 4 the other)
    const first = FORD_RINGS[ring].dirs[0] === dir ? 1 : 3;
    const ready = book.n(`f${ring}_${first}`);
    const bank = dir > 0 ? x0 - 1 : x1 + 1;
    await must(bot, bot.walk(bank, `the bank before ${what}`), `to the bank before ${what}`);
    await watchFor(bot, () => shownAt(bot, x0, row - 1) === ready, `the wave at ${what} leaning ${dir > 0 ? 'right' : 'left'}`, 700);
    await step(bot, dir > 0 ? 'right' : 'left', 6, `into the wave at ${what}`);
    const over = () => (dir > 0 ? bot.px.x / 20 >= x1 + 1 : bot.px.x / 20 <= x0 - 1);
    await watchFor(bot, over, `the wave carrying Tess over ${what}`, 300);
    await must(bot, bot.wait(30), 'landing on the far bank');
    if (!over() || Math.round(bot.px.y / 20) !== row - 1) throw new Error(`${what} left Tess at ${bot.px.x / 20}, ${bot.px.y / 20}`);
  };
  const walkTo = (x: number): Stop => [x, () => must(bot, bot.walk(x, 'a post or an acorn'), `to ${x}`)];
  const lower: Stop[] = [
    [at.ford, () => readAt(bot, at.ford + 1, 'the ford sign')],
    [at.wrong, () => readAt(bot, at.wrong + 1, 'the wrong way sign')],
    // (a wave may carry Tess over one of these as she lands, so they are checked by the level's total)
    ...[...A.posts, ...A.acorns].map(walkTo),
    [A.pie, () => must(bot, bot.walk(A.pie, 'the pie'), 'to the pie')],
    ...A.reaches.map((x0, k): Stop => [x0 - 1.5, () => wave(x0, k, 1, G9, `reach ${k + 1}`)]),
  ];
  await inOrder(lower);
  // up the ladder to the upper ford
  await must(bot, bot.walk(A.ladder - 1, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(A.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', GU - 1, 'up the ladder'), 'up the ladder');
  await must(bot, bot.walk(U.right, 'off the ladder'), 'off the ladder');
  const upper: Stop[] = [
    [at.upper, () => readAt(bot, at.upper + 1, 'the upper ford sign')],
    [at.almost, () => readAt(bot, at.almost + 1, 'the last sign')],
    ...[...U.posts, ...U.acorns].map(walkTo),
    [U.pie, () => must(bot, bot.walk(U.pie, 'the pie'), 'to the pie')],
    ...U.reaches.map((x0, k): Stop => [x0 + A.width + 0.5, () => wave(x0, U.rings[k], -1, GU, `upper reach ${k + 1}`)]),
  ];
  upper.sort((a, b) => b[0] - a[0]);
  for (const [, go] of upper) await go();
  score(bot, from, (A.posts.length + U.posts.length) * POINTS.blaze + (A.acorns.length + U.acorns.length) * POINTS.acorn, 'the ford');
  await leave(bot, bot.walk(A.exit - 1, 'the exit'), 'the exit');
}
