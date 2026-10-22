// The sled run down Jamie Street: every few ticks the bot tries each key (or none) a few
// moves deep on snapshots of the game and keeps the one that goes farthest down the hill
// without hitting a tree or a rock, picking up the dollars it can on the way (and steering
// a little toward one it sees coming).
import { BLOCK, SCAN, type Bot } from './bot';

const ACTIONS = [0, SCAN.down, SCAN.left, SCAN.right, SCAN.up] as const;
const STEP = 3;
const DEPTH = 3;
const BILL = BLOCK.get('slopeBill')!;
/** How much a dollar ahead pulls the sled toward it. */
const LURE = 40;
/** How many columns to either side a dollar can lure the sled from. */
const REACH = 4;

export async function sledRun(bot: Bot, maxTicks = 3000): Promise<string | undefined> {
  const { sim } = bot;
  let held = 0;
  const hold = (k: number) => {
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
    const p = sim.pos;
    return p.y * 20 + p.sy + 40 * (sim.money - money0) - 30 * (hp0 - sim.ci.hitpts) - danger() + sim.ci.gravy + lure();
  };
  /** A dollar a little way down the hill, near enough in line to steer for (as a player would). */
  const lure = () => {
    const p = sim.pos;
    const px = p.x * 20 + p.sx;
    let best = 0;
    for (let dy = 1; dy <= 10; dy++)
      for (let dx = -REACH; dx <= REACH; dx++) {
        if (sim.blockAt(p.x + dx, p.y + dy) !== BILL) continue;
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
  /** Trees and rocks straight ahead of the sled, the nearer the worse. */
  const danger = () => {
    const p = sim.pos;
    const cols = p.sx ? [p.x, p.x + 1] : [p.x];
    let d = 0;
    for (let dy = 1; dy <= 8; dy++) for (const x of cols) if (sim.solidAt(x, p.y + dy)) d += 200 / dy;
    return d;
  };
  const start = sim.ticks;
  while (sim.ticks - start < maxTicks) {
    const snap = sim.snapshot();
    const heldNow = held;
    const hp0 = sim.ci.hitpts;
    const money0 = sim.money;
    let best = -Infinity;
    let pick: number = 0;
    for (const k of ACTIONS) {
      sim.restore(snap);
      held = heldNow;
      const r = await play(k);
      const now = value(r, hp0, money0);
      const v = r ? now * DEPTH : now + (await search(DEPTH - 1, hp0, money0));
      if (v > best) {
        best = v;
        pick = k;
      }
    }
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
