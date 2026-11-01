// Fetches what the doors still shut need, then goes on (gates.ts says which doors and what adds
// to their counters). The explorer searches, heading for what adds to them, for the first place
// where every short counter is
// high enough for the doors that read it (explore's `stopWhen`), that path is played again from
// the scene's start (in rounds while a trip gains keys), and a second search from there looks for the way on. The key can be off
// the direct route: the doors are only on the way after it.
import { INF_REPEAT } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import type { Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { explore, type Entry } from '../explore';
import { SceneSim, type FileSource } from '../sim';
import { locksOf, type Locks } from './gates';
import { pathTo, replayPath, type Replay } from './replayPath';

/** The doors a scene holds shut when the hero comes in, and what fetching their keys would take. */
export function locksAtEntry(game: Game, files: FileSource, scene: number, entry: Entry): Locks {
  return locksOf(new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev).w);
}

interface FetchOptions {
  /** Cells of the ways on (links) the second search heads for; `wanted` are those links' indexes. */
  goal: number[];
  wanted: ReadonlySet<number>;
  budgetMs: number;
  seed?: number;
  progress?: (places: number) => boolean | void;
  /** Walking paths, to measure the route against. */
  paths?: ReadonlySet<number>;
  /** Filled with the counters still short when the keys could not be fetched (for lockedWhy). */
  unreached?: Set<number>;
}

/** Most trips for keys before the bot gives up on a door. */
const ROUNDS = 6;

/** The route that fetches the keys and then reaches a way on (merged keys), or undefined. */
export async function fetchKeys(game: Game, files: FileSource, scene: number, entry: Entry, locks: Locks, o: FetchOptions): Promise<Replay | undefined> {
  if (!locks.wanted.size) return undefined;
  const owed = locks.owed;
  const paid = (meter: ArrayLike<number>) => [...locks.wanted].every((c) => meter[c] === INF_REPEAT || meter[c] > (owed.get(c) ?? 0));
  const seed = o.seed ?? 1;
  const deadline = Date.now() + o.budgetMs * 0.5;
  // Rounds: each goes for the nearest place that adds to a short counter (or pays every door), then
  // plays that on and looks again from there. A door that takes several keys, or keys the hero must
  // come back between, needs more than one; stop when a round gains nothing or at ROUNDS.
  let r1: Replay | undefined;
  let meter: ArrayLike<number> = entry.ci.meter;
  for (let round = 0; round < ROUNDS && !paid(meter); round++) {
    const left = deadline - Date.now();
    if (left <= 0) break;
    const before = Array.from(meter);
    const gained = (w: World) => [...locks.wanted].some((c) => w.ci.meter[c] > before[c]);
    const ex1 = await explore(game, scene, files, entry, {
      budgetMs: left,
      goal: locks.sources.map((s) => s.cell),
      stopWhen: (w) => paid(w.ci.meter) || gained(w),
      ...(r1 ? { start: r1.snap, exact: true } : {}),
      progress: o.progress,
    });
    const at = ex1.reached === undefined ? undefined : ex1.places[ex1.reached]?.via;
    if (!at) break;
    const r = await replayPath(game, files, scene, entry, ex1.moves, pathTo(ex1, at), seed, r1 && r1.snap ? { snap: r1.snap, ticks: r1.ticks } : undefined);
    if (!r || r.link >= 0 || !r.snap) break;
    r1 = r1 ? { ...r, events: [...r1.events, ...r.events] } : r;
    meter = r.ci.meter;
  }
  if (!r1?.snap || !paid(meter)) {
    for (const c of locks.wanted) if (!(meter[c] === INF_REPEAT || meter[c] > (owed.get(c) ?? 0))) o.unreached?.add(c);
    return undefined;
  }
  const ex2 = await explore(game, scene, files, entry, {
    goal: o.goal,
    start: r1.snap,
    exact: true,
    budgetMs: o.budgetMs * 0.5,
    stopAt: (l) => o.wanted.has(l),
    progress: o.progress,
  });
  for (const e of ex2.exits.filter((x) => o.wanted.has(x.link)).sort((a, b) => a.tick - b.tick)) {
    const r2 = await replayPath(game, files, scene, entry, ex2.moves, pathTo(ex2, e.via), seed, { snap: r1.snap, ticks: r1.ticks }, o.paths);
    if (r2 && o.wanted.has(r2.link)) return { ...r2, events: [...r1.events, ...r2.events] };
  }
  return undefined;
}
