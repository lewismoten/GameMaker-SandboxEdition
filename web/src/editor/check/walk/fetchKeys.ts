// Fetches what the doors still shut need, then goes on (gates.ts says which doors and what adds
// to their counters). The explorer searches, heading for what adds to them, for the first place
// where every short counter is high enough for the doors that read it (explore's `stopWhen`), that
// path is played again from the scene's start (in rounds while a trip gains keys), and a second
// search from there looks for the way on. The key can be off the direct route: the doors are only
// on the way after it.
import { INF_REPEAT } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import type { Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { explore, type Entry, type Exploration } from '../explore';
import { SceneSim, type FileSource } from '../sim';
import { locksOf, sourcesOf, liveMonsterSources, type Locks } from './gates';
import { pathTo, replayPath, type Replay } from './replayPath';

/** The source cells a keys-search round was trying to reach. */
interface FetchKeysSource {
  counter: number;
  cell: number;
}

/** Why a keys strategy stopped without replaying a wanted exit. */
type FetchKeysCutoff = 'budget' | 'no-reachable-state' | 'replay-failure' | 'round-limit';

/** Compact evidence from one search in the keys strategy. No snapshots, paths, or heat maps are retained. */
interface FetchKeysRoundDiagnostic {
  /** `key` fetches a counter source; `exit` searches from paid keys for a wanted way on. */
  kind: 'key' | 'exit';
  /** The candidate source closest to the best state this key search reached, or null when there are no candidates. */
  source: FetchKeysSource | null;
  /** Every source this key search was allowed to reach; an exit search has none. */
  candidates: FetchKeysSource[];
  /** Whether the explorer exhausted its states; a successful stop at a source is not complete. */
  complete: boolean;
  /** Work allocated to this exploration, in milliseconds. */
  budgetMs: number;
  /** Work the explorer reports doing, in milliseconds, from its injected clock. */
  ms: number;
  /** Search states reached. */
  places: number;
  /** Least toroidal cell distance from any reached place to a goal source or exit, or null before a search starts. */
  nearestGoalDistance: number | null;
  exits: number;
  deaths: number;
  incidents: number;
  /** Null for a nonterminal round (including a discarded checkpoint); the last failed round names its cutoff. */
  cutoff: FetchKeysCutoff | null;
}

export interface FetchKeysDiagnostics {
  rounds: FetchKeysRoundDiagnostic[];
  /** The terminal cutoff, or null when the key strategy replayed a wanted exit. */
  cutoff: FetchKeysCutoff | null;
}

interface FetchKeysResult {
  replay?: Replay;
  diagnostics: FetchKeysDiagnostics;
}

interface FetchOptions {
  /** Cells of the ways on (links) the second search heads for; `wanted` are those links' indexes. */
  goal: number[];
  wanted: ReadonlySet<number>;
  budgetMs: number;
  seed?: number;
  progress?: (places: number) => boolean | void;
  /** A worker-safe clock seam for both the key deadline and explorer timing. */
  now?: () => number;
  /** Walking paths, to measure the route against. */
  paths?: ReadonlySet<number>;
  /** Filled with the counters still short when the keys could not be fetched (for lockedWhy). */
  unreached?: Set<number>;
  /** Most trips for keys; MAX_KEY_TRIPS unless a test needs a smaller cap. */
  maxTrips?: number;
}

/**
 * Most trips for keys before the bot gives up on a door (cutoff `round-limit`). Each trip stops at
 * the first key gained, so a door that takes N single keys needs about N trips; the time budget
 * still bounds every trip, so the cap only keeps a long scene from looping on. The counter-door
 * audit (2026-11-05 archive walks) found the old cap of 6 left doors taking 22-336 keys unpaid that
 * the same loop opened when uncapped, the largest in 272 trips; 400 leaves room above that.
 */
export const MAX_KEY_TRIPS = 400;

/** The trip cap, when the keys strategy stopped because it made that many trips (for lockedWhy). */
export function tripCapReached(d: FetchKeysDiagnostics, cap: number = MAX_KEY_TRIPS): number | undefined {
  return d.cutoff === 'round-limit' && d.rounds.filter((round) => round.kind === 'key').length >= cap ? cap : undefined;
}

const NO_DISTANCE = 0xffff;

/** The doors a scene holds shut when the hero comes in, and what fetching their keys would take. */
export function locksAtEntry(game: Game, files: FileSource, scene: number, entry: Entry): Locks {
  return locksOf(new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev).w);
}

