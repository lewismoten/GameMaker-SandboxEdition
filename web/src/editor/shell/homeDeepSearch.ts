// The home page's deeper search, wired up (home.ts): on the search box's first focus it starts
// reading every listed game's text in the background (deepIndex.ts), and the page asks it
// which games a query also finds, and where. Nothing starts at page load. No DOM.
import { createDeepIndex, hintOf, type DeepIndex, type DeepStore } from './deepIndex';
import { deepSourceOf } from './deepSources';
import { hydrateFiles } from '../../project/files';
import { queryWords } from './searchMatch';
import type { HomeGame } from './homeCards';
import type { DeepJob, DeepPart } from './deepExtract';

interface Wiring {
  /** Every game the home page lists, in every collection. */
  games(): HomeGame[];
  /** Called (not more than about once a second) when more games became searchable. */
  onMore(): void;
  /** Test seams; the page uses the worker, IndexedDB and idle time. */
  extract?: (job: DeepJob) => Promise<DeepPart[]>;
  store?: DeepStore;
  idle?: () => Promise<void>;
}

const idleTime = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => resolve(), { timeout: 1500 });
    else setTimeout(resolve, 50);
  });

export function homeDeepSearch(w: Wiring) {
  let index: DeepIndex | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const more = () => {
    timer ??= setTimeout(() => {
      timer = undefined;
      w.onMore();
    }, 800);
  };
  const ensure = async () => {
    if (!index) {
      const [{ extractInWorker }, { idbDeepStore }] = await Promise.all([
        w.extract ? Promise.resolve({ extractInWorker: w.extract }) : import('./deepIndexClient'),
        w.store ? Promise.resolve({ idbDeepStore: w.store }) : import('./deepStore'),
      ]);
      index ??= createDeepIndex({ store: idbDeepStore, extract: extractInWorker, idle: w.idle ?? idleTime, onMore: more });
    }
    return index;
  };
  return {
    /** The search box got focus: start (or widen) the background read. */
    async focus(): Promise<void> {
      const i = await ensure();
      await hydrateFiles(w.games().flatMap((g) => g.entry ?? [])).catch(() => undefined); // the lean list's file names, which the read lists
      i.start(w.games().flatMap((g) => deepSourceOf(g) ?? []));
    },
    /** Game key to the words found inside it, for a query. */
    find(query: string): Map<string, string> {
      const words = queryWords(query);
      const out = new Map<string, string>();
      if (!index || !words.length) return out;
      // only games listed now: a secret game locked again drops out, though its text is in memory
      const listed = new Set(w.games().map((g) => g.key));
      for (const [key, part] of index.find(words)) if (listed.has(key)) out.set(key, hintOf(part));
      return out;
    },
    stop(): void {
      index?.stop();
      if (timer) clearTimeout(timer);
      timer = undefined;
    },
  };
}
