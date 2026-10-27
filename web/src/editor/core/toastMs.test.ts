// How long a toast stays up: short notes keep the old 4 s (8 s for errors), long ones get time
// to be read, and none outstays 30 s.
import { describe, expect, it } from 'vitest';
import { toastMs } from './ui';

describe('toastMs', () => {
  it('keeps short notes at the floor', () => {
    expect(toastMs('Saved.')).toBe(4000);
    expect(toastMs('Saved.', 'error')).toBe(8000);
  });
  it('gives a long note about 15 characters a second', () => {
    const note = 'x'.repeat(250);
    expect(toastMs(note)).toBe(2000 + 250 * 65);
  });
  it('never passes 30 s', () => {
    expect(toastMs('x'.repeat(5000))).toBe(30000);
  });
});
