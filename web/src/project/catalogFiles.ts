// Catalog metadata, shared loading and in-place hydration for hosted games.
import type { OriginalExtras } from '../../scripts/cdGames';
import type { LibraryFileFact } from '../../scripts/libraryFacts';
import { withSecretGames } from './secretGames';
import { isSpecialGame, withSpecials } from './special';
import { SPECIALS_EVENT } from '../specials/state';
import type { Issue } from './health';
import type { BoxGame } from '../desk/boxes/boxFacts';

export interface CatalogEntry {
  id: string;
  title: string;
  /** gameware: free samples that came with Game-Maker; shareware: play only. */
  kind: 'gameware' | 'shareware';
  /** Folder of the game's files, relative to the site root. */
  path: string;
  /** Shareware: the author's notice and registration details. */
  notice?: string;
  /** Shareware: CRC-32 of the .gam file. */
  gamCrc?: number;
  /** Total size of the game's files. */
  bytes?: number;
  /** Shareware: its DOS program name, e.g. ORB.EXE (shown, never served). */
  exe?: string;
  /** A few lines from the game's story or instructions. */
  blurb?: string;
  /** Credits, from the game's own screens or Wikipedia. */
  author?: string;
  company?: string;
  year?: number;
  /** Registration price as its author stated it ("Freeware" for free games). */
  price?: string;
  gam: string | null;
  /** The game's DOS files. Missing from an entry of games/catalog.json until hydrateFiles / withFiles fill it in (games/catalog-files.json). */
  files?: string[];
  /** Size of each file in `files`, in bytes (missing from older catalogs). */
  sizes?: number[];
  /** games/catalog.json: the game names its recorded demos (.rec files), which the home page's preview asks before `files` is loaded. */
  rec?: string[];
  /** Palette identities and precomputed sound groups for lazy asset pickers. */
  fileFacts?: Record<string, LibraryFileFact>;
  /** Original games made for this project: label, box art, manual, sound card. */
  original?: OriginalExtras;
  /** Original games: a series of their own ("bizarre": The Bard of Bizarre's, see bizarre.ts). */
  series?: string;
  /** Legacy loose-file gzip copies; also used for separate walkthrough JSON metadata. */
  gz?: boolean;
  /** Built sites: a downloadable DOS ZIP; older catalogs use gzipped GMPK. Named with a hash of its content. */
  pack?: string;
  /** Original games: the 8.3 name of its ZIP and folders in DOS (about.json "dosName"), where the id is longer; read it through dosDir(). */
  dosName?: string;
  /** Built sites: the size of its pack in bytes. */
  packBytes?: number;
  /** Built sites: its ZIP is shipped split, as this .zpart file and shared data (project/sharedZip.ts); `pack` names the joined ZIP. */
  parts?: string;
  /** Built sites: what the quick check (project/health.ts) finds in it, so no file need be fetched to know. */
  health?: Issue[];
  /** Built sites, games with a box: its level count and screenshot captions from the .gam (desk/boxes/boxFacts.ts boxGame). */
  boxGame?: BoxGame;
  /** From games/catalog.json: its notice, manual and printables are in games/details/<id>.json (withDetails). */
  details?: boolean; /** Original games: the site path of its walkthrough (src/walkthrough), when it has one. */
  walkthrough?: string;
  /** Original games: its DOS player look (games/<id>/player.json, dosPlayer/catalogPatches.ts). */
  player?: unknown;
  /** Original games: what its controls mean (games/<id>/controls.json, editor/core/gameControls.ts). */
  controls?: unknown;
  /** Built sites: its pictures are drawn already (games/shots/, gfx/levelPicture.ts builtShotPath). */
  shots?: boolean;
  /** …and its hero (games/shots/<id>-hero.png, gfx/levelPicture.ts builtHeroPath). */
  heroShot?: boolean;
}

/** The publisher of the games made for this project (games/<id>/about.json "company"). */
const SANDBOX_COMPANY = 'Sandbox Software';

/**
 * A Sandbox Software game: one of ours, with its box, disk and manual (not a Starter, see starter.ts). Other games built in
 * ../games under another publisher's name (a BBS download such as The Bard of Bizarre's)
 * are listed with the shareware instead.
 */
export function isSandboxGame(g: Pick<CatalogEntry, 'original' | 'company'> & { series?: string }): boolean {
  return !!g.original && (g.company ?? SANDBOX_COMPANY) === SANDBOX_COMPANY && g.series !== 'starter' && !isSpecialGame(g);
}

const catalogs = new Map<string, Promise<CatalogEntry[]>>();

/** Forgets the fetched catalogs, so the next load lists what is current (a secret game revealed). */
export function forgetCatalog(): void {
  catalogs.clear();
}
// EGG.EXE adding or breaking an egg can reveal (or hide again) a secret game.
if (typeof window !== 'undefined') window.addEventListener('gm-eggs-changed', forgetCatalog);
// a Special kept, locked, unlocked or reset (specials/state.ts) is listed or hidden again
if (typeof window !== 'undefined') window.addEventListener(SPECIALS_EVENT, forgetCatalog);

/**
 * The games catalog (games/index.json, about 300 kB). Many parts of the page ask for it;
 * it is fetched once and shared. A failed fetch is forgotten so a later call retries.
 */
