import { describe, expect, it } from 'vitest';
import { plainError } from '../src/editor/core/plainError';

describe('plainError', () => {
  it('says a failed download plainly', () => {
    expect(plainError(new TypeError('Failed to fetch'))).toMatch(/internet connection/);
    expect(plainError(new TypeError('Load failed'))).toMatch(/internet connection/);
    expect(plainError(new Error('Could not fetch games/x/standalone.html (404)'))).toMatch(/error 404/);
  });
  it('says a full browser plainly', () => {
    const e = new Error('The quota has been exceeded.');
    e.name = 'QuotaExceededError';
    expect(plainError(e)).toMatch(/run out of room/);
  });
  it('keeps messages that are already plain', () => {
    expect(plainError(new Error('These file names won’t work in DOS: A.B'))).toBe('These file names won’t work in DOS: A.B');
    expect(plainError('odd')).toBe('odd');
    expect(plainError(new Error(''))).toBe('Something went wrong.');
  });
});
