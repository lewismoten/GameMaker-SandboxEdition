import { describe, expect, it } from 'vitest';
import { diffHashes } from './sameBytes';

describe('diffHashes', () => {
  it('is empty for the same bytes', () => {
    expect(diffHashes({ 'a/disk/x': '1' }, { 'a/disk/x': '1' })).toEqual([]);
  });
  it('names added, removed and changed files', () => {
    expect(diffHashes({ 'a/x': '1', 'a/y': '1', 'a/z': '1' }, { 'a/x': '2', 'a/y': '1', 'a/w': '1' })).toEqual([
      'changed  a/x',
      'removed  a/z',
      'added    a/w',
    ]);
  });
});
