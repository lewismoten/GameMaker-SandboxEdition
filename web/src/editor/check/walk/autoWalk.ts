// Makes a walkthrough (walkthrough/format.ts) for any game by playing it with the level check's
// explorer: scene after scene, from the title's first link, each scene is tried with a few
// bot styles in order of cost (run and hop, walk the maze, search every move, search and wait
// everywhere) until one reaches a link to a scene not seen yet (or the won scene) without
// dying. The path it found is played again from the scene's start on the same engine, the keys
// it pressed kept tick by tick, and that state carries into the next scene. Where no style gets
// through, it stops there and says so: the walkthrough ends where the bot got to.
import { encodeKeys, keysAt, WALKTHROUGH_FPS, type Walkthrough } from '../../../walkthrough/format';
import type { Game } from '../../../formats/game';
import { MLEN } from '../../../formats/map';
import type { CharInfo, World } from '../../../engine/world';
import { driveMove, type Outcome } from '../drive';
import { explore, type Entry, type Exploration, type ExploreOptions, type Via } from '../explore';
import type { Move } from '../inputs';
import { SceneSim, startCharInfo, type FileSource } from '../sim';

export interface Strategy {
  id: 'runner' | 'walker' | 'search' | 'patient';
  name: string;
  /** Only for scenes with gravity (true) or without (false). */
  gravity?: boolean;
  /** Share of the scene's time budget. */
  share: number;
  options: (goal: number[]) => Partial<ExploreOptions>;
}

const movesOnly = (re: RegExp) => (m: Move) => re.test(m.name);

export const STRATEGIES: Strategy[] = [
  { id: 'runner', name: 'Run and hop', gravity: true, share: 0.15, options: (goal) => ({ goal, moveFilter: movesOnly(/^(walk|step|jump)/) }) },
  { id: 'walker', name: 'Maze walker', gravity: false, share: 0.15, options: (goal) => ({ goal, moveFilter: movesOnly(/^walk/) }) },
  { id: 'search', name: 'Every move', share: 0.35, options: (goal) => ({ goal }) },
  { id: 'patient', name: 'Every move, waiting out hazards', share: 0.5, options: () => ({ waitEverywhere: true }) },
];

export interface SceneOutcome {
  scene: number;
  name: string;
  /** The bot style that got through (undefined: none did). */
  strategy?: Strategy['id'];
  tried: Strategy['id'][];
  /** Ticks the path takes. */
  ticks?: number;
  /** The scene the path leads to. */
  next?: number;
  /** Where the bot went, for a scene it couldn't get through (the heat map). */
  heat?: Uint32Array;
}

export interface AutoWalk {
  /** The keys of every scene the bot got through (none when it got through none). */
  walk?: Walkthrough;
  scenes: SceneOutcome[];
  /** The bot reached the won scene. */
  won: boolean;
  /** Why it stopped, when it didn't win. */
  stopped?: string;
}

export interface AutoWalkOptions {
  /** Time for each scene, all styles together (ms). */
  budgetMs?: number;
  seed?: number;
  /** Told the scene, the style and how far along; return true to stop. */
  progress?: (scene: number, strategy: string, places: number) => boolean | void;
}

/** The places from the start to `id`, by the moves that reached each. */
export function pathTo(ex: Exploration, via: Via): Via[] {
  const out: Via[] = [via];
  for (let p = via.parent; ex.places[p]?.via; p = ex.places[p].via!.parent) out.unshift(ex.places[p].via!);
  return out;
}

export interface Replay {
  link: number;
  events: { tick: number; key: number }[];
  ticks: number;
  ci: CharInfo;
  clock: number;
  world: World;
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
): Promise<Replay | undefined> {
  const sim = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev, seed);
  const events: { tick: number; key: number }[] = [];
  let ticks = 0;
  // a key event is played on the segment's next tick (as the walkthrough runtime plays them)
  sim.onKey = (key) => events.push({ tick: ticks + 1, key });
  const tick = async (): Promise<Outcome> => {
    ticks++;
    const r = await sim.tick();
    return r === 'dead' ? 'dead' : r ? r.link : undefined;
  };
  for (const v of path) {
    const r = await driveMove(sim, moves[v.move], { tick, limit: v.ticks });
    if (r.end === 'dead') return undefined;
    if (typeof r.end === 'number') {
      const ci = sim.w.ci;
      return {
        link: r.end,
        events,
        ticks,
        ci: { ...ci, inv: ci.inv.slice(), meter: ci.meter.slice(), seqon: ci.seqon.slice() },
        clock: sim.w.clock,
        world: sim.w,
      };
    }
  }
  return undefined;
}

