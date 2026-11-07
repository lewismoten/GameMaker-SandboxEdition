// Compatibility, source identity, thumbnail palette and metadata bounds are build gates.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { exportPocket } from './exportPocket';
import { readBundle, writeBundle } from './pocketFile';
import { gamCrc32, pocketCategory, pocketProjectUid, readLibrary, uniqueGmpName, writeLibrary, type PocketLibrary } from './pocketLibrary';
import { emptyCompanion, parseCompanion, serializeCompanion } from '../project/companion';
const fixture: PocketLibrary = {
  schema: 'gmp-library',
  version: 1,
  uid: 'catalog:first-steps',
  title: 'First Steps',
  dosName: 'FIRST',
  category: ['starter', '100'],
  course: 101,
  gamCrc32: '1234ABCD',
};
it('matches site stages and keeps ceremonies out of course numbering', () => {
  expect(pocketCategory('first-steps', 'starter')).toEqual({ category: ['starter', '100'], course: 101 });
  expect(pocketCategory('graduation-basics', 'starter')).toEqual({ category: ['starter', 'graduations'] });
  expect(pocketCategory('new-unassigned-course', 'starter')).toEqual({ category: ['starter', 'other'] });
  expect(pocketCategory('x', 'bizarre')).toEqual({ category: ['bizarre'] });
  expect(pocketCategory('x', 'sandbox')).toEqual({ category: ['sandbox'] });
  expect(pocketCategory('x', undefined, 'shareware')).toEqual({ category: ['cd', 'shareware'] });
});
it('preserves a personal identity through companion backup', () => {
  const c = emptyCompanion(),
    uid = pocketProjectUid(c);
  expect(uid).toMatch(/^project:/);
  expect(pocketProjectUid(parseCompanion(serializeCompanion(c)))).toBe(uid);
});
it('validates UTF-8 byte limits, paths, schema and corrupt metadata independently of gameplay', () => {
  expect(readLibrary(writeLibrary(fixture))).toEqual(fixture);
  expect(readLibrary(new TextEncoder().encode(' \n' + JSON.stringify(fixture)))).toEqual(fixture);
  for (const patch of [
    { version: 2 },
    { title: 'é'.repeat(65) },
    { uid: 'é' },
    { dosName: 'NINETHREE' },
    { category: ['Imported'] },
    { category: ['a', 'b', 'c'] },
    { thumbnail: '../cards.pak' },
    { categoryLabel: 'é'.repeat(25) },
    { touchScore: 101 },
    { dosName: 1234 },
    { gamCrc32: 12345678 },
  ])
    expect(() => writeLibrary({ ...fixture, ...patch } as PocketLibrary)).toThrow();
  expect(readLibrary(new Uint8Array(1025))).toBeUndefined();
  expect(readLibrary(new Uint8Array([239, 187, 191, ...writeLibrary(fixture)]))).toBeUndefined();
});
it('deduplicates identical thumbnail payloads and rejects table/data overlap', () => {
  const b = writeBundle(
    [
      ['a.pth', new Uint8Array([1, 2])],
      ['b.pth', new Uint8Array([1, 2])],
    ],
    true,
  );
  const m = readBundle(b);
  expect(m.get('a.pth')!.off).toBe(m.get('b.pth')!.off);
  new DataView(b.buffer).setUint32(40, 0, true);
  expect(() => readBundle(b)).toThrow();
});
it('does not overwrite colliding 8.3 names', () => {
  const used = new Map<string, string>();
  expect(uniqueGmpName('ABCDEFGH.GMP', 'catalog:first', used)).toBe('ABCDEFGH.GMP');
  const other = uniqueGmpName('ABCDEFGH.GMP', 'catalog:second', used);
  expect(other).toMatch(/^[A-Z0-9]{8}\.GMP$/);
  expect(other).not.toBe('ABCDEFGH.GMP');
  expect(uniqueGmpName('ABCDEFGH.GMP', 'catalog:second', used)).toBe(other);
});
describe('new GMP in legacy container', () => {
  it('keeps GMP 1 and adds independently readable metadata and one indexed preview', async () => {
    const url = new URL('../../../cd/gameware/peach/', import.meta.url);
    const files = new GameFiles(readdirSync(url).map((n) => [n, new Uint8Array(readFileSync(new URL(n, url)))]));
    const { bytes } = await exportPocket(files, { title: 'Peach', gam: 'PEACH.GAM', library: { uid: 'catalog:peach', category: ['cd', 'gameware'] } });
    const entries = readBundle(bytes),
      decoder = new TextDecoder();
    expect(decoder.decode(entries.get('game.txt')!.bytes)).toMatch(/^GMP 1\n/);
    const metadata = readLibrary(entries.get('library.json')!.bytes)!;
    expect(metadata.dosName).toBe('PEACH');
    expect(metadata.gamCrc32).toBe(gamCrc32(files.get('PEACH.GAM')!));
    const compressed = entries.get('thumb.pth')!.bytes,
      raw = inflateRawSync(compressed.subarray(4));
    expect(raw.length).toBe(6284);
    expect(raw.subarray(0, 4).toString()).toBe('PTH1');
    expect(raw.readUInt16LE(4)).toBe(96);
    expect(raw.readUInt16LE(6)).toBe(60);
    expect(raw.readUInt16LE(8)).toBe(256);
  });
});

