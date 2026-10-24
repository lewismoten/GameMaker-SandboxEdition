// Makes a walkthrough (walkthrough/format.ts) for any game by playing it with the level check's
// explorer: scene after scene, from the title's first link, each scene is tried with a few
// bot styles in order of cost (run and hop, walk the maze, search every move, search and wait
// everywhere) until one reaches a link to a scene not seen yet (or the won scene) without
// dying. The path it found is played again from the scene's start on the same engine, the keys
// it pressed kept tick by tick, and that state carries into the next scene. Where no style gets
// through, it stops there and says so: the walkthrough ends where the bot got to. A scene the
// author has played (mine.ts) is played with the author's keys instead, when they still reach
// an exit from where the walkthrough has got to; else the bot plays it.
import { encodeKeys, keysAt, WALKTHROUGH_FPS, type Walkthrough } from '../../../walkthrough/format';
import type { Game } from '../../../formats/game';
import { MLEN } from '../../../formats/map';
import type { CharInfo, World } from '../../../engine/world';
import { driveMove, type Outcome } from '../drive';
import { explore, type Entry, type Exploration, type ExploreOptions, type Via } from '../explore';
import type { Move } from '../inputs';
import { SceneSim, startCharInfo, type FileSource, type Snap } from '../sim';
import { replayMine } from './mine';

export interface Strategy {
  id: 'runner' | 'walker' | 'search' | 'patient' | 'collector' | 'mine';
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
  // played apart from the others (collect()): gathers what the scene holds first, then goes on
  { id: 'collector', name: 'Collect everything, then go on', share: 0.8, options: () => ({}) },
];

