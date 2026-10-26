// Started once by each page (main.ts, play.ts): unlocks what other parts of the page report
// with a `gm-achievement` event ({ detail: { id } }, e.g. the desk's room props, or { id, item }
// to count an item toward a fixed total, e.g. the World Map's styles), follows other
// tabs, and keeps the counted achievements (tin hearts, felt eggs, every game played) in step
// with the saves and the catalog as they change.
import { refreshGoals } from './goals';
import { listenToOtherTabs, loadAchievements, progress, tally, unlockAchievement } from './store';

/** The event other code fires to unlock one: new CustomEvent(ACHIEVEMENT_EVENT, { detail: { id } }), or { id, item } to tally an item. */
const ACHIEVEMENT_EVENT = 'gm-achievement';

let started = false;

export function startAchievements(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener(ACHIEVEMENT_EVENT, (e) => {
    const { id, item } = (e as CustomEvent<{ id?: unknown; item?: unknown } | null>).detail ?? {};
    if (typeof id === 'string' && typeof item === 'string') tally(id, item);
    else if (typeof id === 'string') unlockAchievement(id);
    // eslint-disable-next-line no-console -- a development-only note
    else if (import.meta.env?.DEV) console.info('[achievements] gm-achievement without an id', e);
  });
  listenToOtherTabs();
  // the rest can wait for a quiet moment
  const idle = (f: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(f, { timeout: 4000 }) : setTimeout(f, 1500));
  idle(() => void watchCounts());
}

/** Calls f at most once per `ms` after a burst of calls. */
function settle(f: () => void, ms = 600): () => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(t);
    t = setTimeout(f, ms);
  };
}

async function watchCounts(): Promise<void> {
  await loadAchievements();
  const [{ huntStates, watchHearts }, { eggStates, EGGS_CHANGED }, { SAVES_CHANGED }, { CATALOG_CHANGED }, { laidFromSaves }] = await Promise.all([
    import('../tinHearts/tinHearts'),
    import('../eggs/eggState'),
    import('../project/storage'),
    import('../project/catalogWatch'),
    import('../eggs/teddyEgg'),
  ]);
  // only finds made in a game count, not ones EGG.EXE adds by hand
  const hearts = async () => {
    const s = await huntStates().catch(() => []);
    const n = s.filter((x) => x.inSave).length;
    if (n) unlockAchievement('heart-first');
    if (s.length) progress('heart-all', n, s.length);
  };
  const eggs = async () => {
    const s = await eggStates().catch(() => []);
    const n = s.filter((x) => x.inSave).length;
    if (n) unlockAchievement('egg-first');
    if (laidFromSaves(s)) unlockAchievement('egg-teddy');
    if (s.length && n) progress('egg-all', n, s.length);
  };
  const onHearts = settle(() => void hearts());
  const onEggs = settle(() => void eggs());
  watchHearts(onHearts);
  window.addEventListener(EGGS_CHANGED, onEggs);
  window.addEventListener(SAVES_CHANGED, onEggs);
  window.addEventListener(CATALOG_CHANGED, () => void refreshGoals());
  await Promise.all([hearts(), eggs(), refreshGoals()]);
}
