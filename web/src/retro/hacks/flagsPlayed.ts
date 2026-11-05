// FLAGS PLAYED: how many Starters, Sandbox games and Bard of Bizarre games the badge record counts
// as played and as played to the end, and a way to set that to a number (for trying Show and tell,
// Honor roll and the count badges at "n of N"). It counts only games the lists show, so a game kept
// out of sight is never counted or named. Scope: the merit-badge record in this browser, never a
// game's save file.
import { loadAchievements, replaceAchievements } from '../../achievements/store';
import { goalTargets, refreshGoals } from '../../achievements/goals';
import { loadGameList } from '../../project/files';

type Group = 'STARTERS' | 'SANDBOX' | 'BIZARRE';
const GOALS = { STARTERS: ['starters', 'startersDone'], SANDBOX: ['sandbox', 'sandboxDone'], BIZARRE: ['bizarre', 'bizarreDone'] } as const;
export const PLAYED_GROUPS = Object.keys(GOALS) as Group[];

/** A mistake in the command's words (flagsItems turns it into a FlagError). */
export class PlayedError extends Error {}

async function groups() {
  const list = await loadGameList().catch(() => []);
  return PLAYED_GROUPS.map((g) => ({ g, played: goalTargets(list, GOALS[g][0]), done: goalTargets(list, GOALS[g][1]) }));
}

/** "STARTERS 3/69 played, 1 finished; ..." from the record. */
export async function playedSummary(): Promise<string> {
  const r = await loadAchievements();
  const has = (set: string, ids: string[]) => ids.filter((id) => (r.sets[set] ?? []).includes(id)).length;
  return (await groups())
    .filter((x) => x.played.length)
    .map((x) => `${x.g} ${has('played', x.played)}/${x.played.length} played, ${has('finished', x.done)} finished`)
    .join('; ');
}

/** SET/CLEAR PLAYED <group> <n|ALL|NONE> [DONE]: the first n games of the group count as played (and finished with DONE). */
export async function setPlayed(words: string[], clear: boolean): Promise<string> {
  const group = (words[0] ?? '').toUpperCase();
  const found = (await groups()).find((x) => x.g === group);
  if (!found) throw new PlayedError(`Which group? ${PLAYED_GROUPS.join(', ')}`);
  const arg = (words[1] ?? (clear ? 'NONE' : '')).toUpperCase();
  const n = arg === 'ALL' ? found.played.length : arg === 'NONE' ? 0 : /^\d+$/.test(arg) ? Number(arg) : -1;
  if (n < 0 || n > found.played.length) throw new PlayedError(`How many? 0 to ${found.played.length}, ALL or NONE`);
  const withDone = (words[2] ?? '').toUpperCase() === 'DONE';
  const r = structuredClone(await loadAchievements());
  const apply = (set: string, targets: string[], count: number) => {
    const keep = (r.sets[set] ?? []).filter((id) => !targets.includes(id));
    r.sets[set] = [...keep, ...targets.slice(0, count)];
  };
  apply('played', found.played, n);
  apply('finished', found.done, withDone ? n : 0);
  await replaceAchievements(r);
  await refreshGoals();
  return `${found.g}: ${n} of ${found.played.length} count as played${withDone ? ' and finished' : ', none as finished'}.`;
}
