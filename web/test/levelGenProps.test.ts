// Check dungeon locks, keys and treasure over deterministic seeds.
import { describe, expect, it } from 'vitest';
import { proveResult } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { full, run, set } from './levelGenPropsFixture';
describe('locks and keys', () => {
  it('reaches each key before its lock, and everything is collectable (200 seeds)', () => {
    let locked = 0;
    for (let s = 1; s <= 200; s++) {
      const r = run('dungeon', full, s * 7919);
      const p = proveResult(r);
      expect(p, `seed ${s * 7919}`).toEqual({ reach: true, keysFirst: true, collectable: true, furnished: true, linked: true });
      locked += r.locks.length;
      for (const l of r.locks) {
        expect(r.blocks[l.cell]).toBe(l.pair === 1 ? 10 : 12);
        expect(r.blocks[l.key]).toBe(l.pair === 1 ? 11 : 13);
      }
      expect(r.locks.map((l) => l.order)).toEqual(r.locks.map((_, i) => i));
    }
    expect(locked).toBeGreaterThan(150);
  }, 30_000); // 1 to 2 s alone, over 5 s when the machine is loaded

  it('puts the exit behind every lock and the treasure off the entry', () => {
    for (let s = 1; s <= 40; s++) {
      const r = run('dungeon', full, s);
      expect(r.treasure).not.toContain(r.entry);
      expect(r.treasure.length).toBeGreaterThan(0);
    }
  });

  it('skips locks, with a note, when the door and key share no lock number', () => {
    const r = run('dungeon', set([1, ['wall']], [2, ['floor']], [10, ['locked-door'], 1], [11, ['key'], 2]), 3);
    expect(r.locks).toHaveLength(0);
    expect(r.notes.join(' ')).toMatch(/share no lock number/);
  });

  it('leaves a layout with no new roles exactly as before (no props, no monsters)', () => {
    const r = run('dungeon', set([1, ['wall']], [2, ['floor']]), 5);
    expect(r.locks).toEqual([]);
    expect(r.treasure).toEqual([]);
    expect(r.monsters).toEqual([]);
    expect(new Set(r.blocks)).toEqual(new Set([1, 2]));
  });
});