export async function autoWalk(game: Game, files: FileSource, gameId: string, opt: AutoWalkOptions = {}): Promise<AutoWalk> {
  const seed = opt.seed ?? 1;
  const budget = opt.budgetMs ?? 30_000;
  const first = game.scenes[0]?.links[0];
  const out: AutoWalk = { scenes: [], won: false };
  if (!first || first.toScene >= game.scenes.length) return { ...out, stopped: 'The title has no link into a level.' };
  const segments: Walkthrough['segments'] = [];
  const chapters: Walkthrough['chapters'] = [];
  let scene = first.toScene;
  let entry: Entry = { start: first.to, ci: startCharInfo(), clock: 1 };
  const seen = new Set<number>([scene]);
  let cancelled = false;
  for (let guard = 0; guard < 200 && scene !== 1; guard++) {
    const s = game.scenes[scene];
    const name = s.desc.trim() || `Scene ${scene}`;
    const ways = s.links.filter((l) => l.toScene < game.scenes.length && (l.toScene === 1 || (l.toScene > 1 && !seen.has(l.toScene))));
    const outcome: SceneOutcome = { scene, name, tried: [] };
    out.scenes.push(outcome);
    if (!ways.length) {
      out.stopped = `${name} has no link to a scene not yet played.`;
      break;
    }
    const goal = ways.map((l) => l.from.y * MLEN + l.from.x);
    const wanted = new Set(ways.map((l) => l.toScene));
    let biggest: Exploration | undefined;
    let found: { replay: Replay; strategy: Strategy } | undefined;
    const gravity = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev).w.bg.some((b) => b.grav !== 0);
    for (const st of STRATEGIES) {
      if (st.gravity !== undefined && st.gravity !== gravity) continue;
      outcome.tried.push(st.id);
      // first with far monsters held still (fast); a path that plays differently once they all
      // move is looked for again with every monster moving
      for (const exact of [false, true]) {
        const ex = await explore(game, scene, files, entry, {
          ...st.options(goal),
          exact,
          budgetMs: budget * st.share * (exact ? 0.5 : 1),
          stopAt: (_link, to) => wanted.has(to),
          progress: (places) => {
            if (opt.progress?.(scene, st.name, places)) cancelled = true;
            return cancelled;
          },
        });
        if (cancelled) break;
        if (!biggest || ex.places.length > biggest.places.length) biggest = ex;
        const exits = ex.exits.filter((e) => wanted.has(e.toScene)).sort((a, b) => a.tick - b.tick);
        for (const e of exits) {
          const replay = await replayPath(game, files, scene, entry, ex.moves, pathTo(ex, e.via), seed);
          if (replay && wanted.has(s.links[replay.link].toScene)) {
            found = { replay, strategy: st };
            break;
          }
        }
        if (found || !exits.length) break;
      }
      if (found || cancelled) break;
    }
    if (cancelled) {
      out.stopped = 'Stopped.';
      break;
    }
    if (!found) {
      outcome.heat = biggest?.heat;
      out.stopped = `No bot style got through ${name}: the walkthrough stops there.`;
      break;
    }
    const { replay, strategy } = found;
    outcome.strategy = strategy.id;
    outcome.ticks = replay.ticks;
    const link = s.links[replay.link];
    outcome.next = link.toScene;
    segments.push({ scene, keys: encodeKeys(keysAt(replay.events)) });
    chapters.push({ scene, title: name });
    if (link.toScene === 1) {
      out.won = true;
      break;
    }
    seen.add(link.toScene);
    entry = { start: link.to, ci: replay.ci, clock: replay.clock, prev: replay.world };
    scene = link.toScene;
  }
  if (segments.length)
    out.walk = {
      version: 1,
      game: gameId,
      rand: { seed, per: 'scene' },
      segments,
      chapters,
      timeline: { fps: WALKTHROUGH_FPS, frames: 0, chapters: [] },
    };
  return out;
}
