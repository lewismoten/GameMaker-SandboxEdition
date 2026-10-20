// A play-testing bot for the headless simulator: walks Teddy along a route of simple
// orders (walk to a column hopping over whatever is in the way, hop, do a trick, wait) and
// records every key it presses, so a finished route is also a demo recording.
import type { RecordedKey } from '../../web/src/formats/recording';
import { SCAN } from './ids';
import { Sim } from './sim';

export type Order =
  | { walk: number; hop?: number; maxTicks?: number }
  | { hop: number; dir?: 'left' | 'right'; dirFor?: number; after?: number }
  | { trick: keyof typeof SCAN; hold?: number; after?: number }
  | { wait: number }
  | { face: 'left' | 'right' }
  | { until: string; maxTicks?: number; check: (s: Sim) => boolean };

export interface RunResult {
  ok: boolean;
  log: string[];
  keys: RecordedKey[];
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
}

export async function runRoute(sim: Sim, route: Order[], label = '', rec = new Recorder(sim)): Promise<RunResult> {
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
      while (!done() && t++ < (o.maxTicks ?? 600) && !sim.dead && sim.link < 0) {
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
        return { ok: false, log, keys: rec.keys };
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
        return { ok: false, log, keys: rec.keys };
      }
      say(o.until);
    }
  }
  return { ok: sim.link >= 0 && !sim.dead, log, keys: rec.keys };
}
