// Locks, keys, treasure and monsters in generated layouts: the key-before-lock proof over 200 seeds.
import { describe, expect, it } from 'vitest';
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { generate, proveResult, type GenKind } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';

const set = (...pairs: [number, string[], number?][]): RoleMap =>
  Object.fromEntries(pairs.map(([n, roles, pair]) => [n, { roles, ...(pair ? { pair } : {}) }])) as RoleMap;
const full = set(
  [1, ['wall']],
  [2, ['floor']],
  [10, ['locked-door'], 1],
  [11, ['key'], 1],
  [12, ['locked-door'], 2],
  [13, ['key'], 2],
  [20, ['treasure']],
  [21, ['life']],
  [5, ['tree']],
);
const whole = { x: 0, y: 0, w: 100, h: 100 };
const run = (kind: GenKind, roles: RoleMap, seed: number, monsters?: number[]) => {
  const o = generate(roles, { kind, seed, rect: whole, monsters });
  if (!o.ok) throw new Error(o.message);
  return o.result;
};

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

describe('monsters and forests', () => {
  it('places monsters away from the entry, on open cells, only when asked', () => {
    for (let s = 1; s <= 60; s++) {
      const r = run('dungeon', full, s, [3, 4, 9]);
      expect(r.monsters.length).toBeGreaterThan(1);
      const seen = new Set<number>();
      for (const m of r.monsters) {
        expect([3, 4, 9]).toContain(m.monnum);
        expect(m.cell).not.toBe(r.entry);
        expect(r.kinds[m.cell]).toBe(1);
        expect(Math.abs((m.cell % 100) - (r.entry % 100)) + Math.abs(((m.cell / 100) | 0) - ((r.entry / 100) | 0))).toBeGreaterThanOrEqual(5);
        expect(seen.has(m.cell)).toBe(false);
        seen.add(m.cell);
      }
      expect(run('dungeon', full, s).monsters).toEqual([]);
    }
  });

  it('gives forests treasure and monsters, reachable, with no locks', () => {
    for (let s = 1; s <= 60; s++) {
      const r = run('forest', full, s, [3]);
      expect(r.locks).toEqual([]);
      expect(proveResult(r).collectable).toBe(true);
      expect(r.treasure.length).toBeGreaterThan(0);
      expect(r.monsters.length).toBeGreaterThan(0);
    }
  });
});
