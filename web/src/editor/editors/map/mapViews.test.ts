import { describe, expect, it } from 'vitest';
import { MAX_MAP_VIEWS, lastZoom, recallView, rememberView } from './mapViews';

function fake() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe('map views', () => {
  it('returns what was saved, per project and map', () => {
    const s = fake();
    rememberView('a', 'ONE.MAP', { z: 2, x: 10.4, y: 5 }, s);
    rememberView('b', 'ONE.MAP', { z: 0.5, x: 1, y: 2 }, s);
    expect(recallView('a', 'one.map', s)).toEqual({ z: 2, x: 10.4, y: 5 });
    expect(recallView('b', 'ONE.MAP', s)?.z).toBe(0.5);
    expect(recallView('a', 'TWO.MAP', s)).toBeUndefined();
  });
  it('falls back to the zoom of the map looked at last, else 100%', () => {
    const s = fake();
    expect(lastZoom(s)).toBe(1);
    rememberView('a', 'ONE.MAP', { z: 2, x: 0, y: 0 }, s);
    rememberView('a', 'TWO.MAP', { z: 0.5, x: 0, y: 0 }, s);
    expect(lastZoom(s)).toBe(0.5);
  });
  it('keeps the most recent 200 maps', () => {
    const s = fake();
    for (let i = 0; i < MAX_MAP_VIEWS + 5; i++) rememberView('p', `M${i}.MAP`, { z: 1, x: i, y: 0 }, s);
    rememberView('p', 'M5.MAP', { z: 1, x: 99, y: 0 }, s); // looked at again: kept
    rememberView('p', 'NEW.MAP', { z: 1, x: 0, y: 0 }, s);
    expect(recallView('p', 'M0.MAP', s)).toBeUndefined();
    expect(recallView('p', 'M5.MAP', s)?.x).toBe(99);
    expect(JSON.parse(s.getItem('gm-map-views')!).views).toHaveLength(MAX_MAP_VIEWS);
  });
  it('ignores damaged storage', () => {
    expect(recallView('a', 'X', { getItem: () => '{"views":[["a",{"z":"x"}],5]}' })).toBeUndefined();
    expect(lastZoom({ getItem: () => 'oops' })).toBe(1);
  });
});
