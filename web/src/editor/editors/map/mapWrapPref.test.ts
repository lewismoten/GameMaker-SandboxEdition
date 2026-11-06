import { describe, expect, it } from 'vitest';
import { rememberWrap, wrapFor } from './mapWrapPref';

function fake(readOnly = false) {
  const store = new Map<string, unknown>();
  return {
    store,
    readOnly: readOnly ? {} : undefined,
    extras<T>(file: string, section: string, fallback: T): T {
      return store.has(`${file}/${section}`) ? (store.get(`${file}/${section}`) as T) : fallback;
    },
    setExtras(file: string, section: string, value: unknown) {
      store.set(`${file}/${section}`, value);
    },
  };
}

describe('per-map Wrap', () => {
  it('follows the global preference until the map is toggled', () => {
    const p = fake();
    expect(wrapFor(p, 'town.map', false)).toBe(false);
    expect(wrapFor(p, 'town.map', true)).toBe(true);
  });
  it('lets the saved choice win, per map', () => {
    const p = fake();
    rememberWrap(p, 'world.map', true);
    rememberWrap(p, 'town.map', false);
    expect(wrapFor(p, 'world.map', false)).toBe(true);
    expect(wrapFor(p, 'town.map', true)).toBe(false);
    expect(wrapFor(p, 'other.map', true)).toBe(true);
  });
  it('writes nothing for a read-only project', () => {
    const p = fake(true);
    rememberWrap(p, 'world.map', true);
    expect(p.store.size).toBe(0);
  });
});
