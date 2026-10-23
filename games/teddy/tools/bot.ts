// A play-testing bot for the headless simulator: walks Teddy along a route of simple
// orders (walk to a column hopping over whatever is in the way, hop, do a trick, wait) and
// records every key it presses, so a finished route is also a demo recording. On the way it
// hops for the treats it can see just ahead, as a player would (playLevel takes back a hop
// that spoils the route).
import type { RecordedKey } from '../../../web/src/formats/recording';
import { SOLTOP } from '../../../web/src/formats/blocks';
import { mapBlock, type CharInfo } from '../../../web/src/engine/world';
import { KEEPSAKE, SCAN } from '../src/ids';
import { Sim } from '../../kit/sceneSim';

export type Order =
  | {
      walk: number;
      hop?: number;
      maxTicks?: number;
      /** false: no hopping for treats on the way */ grab?: boolean;
      /** monsters to play dead under when one flies in close at Teddy's height */
      dodge?: string[];
    }
  | { hop: number; dir?: 'left' | 'right'; dirFor?: number; after?: number }
  | { trick: keyof typeof SCAN; hold?: number; after?: number }
  | { wait: number }
  | { face: 'left' | 'right' }
  | { until: string; maxTicks?: number; check: (s: Sim) => boolean };

export interface RunResult {
  ok: boolean;
  log: string[];
  keys: RecordedKey[];
  /** Cells of the treats it hopped for. */
  grabs: string[];
}

/**
 * Records key events with the tick gaps between them, as demo.rec stores them: a key
 * pressed between ticks t and t+1 is played back on tick t+1 (PLAYGAME's recorder counts
 * from 1). `offset` carries the tick count over from earlier levels.
 */
export class Recorder {
  keys: RecordedKey[] = [];
  private last: number;
  constructor(
    private sim: Sim,
    private offset = 0,
    last = 0,
  ) {
    this.last = last;
    sim.onKey = (k) => {
      const at = this.offset + this.sim.ticks + 1;
      this.keys.push({ delta: at - this.last, key: k });
      this.last = at;
    };
  }

  /** The tick of the last recorded key (to continue on the next level). */
  get lastTick(): number {
    return this.last;
  }

  /** Where the recording is now, to take back a tried move with rewind(). */
  mark(): [number, number] {
    return [this.keys.length, this.last];
  }

  rewind([n, last]: [number, number]): void {
    this.keys.length = n;
    this.last = last;
  }
}

/** A collectible background block (a treat, a bone), never the felt egg. */
function isLoot(sim: Sim, b: number): boolean {
  const k = sim.w.bg[b];
  if (b === KEEPSAKE || !k || k.touchBl === b) return false;
  return k.scorePts > 0 || k.chHitPt > 0 || (k.effect > 0 && k.eamt > 0);
}

/** Loot cells in sight a few steps ahead and up to four blocks up, not in `ban`. */
function lootNear(sim: Sim, dir: 'left' | 'right', ban: Set<string>): number[] {
  const { bx, by } = sim.pos;
  const w = sim.w;
  const step = dir === 'right' ? 1 : -1;
  const out: number[] = [];
  for (let d = -1; d <= 3; d++)
    for (let up = 1; up <= 4; up++) {
      const x = bx + d * step;
      const c = (by - up) * 100 + x;
      if (x >= 0 && x < 100 && isLoot(sim, w.map[c]) && !ban.has(`${x},${by - up}`)) out.push(c);
    }
  return out;
}

const HOLDS = [2, 3, 6, 10];

/**
 * Walking along (`key` held), Teddy sees a treat just ahead and up high: tries hopping for
 * it now (a few hop heights, each played a little ahead on the simulator and taken back)
 * and keeps the first hop that takes one without hurting him or leaving him up on a higher
 * perch, as a player grabs what they can see without leaving the path. Returns the hold
 * key, how long it is held and the cell taken, or undefined to walk on.
 */
async function tryGrab(sim: Sim, rec: Recorder, dir: 'left' | 'right', ban: Set<string>): Promise<{ key: number; hold: number; cell: string } | undefined> {
  const w = sim.w;
  const { bx, by } = sim.pos;
  if (sim.pos.y % 20 || !(w.bg[mapBlock(w, bx, by + 1)].solid & SOLTOP)) return undefined;
  const near = lootNear(sim, dir, ban);
  if (!near.length) return undefined;
  const snap = sim.snapshot();
  const at = rec.mark();
  const hp = w.ci.hitpts;
  let found: { key: number; hold: number; cell: string } | undefined;
  // straight up, or up and along at once (E / Q)
  trials: for (const key of [SCAN.up, dir === 'right' ? SCAN.e : SCAN.q]) {
    for (const hold of HOLDS) {
      sim.press(key);
      for (let i = 0; i < hold; i++) await sim.tick();
      sim.release(key);
      for (let i = 0; i < 24 && !sim.dead && sim.link < 0; i++) await sim.tick();
      const got = near.find((c) => !isLoot(sim, w.map[c]));
      const fine = !sim.dead && w.ci.hitpts >= hp && sim.pos.by >= by && sim.pos.y % 20 === 0;
      sim.restore(snap);
      rec.rewind(at);
      if (got !== undefined && fine) {
        found = { key, hold, cell: `${got % 100},${Math.floor(got / 100)}` };
        break trials;
      }
    }
  }
  return found;
}

