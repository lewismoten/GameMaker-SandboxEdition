// Totals counted from the games catalog: every Sandbox game and every Bard of Bizarre game
// played and finished, every Teddy game finished, every walkthrough watched. The catalog given out (loadGameList) already leaves out a
// game that is kept out of sight until it is found, so such a game never counts, and is never
// named, until the lists show it anyway.
import { isSandboxGame, loadLeanGameList as loadGameList, type CatalogEntry } from '../project/files';
import { isBizarreGame } from '../project/bizarre';
import { isStarterGame } from '../project/starter';
import { isCeremony } from '../project/ceremonies';
import { noteHonor } from './honorDates';
import type { Goal } from './catalog';
import { currentAchievements, loadAchievements, progress, remember, countOccurrence, unlockAchievement } from './store';

import { REPEAT_TIERS, REPEAT_SETS, repeatProgress, type PlayOutcome, type RepeatGoal } from './repeatGoals';

type Listed = Pick<CatalogEntry, 'id' | 'original' | 'company' | 'series' | 'walkthrough'> & Partial<Pick<CatalogEntry, 'gam'>>;

/** Which set of the record each catalog goal counts. */
const GOAL_SET: Partial<Record<Goal, string>> = {
  sandbox: 'played',
  bizarre: 'played',
  sandboxDone: 'finished',
  bizarreDone: 'finished',
  starters: 'played',
  startersDone: 'finished',
  teddy: 'finished',
  walkthroughs: 'watched',
  playedCount: 'played',
  finishedCount: 'finished',
  watchedCount: 'watched',
  ...REPEAT_SETS,
};

/** A Teddy game: Sandbox Software's teddy, teddy2, teddy3… (a new one counts once the catalog lists it). */
const isTeddyGame = (g: Listed) => isSandboxGame(g) && /^teddy\d*$/.test(g.id);

/** The catalog games a goal counts. */
export function goalTargets(catalog: readonly Listed[], goal: Goal): string[] {
  if (goal in REPEAT_SETS) return catalog.filter((g) => !!g.gam).map((g) => g.id);
  const pick =
    goal === 'sandbox' || goal === 'sandboxDone'
      ? isSandboxGame
      : goal === 'bizarre' || goal === 'bizarreDone'
        ? isBizarreGame
        : goal === 'starters' || goal === 'startersDone'
          ? isStarterGame
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
  // an honors badge for each graduation game in the finished set (also those finished before the badges existed)
  for (const id of r.sets.finished ?? []) if (isCeremony(id)) unlockAchievement(`honor-${id}`);
  for (const a of ACHIEVEMENTS) {
    const set = a.from && GOAL_SET[a.from];
    if (!set) continue;
    if (a.count) {
      // a count level: distinct listed games in the record (a game the lists keep out of sight never counts)
      const listed = new Set(list.map((g) => g.id));
      progress(a.id, Math.min(new Set((r.sets[set] ?? []).filter((id) => listed.has(id))).size, a.count), a.count);
      continue;
    }
    const targets = goalTargets(list, a.from!);
    const p = a.times ? repeatProgress(targets, r.sets, REPEAT_SETS[a.from as RepeatGoal], a.times) : goalProgress(targets, r.sets[set] ?? []);
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
  if (isCeremony(id)) noteHonor(id);
  await refreshGoals();
}

/** A catalog game's walkthrough was watched to its end. */
export async function noteWatched(gameId: string | undefined): Promise<void> {
  if (!gameId) return;
  await remember('watched', gameId.replace(/^game:/, ''));
  await refreshGoals();
}

/** A real play event in a currently listed game; projects, bundles and unknown ids do not count. */
export async function noteOutcome(gameId: string | undefined, outcome: PlayOutcome): Promise<void> {
  if (!gameId || /^(?:project|bundle):/.test(gameId)) return;
  const id = gameId.replace(/^game:/, '');
  const list = await loadGameList().catch(() => []);
  if (!list.some((g) => g.id === id && !!g.gam)) return;
  await countOccurrence(`${outcome}:${id}`, Math.max(...REPEAT_TIERS));
  await refreshGoals(list);
}