export function loadCatalog(base = './games/'): Promise<CatalogEntry[]> {
  let p = catalogs.get(base);
  if (!p) {
    p = fetch(`${base}index.json`)
      .then((res) => (res.ok ? (res.json() as Promise<CatalogEntry[]>) : []))
      .then((list) => withSecretGames(list, base))
      .then((list) => withSpecials(list));
    p.catch(() => catalogs.delete(base));
    catalogs.set(base, p);
  }
  return p;
}

/** A JSON file, or undefined when it isn't there (a dev server answers a missing file with index.html). */
async function fetchJson<T>(url: string): Promise<T | undefined> {
  const res = await fetch(url);
  return res.ok && res.headers.get('content-type')?.includes('json') ? ((await res.json()) as T) : undefined;
}

/**
 * The games without their shareware notices, manuals and printables (games/catalog.json,
 * an eighth of index.json): for a page that only needs the list, such as the play page.
 * The full catalog when it is loaded already, or there is no short one.
 */
export async function loadCatalogList(base = './games/'): Promise<CatalogEntry[]> {
  const list = await loadLeanCatalogList(base);
  await hydrateFiles(list, base);
  return list;
}

/** loadCatalogList without the file lists (`files` and `sizes` are filled in by hydrateFiles or withFiles when something needs them). */
export function loadLeanCatalogList(base = './games/'): Promise<CatalogEntry[]> {
  const full = catalogs.get(base);
  if (full) return full;
  const key = `${base}catalog.json`;
  let p = catalogs.get(key);
  if (!p) {
    p = fetchJson<CatalogEntry[]>(key).then((list) => (list ? withSecretGames(list, base).then((l) => withSpecials(l)) : loadCatalog(base)));
    p.catch(() => catalogs.delete(key));
    catalogs.set(key, p);
  }
  return p;
}

/**
 * The list the home page, the shelf and the disk box draw from: games/catalog.json (a quarter
 * of index.json; manuals hold only their title until withDetails). The development server
 * hands out the full catalog instead: it serves catalog.json from whatever scripts/cdGames.ts
 * it was started with, which may be older than this page.
 */
export function loadGameList(base = './games/'): Promise<CatalogEntry[]> {
  return import.meta.env?.DEV ? loadCatalog(base) : loadCatalogList(base);
}

/** loadGameList without the file lists: for a page that only draws the list (the home page), which asks withFiles for a game it opens. */
export function loadLeanGameList(base = './games/'): Promise<CatalogEntry[]> {
  return import.meta.env?.DEV ? loadCatalog(base) : loadLeanCatalogList(base);
}

type FileLists = Record<string, { files: string[]; sizes: number[] }>;
const fileLists = new Map<string, Promise<FileLists>>();

/** games/catalog-files.json, fetched once; the full catalog's lists when the page has no such file. */
function loadFileLists(base: string): Promise<FileLists> {
  let p = fileLists.get(base);
  if (!p) {
    p = fetchJson<FileLists>(`${base}catalog-files.json`)
      .then(async (lists) => lists ?? Object.fromEntries((await loadCatalog(base)).map((e) => [e.id, { files: e.files ?? [], sizes: e.sizes ?? [] }])))
      .catch((e) => {
        fileLists.delete(base);
        throw e;
      });
    fileLists.set(base, p);
  }
  return p;
}

/** Fills in `files` and `sizes` of each entry that lacks them (a lean list's), in place, so every holder of the entry sees them. */
export async function hydrateFiles(list: { id: string; files?: string[]; sizes?: number[] }[], base = './games/'): Promise<void> {
  if (list.every((e) => e.files)) return;
  const lists = await loadFileLists(base);
  for (const e of list)
    if (!e.files) {
      e.files = lists[e.id]?.files ?? [];
      e.sizes = lists[e.id]?.sizes;
    }
}

/** The entry with its `files` and `sizes` (games/catalog-files.json), filled in on the entry itself. */
export async function withFiles<T extends { id: string; files?: string[]; sizes?: number[] }>(entry: T, base = './games/'): Promise<T & { files: string[] }> {
  await hydrateFiles([entry], base);
  return entry as T & { files: string[] };
}

/** An entry with its shareware notice, manual and printables (games/details/<id>.json), for one from loadCatalogList. */
export async function withDetails(entry: CatalogEntry, base = './games/'): Promise<CatalogEntry> {
  if (!entry.details) return entry; // nothing left out, or a full entry
  const details = await fetchJson<Pick<CatalogEntry, 'notice' | 'original' | 'blurb' | 'controls' | 'player'>>(`${base}details/${entry.id}.json`).catch(
    () => undefined,
  );
  if (!details) return (await loadCatalog(base)).find((g) => g.id === entry.id) ?? entry;
  const { original, ...more } = details; // a Starter's blurb, controls, player look, label and box art too (scripts/cdGames.ts pageCatalog)
  return { ...entry, ...more, original: entry.original || original ? { ...entry.original, ...original } : undefined };
}

/** "Eric-Jon Waugh · A-J Games · 1993" */
export function creditLine(g: Pick<CatalogEntry, 'author' | 'company' | 'year'>): string {
  // an author who is also the publisher (The Bard of Bizarre) is named once
  const company = g.company && g.company.toLowerCase() !== g.author?.toLowerCase() ? g.company : undefined;
  return [g.author, company, g.year].filter(Boolean).join(' · ');
}
