// Portable game import, using the same discovery and player recovery as the site's importer.
import { scanImport, GameReader, scanFile, type ScanFile } from '../../../src/project/importScan';
import { adoptPlayer, type ImportedPlayer } from '../../../src/project/importPlayer';
import { decodePack } from '../../../src/project/gamePack';
export {
  scanImport,
  GameReader,
  scanFile,
  gameFromFiles,
  type ScanFile,
  type ScanOptions,
  type ScanReport,
  type FoundGame,
  type ReadGame,
} from '../../../src/project/importScan';
export { createZip, readZip, listZip, isZip, crc32, type ZipEntry, type ZipListing, type ZipLimits } from '../../../src/project/zip';

export interface UnpackOptions {
  /** Optional source name, used for messages and archive detection. */
  name?: string;
  signal?: AbortSignal;
  /** Bounds per archive and on the returned game's file data. Defaults: 8192 files, 128 MiB. */
  maxEntries?: number;
  maxBytes?: number;
}
export interface UnpackedGame {
  name: string;
  gam: string;
  /** Portable tuples: pass these to the engine's own GameFiles constructor. */
  entries: [string, Uint8Array][];
  /** Recovered DOS-player settings, when a customized player was supplied. */
  player?: ImportedPlayer;
}
export type GameInput = Uint8Array | ArrayBuffer | Iterable<ScanFile | File>;

async function gunzip(bytes: Uint8Array, maxBytes: number): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('Game archive exceeds the byte limit');
    }
    parts.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Discover and read games from folders, ZIPs, ZIP-based SFX EXEs, nested archives, or GMPK packs. */
export async function unpackGames(input: GameInput, options: UnpackOptions = {}): Promise<UnpackedGame[]> {
  const { signal, maxEntries = 8192, maxBytes = 128 << 20 } = options;
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 1 || !Number.isSafeInteger(maxBytes) || maxBytes < 1)
    throw new RangeError('Archive limits must be positive integers');
  signal?.throwIfAborted();
  let given: ScanFile[];
  if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
    let bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (bytes.length > maxBytes) throw new Error('Game archive exceeds the byte limit');
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = await gunzip(bytes, maxBytes);
    if (bytes[0] === 0x47 && bytes[1] === 0x4d && bytes[2] === 0x50 && bytes[3] === 0x4b) {
      given = decodePack(bytes).map(([path, data]) => ({ path, size: data.length, read: () => Promise.resolve(data) }));
    } else {
      const data = bytes;
      const ext = bytes[0] === 0x4d && bytes[1] === 0x5a ? '.exe' : '.zip';
      const name = options.name ?? 'game';
      given = [{ path: name.toLowerCase().endsWith(ext) ? name : name + ext, size: bytes.length, read: () => Promise.resolve(data) }];
    }
  } else given = Array.from(input, (f) => ('path' in f ? f : scanFile(f)));
  if (given.length > maxEntries || given.some((f) => f.size > maxBytes)) throw new Error('Game input exceeds archive limits');
  const zipLimits = { maxEntries, maxBytes };
  const report = await scanImport(given, { signal, zipLimits });
  if (!report.games.length && report.badZips.length) throw new Error(report.badZips.map((z) => `${z.path}: ${z.error}`).join('; '));
  const reader = new GameReader(given, zipLimits),
    result: UnpackedGame[] = [];
  for (const found of report.games) {
    signal?.throwIfAborted();
    const read = await reader.read(found);
    const player = adoptPlayer(read.files, read.players);
    const gam = read.files.mainGame(found.gam);
    if (!gam) throw new Error(`No .GAM file in ${found.name}`);
    const entries = read.files.entries();
    if (entries.length > maxEntries || entries.reduce((n, [, b]) => n + b.length, 0) > maxBytes) throw new Error('Unpacked game exceeds archive limits');
    result.push({ name: found.name, gam, entries, ...(player ? { player } : {}) });
  }
  return result;
}

/** Read exactly one game; collections use unpackGames or scanImport plus GameReader. */
export async function unpackGame(input: GameInput, options?: UnpackOptions): Promise<UnpackedGame> {
  const games = await unpackGames(input, options);
  if (games.length !== 1)
    throw new Error(games.length ? `Archive contains ${games.length} games; choose one with unpackGames` : 'No Game-Maker .GAM file was found');
  return games[0];
}
