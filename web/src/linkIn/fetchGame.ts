// Fetching a game named by a link (?open=<url>): a .zip, a game pack, a one-page export, or a
// single .gam whose files sit beside it in the same folder (each file it names is fetched from
// there). Downloads stop at the limits. A server that does not allow other sites to read its
// files (no Access-Control-Allow-Origin header) fails with a LinkError saying so, and pointing
// at the postMessage way in (docs/embed.md).
import { parseGame } from '../formats/game';
import { filesNamedBy } from '../project/streamGame';
import { normalize } from '../project/files';
import { LinkError, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES } from './protocol';

/** The bytes at `url`, at most `cap` of them; undefined for a 404 when `optional`. */
export async function fetchCapped(url: string, cap: number, optional = false): Promise<Uint8Array | undefined> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: 'omit', redirect: 'follow', mode: 'cors' });
  } catch {
    // A network error and a CORS refusal look the same to a page, on purpose.
    throw new LinkError(`The game at ${url} could not be fetched. Its server may not let other sites read its files, or it may be offline.`, 'cors');
  }
  if (!res.ok) {
    if (optional && res.status === 404) return undefined;
    throw new LinkError(`The game at ${url} could not be fetched (the server answered ${res.status}).`, 'fetch');
  }
  const said = Number(res.headers.get('content-length') ?? 0);
  if (said > cap) throw new LinkError(`The file at ${url} is bigger than the limit allows.`, 'too-big');
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array(await res.arrayBuffer());
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > cap) {
      await reader.cancel();
      throw new LinkError(`The file at ${url} is bigger than the limit allows.`, 'too-big');
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** The last part of a URL's path, decoded: the file's name. */
export function urlFileName(url: string): string {
  try {
    const last = new URL(url).pathname.split('/').filter(Boolean).pop() ?? 'game';
    return decodeURIComponent(last);
  } catch {
    return 'game';
  }
}

/** Every file a .gam names (each scene's files and its high score file), and the files those name in turn. */
export function gamNeeds(gamName: string, gam: Uint8Array): string[] {
  const names = new Set<string>();
  for (const s of parseGame(gam).scenes) for (const f of s.files) if (f) names.add(normalize(f));
  names.add(normalize(`${gamName.replace(/\.[^.]*$/, '')}.his`));
  return [...names];
}

/**
 * The files at `url`: the one file (a whole game in a .zip, a pack or an exported page), or a
 * .gam and the files beside it that it names, each fetched from the same folder.
 */
export async function fetchGame(url: string, onProgress?: (done: number, total: number) => void): Promise<[string, Uint8Array][]> {
  const name = urlFileName(url);
  const first = await fetchCapped(url, MAX_TOTAL_BYTES);
  if (!first) throw new LinkError(`Nothing is at ${url}.`, 'fetch');
  if (!/\.gam$/i.test(name)) return [[name, first]];
  let wanted: string[];
  try {
    wanted = gamNeeds(name, first);
  } catch {
    throw new LinkError(`${name} is damaged or is not a Game-Maker game file.`, 'invalid');
  }
  const out: [string, Uint8Array][] = [[name, first]];
  const seen = new Set([normalize(name)]);
  let total = first.length;
  const queue = wanted.filter((n) => !seen.has(n));
  let done = 0;
  while (queue.length) {
    const batch = queue.splice(0, 4);
    const got = await Promise.all(
      batch.map(async (n) => {
        seen.add(n);
        // the files sit beside the .gam; DOS names are case-blind, so try as named, then upper case
        const at = (file: string) => new URL(encodeURIComponent(file), url).href;
        const bytes = (await fetchCapped(at(n), MAX_FILE_BYTES, true)) ?? (await fetchCapped(at(n.toUpperCase()), MAX_FILE_BYTES, true));
        return [n, bytes] as const;
      }),
    );
    for (const [n, bytes] of got) {
      done++;
      if (!bytes) continue; // a missing file: the game says so when it needs it, as DOS did
      total += bytes.length;
      if (total > MAX_TOTAL_BYTES || out.length >= MAX_FILES) throw new LinkError('The game is bigger than the limit allows.', 'too-big');
      out.push([n, bytes]);
      for (const more of filesNamedBy(n, bytes).map(normalize)) if (!seen.has(more) && !queue.includes(more)) queue.push(more);
    }
    onProgress?.(done, done + queue.length);
  }
  return out;
}