/** Exact wrapped Manhattan distance to the nearest goal for every map cell. */
function distancesTo(goals: readonly number[]): Uint16Array {
  const count = MLEN * MWID;
  const distance = new Uint16Array(count).fill(NO_DISTANCE);
  const queue: number[] = [];
  for (const goal of goals) {
    if (goal < 0 || goal >= count || distance[goal] === 0) continue;
    distance[goal] = 0;
    queue.push(goal);
  }
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head];
    const nextDistance = distance[cell] + 1;
    const x = cell % MLEN;
    const next = [
      x ? cell - 1 : cell + MLEN - 1,
      x + 1 < MLEN ? cell + 1 : cell - MLEN + 1,
      cell >= MLEN ? cell - MLEN : cell + MLEN * (MWID - 1),
      cell + MLEN < count ? cell + MLEN : cell - MLEN * (MWID - 1),
    ];
    for (const neighbor of next)
      if (distance[neighbor] === NO_DISTANCE) {
        distance[neighbor] = nextDistance;
        queue.push(neighbor);
      }
  }
  return distance;
}

function nearestGoalDistance(ex: Exploration, distance: Uint16Array): number | null {
  let nearest = NO_DISTANCE;
  for (const place of ex.places) nearest = Math.min(nearest, distance[place.cell] ?? NO_DISTANCE);
  return nearest === NO_DISTANCE ? null : nearest;
}

function deaths(ex: Exploration): number {
  let count = 0;
  for (const at of ex.deaths.values()) count += at;
  return count;
}

function cellDistance(a: number, b: number): number {
  const ax = a % MLEN;
  const ay = Math.floor(a / MLEN);
  const bx = b % MLEN;
  const by = Math.floor(b / MLEN);
  return Math.min(Math.abs(ax - bx), MLEN - Math.abs(ax - bx)) + Math.min(Math.abs(ay - by), MWID - Math.abs(ay - by));
}

function sourceAt(ex: Exploration, sources: readonly FetchKeysSource[], distance: Uint16Array): FetchKeysSource | null {
  if (!sources.length) return null;
  let cell = ex.reached === undefined ? undefined : ex.places[ex.reached]?.cell;
  if (cell === undefined) for (const place of ex.places) if (cell === undefined || distance[place.cell] < distance[cell]) cell = place.cell;
  if (cell === undefined) return sources[0];
  return sources.reduce((closest, source) => (cellDistance(cell, source.cell) < cellDistance(cell, closest.cell) ? source : closest));
}

function roundDiagnostic(
  kind: FetchKeysRoundDiagnostic['kind'],
  ex: Exploration,
  sources: FetchKeysSource[],
  distance: Uint16Array,
  budgetMs: number,
): FetchKeysRoundDiagnostic {
  return {
    kind,
    source: kind === 'key' ? sourceAt(ex, sources, distance) : null,
    candidates: kind === 'key' ? sources.slice() : [],
    complete: ex.complete,
    budgetMs,
    ms: ex.ms,
    places: ex.places.length,
    nearestGoalDistance: nearestGoalDistance(ex, distance),
    exits: ex.exits.length,
    deaths: deaths(ex),
    incidents: ex.incidents.length,
    cutoff: null,
  };
}

function budgetDiagnostic(kind: FetchKeysRoundDiagnostic['kind'], sources: FetchKeysSource[], distance: Uint16Array, entry: Entry): FetchKeysRoundDiagnostic {
  const cell = entry.start.y * MLEN + entry.start.x;
  const nearest = distance[cell];
  return {
    kind,
    source: null,
    candidates: kind === 'key' ? sources.slice() : [],
    complete: false,
    budgetMs: 0,
    ms: 0,
    places: 0,
    nearestGoalDistance: nearest === NO_DISTANCE ? null : nearest,
    exits: 0,
    deaths: 0,
    incidents: 0,
    cutoff: 'budget',
  };
}

