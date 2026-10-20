import { describe, expect, it } from 'vitest';
import { GameFiles, cdName, normalize } from '../src/project/files';

describe('file names', () => {
  it('cuts names to 8.3 the way DOS did', () => {
    expect(normalize('NEJILLIAN.GIF')).toBe('nejillia.gif');
    expect(normalize('C:\\GM\\SAMPLE\\sample.gam')).toBe('sample.gam');
    expect(normalize('picture.jpeg')).toBe('picture.jpe');
    expect(normalize('README')).toBe('readme');
  });

  it('finds a file by its long name', () => {
    const files = new GameFiles([['NEJILLIA.GIF', new Uint8Array([1])]]);
    expect(files.get('nejillian.gif')).toEqual(new Uint8Array([1]));
  });
});

describe('names on the CD', () => {
  it('finds files the CD renamed with underscores', () => {
    const files = new GameFiles([
      ['a_j.bkd', new Uint8Array([2])],
      ['can_t.gif', new Uint8Array([3])],
    ]);
    expect(files.get('A-J.BKD')).toEqual(new Uint8Array([2]));
    expect(files.has("can't.gif")).toBe(true);
    expect(files.resolve('PARSEC-W.GIF')).toBeUndefined();
    expect(files.resolve('a-j.bkd')).toBe('a_j.bkd');
    expect(cdName('A-J2#1.MAP')).toBe('a_j2_1.map');
  });

  it('prefers a file that has the exact name', () => {
    const files = new GameFiles([
      ['a_j.bkd', new Uint8Array([2])],
      ['a-j.bkd', new Uint8Array([4])],
    ]);
    expect(files.get('a-j.bkd')).toEqual(new Uint8Array([4]));
  });
});
