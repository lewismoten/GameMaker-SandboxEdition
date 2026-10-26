// The sled run down Jamie Street: every few ticks the bot tries each key (or none) a few
// moves deep on snapshots of the game and keeps the one that goes farthest down the hill
// without hitting a tree or a rock, picking up the dollars it can on the way (and steering
// a little toward one it sees coming). The run slants round the map's wrap (src/levels/slant.ts),
// so how far down the hill the sled is comes from the run's own rows, not the map's, and like a
// player it looks down the run for a clear lane and steers for it well before it gets there.
import { BLOCK, SCAN, type Bot } from './bot';
import { RISE, WIDTH, cellAt, runAt } from '../src/levels/slant';

const ACTIONS = [0, SCAN.down, SCAN.left, SCAN.right, SCAN.up] as const;
const STEP = 3;
const DEPTH = 3;
const BILL = BLOCK.get('slopeBill')!;
/** How much a dollar ahead pulls the sled toward it. */
const LURE = 40;
/** How many columns to either side a dollar can lure the sled from. */
const REACH = 4;
/** How far down the run the bot looks for a clear lane, in rows. */
const AHEAD = 12;
/** How much being off the clear lane costs, per block. */
const LANE = 30;
/** How much better another key must look to let go of the one held: steady hands, as a player's. */
const STEADY = 8;

const wrap = (n: number) => ((n % 100) + 100) % 100;

/** Where the sled is on the run: its row u (and pixels sy into it) and how far across, c, in blocks along the slant. */
function onRun(p: { x: number; y: number; sx: number; sy: number }): { u: number; sy: number; c: number } {
  for (let lap = 0; lap < 3; lap++) {
    const { u, i } = runAt(p.x, p.y, lap);
    if (i < WIDTH) return { u, sy: p.sy, c: i + p.sx / 20 - ((u % RISE) + p.sy / 20) / RISE };
  }
  return { u: 0, sy: 0, c: 0 };
}

export async function sledRun(bot: Bot, maxTicks = 3000): Promise<string | undefined> {
  const { sim } = bot;
  const blockAt = (x: number, y: number) => sim.blockAt(wrap(x), wrap(y));
  const solidAt = (x: number, y: number) => sim.solidAt(wrap(x), wrap(y));
  let held = 0;
  const hold = (k: number) => {
    // a push is one shove per press, so pushing again means letting go and tapping again
    if (k === held && k === SCAN.down) {
      sim.release(k);
      held = 0;
    }
    if (k === held) return;
    if (held) sim.release(held);
    if (k) sim.press(k);
    held = k;
  };
  /** Plays `k` for STEP ticks; returns a scene event. */
  const play = async (k: number): Promise<string | undefined> => {
    hold(k);
    for (let i = 0; i < STEP; i++) {
      const r = await sim.tick();
      if (r) return r;
    }
    return undefined;
  };
  const value = (r: string | undefined, hp0: number, money0: number) => {
    if (r === 'dead' || r === 'end') return -1e9;
    if (r === 'link') return 1e6 - sim.ticks;
    const at = onRun(sim.pos);
    return at.u * 20 + at.sy + 40 * (sim.money - money0) - 30 * (hp0 - sim.ci.hitpts) - danger() + sim.ci.gravy + lure() - LANE * Math.abs(at.c - lane);
  };
  /** The lane (a column of the run) to make for: clear the furthest down the run, and then the nearest. */
  let lane = 0;
  const pickLane = () => {
    const { u, c } = onRun(sim.pos);
    let best = -Infinity;
    for (let i = 1; i < WIDTH - 1; i++) {
      let clear = 0;
      while (clear < AHEAD && !solidAt(...cellAt(u + clear + 1, i))) clear++;
      const score = clear * 10 - Math.abs(i - c) * 3;
      if (score > best) ((best = score), (lane = i));
    }
  };
  /** A dollar a little way down the hill, near enough in line to steer for (as a player would). */
  const lure = () => {
    const p = sim.pos;
    const px = p.x * 20 + p.sx;
    let best = 0;
    for (let dy = 1; dy <= 10; dy++)
      for (let dx = -REACH; dx <= REACH; dx++) {
        if (blockAt(p.x + dx, p.y + dy) !== BILL) continue;
        const off = Math.abs((p.x + dx) * 20 - px) / 20;
        best = Math.max(best, LURE * (1 - off / (REACH + 1)) * (1 - dy / 12));
      }
    return best;
  };
  const search = async (depth: number, hp0: number, money0: number): Promise<number> => {
    let best = -Infinity;
    const snap = sim.snapshot();
    const heldNow = held;
    for (const k of ACTIONS) {
      sim.restore(snap);
      held = heldNow;
      const r = await play(k);
      // every step counts, so getting down the hill sooner beats putting a turn off
      const now = value(r, hp0, money0);
      const v = r || depth === 1 ? now * depth : now + (await search(depth - 1, hp0, money0));
      if (v > best) best = v;
    }
    sim.restore(snap);
    held = heldNow;
    return best;
  };
  /** Trees and rocks ahead of the sled down the run, the nearer the worse. */
  const danger = () => {
    const { u, c } = onRun(sim.pos);
    const i = Math.floor(c);
    const cols = c - i > 0.1 ? [i, i + 1] : [i];
    let d = 0;
    for (let dy = 1; dy <= 8; dy++) for (const x of cols) if (solidAt(...cellAt(u + dy, x))) d += 200 / dy;
    return d;
  };
  const start = sim.ticks;
  while (sim.ticks - start < maxTicks) {
    pickLane();
    const snap = sim.snapshot();
    const heldNow = held;
    const hp0 = sim.ci.hitpts;
    const money0 = sim.money;
    let best = -Infinity;
    let pick: number = 0;
    let keep = -Infinity;
    for (const k of ACTIONS) {
      sim.restore(snap);
      held = heldNow;
      const r = await play(k);
      const now = value(r, hp0, money0);
      const v = r ? now * DEPTH : now + (await search(DEPTH - 1, hp0, money0));
      if (k === heldNow) keep = v;
      if (v > best) {
        best = v;
        pick = k;
      }
    }
    // keep a steer (or letting go) unless another key is clearly better
    if (heldNow !== SCAN.down && keep >= best - STEADY) pick = heldNow;
    sim.restore(snap);
    held = heldNow;
    const r = await play(pick);
    if (r) {
      if (held) sim.releaseAll();
      held = 0;
      bot.say(`sled run: ${r}`);
      return r;
    }
  }
  bot.say('sled run: out of time');
  return undefined;
}
