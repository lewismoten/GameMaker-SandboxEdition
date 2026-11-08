// The optimized copy's names: in My Games, and in the .gam title DOS shows on its menu.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { optimizedName, optimizedTitle } from './optimizedCopy';

describe('optimizedTitle', () => {
  it('adds the version when it fits', () => expect(optimizedTitle('Tune-Up', 'v2.0')).toBe('Tune-Up (opt v2.0)'));
  it('cuts a long title to keep 19 characters', () => expect(optimizedTitle('  The Reckoning Day  ', 'v1.1')).toBe('The Reck (opt v1.1)'));
  it('drops a version too long to fit', () => expect(optimizedTitle('Depth', 'release-candidate-3')).toBe('Depth (opt)'));
  it('replaces an earlier mark instead of stacking', () => expect(optimizedTitle('Tune-Up (opt v1.0)', 'v2.0')).toBe('Tune-Up (opt v2.0)'));
});

describe('optimizedName', () => {
  it('numbers a name already taken', () => expect(optimizedName('Tune-Up', 'v2.0', ['tune-up (optimized from v2.0)'])).toBe('Tune-Up (optimized from v2.0) 2'));
});

// The Optimize dialog of a game open to look at only makes its copy straight away: the steps run on a
// copy of the files, which has no guard, while the game itself still refuses every change.
describe('a look-only game', () => {
  it('has files whose copy can be changed while the game refuses', () => {
    const files = new GameFiles([['a.pal', new Uint8Array(768)]]);
    files.guard = () => {
      throw new Error('refused');
    };
    const copy = files.copy();
    copy.set('a.pal', new Uint8Array(768).fill(1));
    expect(copy.get('a.pal')![0]).toBe(1);
    expect(() => files.set('a.pal', new Uint8Array(768))).toThrow('refused');
    expect(files.get('a.pal')![0]).toBe(0);
  });
});
