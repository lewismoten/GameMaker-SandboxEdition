// The map picture dialog's "As players see it": the map as a strategy guide or poster shows it,
// for players to find their way. The explorer plays every scene on the map from every way in, in
// its own worker (check/unrollClient.ts), to find what the player sees; a map the hero walks off
// the edge of is laid out as the player goes through it (check/unroll.ts). It is drawn as the
// printed Level Maps draw a level, with where you arrive and the ways out marked
// (manual/printables/levelPoster.ts, loaded when first used); a released game opened to look
// inside keeps its tin heart and eggs hidden, as there. What was found is kept until the
// map, its blocks or its monsters change.
import type { Project } from '../../core/project';
import type { Level } from '../../../manual/printables/levelMapLayout';
import type { MapUnroll } from '../../check/unrollMap';
import { fnv1a } from '../../../seededRandom';
import { ADVTYPE } from '../../../formats/game';
import { lookedAt } from '../../shell/lookId';

/** How long the explorer plays, all ways in together. */
const BUDGET_MS = 30_000;

const found = new Map<string, MapUnroll>();

/** What the picture depends on: the game and the scene's files, by their bytes. */
function stamp(project: Project, names: string[]): string {
  let s = '';
  for (const n of names) {
    const b = project.files.get(n);
    if (b) for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    s += `|${b?.length ?? 0}|`;
  }
  return `${names.join(',')}:${fnv1a(s)}`;
}

/** The scene files the poster draws with, or undefined when no scene plays on `file`. */
export function posterScene(project: Project, file: string): { bbl: string; names: string[] } | undefined {
  const s = project.game().scenes.find((x) => x.gametype === ADVTYPE && x.files[1]?.toLowerCase() === file.toLowerCase() && x.files[2]);
  return s ? { bbl: s.files[2].toLowerCase(), names: [project.gam, ...s.files.slice(0, 5).filter(Boolean)].map((n) => n.toLowerCase()) } : undefined;
}

/** Finds what the player sees of `file` (or takes what was found before); `progress` hears each way in. */
export function findPlayersView(
  project: Project,
  file: string,
  progress: (done: number, total: number) => void,
): { done: Promise<{ level: Level; complete: boolean } | undefined>; cancel(): void } {
  const scene = posterScene(project, file);
  if (!scene) return { done: Promise.resolve(undefined), cancel: () => undefined };
  const map = file.toLowerCase();
  const key = stamp(project, scene.names);
  let cancel = () => undefined as void;
  const level = async (f: MapUnroll): Promise<{ level: Level; complete: boolean } | undefined> => {
    const [{ levelsOf }, { listedSecrets }] = await Promise.all([
      import('../../../manual/printables/levelMapLayout'),
      import('../../../manual/printables/levelSecrets'),
    ]);
    // a released game's tin heart and eggs stay hidden, as on its printed Level Maps
    const looked = lookedAt(project.id);
    const secret = (looked && listedSecrets(looked)) || {};
    const k = `${map}|${scene.bbl}`;
    const views = f.seen ? { [k]: f.seen } : {};
    const unrolled = f.unrolled ? { [k]: f.unrolled } : {};
    const l = levelsOf(project.game(), project.files, secret, views, unrolled).find((x) => x.group.map === map && x.group.bbl === scene.bbl);
    return l && { level: l, complete: f.complete };
  };
  const known = found.get(key);
  if (known) return { done: level(known), cancel };
  const done = import('../../check/unrollClient').then(async ({ startUnroll }) => {
    const run = startUnroll(project.files, { gam: project.gam, map, bbl: scene.bbl, budgetMs: BUDGET_MS }, progress);
    cancel = () => run.cancel();
    const f = await run.done;
    found.set(key, f);
    return level(f);
  });
  return { done, cancel: () => cancel() };
}

/** The poster as a PNG, `scale` x 20 pixels a block. */
export async function posterPng(project: Project, level: Level, scale: number): Promise<Blob | undefined> {
  const { levelPoster } = await import('../../../manual/printables/levelPoster');
  return levelPoster(project.game(), project.files, project.name, level, scale);
}
