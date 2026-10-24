// Totals counted from the games catalog: every Sandbox game played, every Bard of Bizarre game
// played, every Teddy game finished, every walkthrough watched. The catalog given out (loadGameList) already leaves out a
// game that is kept out of sight until it is found, so such a game never counts, and is never
// named, until the lists show it anyway.
import { isSandboxGame, loadGameList, type CatalogEntry } from '../project/files';
import { isBizarreGame } from '../project/bizarre';
import type { Goal } from './catalog';
import { currentAchievements, loadAchievements, progress, remember } from './store';

type Listed = Pick<CatalogEntry, 'id' | 'original' | 'company' | 'series' | 'walkthrough'>;

/** Which set of the record each catalog goal counts. */
const GOAL_SET: Partial<Record<Goal, string>> = { sandbox: 'played', bizarre: 'played', teddy: 'finished', walkthroughs: 'watched' };

/** A Teddy game: Sandbox Software's teddy, teddy2, teddy3… (a new one counts once the catalog lists it). */
const isTeddyGame = (g: Listed) => isSandboxGame(g) && /^teddy\d*$/.test(g.id);

/** The catalog games a goal counts. */
export function goalTargets(catalog: readonly Listed[], goal: Goal): string[] {
  const pick =
    goal === 'sandbox'
      ? isSandboxGame
      : goal === 'bizarre'
        ? isBizarreGame
        : goal === 'teddy'
          ? isTeddyGame
          : goal === 'walkthroughs'
            ? (g: Listed) => !!g.original && !!g.walkthrough
            : () => false;
  return catalog.filter((g) => pick(g as CatalogEntry)).map((g) => g.id);
}

/** How many of the targets are done. */
export function goalProgress(targets: readonly string[], done: readonly string[]): { n: number; of: number } {
  const d = new Set(done);
  return { n: targets.filter((t) => d.has(t)).length, of: targets.length };
}

/** Brings every catalog-counted achievement up to date with the record's sets. */
export async function refreshGoals(catalog?: readonly Listed[]): Promise<void> {
  const list = catalog ?? (await loadGameList().catch(() => []));
  const r = currentAchievements() ?? (await loadAchievements());
  const { ACHIEVEMENTS } = await import('./catalog');
  for (const a of ACHIEVEMENTS) {
    const set = a.from && GOAL_SET[a.from];
    if (!set) continue;
    const p = goalProgress(goalTargets(list, a.from!), r.sets[set] ?? []);
    if (p.of) progress(a.id, p.n, p.of);
  }
}

/** A catalog game was played ('game:<id>' save ids and bare ids both do). */
export async function notePlayed(gameId: string | undefined): Promise<void> {
  const id = gameId?.replace(/^game:/, '');
  if (!id || gameId?.startsWith('project:')) return;
  await remember('played', id);
  await refreshGoals();
}

/** A catalog game was played to its ending (the Game Won scene). */
export async function noteFinished(gameId: string | undefined): Promise<void> {
  const id = gameId?.replace(/^game:/, '');
  if (!id || gameId?.startsWith('project:')) return;
  await remember('finished', id);
  await refreshGoals();
}

/** A catalog game's walkthrough was watched to its end. */
export async function noteWatched(gameId: string | undefined): Promise<void> {
  if (!gameId) return;
  await remember('watched', gameId.replace(/^game:/, ''));
  await refreshGoals();
}
