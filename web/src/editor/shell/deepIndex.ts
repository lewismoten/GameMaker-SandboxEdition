// Home search, deeper: indexes the text of every game the home page lists, one game at a time
// in the background, so a search also finds words inside games. It only starts when told (the
// search box gets focus), waits for idle time between games, and keeps what it read in a store
// (IndexedDB, deepStore.ts) keyed by game and version, so the next visit starts with it. A
// store that fails costs only the speed. The text itself is read by deepExtract.ts in a Web
// Worker (deepIndexClient.ts). No DOM.
import { matches } from './searchMatch';
import type { Part } from './searchMatch';
import type { DeepJob, DeepPart } from './deepExtract';

/** Where a game's files and words come from; home.ts builds one per HomeGame. */
export interface DeepSource {
  /** The game's key on the home page (`cd:<id>` or `my:<id>`). */
  key: string;
  /** Changes when the game does (a pack hash, an edit time), so a cached index is dropped. */
  version: string;
  /** Every file name. */
  names: string[];
  /** Reads the files worth reading, by the site's own loaders. */
  readFiles(): Promise<[string, Uint8Array][]>;
  /** Words outside the files (blurb, box text, questions), and a project's companion. */
  readExtras(): Promise<Pick<DeepJob, 'extras' | 'companion'>>;
}

export interface DeepStore {
  get(key: string): Promise<DeepPart[] | undefined>;
  put(key: string, parts: DeepPart[]): Promise<void>;
}

interface Options {
  store: DeepStore;
  extract(job: DeepJob): Promise<DeepPart[]>;
  /** Resolves when the browser can spare time (requestIdleCallback, or a short wait). */
  idle(): Promise<void>;
  /** More games are searchable now. */
  onMore(): void;
}

/** What a hit says: where the words were found. */
export function hintOf(p: DeepPart): string {
  if (!p.file) return `found in ${p.label.toLowerCase()}`;
  return p.label === 'Name' ? `found: file ${p.file}` : `found in ${p.file}`;
}

export function createDeepIndex(o: Options) {
  const parts = new Map<string, DeepPart[]>();
  let running = false;
  let queue: DeepSource[] = [];
  let total = 0;
  let epoch = 0;

  const one = async (s: DeepSource) => {
    const id = `${s.key}|${s.version}`;
    let got: DeepPart[] | undefined;
    try {
      got = await o.store.get(id);
    } catch {
      got = undefined;
    }
    if (!got) {
      try {
        const [files, more] = await Promise.all([s.readFiles(), s.readExtras()]);
        got = await o.extract({ names: s.names, files, ...more });
      } catch {
        got = []; // unreadable now: its names and words stay searchable the usual way
      }
      void o.store.put(id, got).catch(() => undefined);
    }
    parts.set(s.key, got);
    o.onMore();
  };

  const run = async (mine: number) => {
    running = true;
    try {
      for (let s = queue.shift(); s && mine === epoch; s = queue.shift()) {
        await o.idle();
        if (mine !== epoch) break;
        await one(s);
      }
    } finally {
      running = false;
    }
  };

  return {
    /** Starts (or widens) the run with these games; a game already read is not read again. */
    start(sources: DeepSource[]): void {
      const fresh = sources.filter((s) => !parts.has(s.key) && !queue.some((q) => q.key === s.key));
      queue.push(...fresh);
      total = parts.size + queue.length;
      if (!running && queue.length) void run(epoch);
    },
    /** Drops what is waiting (the page is leaving). */
    stop(): void {
      epoch++;
      queue = [];
    },
    /** For each game with a line holding every word, the first such line. */
    find(words: string[]): Map<string, DeepPart> {
      const hits = new Map<string, DeepPart>();
      if (!words.length) return hits;
      for (const [key, list] of parts) {
        const hit = list.find((p) => matches(p.text, words));
        if (hit) hits.set(key, hit);
      }
      return hits;
    },
    get progress(): { done: number; total: number } {
      return { done: parts.size, total };
    },
  };
}

export type DeepIndex = ReturnType<typeof createDeepIndex>;
export type { Part };