/** Plays `route`; `ban` lists treats not to hop for (false: none at all, as the title demo plays). */
export async function runRoute(sim: Sim, route: Order[], label = '', rec = new Recorder(sim), ban: Set<string> | false = new Set()): Promise<RunResult> {
  const grabs: string[] = [];
  const log: string[] = [];
  const say = (s: string) => log.push(`${label}${s} @${sim.pos.bx},${sim.pos.by} t${sim.ticks} hp${sim.w.ci.hitpts}`);
  const tick = async (n = 1) => {
    for (let i = 0; i < n && !sim.dead && sim.link < 0; i++) await sim.tick();
  };
  for (const o of route) {
    if (sim.dead || sim.link >= 0) break;
    if ('walk' in o) {
      const dir = o.walk > sim.pos.bx ? 'right' : 'left';
      const key = SCAN[dir];
      const goal = o.walk * 20;
      const done = () => (dir === 'right' ? sim.pos.x >= goal : sim.pos.x <= goal);
      sim.press(key);
      let stuck = 0;
      let lastX = sim.pos.x;
      let t = 0;
      const incoming = () =>
        (o.dodge ?? []).some((n) =>
          sim
            .monsters(n)
            .some(
              (m) =>
                m.y === sim.pos.by &&
                (dir === 'right' ? m.x - sim.pos.bx : sim.pos.bx - m.x) >= 0 &&
                (dir === 'right' ? m.x - sim.pos.bx : sim.pos.bx - m.x) <= 2,
            ),
        );
      while (!done() && t++ < (o.maxTicks ?? 600) && !sim.dead && sim.link < 0) {
        if (incoming()) {
          // something flying in at head height: flop down until it has gone over
          sim.release(key);
          sim.press(SCAN.dead);
          let n = 0;
          while (incoming() && n++ < 60) await tick();
          await tick(2);
          sim.release(SCAN.dead);
          await tick(2);
          say('played dead under it');
          sim.press(key);
          continue;
        }
        const grab = o.grab === false || ban === false ? undefined : await tryGrab(sim, rec, dir, ban);
        if (grab) {
          grabs.push(grab.cell);
          say(`hops for the treat at ${grab.cell}`);
          sim.press(grab.key);
          await tick(grab.hold);
          sim.release(grab.key);
          await tick(2);
          continue;
        }
        await tick();
        stuck = sim.pos.x === lastX ? stuck + 1 : 0;
        lastX = sim.pos.x;
        if (stuck >= 2) {
          // blocked: hop while still pushing (Up wins the key stack), then let go of Up
          sim.press(SCAN.up);
          await tick(o.hop ?? 8);
          sim.release(SCAN.up);
          await tick(2);
          stuck = 0;
        }
      }
      sim.release(key);
      await tick(1);
      if (!done() && sim.link < 0) {
        say(`FAILED to walk to ${o.walk}`);
        return { ok: false, log, keys: rec.keys, grabs };
      }
      say(`walked to ${o.walk}`);
    } else if ('hop' in o) {
      if (o.dir) sim.press(SCAN[o.dir]);
      if (o.dir) await tick(1);
      sim.press(SCAN.up);
      await tick(o.hop);
      sim.release(SCAN.up);
      if (o.dir) {
        await tick(o.dirFor ?? 6);
        sim.release(SCAN[o.dir]);
      }
      await tick(o.after ?? 10);
      say(`hopped ${o.hop}${o.dir ? ' ' + o.dir : ''}`);
    } else if ('trick' in o) {
      sim.press(SCAN[o.trick]);
      await tick(o.hold ?? 2);
      sim.release(SCAN[o.trick]);
      await tick(o.after ?? 16);
      say(`did ${o.trick}`);
    } else if ('wait' in o) {
      await tick(o.wait);
    } else if ('face' in o) {
      sim.press(SCAN[o.face]);
      await tick(1);
      sim.release(SCAN[o.face]);
      await tick(3);
    } else if ('until' in o) {
      let t = 0;
      while (!o.check(sim) && t++ < (o.maxTicks ?? 300) && !sim.dead && sim.link < 0) await tick();
      if (!o.check(sim) && sim.link < 0) {
        say(`FAILED: ${o.until}`);
        return { ok: false, log, keys: rec.keys, grabs };
      }
      say(o.until);
    }
  }
  return { ok: sim.link >= 0 && !sim.dead, log, keys: rec.keys, grabs };
}

/**
 * Plays a level's route, hopping for treats on the way; when a hop spoils the route (Teddy
 * ends up on a roof, misses a cue), the level is played again from its start without that
 * treat, latest first, until the route works (the simulator is deterministic). `make`
 * builds the level's Sim and Recorder afresh around a copy of the character's info; the
 * copy that finished is returned for the next level.
 */
export async function playLevel(
  make: (ci: CharInfo) => { sim: Sim; rec: Recorder },
  route: Order[],
  label: string,
  ci: CharInfo,
): Promise<RunResult & { sim: Sim; rec: Recorder; ci: CharInfo }> {
  const ban = new Set<string>();
  for (;;) {
    const mine = structuredClone(ci);
    const { sim, rec } = make(mine);
    const r = await runRoute(sim, route, label, rec, ban);
    const fresh = r.grabs.filter((g) => !ban.has(g));
    if (r.ok || !fresh.length) return { ...r, sim, rec, ci: mine };
    ban.add(fresh[fresh.length - 1]);
  }
}
