import { beforeEach, vi, describe, expect, it } from 'vitest';
import { KEY, getColorHelp, onColorHelp, parse, resetColorHelpCache, setColorHelp } from './colorHelpPrefs';

describe('color help preferences', () => {
  beforeEach(() => {
    const mem = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    });
    resetColorHelpCache();
  });
  it('starts with everything off', () => {
    expect(getColorHelp()).toEqual({ names: false, warn: 'off', preview: 'normal' });
  });
  it('ignores junk', () => {
    expect(parse('{"names":"yes","warn":"x","preview":7}')).toEqual({ names: false, warn: 'off', preview: 'normal' });
    expect(parse('not json').warn).toBe('off');
  });
  it('keeps choices locally and tells listeners', () => {
    let n = 0;
    const off = onColorHelp(() => n++);
    setColorHelp({ names: true, warn: 'both' });
    expect(JSON.parse(localStorage.getItem(KEY)!)).toMatchObject({ names: true, warn: 'both' });
    expect(n).toBe(1);
    off();
    setColorHelp({ preview: 'all' });
    expect(n).toBe(1);
    resetColorHelpCache();
    expect(getColorHelp().preview).toBe('all');
  });
  it('stores nothing when back to the defaults', () => {
    setColorHelp({ names: true });
    setColorHelp({ names: false });
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
