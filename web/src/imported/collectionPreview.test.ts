// The import chooser's preview counts.
import { describe, expect, it } from 'vitest';
import { sizeText, totalsOf, totalsText } from './collectionPreview';

describe('collection preview', () => {
  const games = [{ fileCount: 40, bytes: 1024 * 1024 }, { fileCount: 10, bytes: 2048, missing: 3 }, { fileCount: 5 }, { fileCount: 1, bytes: 0, missing: 1 }];
  it('adds games, files, bytes and missing files', () => {
    expect(totalsOf(games)).toEqual({ games: 4, files: 56, bytes: 1024 * 1024 + 2048, gamesMissing: 2, filesMissing: 4 });
  });
  it('counts nothing for no games', () => {
    expect(totalsOf([])).toEqual({ games: 0, files: 0, bytes: 0, gamesMissing: 0, filesMissing: 0 });
  });
  it('writes sizes for people', () => {
    expect(sizeText(512)).toBe('512 bytes');
    expect(sizeText(2048)).toBe('2 KB');
    expect(sizeText(3.5 * 1024 * 1024)).toBe('3.5 MB');
  });
  it('words the totals, singular and plural', () => {
    expect(totalsText(totalsOf([{ fileCount: 1, bytes: 10 }]))).toBe('1 game, 1 file, 10 bytes');
    expect(totalsText(totalsOf(games))).toBe('4 games, 56 files, 1.0 MB; 2 are missing files (4 files in all)');
    expect(totalsText(totalsOf([{ fileCount: 2, bytes: 5, missing: 1 }]))).toBe('1 game, 2 files, 5 bytes; 1 is missing files (1 file in all)');
  });
});
