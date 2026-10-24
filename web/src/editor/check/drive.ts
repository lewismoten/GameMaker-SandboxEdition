// Plays one of the level check's moves (inputs.ts) on a scene sim: hold its keys step by step
// until each step's end, then let go and wait for the hero to come to rest. The explorer plays
// moves through it, and a walkthrough replays a found path through it tick for tick, so both
// press the same keys at the same ticks.
import type { Move } from './inputs';
import type { SceneSim } from './sim';

/** What a tick ended in: a death, a link taken (its index), or nothing. */
export type Outcome = 'dead' | number | undefined;

export interface DriveHooks {
  /** One game tick, with whatever the caller watches for. */
  tick(): Promise<Outcome>;
  /** The hero is being carried (a lift) and has gone on a while: a place on the way. */
  carried?(): void;
  /** Stop after this many ticks of the move (a replay to a place found partway). */
  limit?: number;
}

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
    let airborne = false;
    for (let t = 0; t < s.max; t++) {
      const r = await go();
      if (r !== undefined) return { end: r, ticks };
      if (w.ci.gravy !== 0) airborne = true;
      if (s.until === 'cell' && cellOf() !== cell) break;
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
    if (resting) {
      if (++still >= 2) break;
    } else still = 0;
    // bobbing in one cell (an updraft, water) is as still as the hero gets there
    if (cellOf() === cell) {
      if (++sameCell >= 18) break;
    } else {
      sameCell = 0;
      cell = cellOf();
    }
    if (w.ci.gravy === 0 && (p.x !== last.x || p.y !== last.y) && ++carried % 9 === 0) h.carried?.();
    last = p;
  }
  return { end: undefined, ticks };
}
