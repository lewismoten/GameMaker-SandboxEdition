import { describe, expect, it } from 'vitest';
import { GameFiles, normalize } from '../src/project/files';

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