/** The route that fetches the keys and then reaches a way on (merged keys), with compact diagnostics. */
export async function fetchKeys(
  game: Game,
  files: FileSource,
  scene: number,
  entry: Entry,
  locks: Pick<Locks, 'owed' | 'wanted' | 'sources'>,
  o: FetchOptions,
): Promise<FetchKeysResult> {
  const rounds: FetchKeysRoundDiagnostic[] = [];
  if (!locks.wanted.size) return { diagnostics: { rounds, cutoff: 'no-reachable-state' } };
  const owed = locks.owed;
  const paid = (meter: ArrayLike<number>) => [...locks.wanted].every((c) => meter[c] === INF_REPEAT || meter[c] > (owed.get(c) ?? 0));
  let sources = locks.sources.filter((source) => locks.wanted.has(source.counter)).map(({ counter, cell }) => ({ counter, cell }));
  let sourceDistance = distancesTo(sources.map((source) => source.cell));
  const now = o.now ?? (() => performance.now());
  const seed = o.seed ?? 1;
  const deadline = now() + o.budgetMs * 0.5;
  // Rounds: each goes for the nearest place that adds to a short counter (or pays every door), then
  // plays that on and looks again from there. A door that takes several keys, or keys the hero must
  // come back between, needs more than one; stop when a round gains nothing or at the trip cap.
  let r1: Replay | undefined;
  const initial = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev).w;
  let meter: ArrayLike<number> = initial.ci.meter;
  const history: (Replay | undefined)[] = [];
  const refused = new Set<string>();
  // Refusing a checkpoint does not prune its moves: another trajectory through
  // that cell can still carry the pickup onward and stop in a different cell.
  const checkpoint = (w: World) => JSON.stringify([w.chr.x[0], w.chr.y[0], w.ci.hitpts, w.ci.meter, w.ci.inv, w.ci.seqon]);
  const refresh = () => {
    if (!r1) {
      sources = locks.sources.filter((source) => locks.wanted.has(source.counter)).map(({ counter, cell }) => ({ counter, cell }));
    } else {
      // Follow moving/dropped supplies and ignore collected or already paid targets.
      const w = r1.world;
      const short = new Set([...locks.wanted].filter((c) => meter[c] !== INF_REPEAT && meter[c] <= (owed.get(c) ?? 0)));
      sources = sourcesOf(w.map, w.bg, short, liveMonsterSources(w), (n) => w.blkmap[n], w).map(({ counter, cell }) => ({ counter, cell }));
    }
    sourceDistance = distancesTo(sources.map((source) => source.cell));
  };
  let cutoff: FetchKeysCutoff | null = null;
  const maxTrips = o.maxTrips ?? MAX_KEY_TRIPS;
  for (let round = 0; round < maxTrips && !paid(meter); round++) {
    const left = deadline - now();
    if (left <= 0) {
      rounds.push(budgetDiagnostic('key', sources, sourceDistance, entry));
      cutoff = 'budget';
      break;
    }
    const before = Array.from(meter);
    const gained = (w: World) => [...locks.wanted].some((c) => before[c] !== INF_REPEAT && before[c] <= (owed.get(c) ?? 0) && w.ci.meter[c] > before[c]);
    let leavingPaid = false;
    const ex1 = await explore(game, scene, files, entry, {
      budgetMs: left,
      resourceSearch: true,
      // Resource routes can depend on enemies that move into view during a long climb.
      exact: true,
      steadyTicks: 3,
      steadySteering: true,
      steerAirborne: true,
      alignTurns: true,
      goal: sources.map((source) => source.cell),
      stopWhen: (w) => (paid(w.ci.meter) || gained(w)) && !refused.has(checkpoint(w)),
      onTick: (w) => {
        leavingPaid = paid(w.ci.meter);
      },
      stopAt: (link) => leavingPaid && o.wanted.has(link),
      ...(r1 ? { start: r1.snap } : {}),
      progress: o.progress,
      now: o.now,
    });
    const diagnostic = roundDiagnostic('key', ex1, sources, sourceDistance, left);
    rounds.push(diagnostic);
    // A pickup can occupy the exit itself; keep its real transition rather than
    // requiring an intermediate resting place inside this scene.
    for (const exit of ex1.exits.filter((e) => o.wanted.has(e.link) && paid(e.ci.meter)).sort((a, b) => a.tick - b.tick)) {
      const r = await replayPath(
        game,
        files,
        scene,
        entry,
        ex1.moves,
        pathTo(ex1, exit.via),
        seed,
        r1?.snap ? { snap: r1.snap, ticks: r1.ticks } : undefined,
        o.paths,
      );
      if (r && o.wanted.has(r.link) && paid(r.ci.meter))
        return { replay: r1 ? { ...r, events: [...r1.events, ...r.events] } : r, diagnostics: { rounds, cutoff: null } };
    }
    const at = ex1.reached === undefined ? undefined : ex1.places[ex1.reached]?.via;
    if (!at) {
      // A greedy pickup may strand the hero. An exhausted search from that
      // checkpoint is evidence to try another pickup route from its predecessor.
      // This rewinds planning only; the final recording contains the chosen route.
      if (ex1.complete && r1 && history.length) {
        refused.add(checkpoint(r1.world));
        r1 = history.pop();
        meter = r1?.ci.meter ?? initial.ci.meter;
        refresh();
        continue;
      }
      cutoff = ex1.complete ? 'no-reachable-state' : 'budget';
      diagnostic.cutoff = cutoff;
      break;
    }
    const r = await replayPath(game, files, scene, entry, ex1.moves, pathTo(ex1, at), seed, r1?.snap ? { snap: r1.snap, ticks: r1.ticks } : undefined);
    if (!r || r.link >= 0 || !r.snap) {
      cutoff = 'replay-failure';
      diagnostic.cutoff = cutoff;
      break;
    }
    history.push(r1);
    r1 = r1 ? { ...r, events: [...r1.events, ...r.events] } : r;
    meter = r.ci.meter;
    refresh();
  }
  if (!r1?.snap || !paid(meter)) {
    cutoff ??= 'round-limit';
    if (cutoff === 'round-limit' && rounds.length) rounds[rounds.length - 1].cutoff = cutoff;
    for (const c of locks.wanted) if (!(meter[c] === INF_REPEAT || meter[c] > (owed.get(c) ?? 0))) o.unreached?.add(c);
    return { diagnostics: { rounds, cutoff } };
  }
  const exitDistance = distancesTo(o.goal);
  const ex2 = await explore(game, scene, files, entry, {
    goal: o.goal,
    resourceSearch: true,
    steadyTicks: 3,
    steadySteering: true,
    steerAirborne: true,
    alignTurns: true,
    start: r1.snap,
    exact: true,
    budgetMs: o.budgetMs * 0.5,
    stopAt: (link) => o.wanted.has(link),
    progress: o.progress,
    now: o.now,
  });
  const exitDiagnostic = roundDiagnostic('exit', ex2, [], exitDistance, o.budgetMs * 0.5);
  rounds.push(exitDiagnostic);
  const exits = ex2.exits.filter((exit) => o.wanted.has(exit.link)).sort((a, b) => a.tick - b.tick);
  for (const exit of exits) {
    const r2 = await replayPath(game, files, scene, entry, ex2.moves, pathTo(ex2, exit.via), seed, { snap: r1.snap, ticks: r1.ticks }, o.paths);
    if (r2 && o.wanted.has(r2.link)) return { replay: { ...r2, events: [...r1.events, ...r2.events] }, diagnostics: { rounds, cutoff: null } };
  }
  cutoff = exits.length ? 'replay-failure' : ex2.complete ? 'no-reachable-state' : 'budget';
  exitDiagnostic.cutoff = cutoff;
  return { diagnostics: { rounds, cutoff } };
}
