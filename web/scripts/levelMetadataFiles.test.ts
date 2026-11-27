// Per-game storage round-trips deterministically, prunes retired entries and preserves untouched files.
import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readMetadata, writeMetadata } from './levelMetadataFiles';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});
it('writes independent canonical files and removes entries no longer listed', () => {
  const root = mkdtempSync(join(tmpdir(), 'level-metadata-'));
  roots.push(root);
  const dir = join(root, 'views');
  expect(readMetadata(dir)).toEqual({});
  const data = { zebra: { hash: 'z', maps: {} }, apple: { hash: 'a', maps: {} } };
  writeMetadata(dir, data);
  expect(readMetadata(dir)).toEqual(data);
  expect(readFileSync(join(dir, 'apple.json'), 'utf8')).toBe(`${JSON.stringify(data.apple)}\n`);
  utimesSync(join(dir, 'apple.json'), 1, 1);
  writeMetadata(dir, { apple: data.apple, zebra: data.zebra });
  expect(statSync(join(dir, 'apple.json')).mtimeMs).toBe(1000);
  writeMetadata(dir, { apple: data.apple });
  expect(readdirSync(dir)).toEqual(['apple.json']);
});

it.each([
  { label: 'invalid game ID', replacement: { apple: 2, 'z invalid': 3 }, error: /Invalid game id/ },
  { label: 'serialization error', replacement: { apple: 2, zebra: 3n }, error: /BigInt/i },
  { label: 'missing JSON value', replacement: { apple: 2, zebra: undefined }, error: /Invalid JSON metadata/ },
])('leaves the filesystem untouched on $label', ({ replacement, error }) => {
  const root = mkdtempSync(join(tmpdir(), 'level-metadata-'));
  roots.push(root);
  const original = { apple: 1, retired: 1 };
  writeMetadata(root, original);
  expect(() => writeMetadata<unknown>(root, replacement)).toThrow(error);
  expect(readMetadata(root)).toEqual(original);
  const missing = join(root, 'missing');
  expect(() => writeMetadata<unknown>(missing, replacement)).toThrow(error);
  expect(readdirSync(root).sort()).toEqual(['apple.json', 'retired.json']);
});
