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
