// The ZIP cache keeps bytes by content: same inputs hit, a changed input or code stamp misses.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { archiveCache, codeStamp } from './archiveCache';
import type { CdCatalogEntry } from './cdGames';

const temp = mkdtempSync(join(tmpdir(), 'archive-cache-'));
afterAll(() => rmSync(temp, { recursive: true, force: true }));
const entry = { id: 'x', path: 'games/gameware/x/', pack: 'x.zip', files: ['x.gam'] } as unknown as CdCatalogEntry;
const file = join(temp, 'x.gam');
const paths = new Map([['games/gameware/x/x.gam', file]]);

describe('archiveCache', () => {
  it('builds once per content and again when an input or the code changes', async () => {
    writeFileSync(file, 'one');
    let builds = 0;
    const make = async () => new Uint8Array([++builds]);
    const cache = archiveCache(join(temp, 'c'), 'stamp-a', []);
    expect(await cache.get(entry, paths, make)).toEqual(new Uint8Array([1]));
    expect(await cache.get(entry, paths, make)).toEqual(new Uint8Array([1]));
    expect(builds).toBe(1);
    writeFileSync(file, 'two');
    expect(await cache.get(entry, paths, make)).toEqual(new Uint8Array([2]));
    expect(await archiveCache(join(temp, 'c'), 'stamp-b', []).get(entry, paths, make)).toEqual(new Uint8Array([3]));
  });
  it('stamps the files the archive code imports', async () => {
    expect(await codeStamp('scripts/gameArchive.ts', join(__dirname, '..'))).toMatch(/^[0-9a-f]{64}$/);
  });
});
