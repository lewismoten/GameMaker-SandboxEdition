// The import progress panel's pure part (its dialog is checked in a browser: no DOM in vitest).
import { describe, expect, it } from 'vitest';
import { importRunning, pickedLabel } from './importPanel';

describe('import panel', () => {
  it('names what was picked', () => {
    expect(pickedLabel(['a.zip'])).toBe('a.zip');
    expect(pickedLabel(['a.zip', 'b.zip', 'c.zip'])).toBe('a.zip and 2 more');
    expect(pickedLabel([])).toBe('your files');
  });
  it('starts with no import running', () => {
    expect(importRunning()).toBe(false);
  });
});
