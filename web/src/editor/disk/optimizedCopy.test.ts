// The optimized copy's names: in My Games, and in the .gam title DOS shows on its menu.
import { describe, expect, it } from 'vitest';
import { withStamp } from '../../project/checkpoint';
import type { StoredCheckpoint } from '../../project/storage';
import { GameFiles } from '../../project/files';
import { optimizedName, optimizedTitle, packedFrom } from './optimizedCopy';

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

it('finds the latest matching release while reading each checkpoint delta once', () => {
  const disk = (byte: number) => new GameFiles([['level.map', Uint8Array.of(byte)]]);
  let history: StoredCheckpoint[] = [];
  for (const [i, byte] of [1, 2, 1, 3, 4].entries()) {
    history = withStamp(history, { id: String(i), name: String(i), made: i, tag: i === 1 ? undefined : `v${i}` }, disk(byte));
  }
  let reads = 0;
  const counted = history.map((checkpoint) => ({
    ...checkpoint,
    get delta() {
      reads++;
      return checkpoint.delta;
    },
  }));
  expect(packedFrom(counted, disk(1), undefined)).toBe('v2');
  expect(reads).toBeLessThanOrEqual(history.length);
});
