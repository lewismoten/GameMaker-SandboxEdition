// Watching how a scene is played, in the walkthrough player (the real engine, with play and pause
// and a seek bar): the walkthrough bot's route through it (the game's walkthrough from Make a
// walkthrough, started at this scene's chapter; or, when that has no route here, one the bot
// makes for this scene alone in its worker, kept in the companion), and the author's own play
// of it (check/walk/mine.ts). A one-scene walkthrough plays with the game started at the
// scene, as the play test starts it, and is checked and timed in the worker first. A route made
// for one scene keeps a fingerprint of the scene's files, so the panel
// can say when the map changed since and offer to make it again (check/walk/botRoutes.ts).
import { toast } from '../core/ui';
import type { Project } from '../core/project';
import { GameFiles, type CatalogEntry } from '../../project/files';
import { serializeGame } from '../../formats/game';
import type { Walkthrough } from '../../walkthrough/format';
import { myPlays, oneScene } from '../check/walk/mine';
import { startWalk } from '../check/walk/walkClient';
import { allWalkPaths } from '../check/walk/walkPaths';
import { botRoutes, keepBotRoute, walkthroughThrough } from '../check/walk/botRoutes';
import { startingAt } from '../editors/integrator/startAt';

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
  const running = startWalk(
    project.files,
    { gam: project.gam, id: project.id, budgetMs: 60_000, only: scene, walk, paths: allWalkPaths(project, project.game()) },
    say,
  );
  signal?.addEventListener('abort', () => running.cancel());
  const { result } = await running.done;
  return result.walk?.timeline.frames ? result.walk : undefined;
}

/** Has the bot make a route through `scene` alone now, in its worker, and keeps it (replacing any). True when it found one. */
export async function makeBotRoute(project: Project, scene: number, say: (what: string) => void, signal?: AbortSignal): Promise<boolean> {
  const name = sceneName(project, scene);
  say('Starting the bot…');
  const walk = await inWorker(project, scene, say, undefined, signal);
  if (!walk) {
    say(`The bot found no way through ${name} in a minute: the Level check’s heat map shows where it can go.`);
    return false;
  }
  keepBotRoute(project, scene, walk);
  say(`The bot found a way through ${name}.`);
  return true;
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
  const whole = walkthroughThrough(project, scene);
  if (whole) return play(project, `${name}, the walkthrough bot`, project.files.copy(), whole, scene);
  if (!botRoutes(project)[scene] && (!(await make()) || !(await makeBotRoute(project, scene, say, signal)))) return;
  const route = botRoutes(project)[scene]?.walk;
  if (route) return play(project, `${name}, the bot`, startedAt(project, scene), route, scene);
}

/** Plays the author's own kept play of `scene`. */
export async function watchMine(project: Project, scene: number, say: (what: string) => void, signal?: AbortSignal): Promise<void> {
  const mine = myPlays(project)[scene];
  if (!mine) return void toast('There is no play of yours to watch here yet: record one first.');
  const name = sceneName(project, scene);
  const walk = await inWorker(project, scene, say, oneScene(project.id, scene, name, mine.keys, mine.next === 1, false), signal);
  if (!walk) return say('Your play could not be played back.');
  say('');
  return play(project, `${name}, your play`, startedAt(project, scene), walk, scene);
}
