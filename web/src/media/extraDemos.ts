// Demo recordings added for this edition: games on the Game-Maker CD that shipped without
// a title demo get one recorded here (games/kit/cdDemos), so people can see how each was
// played. They are kept apart from the games' own files, in extras/demos.json and
// extras/demos/<id>.rec, and are never part of a game unless someone asks for it, with a
// notice that the original game did not have it.
import { crc32 } from '../project/zip';
import { fetchSiteFile, type CatalogEntry } from '../project/files';

export interface ExtraDemo {
  /** Catalog id of the game. */
  id: string;
  /** The recording, in extras/demos/ (or, with `inGame`, one of the game's own files). */
  file: string;
  /** True when the recording is the game's own file that its title screen never named. */
  inGame?: boolean;
  /** The game file it plays, and that file's CRC-32 (to recognize the game's files). */
  gam: string;
  gamCrc: number;
  /** Game ticks until the last key (18.2 a second). */
  ticks: number;
  /** Who or what made it, in a sentence. */
  made: string;
  /** When it was made (YYYY-MM-DD). */
  date: string;
}

export interface ExtraDemoIndex {
  note: string;
  demos: ExtraDemo[];
}

/** What the UI says about a recording that was not in the original game. */
export const ADDED_DEMO_NOTICE = 'Demo added for this edition — not in the original game';

/** The name an added demo takes when it is put into a copy of the game. */
export const ADDED_DEMO_FILE = 'sedemo.rec';

/** Reads the index, keeping only well-formed entries. */
export function parseExtraDemoIndex(json: unknown): ExtraDemoIndex {
  const o = (json ?? {}) as Partial<ExtraDemoIndex>;
  const demos = (Array.isArray(o.demos) ? o.demos : []).filter(
    (d): d is ExtraDemo => !!d && typeof d.id === 'string' && typeof d.file === 'string' && typeof d.gam === 'string' && typeof d.gamCrc === 'number',
  );
  return { note: typeof o.note === 'string' ? o.note : '', demos };
}

/** The added demo for a catalog game (by id, and only while its .gam is the one recorded). */
export function extraDemoFor(index: ExtraDemoIndex, id: string, gamCrc?: number): ExtraDemo | undefined {
  return index.demos.find((d) => d.id === id && (gamCrc === undefined || d.gamCrc === gamCrc));
}

/** The added demo for a game's files, recognized by its .gam file's contents. */
export function extraDemoForGam(index: ExtraDemoIndex, gamBytes: Uint8Array | undefined): ExtraDemo | undefined {
  if (!gamBytes) return undefined;
  const crc = crc32(gamBytes);
  return index.demos.find((d) => d.gamCrc === crc);
}

let index: Promise<ExtraDemoIndex> | undefined;
let loaded: ExtraDemoIndex | undefined;

/** The index of added demos (fetched once; empty when it cannot be read). */
export function loadExtraDemos(base = './'): Promise<ExtraDemoIndex> {
  index ??= fetch(`${base}extras/demos.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((j) => (loaded = parseExtraDemoIndex(j)));
  return index;
}

/** The index if it has been fetched already (for code that cannot wait). */
export function extraDemosLoaded(): ExtraDemoIndex | undefined {
  return loaded;
}

const recordings = new Map<string, Promise<Uint8Array | undefined>>();

/** The bytes of an added demo (a game's own file for `inGame` ones: pass the catalog entry). */
export function fetchExtraDemo(d: ExtraDemo, entry?: Pick<CatalogEntry, 'path'>, base = './'): Promise<Uint8Array | undefined> {
  const url = d.inGame ? (entry ? `${base}${entry.path}${d.file}` : '') : `${base}extras/demos/${d.file}`;
  if (!url) return Promise.resolve(undefined);
  let p = recordings.get(url);
  if (!p) {
    p = fetchSiteFile(url).catch(() => undefined);
    recordings.set(url, p);
  }
  return p;
}
