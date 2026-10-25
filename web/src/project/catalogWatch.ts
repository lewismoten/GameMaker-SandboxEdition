// Keeps the listings live when a secret game (project/secretGames.ts) is revealed or hidden
// again: EGG.EXE adding, breaking or resetting an egg or a tin heart (here or in another tab),
// or a game saved with an egg in it or a heart found. When what the catalog shows no longer matches, the catalog is
// forgotten and CATALOG_CHANGED is fired on window, so whatever lists games can list them
// afresh with loadCatalog. No page reload.
import { EGGS_CHANGED, OVERRIDES_KEY } from '../eggs/eggState';
import { forgetCatalog } from './files';
import { secretsListed, secretsRevealed } from './secretGames';
import { SAVES_CHANGED } from './storage';

/** Fired on window (a CustomEvent whose detail is { revealed }: the open gates, 0 for none) when the catalog's list changes. */
export const CATALOG_CHANGED = 'gm-catalog-changed';
/** How often the saves are looked at while the page shows (a game saved in another tab). */
const POLL_MS = 8000;

/** Whether the listings must change: they were given out, and the eggs or hearts now say otherwise. */
export const catalogStale = (listed: number | undefined, revealed: number): boolean => listed !== undefined && listed !== revealed;

let chain: Promise<void> = Promise.resolve();
/** What the watchers were last told the lists show (kept apart: a list loaded meanwhile is not news to them). */
let told: number | undefined;

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
function checkCatalog(): Promise<void> {
  return (chain = chain.then(check, check).catch(() => undefined));
}

const watchers = new Set<(revealed: number) => void>();
let stop: (() => void) | undefined;

function start(): () => void {
  const onChange = () => void checkCatalog();
  const onVisible = () => document.visibilityState === 'visible' && onChange();
  // EGG.EXE in another tab: tell this tab's egg display too (its own EGGS_CHANGED looks again)
  const onStorage = (e: StorageEvent) => (e.key === OVERRIDES_KEY || e.key === null) && window.dispatchEvent(new Event(EGGS_CHANGED));
  const onCatalog = (e: Event) => {
    const { revealed } = (e as CustomEvent<{ revealed: number }>).detail;
    for (const w of [...watchers]) w(revealed);
  };
  window.addEventListener(EGGS_CHANGED, onChange);
  window.addEventListener(SAVES_CHANGED, onChange);
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', onChange);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener(CATALOG_CHANGED, onCatalog);
  const poll = setInterval(() => document.visibilityState === 'visible' && onChange(), POLL_MS);
  // a tin heart found or changed (the hearts' own event and EGG.EXE's page for them)
  let stopHearts: (() => void) | undefined;
  let stopped = false;
  void import('../tinHearts/tinHearts').then(({ watchHearts }) => {
    if (!stopped) stopHearts = watchHearts(onChange);
  });
  return () => {
    stopped = true;
    stopHearts?.();
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
 * Calls `then` (with the gates whose secret games now show, 0 for none) each time the catalog's list
 * changes, until the returned function is called. Watching starts with the first caller.
 */
export function onCatalogChanged(then: (revealed: number) => void): () => void {
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
