// A hosted game's ZIP when the build split it (project/zipParts.ts, catalog "parts"): its .zpart
// file and the shared data it names (games/shared/<name>.bin), fetched and joined back into the
// very same bytes the ZIP had. Every reader of a game's ZIP comes here through fetchGameZip.
import { fetchArchive } from './archiveWait';
import { decodePart, joinPart } from './zipParts';

/** Where the shared data lives, relative to the site root. */
export const SHARED_DIR = 'games/shared/';

/** Shared data fetched this session (the DOS player and kit pictures many games have), by URL. */
const blobs = new Map<string, Promise<Uint8Array>>();

async function hexSha256(bytes: Uint8Array): Promise<string | undefined> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return undefined; // not a secure context: the length check still runs
  const sum = new Uint8Array(await subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>));
  return Array.from(sum, (b) => b.toString(16).padStart(2, '0')).join('');
}

function fetchBlob(url: string, name: string, signal?: AbortSignal | null): Promise<Uint8Array> {
  let got = blobs.get(url);
  if (!got) {
    got = (async () => {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const sum = await hexSha256(bytes);
      if (sum !== undefined && !sum.startsWith(name)) throw new Error('shared data does not match its name');
      return bytes;
    })();
    blobs.set(url, got);
    got.catch(() => blobs.delete(url));
  }
  return got;
}

/**
 * A hosted game's ZIP as a Response (fetchArchive's, for a game shipped whole). A split one is
 * joined here; a missing or wrong piece gives a failed Response (status 502), as a missing ZIP would.
 */
export async function fetchGameZip(entry: { path: string; pack?: string; parts?: string }, base = './', init?: RequestInit): Promise<Response> {
  if (!entry.parts) return fetchArchive(`${base}${entry.path}${entry.pack}`, init);
  const res = await fetchArchive(`${base}${entry.path}${entry.parts}`, init);
  if (!res.ok) return res;
  try {
    const part = new Uint8Array(await res.arrayBuffer());
    const names = [...new Set(decodePart(part).header.shared.map(([, , name]) => name))];
    const got = new Map(await Promise.all(names.map(async (n) => [n, await fetchBlob(`${base}${SHARED_DIR}${n}.bin`, n, init?.signal)] as const)));
    const zip = joinPart(part, (n) => got.get(n)!);
    return new Response(zip as Uint8Array<ArrayBuffer>, { headers: { 'Content-Type': 'application/zip', 'Content-Length': String(zip.length) } });
  } catch (e) {
    if (init?.signal?.aborted) throw e;
    return new Response(null, { status: 502, statusText: 'Could not join the game archive' });
  }
}
