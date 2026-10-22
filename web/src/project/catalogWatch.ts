// Keeps the listings live when a secret game (project/secretGames.ts) is revealed or hidden
// again: EGG.EXE adding, breaking or resetting an egg (here or in another tab), or a game
// saved with an egg in it. When what the catalog shows no longer matches, the catalog is
// forgotten and CATALOG_CHANGED is fired on window, so whatever lists games can list them
// afresh with loadCatalog. No page reload.
import { EGGS_CHANGED, OVERRIDES_KEY } from '../eggs/eggState';
import { forgetCatalog } from './files';
import { secretsListed, secretsRevealed } from './secretGames';
import { SAVES_CHANGED } from './storage';

/** Fired on window (a CustomEvent whose detail is { revealed }) when the catalog's list changes. */
export const CATALOG_CHANGED = 'gm-catalog-changed';
/** How often the saves are looked at while the page shows (a game saved in another tab). */
const POLL_MS = 8000;

/** Whether the listings must change: they were given out, and the eggs now say otherwise. */
export const catalogStale = (listed: boolean | undefined, revealed: boolean): boolean => listed !== undefined && listed !== revealed;

let chain: Promise<void> = Promise.resolve();
/** What the watchers were last told the lists show (kept apart: a list loaded meanwhile is not news to them). */
let told: boolean | undefined;

async function check(): Promise<void> {
  told ??= secretsListed();
  if (told === undefined) return;
  const revealed = await secretsRevealed();
  if (!catalogStale(told, revealed)) return;
  told = revealed;
  forgetCatalog();
  window.dispatchEvent(new CustomEvent(CATALOG_CHANGED, { detail: { revealed } }));
}

/** Looks again now (one look at a time, in order). */
export function checkCatalog(): Promise<void> {
  return (chain = chain.then(check, check).catch(() => undefined));
}

const watchers = new Set<(revealed: boolean) => void>();
let stop: (() => void) | undefined;

function start(): () => void {
  const onChange = () => void checkCatalog();
  const onVisible = () => document.visibilityState === 'visible' && onChange();
  // EGG.EXE in another tab: tell this tab's egg display too (its own EGGS_CHANGED looks again)
  const onStorage = (e: StorageEvent) => (e.key === OVERRIDES_KEY || e.key === null) && window.dispatchEvent(new Event(EGGS_CHANGED));
  const onCatalog = (e: Event) => {
    const { revealed } = (e as CustomEvent<{ revealed: boolean }>).detail;
    for (const w of [...watchers]) w(revealed);
  };
  window.addEventListener(EGGS_CHANGED, onChange);
  window.addEventListener(SAVES_CHANGED, onChange);
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', onChange);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener(CATALOG_CHANGED, onCatalog);
  const poll = setInterval(() => document.visibilityState === 'visible' && onChange(), POLL_MS);
  return () => {
    clearInterval(poll);
    window.removeEventListener(EGGS_CHANGED, onChange);
    window.removeEventListener(SAVES_CHANGED, onChange);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('focus', onChange);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener(CATALOG_CHANGED, onCatalog);
  };
}

/**
 * Calls `then` (with whether the secret games now show) each time the catalog's list
 * changes, until the returned function is called. Watching starts with the first caller.
 */
export function onCatalogChanged(then: (revealed: boolean) => void): () => void {
  watchers.add(then);
  told ??= secretsListed();
  stop ??= start();
  return () => {
    watchers.delete(then);
    if (watchers.size) return;
    stop?.();
    stop = undefined;
    told = undefined;
  };
}
