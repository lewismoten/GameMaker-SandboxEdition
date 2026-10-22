// Tests: the index of demos added for this edition (media/extraDemos.ts).
import { describe, expect, it } from 'vitest';
import { extraDemoFor, extraDemoForGam, parseExtraDemoIndex } from '../src/media/extraDemos';
import { crc32 } from '../src/project/zip';

const gam = new Uint8Array([1, 2, 3, 4]);
const index = parseExtraDemoIndex({
  note: 'Added here',
  demos: [
    { id: 'sample', file: 'sample.rec', gam: 'sample.gam', gamCrc: crc32(gam), ticks: 900, made: 'bot', date: '2026-10-21' },
    { id: 'broken', gam: 'x.gam' },
    null,
  ],
});

describe('added demos index', () => {
  it('keeps only well-formed entries', () => {
    expect(index.note).toBe('Added here');
    expect(index.demos.map((d) => d.id)).toEqual(['sample']);
    expect(parseExtraDemoIndex(undefined)).toEqual({ note: '', demos: [] });
    expect(parseExtraDemoIndex({ demos: 'no' }).demos).toEqual([]);
  });

  it('finds a catalog game by id, and only while its .gam is the one recorded', () => {
    expect(extraDemoFor(index, 'sample')?.file).toBe('sample.rec');
    expect(extraDemoFor(index, 'sample', crc32(gam))?.file).toBe('sample.rec');
    expect(extraDemoFor(index, 'sample', 1234)).toBeUndefined();
    expect(extraDemoFor(index, 'nebula')).toBeUndefined();
  });

  it('recognizes a game by its .gam file', () => {
    expect(extraDemoForGam(index, gam)?.id).toBe('sample');
    expect(extraDemoForGam(index, new Uint8Array([9]))).toBeUndefined();
    expect(extraDemoForGam(index, undefined)).toBeUndefined();
  });
});
