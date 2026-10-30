// Palette identities and audio groups are generated once, with cache invalidation after file edits.
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { libraryFacts } from '../scripts/libraryFacts';
import { encodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
const folders: string[] = [];
afterEach(() => {
  for (const path of folders.splice(0)) rmSync(path, { recursive: true, force: true });
});
const folder = () => {
  const path = mkdtempSync(join(tmpdir(), 'gm-library-facts-'));
  folders.push(path);
  return path;
};

describe('library asset facts', () => {
  it('hashes palette contents and refreshes a cached file after an edit', () => {
    const root = folder();
    const a = join(root, 'a.pal');
    const b = join(root, 'b.pal');
    writeFileSync(a, new Uint8Array(768));
    writeFileSync(b, new Uint8Array(768));
    const files = new Map([
      ['a.pal', a],
      ['b.pal', b],
    ]);
    const before = libraryFacts(files);
    expect(before['a.pal'].paletteHash).toBe(before['b.pal'].paletteHash);
    expect(before['a.pal'].paletteHash).toHaveLength(64);
    writeFileSync(b, new Uint8Array(768).fill(1));
    utimesSync(b, 1_000, 1_000);
    const after = libraryFacts(files);
    expect(after['b.pal'].paletteHash).not.toBe(before['b.pal'].paletteHash);
    expect(before['a.pal'].paletteHash).toBe(after['a.pal'].paletteHash);
  });

  it('classifies a short voice file and ignores damaged data', () => {
    const root = folder();
    const good = join(root, 'click.voc');
    const bad = join(root, 'bad.pal');
    writeFileSync(
      good,
      encodeVoc(
        Float32Array.from({ length: 80 }, (_, i) => Math.sin(i) * 0.5),
        8_000,
      ),
    );
    writeFileSync(bad, Uint8Array.of(1));
    expect(
      libraryFacts(
        new Map([
          ['click.voc', good],
          ['bad.pal', bad],
        ]),
      ),
    ).toEqual({ 'click.voc': { soundGroup: 'blip' } });
  });
});
