// Watching how a scene is played, in the walkthrough player (the real engine, with play and pause
// and a seek bar): the walkthrough bot's route through it (the game's walkthrough from Make a
// walkthrough, started at this scene's chapter; or, when that has no route here, one the bot
// makes for this scene alone in its worker, kept in the companion), and the author's own play
// of it (check/walk/mine.ts). A one-scene walkthrough plays with the game started at the
// scene, as the play test starts it, and is checked and timed in the worker first.
import { toast } from '../core/ui';
import type { Project } from '../core/project';
import { GameFiles, type CatalogEntry } from '../../project/files';
import { serializeGame } from '../../formats/game';
import type { Walkthrough } from '../../walkthrough/format';
import { myPlays, oneScene } from '../check/walk/mine';
import { startWalk } from '../check/walk/walkClient';
import { startingAt } from '../editors/integrator/startAt';
import type { SavedWalk } from './walkDialog';

/** A route the bot made for one scene alone (section "botRoutes" of the .gam, by scene). */
interface BotRoute {
  when: string;
  walk: Walkthrough;
}

const ROUTES = 'botRoutes';

const sceneName = (project: Project, scene: number) => project.game().scenes[scene]?.desc.trim() || `Scene ${scene}`;

/** The project's files with the game started at `scene`. */
function startedAt(project: Project, scene: number): GameFiles {
  const files = new GameFiles(project.files.entries());
  files.set(project.gam, serializeGame(startingAt(project.game(), scene)));
  return files;
}

async function play(project: Project, title: string, files: GameFiles, walk: Walkthrough, scene: number): Promise<void> {
  const mark = walk.chapters.find((c) => c.scene === scene)?.title;
  const chapter = walk.timeline.chapters.findIndex((c) => c.title === (mark || sceneName(project, scene)));
  const entry = { id: `project:${project.id}`, title, gam: project.gam, kind: 'mine', path: '', files: [] } as unknown as CatalogEntry;
  const { watchWalkthrough } = await import('../../walkthrough/player');
  await watchWalkthrough(entry, () => Promise.resolve(files), undefined, walk, chapter >= 0 ? chapter : undefined);
}

/** Checks and times a one-scene walkthrough in the walkthrough bot's worker (or, with `walk` left out, has the bot make one). */
async function inWorker(
  project: Project,
  scene: number,
  say: (what: string) => void,
  walk?: Walkthrough,
  signal?: AbortSignal,
): Promise<Walkthrough | undefined> {
  const running = startWalk(project.files, { gam: project.gam, id: project.id, budgetMs: 60_000, only: scene, walk }, say);
  signal?.addEventListener('abort', () => running.cancel());
  const { result } = await running.done;
  return result.walk?.timeline.frames ? result.walk : undefined;
}

/** Whether the bot has a route through `scene` to show: in the game's walkthrough, or one made for the scene alone. */
export function botHasRoute(project: Project, scene: number): boolean {
  const saved = project.extras<SavedWalk | undefined>(project.gam, 'walkthrough', undefined);
  if (saved?.walk?.timeline.frames && saved.walk.segments.some((s) => s.scene === scene)) return true;
  return !!project.extras<Record<string, BotRoute>>(project.gam, ROUTES, {})[scene];
}

/**
 * Plays the bot's route through `scene`. With none yet, `make` says whether to have the bot
 * make one now (for this scene alone, in its worker; `say` hears how it goes).
 */
export async function watchBot(
  project: Project,
  scene: number,
  say: (what: string) => void,
  make: () => Promise<boolean>,
  signal?: AbortSignal,
): Promise<void> {
  const name = sceneName(project, scene);
  const saved = project.extras<SavedWalk | undefined>(project.gam, 'walkthrough', undefined);
  if (saved?.walk?.timeline.frames && saved.walk.segments.some((s) => s.scene === scene))
    return play(project, `${name}: the walkthrough bot`, project.files.copy(), saved.walk, scene);
  const routes = project.extras<Record<string, BotRoute>>(project.gam, ROUTES, {});
  let route: Walkthrough | undefined = routes[scene]?.walk;
  if (!route) {
    if (!(await make())) return;
    say('Starting the bot…');
    route = await inWorker(project, scene, say, undefined, signal);
    if (!route) {
      say(`The bot found no way through ${name} in a minute: the Level check’s heat map shows where it can go.`);
      return;
    }
    project.setExtras(project.gam, ROUTES, { ...routes, [scene]: { when: new Date().toISOString(), walk: route } satisfies BotRoute });
    say(`The bot found a way through ${name}.`);
  }
  return play(project, `${name}: the bot`, startedAt(project, scene), route, scene);
}

/** Forgets the route the bot made for `scene` alone (the map changed: it is made again when next watched). */
export function forgetBotRoute(project: Project, scene: number): void {
  const { [scene]: _gone, ...rest } = project.extras<Record<string, BotRoute>>(project.gam, ROUTES, {});
  project.setExtras(project.gam, ROUTES, Object.keys(rest).length ? rest : undefined);
}

/** Plays the author's own kept play of `scene`. */
export async function watchMine(project: Project, scene: number, say: (what: string) => void, signal?: AbortSignal): Promise<void> {
  const mine = myPlays(project)[scene];
  if (!mine) return void toast('There is no play of yours to watch here yet: record one first.');
  const name = sceneName(project, scene);
  const walk = await inWorker(project, scene, say, oneScene(project.id, scene, name, mine.keys, mine.next === 1, false), signal);
  if (!walk) return say('Your play could not be played back.');
  say('');
  return play(project, `${name}: your play`, startedAt(project, scene), walk, scene);
}
