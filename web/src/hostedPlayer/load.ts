// Fetching a listed game's files from its folder. A static web host cannot list a folder, so
// the .gam is fetched first and the files it names (and the files those name: sound sets,
// slide lists, backdrops) are fetched beside it, as linkIn/fetchGame.ts does for a link to a
// .gam; the list's "files" are fetched too. DOS names are case-blind, so each name is tried
// as written, then in lower and in upper case.
import { fetchGame } from '../linkIn/fetchGame';
import { LinkError, MAX_FILE_BYTES } from '../linkIn/protocol';
import { normalize } from '../project/files';
import { gamCandidates, type ListedGame } from './list';

/** The file's bytes, or undefined when the folder has no such file. */
async function fetchOptional(folder: string, name: string): Promise<Uint8Array | undefined> {
  for (const n of [...new Set([name, name.toLowerCase(), name.toUpperCase()])]) {
    try {
      const res = await fetch(new URL(encodeURIComponent(n), folder), { credentials: 'same-origin' });
      if (!res.ok) continue;
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.length <= MAX_FILE_BYTES) return bytes;
    } catch {
      /* try the next spelling */
    }
  }
  return undefined;
}

/** The game's files and the name of its .gam among them. */
export async function loadListedGame(
  game: ListedGame,
  onProgress?: (done: number, total: number) => void,
): Promise<{ gam: string; entries: [string, Uint8Array][] }> {
  let entries: [string, Uint8Array][] | undefined;
  let gam = '';
  let lastError: unknown;
  for (const name of gamCandidates(game)) {
    try {
      entries = await fetchGame(new URL(encodeURIComponent(name), game.folder).href, onProgress);
      gam = name;
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (!entries) {
    // a plain "not there" (404) says nothing the sentence below does not
    const why = lastError instanceof Error && !(lastError instanceof LinkError && lastError.reason === 'fetch') ? ` (${lastError.message})` : '';
    throw new Error(`No game file (.gam) was found in ${game.folder}${why}. Name it in games.json with "gam".`);
  }
  const have = new Set(entries.map(([n]) => normalize(n)));
  const extra = (game.files ?? []).filter((f) => !have.has(normalize(f)));
  for (let i = 0; i < extra.length; i += 4) {
    const got = await Promise.all(extra.slice(i, i + 4).map(async (f) => [f, await fetchOptional(game.folder, f)] as const));
    for (const [f, bytes] of got) if (bytes) entries.push([normalize(f), bytes]);
  }
  return { gam: normalize(gam), entries: entries.map(([n, b]) => [normalize(n), b]) };
}
