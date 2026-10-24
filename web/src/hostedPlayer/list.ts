// The web player's game list (games.json, docs/web-player.md): which game folders sit beside
// the page and what they are called. No DOM here, so it is tested on its own (list.test.ts).
// The JSON is the host's, but it is still only data: every field is checked and cut to size,
// and only http(s) folders are kept.
//
//   { "title": "My old games",
//     "games": [ { "id": "nebula", "title": "Nebula", "folder": "nebula/", "gam": "NEBULA.GAM",
//                  "files": ["NEBULA.MAP", …], "author": "…", "year": 1994, "about": "…" } ] }
//
// A bare array of games is taken too. Only "folder" is needed: the id is the folder's last
// part, the title the folder's name, and the .gam the one in "files" or <id>.gam.

/** One game of the list, with its folder resolved to an address. */
export interface ListedGame {
  /** What ?game= names it by, and what its saves are kept under. */
  id: string;
  title: string;
  /** The folder's address, ending in "/". */
  folder: string;
  /** The .gam's name in the folder, when the list says (or `files` holds one). */
  gam?: string;
  /** Files to fetch besides the ones the .gam names. */
  files?: string[];
  author?: string;
  year?: number;
  about?: string;
}

export interface GameList {
  title?: string;
  games: ListedGame[];
}

/** The most games one list may hold. */
export const MAX_GAMES = 500;
const MAX_TEXT = 300;
const MAX_LISTED_FILES = 1024;

const text = (v: unknown, max = MAX_TEXT): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return t ? t.slice(0, max) : undefined;
};

/** A DOS-ish file name: no folders, no "..", nothing odd. */
export const safeFileName = (v: unknown): string | undefined => {
  const t = text(v, 64);
  return t && /^[\w$~!#%&'(){}@^`-][\w.$~!#%&'(){}@^` -]*$/.test(t) && !t.includes('..') ? t : undefined;
};

/** An id for ?game= and the save store: lower case letters, digits, "-" and "_". */
export function gameId(v: string): string {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** The folder's address (http or https only), ending in "/"; undefined when it is not one. */
export function folderUrl(folder: string, base: string): string | undefined {
  try {
    const u = new URL(folder.endsWith('/') ? folder : `${folder}/`, base);
    if (!/^https?:$/.test(u.protocol)) return undefined;
    u.search = '';
    u.hash = '';
    return u.href;
  } catch {
    return undefined;
  }
}

/** The last part of a folder's address: "…/games/nebula/" is "nebula". */
const lastPart = (url: string) => decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() ?? '');

function readGame(raw: unknown, base: string): ListedGame | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const folderText = text(r.folder, 2048);
  if (!folderText) return undefined;
  const folder = folderUrl(folderText, base);
  if (!folder) return undefined;
  const id = gameId(text(r.id) ?? lastPart(folder)) || 'game';
  const files = Array.isArray(r.files)
    ? r.files
        .slice(0, MAX_LISTED_FILES)
        .map(safeFileName)
        .filter((f): f is string => !!f)
    : undefined;
  const gam = safeFileName(r.gam) ?? files?.find((f) => /\.gam$/i.test(f));
  const year = typeof r.year === 'number' && Number.isInteger(r.year) && r.year > 1900 && r.year < 3000 ? r.year : undefined;
  const game: ListedGame = { id, title: text(r.title, 80) ?? (lastPart(folder) || id), folder };
  if (gam && /\.gam$/i.test(gam)) game.gam = gam;
  if (files?.length) game.files = files;
  const author = text(r.author, 80);
  if (author) game.author = author;
  if (year) game.year = year;
  const about = text(r.about);
  if (about) game.about = about;
  return game;
}

/**
 * The list in `json` (the text of games.json), its folders resolved against `base` (the
 * JSON's own address). Games without a usable folder are left out; ids are made unique.
 * Throws when the text is not JSON or holds no list.
 */
export function parseGameList(json: string, base: string): GameList {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('The game list is not valid JSON.');
  }
  const obj = Array.isArray(data) ? { games: data } : (data as Record<string, unknown> | null);
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.games)) throw new Error('The game list has no "games" array.');
  const seen = new Set<string>();
  const games: ListedGame[] = [];
  for (const raw of obj.games.slice(0, MAX_GAMES)) {
    const g = readGame(raw, base);
    if (!g) continue;
    let id = g.id;
    for (let n = 2; seen.has(id); n++) id = `${g.id}-${n}`;
    seen.add(id);
    games.push({ ...g, id });
  }
  const list: GameList = { games };
  const title = text(obj.title, 80);
  if (title) list.title = title;
  return list;
}

/**
 * The game ?game=<name> asks for: the list's game with that id (or folder name), or else a
 * folder of that name beside the page, on the page's own site only. A name ending in .gam
 * names the game file itself ("old/NEBULA.GAM").
 */
export function findGame(name: string, list: GameList | undefined, page: string): ListedGame | undefined {
  const want = name.trim();
  if (!want) return undefined;
  const id = gameId(want);
  const listed = list?.games.find((g) => g.id === id) ?? list?.games.find((g) => gameId(lastPart(g.folder)) === id);
  if (listed) return listed;
  const gamAt = want.match(/^(.*?)([^/]+\.gam)$/i);
  const folder = folderUrl(gamAt ? gamAt[1] || './' : want, page);
  if (!folder || new URL(folder).origin !== new URL(page).origin) return undefined;
  const folderId = gameId(lastPart(folder)) || 'game';
  const gam = gamAt ? safeFileName(gamAt[2]) : undefined;
  return { id: gamAt ? gameId(gamAt[2].replace(/\.gam$/i, '')) || folderId : folderId, title: gam ?? lastPart(folder), folder, ...(gam ? { gam } : {}) };
}

/** The .gam names to try for a game, in order: the listed one, or <id>.gam in lower then upper case. */
export function gamCandidates(game: ListedGame): string[] {
  if (game.gam) return [game.gam];
  const base = lastPart(game.folder) || game.id;
  return [...new Set([`${base}.gam`.toLowerCase(), `${base}.GAM`.toUpperCase(), `${game.id}.gam`])];
}

/** The list's address from ?list= (same site only), or games.json beside the page. */
export function listUrl(param: string | null, page: string): string {
  const fallback = new URL('games.json', page).href;
  if (!param) return fallback;
  try {
    const u = new URL(param, page);
    return u.origin === new URL(page).origin ? u.href : fallback;
  } catch {
    return fallback;
  }
}
