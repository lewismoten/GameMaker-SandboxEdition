import { describe, expect, it } from 'vitest';
import { fetchOrder, partCount, takePart, type Manifest } from './plan';

const m: Manifest = {
  shell: ['./', './assets/main-a.js', './icon.svg'],
  files: [
    ['assets/main-a.js', 10, 10],
    ['assets/zzz-b.js', 10, 10],
    ['assets/desk-c.js', 10, 10],
    ['bbs/x.bin', 10, 10],
    ['desk/y.png', 10, 10],
    ['games/g/g.zip', 20_000_000, 1],
    ['phone/p.bin', 10, 10],
    ['tour/t.json', 10, 10],
    ['icon.svg', 1, 1],
  ],
};

describe('fetchOrder', () => {
  it('puts the shell, then home and desk code, then the rest, and leaves packs out by default', () => {
    const paths = fetchOrder(m, false).map((e) => e[0]);
    expect(paths.slice(0, 3)).toEqual(['./', 'assets/main-a.js', 'icon.svg']);
    expect(paths.indexOf('assets/desk-c.js')).toBeLessThan(paths.indexOf('assets/zzz-b.js'));
    expect(paths.indexOf('desk/y.png')).toBeLessThan(paths.indexOf('bbs/x.bin'));
    expect(paths.some((p) => /^(games\/.*\.zip$|phone\/)/.test(p))).toBe(false);
    expect(paths).toContain('games/catalog.json');
    expect(new Set(paths).size).toBe(paths.length);
  });
  it('adds the packs last with games', () => {
    const paths = fetchOrder(m, true).map((e) => e[0]);
    expect(paths.slice(-2).sort()).toEqual(['games/g/g.zip', 'phone/p.bin']);
  });
});

describe('parts', () => {
  it('slices by size and covers every file once', () => {
    const order = fetchOrder(m, true);
    const n = partCount(order);
    expect(n).toBeGreaterThan(1);
    const all = Array.from({ length: n }, (_, i) => takePart(order, i + 1)).flat();
    expect(all).toEqual(order);
    expect(takePart(order, 0)).toEqual(order);
    expect(takePart(order, n + 1)).toEqual([]);
  });
});
