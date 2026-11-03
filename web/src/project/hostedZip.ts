// Read a catalog's DOS distribution through the archives SDK, recovering native extensions.
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { GameFiles, IGNORED_FILE, cdName } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';

/** The CD's own player (cd/gm/xferplay.exe): its size and SHA-256 (hostedZip.test.ts checks them against that file). */
const STOCK_PLAYER = { size: 160_598, sha256: '404be3612012488e5e8ed5ce1dc2e183cf4b53bd4a6cc9b4d8a1d14e980bca5c' };

/**
 * True when every .exe that could be a game's player is the CD's own, so there is nothing to
 * adopt. Reading a hand-edited player's patches needs the engine's formats, which live in the
 * play page's chunk (about 118 kB): checking first keeps that off the home page, whose
 * featured game's .gam is read from this zip. Without Web Crypto (an insecure page) it says no.
 */
export async function onlyStockPlayers(exes: { bytes: Uint8Array }[]): Promise<boolean> {
  const players = exes.filter((e) => e.bytes.length === STOCK_PLAYER.size);
  if (!players.length) return true;
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return false;
  for (const { bytes } of players) {
    const sum = new Uint8Array(await subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>));
    if (Array.from(sum, (b) => b.toString(16).padStart(2, '0')).join('') !== STOCK_PLAYER.sha256) return false;
  }
  return true;
}

export async function readHostedZip(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  const entries = await readZip(bytes);
  const files = new GameFiles(entries.filter((e) => !IGNORED_FILE.test(e.name)).map((e) => [e.name, e.data]));
  const exes = entries.filter((e) => /\.exe$/i.test(e.name)).map((e) => ({ name: e.name, bytes: e.data }));
  if (!(await onlyStockPlayers(exes))) (await import('@lewismoten/gamemaker-sandbox-archives/project/importPlayer')).adoptPlayer(files, exes);
  const out = new Map<string, Uint8Array>();
  for (const [name, data] of files.entries()) {
    out.set(name, data);
    // The CD's ISO names replace punctuation with underscores; catalog entries keep those names.
    if (!out.has(cdName(name))) out.set(cdName(name), data);
  }
  return out;
}

/** Unzipped entries per zip, so the many files a box or label reads from one zip inflate it once. */
const unzipped = new WeakMap<Uint8Array, ReturnType<typeof readZip>>();

/** One file of a zip by any of `names` (compared in lower case), as stored: no player is read. */
export async function findZipFile(bytes: Uint8Array, names: string[]): Promise<Uint8Array | undefined> {
  let entries = unzipped.get(bytes);
  if (!entries) unzipped.set(bytes, (entries = readZip(bytes)));
  return (await entries).find((e) => names.includes(e.name.toLowerCase()))?.data;
}
