// A disk cache for the dev server's catalog ZIPs, used by the archive worker (gameArchiveWorker.ts).
// A ZIP is a pure function of its input bytes, its catalog entry and the export code, so its sha256 of
// those names the cached bytes: a start, or a source change, only re-zips the games that really changed.
// The export code is stamped from the files gameArchive.ts imports (size and mtime, found with esbuild).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import type { CdCatalogEntry } from './cdGames';

const KEEP_MS = 14 * 24 * 3600 * 1000;

/** Size and mtime of every file the archive code is made of; any edit to one changes the stamp. */
export async function codeStamp(entry: string, webRoot: string): Promise<string> {
  const { metafile } = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    metafile: true,
    platform: 'node',
    conditions: ['gamemaker-source'],
    logLevel: 'silent',
    absWorkingDir: webRoot,
  });
  const h = createHash('sha256');
  for (const f of Object.keys(metafile.inputs).sort()) {
    const s = statSync(join(webRoot, f));
    h.update(`${f}:${s.size}:${s.mtimeMs}\n`);
  }
  return h.digest('hex');
}

export interface ArchiveCache {
  get(entry: CdCatalogEntry, paths: ReadonlyMap<string, string>, make: () => Promise<Uint8Array>): Promise<Uint8Array>;
}

/** Cache in `dir`, keyed by `stamp` (the export code) plus each entry's catalog record and input file bytes. */
export function archiveCache(dir: string, stamp: string, extraInputs: readonly string[]): ArchiveCache {
  mkdirSync(dir, { recursive: true });
  const now = Date.now();
  for (const n of readdirSync(dir)) {
    try {
      if (now - statSync(join(dir, n)).mtimeMs > KEEP_MS) unlinkSync(join(dir, n));
    } catch {
      /* another worker got there first */
    }
  }
  return {
    async get(entry, paths, make) {
      const h = createHash('sha256').update(stamp).update(JSON.stringify(entry));
      for (const p of [...entry.files.map((n) => `${entry.path}${n}`), ...extraInputs]) {
        const file = paths.get(p);
        h.update(p).update(file && existsSync(file) ? readFileSync(file) : 'missing');
      }
      const file = join(dir, `${h.digest('hex')}.zip`);
      try {
        const bytes = new Uint8Array(readFileSync(file));
        utimesSync(file, new Date(), new Date());
        return bytes;
      } catch {
        /* a miss */
      }
      const bytes = await make();
      const tmp = `${file}.${process.pid}.tmp`;
      writeFileSync(tmp, bytes);
      renameSync(tmp, file);
      return bytes;
    },
  };
}
