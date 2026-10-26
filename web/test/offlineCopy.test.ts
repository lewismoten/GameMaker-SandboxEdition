// The offline copy: sizes in words, and checking there is room.
import { describe, expect, it } from 'vitest';
import { hasRoom, sizeText } from '../src/offline/offlineCopy';

describe('offline copy', () => {
  it('says sizes the way people read them', () => {
    expect(sizeText(300)).toBe('1 KB');
    expect(sizeText(512 * 1024)).toBe('512 KB');
    expect(sizeText(31.25 * 1024 * 1024)).toBe('31.3 MB');
    expect(sizeText(10 * 1024 ** 3)).toBe('10.0 GB');
  });

  it('checks there is room, with a little to spare, when the browser says how much', () => {
    expect(hasRoom({}, 1e9)).toBe(true);
    expect(hasRoom({ usage: 0, quota: 100e6 }, 50e6)).toBe(true);
    expect(hasRoom({ usage: 60e6, quota: 100e6 }, 40e6)).toBe(false);
  });
});
