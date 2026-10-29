// Plays one of the level check's moves (inputs.ts) on a scene sim: hold its keys step by step
// until each step's end, then let go and wait for the hero to come to rest. The explorer plays
// moves through it, and a walkthrough replays a found path through it tick for tick, so both
// press the same keys at the same ticks.
import { BLEN, SOLTOP } from '../../formats/blocks';
import { MLEN, MWID } from '../../formats/map';
import type { World } from '../../engine/world';
import type { Move } from './inputs';
import type { SceneSim } from './sim';

/** What a tick ended in: a death, a link taken (its index), or nothing. */
export type Outcome = 'dead' | number | undefined;

interface DriveHooks {
  /** One game tick, with whatever the caller watches for. */
  tick(): Promise<Outcome>;
  /** The hero is being carried (a lift) and has gone on a while: a place on the way. */
  carried?(): void;
  /** Stop after this many ticks of the move (a replay to a place found partway). */
  limit?: number;
}

/**
 * The hero is in the air over safe footing in a column he didn't start in: straight below, the
 * first thing in the columns he covers is the top of a solid block under his middle, and nothing
 * that hurts. Let go here, he drops onto it. (Landing half on an edge, PLAYGAME slides him to the
 * side his middle is over, MoveCharGrav, so the footing must be under his middle.)
 */
export function overLanding(w: World, startCols: readonly number[]): boolean {
  const c = w.chr;
  const cols = colsOf(w);
  const mid = c.x[1] >= BLEN / 2 ? cols[cols.length - 1] : cols[0];
  if (startCols.includes(mid)) return false;
  const top = c.y[0] + (c.y[1] > 0 ? 2 : 1);
  for (let dy = 0; dy < 10; dy++) {
    const y = (top + dy) % MWID;
    let hit = false;
    for (const x of cols) {
      const b = w.bg[w.blkmap[w.map[y * MLEN + x]] ?? 0];
      if (!b) continue;
      if (b.chHitPt < 0) return false;
      if (b.solid & SOLTOP) {
        if (x !== mid) return false;
        hit = true;
      }
    }
    if (hit) return true;
  }
  return false;
}

/** The map columns the hero covers. */
const colsOf = (w: World) => (w.chr.x[1] > 0 ? [w.chr.x[0] % MLEN, (w.chr.x[0] + 1) % MLEN] : [w.chr.x[0] % MLEN]);

/** Plays the move; returns how it ended and how many ticks it took. */
export async function driveMove(sim: SceneSim, m: Move, h: DriveHooks): Promise<{ end: Outcome | 'limit'; ticks: number }> {
  const w = sim.w;
  const cellOf = () => w.chr.y[0] * 100 + w.chr.x[0];
  let ticks = 0;
  const limit = h.limit ?? Infinity;
  const go = async (): Promise<Outcome | 'limit'> => {
    if (ticks >= limit) return 'limit';
    ticks++;
    return h.tick();
  };
  for (const s of m.steps) {
    sim.hold(s.keys);
    const cell = cellOf();
    const startCols = colsOf(w);
    const startY = sim.px.y;
    let airborne = false;
    for (let t = 0; t < s.max; t++) {
      const r = await go();
      if (r !== undefined) return { end: r, ticks };
      if (w.ci.gravy !== 0) airborne = true;
      if (t + 1 < (s.min ?? 0)) continue;
      if (s.until === 'cell' && cellOf() !== cell) break;
      if (s.until === 'over' && ((sim.px.y < startY && overLanding(w, startCols)) || (airborne && w.ci.gravy === 0 && t > 1))) break;
      // landed again, or never left the ground
      if (s.until === 'land' && w.ci.gravy === 0 && (airborne ? t > 1 : t >= 4)) break;
    }
  }
  // let go and settle; a hero carried along (a lift) is dropped off at places on the way
  sim.hold([]);
  let last = sim.px;
  let still = 0;
  let carried = 0;
  let sameCell = 0;
  let cell = cellOf();
  for (let t = 0; t < 90; t++) {
    const r = await go();
    if (r !== undefined) return { end: r, ticks };
    const p = sim.px;
    const resting = w.ci.gravx === 0 && w.ci.gravy === 0 && p.x === last.x && p.y === last.y && (w.chr.cseq === 0 || w.curkey === 0);
    // steady hands wait a while after letting go before the next key
    if (resting) {
      if (++still >= 2 && t + 1 >= (m.settle ?? 0)) break;
    } else still = 0;
    // bobbing in one cell (an updraft, water) is as still as the hero gets there
    if (cellOf() === cell) {
      if (++sameCell >= 18 && t + 1 >= (m.settle ?? 0)) break;
    } else {
      sameCell = 0;
      cell = cellOf();
    }
    if (w.ci.gravy === 0 && (p.x !== last.x || p.y !== last.y) && ++carried % 9 === 0) h.carried?.();
    last = p;
  }
  return { end: undefined, ticks };
}