/** The author's own play of a scene (not one of the bot's styles). */
export const MINE: Strategy = { id: 'mine', name: 'Your play', share: 0, options: () => ({}) };

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
  /** The author's play of the scene was used, or was asked for but no longer reaches an exit (the bot played it). */
  mine?: 'used' | 'broke';
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
  /** The author's own plays to use, by scene: their keys (encodeKeys), from the scene's entry. */
  mine?: Record<number, string>;
  /** Stop after this many scenes (1: just the first scene). */
  maxScenes?: number;
}

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
): Promise<Replay | undefined> {
  const sim = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev, seed);
  if (from) sim.restore(from.snap);
  const events: { tick: number; key: number }[] = [];
  let ticks = from?.ticks ?? 0;
  // a key event is played on the segment's next tick (as the walkthrough runtime plays them)
  sim.onKey = (key) => events.push({ tick: ticks + 1, key });
  const tick = async (): Promise<Outcome> => {
    ticks++;
    const r = await sim.tick();
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
  const taken = new Map<string, number>();
  /** Arrival points used, and the cells of each scene the bot's searches reached. */
  const arrived = new Set<string>([`${scene}@${first.to.x},${first.to.y}`]);
  const reached = new Map<number, Uint8Array>();
  const remember = (sc: number, ex: Exploration | undefined) => {
    if (!ex) return;
    const r = reached.get(sc) ?? new Uint8Array(ex.heat.length);
    ex.heat.forEach((h, i) => h && (r[i] = 1));
    reached.set(sc, r);
  };
  let cancelled = false;
  for (let guard = 0; guard < 200 && scene !== 1; guard++) {
    const s = game.scenes[scene];
    const name = s.desc.trim() || `Scene ${scene}`;
    const level = (l: { toScene: number }) => l.toScene === 1 || (l.toScene > 1 && l.toScene < game.scenes.length);
    // a scene not played yet (or the won scene); else back the way a hub game goes (a side room
    // returns to the hub), each way taken at most twice so the bot can't go round for ever
    let ways = s.links.filter((l) => level(l) && (l.toScene === 1 || !seen.has(l.toScene)));
    const backOnly = !ways.length;
    if (backOnly) ways = s.links.filter((l) => level(l) && l.toScene !== scene && (taken.get(`${scene}>${l.toScene}`) ?? 0) < 2);
    const outcome: SceneOutcome = { scene, name, tried: [] };
    out.scenes.push(outcome);
    if (!ways.length) {
      out.stopped = `${name} has no way on that the bot hasn’t taken already.`;
      break;
    }
    const goal = ways.map((l) => l.from.y * MLEN + l.from.x);
    // back to a hub: a way that lands somewhere in it the bot hasn't been beats the way it came in
    if (backOnly) {
      const fresh = ways.filter((l) => !arrived.has(`${l.toScene}@${l.to.x},${l.to.y}`) && !reached.get(l.toScene)?.[(l.to.y % 100) * MLEN + (l.to.x % MLEN)]);
      if (fresh.length) ways = fresh;
    }
    const wanted = new Set(ways.map((l) => s.links.indexOf(l)));
    let biggest: Exploration | undefined;
    let found: { replay: Replay; strategy: Strategy } | undefined;
    /**
     * The collector: explore the whole scene, go to the place where the hero has gathered the
     * most (things carried, counters, score), and look for the way on from there. For a side
     * room whose only way out is back (its prize is the point), and for a way on that opens only
     * for what the hero carries.
     */
    const collect = async (): Promise<boolean> => {
      const st = STRATEGIES.find((x) => x.id === 'collector')!;
      outcome.tried.push(st.id);
      const prog = (places: number) => {
        if (opt.progress?.(scene, st.name, places)) cancelled = true;
        return cancelled;
      };
      const ex1 = await explore(game, scene, files, entry, { budgetMs: budget * 0.4, progress: prog });
      if (cancelled) return false;
      if (!biggest || ex1.places.length > biggest.places.length) biggest = ex1;
      const startWorth = ex1.places[0]?.worth ?? 0;
      const best = ex1.places.filter((p) => p.via && p.worth > startWorth).sort((a, b) => b.worth - a.worth || a.tick - b.tick)[0];
      if (!best) return false;
      const r1 = await replayPath(game, files, scene, entry, ex1.moves, pathTo(ex1, best.via!), seed);
      if (!r1 || r1.link >= 0 || !r1.snap) return false;
      const ex2 = await explore(game, scene, files, entry, { goal, start: r1.snap, budgetMs: budget * 0.4, stopAt: (l) => wanted.has(l), progress: prog });
      if (cancelled) return false;
      for (const e of ex2.exits.filter((x) => wanted.has(x.link)).sort((a, b) => a.tick - b.tick)) {
        const r2 = await replayPath(game, files, scene, entry, ex2.moves, pathTo(ex2, e.via), seed, { snap: r1.snap, ticks: r1.ticks });
        if (r2 && wanted.has(r2.link)) {
          found = { replay: { ...r2, events: [...r1.events, ...r2.events] }, strategy: st };
          return true;
        }
      }
      return false;
    };
    // the author's own play, if it still gets out from here
    const myKeys = opt.mine?.[scene];
    if (myKeys !== undefined) {
      opt.progress?.(scene, MINE.name, 0);
      const r = await replayMine(game, files, scene, entry, myKeys, seed);
      const l = r && s.links[r.link];
      if (r && l && level(l) && l.toScene !== scene) found = { replay: r, strategy: MINE };
      outcome.mine = found ? 'used' : 'broke';
    }
    // a side room with no new way on: what it holds is why the hero came
    if (backOnly && !found) await collect();
    const gravity = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev).w.bg.some((b) => b.grav !== 0);
    for (const st of found ? [] : STRATEGIES) {
      if (st.id === 'collector' || (st.gravity !== undefined && st.gravity !== gravity)) continue;
      outcome.tried.push(st.id);
      // first with far monsters held still (fast); a path that plays differently once they all
      // move is looked for again with every monster moving
      for (const exact of [false, true]) {
        const ex = await explore(game, scene, files, entry, {
          ...st.options(goal),
          exact,
          budgetMs: budget * st.share * (exact ? 0.5 : 1),
          stopAt: (l) => wanted.has(l),
          progress: (places) => {
            if (opt.progress?.(scene, st.name, places)) cancelled = true;
            return cancelled;
          },
        });
        if (cancelled) break;
        if (!biggest || ex.places.length > biggest.places.length) biggest = ex;
        const exits = ex.exits.filter((e) => wanted.has(e.link)).sort((a, b) => a.tick - b.tick);
        for (const e of exits) {
          const replay = await replayPath(game, files, scene, entry, ex.moves, pathTo(ex, e.via), seed);
          if (replay && wanted.has(replay.link)) {
            found = { replay, strategy: st };
            break;
          }
        }
        if (found || !exits.length) break;
      }
      if (found || cancelled) break;
    }
    if (!found && !cancelled && !backOnly) await collect();
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
    if (opt.maxScenes && out.scenes.length >= opt.maxScenes) break;
    seen.add(link.toScene);
    remember(scene, biggest);
    arrived.add(`${link.toScene}@${link.to.x},${link.to.y}`);
    taken.set(`${scene}>${link.toScene}`, (taken.get(`${scene}>${link.toScene}`) ?? 0) + 1);
    entry = { start: link.to, ci: replay.ci, clock: replay.clock, prev: replay.world };
    scene = link.toScene;
  }
  if (segments.length)
    out.walk = {
      version: 1,
      game: gameId,
      rand: { seed, per: 'scene' },
      bot: true,
      partial: !out.won || undefined,
      segments,
      chapters,
      timeline: { fps: WALKTHROUGH_FPS, frames: 0, chapters: [] },
    };
  return out;
}
