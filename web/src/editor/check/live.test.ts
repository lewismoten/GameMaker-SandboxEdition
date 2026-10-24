// The level check's live posts (live.ts): throttled, only changed cells, and an honest time left.
import { describe, expect, it } from 'vitest';
import { LiveFeed, estimateLeft } from './live';

const live = (ms: number) => ({ heat: new Uint32Array(10), first: new Int32Array(10).fill(-1), deaths: new Map<number, number>(), ms });

describe('the level check live feed', () => {
  it('posts at most once a second, with only the cells that changed', () => {
    let t = 0;
    const feed = new LiveFeed(() => t);
    const l = live(0);
    l.heat[3] = 5;
    l.first[3] = 2;
    const at = { scene: 2, index: 0, total: 1, nodes: 4, queued: 1, budgetMs: 15000 };
    const a = feed.update(at, l)!;
    expect([...a.cells]).toEqual([3, 5, 2]);
    expect(a.tried).toBe(3);
    t = 200;
    l.heat[4] = 1;
    expect(feed.update(at, l)).toBeUndefined();
    t = 1200;
    l.heat[3] = 9;
    l.deaths.set(7, 2);
    const b = feed.update(at, { ...l, ms: 1200 })!;
    expect([...b.cells]).toEqual([3, 9, 2, 4, 1, -1]);
    expect([...b.deaths]).toEqual([7, 2]);
  });

  it('starts over for a new scene and counts the scenes', () => {
    let t = 0;
    const feed = new LiveFeed(() => t);
    const l = live(0);
    l.heat[1] = 1;
    feed.update({ scene: 2, index: 0, total: 3, nodes: 1, queued: 0, budgetMs: 1000 }, l);
    t = 100;
    const b = feed.update({ scene: 4, index: 1, total: 3, nodes: 1, queued: 0, budgetMs: 1000 }, l)!;
    expect([...b.cells]).toEqual([1, 1, -1]);
    // the scene still has its whole budget, and one more scene may follow: only an upper bound
    expect(b.leftMs).toBe(2000);
    expect(b.sure).toBe(false);
    expect(b.fraction).toBeCloseTo(1 / 3);
  });

  it('says "up to" the budget unless the queue is clearly emptying', () => {
    expect(estimateLeft([{ ms: 1000, tried: 10, queued: 50 }], 15000)).toEqual({ ms: 14000, sure: false });
    const growing = [
      { ms: 1000, tried: 10, queued: 50 },
      { ms: 4000, tried: 40, queued: 80 },
    ];
    expect(estimateLeft(growing, 15000)).toEqual({ ms: 11000, sure: false });
    const emptying = [
      { ms: 1000, tried: 10, queued: 50 },
      { ms: 4000, tried: 40, queued: 20 },
    ];
    // 30 places in 3 s, 20 to go: about 2 s
    expect(estimateLeft(emptying, 15000)).toEqual({ ms: 2000, sure: true });
  });
});
