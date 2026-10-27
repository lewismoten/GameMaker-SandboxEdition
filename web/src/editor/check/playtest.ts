// The level check's playtest of a whole game, or of one scene: explores each scene from where
// play enters it (explore.ts), carrying the hero's hit points, score and inventory from the
// exit that led there, then finds the stuck areas in it (stuck.ts). Scenes are taken in the
// order play reaches them from the title's first link. It can also play with steady hands
// (one key at a time, unhurried), or go on into each scene carrying the least the hero could
// have left the last one with (what a player who skips things brings).
import { parseBlocks, BACKBL } from '../../formats/blocks';
import { NOSCENE, parseGame, type Game } from '../../formats/game';
import { parseMap } from '../../formats/map';
import { explore, type Entry, type Exploration, type ExploreLive } from './explore';
import { startCharInfo, type FileSource } from './sim';
import { stuckAreas, type StuckArea } from './stuck';
import { levelScenes, linksInto } from './sceneLinks';

/** For games/kit/levelCheck.ts, which takes the level scenes from here. */
export { levelScenes };

export interface SceneRun {
  scene: number;
  name: string;
  /** Where the hero came in: the scene and link that led here (-1 for a scene checked alone). */
  from: { scene: number; link: number };
  ex: Exploration;
  stuck: StuckArea[];
  /** The hero's hit points as it entered. */
  hpIn: number;
  /** Where and with what the hero came in (to play the scene again another way). */
  entry: Entry;
}

interface PlaytestOptions {
  /** Work per scene before moving on (ms). */
  budgetMs?: number;
  /** Told the scene being explored, how far along it is and what it has found so far; return true to stop everything. */
  progress?: (scene: number, done: number, total: number, places: number, queued: number, live: ExploreLive) => boolean | void;
  /** Play with steady hands: one key at a time, at least this many ticks between changes. */
  steadyTicks?: number;
  /** Go on into each scene carrying the least the hero could leave the last one with (explore.ts poorExits). */
  leaveBehind?: boolean;
  /** Try places nearer the scene's links on first (explore.ts goal): finds a way through sooner, covers less. */
  towardExits?: boolean;
}

export interface Playtest {
  runs: SceneRun[];
  /** Level scenes play never reached (no link leads there that the hero could take). */
  unreached: number[];
  /** The hero reached a link to the won scene. */
  won: boolean;
  canceled: boolean;
  /** Scenes the bot couldn't load or play (a file missing, a scene with no map), and why. */
  failed: { scene: number; error: string }[];
}

/** The game's file, parsed. */
export function gameOf(files: FileSource & { mainGame?(): string | undefined }, gam?: string): Game {
  const name = gam ?? files.mainGame?.();
  const bytes = name ? files.get(name) : undefined;
  if (!bytes) throw new Error('This game has no .gam file.');
  return parseGame(bytes);
}

/** Plays the whole game: every scene the hero can get to, in the order play reaches them. */
export async function playtestGame(game: Game, files: FileSource, opt: PlaytestOptions = {}): Promise<Playtest> {
  const runs: SceneRun[] = [];
  const first = game.scenes[0]?.links[0];
  const out: Playtest = { runs, unreached: [], won: false, canceled: false, failed: [] };
  if (!first || first.toScene === NOSCENE) return out;
  // a game whose start goes straight to the won (or title) scene has no level to play
  if (first.toScene <= 1 || first.toScene >= game.scenes.length) {
    out.won = first.toScene === 1;
    return out;
  }
  const queue: { scene: number; from: { scene: number; link: number }; entry: Entry }[] = [
    { scene: first.toScene, from: { scene: 0, link: 0 }, entry: { start: first.to, ci: startCharInfo(), clock: 1 } },
  ];
  const seen = new Set<number>([first.toScene]);
  const levels = levelScenes(game);
  while (queue.length) {
    const job = queue.shift()!;
    // a scene the bot can't load (a missing file, no map) is reported, and the rest still played
    let r: SceneRun | undefined;
    try {
      r = await checkScene(game, files, job.scene, job.from, job.entry, opt, runs.length, Math.max(levels.length, runs.length + 1));
    } catch (e) {
      out.failed.push({ scene: job.scene, error: e instanceof Error ? e.message : String(e) });
      continue;
    }
    if (!r) {
      out.canceled = true;
      break;
    }
    runs.push(r);
    for (const e of opt.leaveBehind ? r.ex.poorExits : r.ex.exits) {
      if (e.toScene === 1) out.won = true;
      if (e.toScene <= 1 || e.toScene >= game.scenes.length || seen.has(e.toScene)) continue;
      seen.add(e.toScene);
      queue.push({ scene: e.toScene, from: { scene: job.scene, link: e.link }, entry: { start: e.to, ci: e.ci, clock: e.clock, prev: e.world } });
    }
  }
  out.unreached = levels.filter((s) => !seen.has(s));
  return out;
}

/** Checks one scene by itself: the hero as the game starts, coming in by the first link that leads here. */
export async function playtestScene(game: Game, files: FileSource, scene: number, opt: PlaytestOptions = {}): Promise<SceneRun | undefined> {
  const into = linksInto(game, scene);
  const from = into.find((l) => l.scene !== scene) ?? into[0];
  const start = from?.to ?? { x: 50, y: 50 };
  return checkScene(
    game,
    files,
    scene,
    from ? { scene: from.scene, link: from.link } : { scene: -1, link: -1 },
    { start, ci: startCharInfo(), clock: 1 },
    opt,
    0,
    1,
  );
}

/** Plays one scene again from the same entry as an earlier run, another way (steady hands). */
export async function replayScene(game: Game, files: FileSource, run: SceneRun, opt: PlaytestOptions = {}): Promise<SceneRun | undefined> {
  return checkScene(game, files, run.scene, run.from, run.entry, opt, 0, 1);
}

async function checkScene(
  game: Game,
  files: FileSource,
  scene: number,
  from: { scene: number; link: number },
  entry: Entry,
  opt: PlaytestOptions,
  done: number,
  total: number,
): Promise<SceneRun | undefined> {
  let canceled = false;
  const onward = game.scenes[scene].links.filter((l) => l.toScene !== NOSCENE && l.toScene !== from.scene && l.toScene !== scene);
  const ex = await explore(game, scene, files, entry, {
    budgetMs: opt.budgetMs,
    steadyTicks: opt.steadyTicks,
    goal: opt.towardExits && onward.length ? onward.map((l) => l.from.y * 100 + l.from.x) : undefined,
    progress: (places, queued, live) => {
      if (opt.progress?.(scene, done, total, places, queued, live)) canceled = true;
      return canceled;
    },
  });
  if (canceled) return undefined;
  const s = game.scenes[scene];
  const mapBytes = files.get(s.files[1]);
  const bblBytes = s.files[2] ? files.get(s.files[2]) : undefined;
  const stuck = mapBytes && bblBytes ? stuckAreas(ex, parseMap(mapBytes).blocks, parseBlocks(bblBytes, BACKBL)) : [];
  return { scene, name: s.desc.trim() || `Scene ${scene}`, from, ex, stuck, hpIn: entry.ci.hitpts, entry };
}