it('keeps generated flash previews and metadata inside their budgets, with no secret entries', () => {
  const data = new URL('../../../hardware/pocket-player/data/', import.meta.url);
  const metadata = readFileSync(new URL('library.jsonl', data));
  const thumbs = readFileSync(new URL('thumbs.pak', data));
  expect(metadata.length).toBeLessThanOrEqual(64 * 1024);
  expect(thumbs.length).toBeLessThanOrEqual(384 * 1024);
  const [header, ...lines] = metadata.toString().trim().split('\n');
  expect(JSON.parse(header)).toEqual({ schema: 'gmp-library-index', version: 1 });
  const records = lines.map((line) => JSON.parse(line) as PocketLibrary & { id: string });
  const uids = records.map((r) => r.uid);
  expect(new Set(uids).size).toBe(uids.length);
  const games = new URL('../../../games/', import.meta.url);
  for (const id of readdirSync(games).filter((id) => existsSync(new URL(`${id}/about.json`, games)))) {
    try {
      const about = JSON.parse(readFileSync(new URL(`${id}/about.json`, games), 'utf8'));
      if (about.secret) expect(uids).not.toContain(`catalog:${id}`);
    } catch (e) {
      if (!(e instanceof Error && 'code' in e && e.code === 'ENOENT')) throw e;
    }
  }
  const bundle = readBundle(thumbs);
  for (const r of records) {
    expect(readLibrary(new TextEncoder().encode(JSON.stringify({ ...r, thumbnail: r.thumbnail ? 'thumb.pth' : undefined })))).toBeDefined();
    if (r.thumbnail) expect(inflateRawSync(bundle.get(r.thumbnail)!.bytes.subarray(4)).length).toBe(6284);
  }
});

it('keeps served firmware and filesystem headroom for both boards', () => {
  for (const env of ['esp32-3248s035', 'cyd-2432s028']) {
    const fw = new URL(`../../public/pocket/fw/${env}/`, import.meta.url);
    const app = readFileSync(new URL('firmware.bin', fw));
    expect(app.length).toBeLessThanOrEqual(1024 * 1024 - 128 * 1024);
    const image = readFileSync(new URL('littlefs.bin', fw));
    expect(image.length).toBe(0x2f0000);
    let erased = 0;
    for (let at = 0; at < image.length; at += 4096) if (image.subarray(at, at + 4096).every((v) => v === 255)) erased += 4096;
    // Conservative: stale written blocks count as occupied, too. No compaction space is borrowed.
    expect(erased).toBeGreaterThanOrEqual((128 + 64) * 1024);
  }
});
