// The optimized copy's names: in My Games, and in the .gam title DOS shows on its menu.
import { describe, expect, it } from 'vitest';
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
