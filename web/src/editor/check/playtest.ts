// The level check's playtest of a whole game, or of one scene: explores each scene from where
// play enters it (explore.ts), carrying the hero's hit points, score and inventory from the
// exit that led there, then finds the stuck areas in it (stuck.ts). Scenes are taken in the
// order play reaches them from the title's first link.
import { parseBlocks, BACKBL } from '../../formats/blocks';
import { ADVTYPE, NOSCENE, parseGame, type Game } from '../../formats/game';
import { parseMap } from '../../formats/map';
import { explore, type Entry, type Exploration } from './explore';
import { startCharInfo, type FileSource } from './sim';
import { stuckAreas, type StuckArea } from './stuck';

export interface SceneRun {
  scene: number;
  name: string;
  /** Where the hero came in: the scene and link that led here (-1 for a scene checked alone). */
  from: { scene: number; link: number };
  ex: Exploration;
  stuck: StuckArea[];
  /** The hero's hit points as it entered. */
  hpIn: number;
}

export interface PlaytestOptions {
  /** Work per scene before moving on (ms). */
  budgetMs?: number;
  /** Told the scene being explored and how far along it is; return true to stop everything. */
  progress?: (scene: number, done: number, total: number, places: number) => boolean | void;
}

export interface Playtest {
  runs: SceneRun[];
  /** Level scenes play never reached (no link leads there that the hero could take). */
  unreached: number[];
  /** The hero reached a link to the won scene. */
  won: boolean;
  cancelled: boolean;
}

/** The game's file, parsed. */
export function gameOf(files: FileSource & { mainGame?(): string | undefined }, gam?: string): Game {
  const name = gam ?? files.mainGame?.();
  const bytes = name ? files.get(name) : undefined;
  if (!bytes) throw new Error('This game has no .gam file.');
  return parseGame(bytes);
}

/** Level scenes: the ones with a map that play can enter. */
export function levelScenes(game: Game): number[] {
  return game.scenes.flatMap((s, i) => (i > 1 && s.gametype === ADVTYPE && s.files[1] ? [i] : []));
}

/** Every link into `scene`: from which scene, which link, and where the hero starts. */
export function linksInto(game: Game, scene: number): { scene: number; link: number; to: { x: number; y: number } }[] {
  return game.scenes.flatMap((s, i) => s.links.flatMap((l, k) => (l.toScene === scene ? [{ scene: i, link: k, to: l.to }] : [])));
}

/** Plays the whole game: every scene the hero can get to, in the order play reaches them. */
export async function playtestGame(game: Game, files: FileSource, opt: PlaytestOptions = {}): Promise<Playtest> {
  const runs: SceneRun[] = [];
  const first = game.scenes[0]?.links[0];
  const out: Playtest = { runs, unreached: [], won: false, cancelled: false };
  if (!first || first.toScene === NOSCENE) return out;
  const queue: { scene: number; from: { scene: number; link: number }; entry: Entry }[] = [
    { scene: first.toScene, from: { scene: 0, link: 0 }, entry: { start: first.to, ci: startCharInfo(), clock: 1 } },
  ];
  const seen = new Set<number>([first.toScene]);
  const levels = levelScenes(game);
  while (queue.length) {
    const job = queue.shift()!;
    const r = await checkScene(game, files, job.scene, job.from, job.entry, opt, runs.length, Math.max(levels.length, runs.length + 1));
    if (!r) {
      out.cancelled = true;
      break;
    }
    runs.push(r);
    for (const e of r.ex.exits) {
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
  let cancelled = false;
  const ex = await explore(game, scene, files, entry, {
    budgetMs: opt.budgetMs,
    progress: (places) => {
      if (opt.progress?.(scene, done, total, places)) cancelled = true;
      return cancelled;
    },
  });
  if (cancelled) return undefined;
  const s = game.scenes[scene];
  const mapBytes = files.get(s.files[1]);
  const bblBytes = s.files[2] ? files.get(s.files[2]) : undefined;
  const stuck = mapBytes && bblBytes ? stuckAreas(ex, parseMap(mapBytes).blocks, parseBlocks(bblBytes, BACKBL)) : [];
  return { scene, name: s.desc.trim() || `Scene ${scene}`, from, ex, stuck, hpIn: entry.ci.hitpts };
}
