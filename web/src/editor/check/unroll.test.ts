// Unroll (unroll.ts): a hero walking off an edge carries on in unwrapped blocks, a jump picks up
// on the lap it was first seen on, and a way that comes back round on itself is folded to one lap.
import { describe, expect, it } from 'vitest';
import { MLEN, MWID } from '../../formats/map';
import { Unroll, unrolledAt, unrolledShows } from './unroll';

/** Walks the hero from (x, y) by (dx, dy) a block a tick for `n` ticks, with a 16 x 10 screen round it. */
function walk(u: Unroll, x: number, y: number, dx: number, dy: number, n: number): [number, number] {
  for (let i = 0; i <= n; i++) {
    const hx = (((x + dx * i) % MLEN) + MLEN) % MLEN;
    const hy = (((y + dy * i) % MWID) + MWID) % MWID;
    u.look(hx, hy, (hx - 8 + MLEN) % MLEN, (hy - 5 + MWID) % MWID, 16, 10);
  }
  return [x + dx * n, y + dy * n];
}

describe('Unroll', () => {
  it('leaves a map the hero never walks off as it is', () => {
    const u = new Unroll();
    walk(u, 10, 50, 1, 0, 60);
    expect(u.result()).toBeUndefined();
  });

  it('carries on past the right edge', () => {
    const u = new Unroll();
    walk(u, 80, 50, 1, 0, 40); // to x 120: the map's x 20
    const r = u.result()!;
    expect(r.loops).toEqual([false, false]);
    expect(r.box).toEqual([72, 45, 56, 10]);
    expect(r.runs).toBeUndefined();
    // a door at the map's x 15 is drawn past the edge, where the hero met it
    expect(unrolledAt(r, 15, 50)).toEqual({ x: 115, y: 50 });
  });

  it('puts a jump back on the lap where that block was first seen', () => {
    const u = new Unroll();
    walk(u, 90, 50, 1, 0, 20); // to x 110
    u.cut();
    walk(u, 5, 50, 1, 0, 10); // the explorer back at the map's x 5: really x 105
    const r = u.result()!;
    expect(r.box[0] + r.box[2]).toBe(115 + 8);
    expect(r.box[0]).toBe(82);
  });

  it('folds a way that goes round forever to one lap, cut where least is seen', () => {
    const u = new Unroll();
    walk(u, 10, 50, 1, 0, MLEN + 5); // all the way round and on
    const r = u.result()!;
    expect(r.loops).toEqual([true, false]);
    expect(r.box[2]).toBe(MLEN);
    expect(r.box[3]).toBe(10);
  });

  it('keeps a level that winds on past a lap, drawing only what was seen', () => {
    const u = new Unroll();
    // right 80, down 30, right 80 more: past a lap across without coming back to a block it stood on
    let [x, y] = walk(u, 10, 10, 1, 0, 80);
    [x, y] = walk(u, x, y, 0, 1, 30);
    walk(u, x, y, 1, 0, 80);
    const r = u.result()!;
    expect(r.loops).toEqual([false, false]);
    expect(r.box[2]).toBeGreaterThan(MLEN);
    expect(r.runs).toHaveLength(r.box[3]);
    expect(unrolledShows(r, 20, 10)).toBe(true);
    expect(unrolledShows(r, 150, 10)).toBe(false);
    expect(unrolledShows(r, 150, 40)).toBe(true);
  });

  it('counts a bot walking round and round as going round forever', () => {
    const u = new Unroll();
    walk(u, 50, 10, 0, 1, MWID * 3 + 1);
    expect(u.result()!.loops).toEqual([false, true]);
  });
});
