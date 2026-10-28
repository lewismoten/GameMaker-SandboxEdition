// Plays a path the level check's explorer found again from the scene's start (or from a place
// reached before), every monster moving as the engine does, keeping the keys it pressed tick by
// tick: what autoWalk and its key fetcher (fetchKeys.ts) put in the walkthrough.
import type { CharInfo, World } from '../../../engine/world';
import type { Game } from '../../../formats/game';
import { driveMove, type Outcome } from '../drive';
import type { Entry, Exploration, Via } from '../explore';
import type { Move } from '../inputs';
import { SceneSim, type FileSource, type Snap } from '../sim';
import { footCell } from './walkPaths';
import type { RouteFit } from './pathRoute';

/** The places from the start to `id`, by the moves that reached each. */
export function pathTo(ex: Exploration, via: Via): Via[] {
  const out: Via[] = [via];
  for (let p = via.parent; ex.places[p]?.via; p = ex.places[p].via!.parent) out.unshift(ex.places[p].via!);
  return out;
}

export interface Replay {
  /** The link taken (-1: the path ended at a place in the scene, kept in `snap`). */
  link: number;
  snap?: Snap;
  events: { tick: number; key: number }[];
  ticks: number;
  ci: CharInfo;
  clock: number;
  world: World;
  /** How much of its walking was on the walking paths (none measured when none were given). */
  fit?: RouteFit;
}

/** Plays a found path again from the scene's start (every monster moving, as the engine does), recording its keys. */
export async function replayPath(
  game: Game,
  files: FileSource,
  scene: number,
  entry: Entry,
  moves: Move[],
  path: Via[],
  seed = 1,
  /** Go on from partway (a place reached before, `ticks` into the scene) instead of the scene's start. */
  from?: { snap: Snap; ticks: number },
  /** Walking paths, to measure how much of the route keeps to them. */
  paths?: ReadonlySet<number>,
): Promise<Replay | undefined> {
  const sim = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev, seed);
  if (from) sim.restore(from.snap);
  const events: { tick: number; key: number }[] = [];
  let ticks = from?.ticks ?? 0;
  // a key event is played on the segment's next tick (as the walkthrough runtime plays them)
  sim.onKey = (key) => events.push({ tick: ticks + 1, key });
  let moving = 0;
  let onPath = 0;
  const tick = async (): Promise<Outcome> => {
    ticks++;
    const was = paths && sim.px;
    const r = await sim.tick();
    if (was && r === undefined) {
      const now = sim.px;
      if (now.x !== was.x || now.y !== was.y) {
        moving++;
        if (paths.has(sim.w.map[footCell(sim.w)])) onPath++;
      }
    }
    return r === 'dead' ? 'dead' : r ? r.link : undefined;
  };
  const done = (link: number): Replay => {
    const ci = sim.w.ci;
    return {
      link,
      snap: link < 0 ? sim.snapshot() : undefined,
      events,
      ticks,
      ci: { ...ci, inv: ci.inv.slice(), meter: ci.meter.slice(), seqon: ci.seqon.slice() },
      clock: sim.w.clock,
      world: sim.w,
      fit: { ticks, moving, onPath },
    };
  };
  for (const v of path) {
    const r = await driveMove(sim, moves[v.move], { tick, limit: v.ticks });
    if (r.end === 'dead') return undefined;
    if (typeof r.end === 'number') return done(r.end);
  }
  // the path ends at a place, not a link: the state there, to go on from
  return done(-1);
}
