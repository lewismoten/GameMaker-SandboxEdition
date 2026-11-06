import { describe, expect, it } from 'vitest';
import type { Facing, RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { generate, proveResult, verifyReach, type GenKind, type GenResult } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';

type E = { roles: string[]; facing?: Facing; pair?: number };
const map = (e: Record<number, E>): RoleMap => e as unknown as RoleMap;
// blocks 20..23 are chairs facing N, E, S, W; 30..33 beds; 40..43 shelves; 50..53 counters
const faced = (base: number, role: string): Record<number, E> =>
  Object.fromEntries((['N', 'E', 'S', 'W'] as Facing[]).map((f, i) => [base + i, { roles: [role], facing: f }]));
const full = map({
  1: { roles: ['wall'] },
  2: { roles: ['floor'] },
  3: { roles: ['door'] },
  4: { roles: ['table'] },
  5: { roles: ['rug'] },
  6: { roles: ['lamp'] },
  7: { roles: ['plant'] },
  8: { roles: ['stove'] },
  ...faced(20, 'chair'),
  ...faced(30, 'bed'),
  ...faced(40, 'shelf'),
  ...faced(50, 'counter'),
});
const rect = { x: 0, y: 0, w: 40, h: 24 };
const run = (kind: GenKind, roles: RoleMap, seed: number, r = rect): GenResult => {
  const o = generate(roles, { kind, seed, rect: r });
  if (!o.ok) throw new Error(o.message);
  return o.result;
};
const DIR: Record<Facing, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

describe('interiors', () => {
  for (const kind of ['home', 'shop'] as const) {
    it(`${kind}: chairs face tables, pieces stand against walls, the floor is all reachable, the door is free (150 seeds)`, () => {
      let chairs = 0;
      for (let seed = 1; seed <= 150; seed++) {
        const res = run(kind, full, seed);
        const w = res.rect.w;
        const at = new Map(res.furniture.map((f) => [f.cell, f]));
        expect(verifyReach(res).ok, `seed ${seed}`).toBe(true);
        expect(proveResult(res).furnished, `seed ${seed}`).toBe(true);
        // the door is in the wall ring, the cell inside it is open and holds nothing
        expect(res.kinds[res.exit]).toBe(11);
        expect(res.kinds[res.entry]).not.toBe(10);
        for (const f of res.furniture) {
          const x = f.cell % w,
            y = (f.cell / w) | 0;
          if (f.role === 'chair') {
            chairs++;
            const [dx, dy] = DIR[f.facing!];
            expect(at.get((y + dy) * w + x + dx)?.role, `seed ${seed} chair`).toBe('table');
            // and the block is the chair that faces that way
            expect(full[f.block].facing).toBe(f.facing);
          }
          if (f.role === 'bed' || f.role === 'shelf' || f.role === 'counter') expect(full[f.block].facing).toBe(f.facing);
          if (f.role === 'bed' || f.role === 'shelf') {
            // behind the piece (opposite its front) is a wall or another piece, never open floor
            const [dx, dy] = DIR[f.facing!];
            const back = res.kinds[(y - dy) * w + x - dx];
            expect(back === 0 || back === 10, `seed ${seed} ${f.role} back`).toBe(true);
          }
        }
      }
      if (kind === 'home') expect(chairs).toBeGreaterThan(50);
    });
  }

  it('keeps a lane two cells wide from the door in a home', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const res = run('home', full, seed);
      const w = res.rect.w;
      for (let k = 0; k < 4; k++)
        for (const dx of [0, 1]) {
          const c = res.entry - k * w + dx;
          if (res.kinds[c] !== 0) expect([10, 11]).not.toContain(res.kinds[c]);
        }
    }
  });

  it('a shop has a counter between the door and the back shelves, and a shopkeeper spot behind it', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const res = run('shop', full, seed);
      const w = res.rect.w;
      const counter = res.furniture.filter((f) => f.role === 'counter');
      expect(counter.length).toBeGreaterThan(4);
      const crow = (counter[0].cell / w) | 0;
      expect(counter.every((c) => ((c.cell / w) | 0) === crow)).toBe(true);
      expect((res.entry / w) | 0).toBeGreaterThan(crow);
      expect(res.shopkeeper).toBeDefined();
      expect((res.shopkeeper! / w) | 0).toBeLessThan(crow);
      expect(res.kinds[res.shopkeeper!]).toBe(1);
      for (const s of res.furniture.filter((f) => f.role === 'shelf' && ((f.cell / w) | 0) < crow)) expect(s.facing).toBe('S');
    }
  });

  it('is the same for the same seed', () => {
    expect([...run('home', full, 9).blocks]).toEqual([...run('home', full, 9).blocks]);
    expect([...run('home', full, 9).blocks]).not.toEqual([...run('home', full, 10).blocks]);
  });

  it('uses only the chair facings it has, and no chairs when it has no chair block', () => {
    // a chair block with no facing set works for every side
    const noFacing = map({ 1: { roles: ['wall'] }, 2: { roles: ['floor'] }, 4: { roles: ['table'] }, 20: { roles: ['chair'] } });
    expect(run('home', noFacing, 3).furniture.some((f) => f.role === 'chair')).toBe(true);
    const onlyN = map({ 1: { roles: ['wall'] }, 2: { roles: ['floor'] }, 4: { roles: ['table'] }, 20: { roles: ['chair'], facing: 'N' } });
    let seen = 0;
    for (let s = 1; s <= 30; s++) for (const f of run('home', onlyN, s).furniture) if (f.role === 'chair') (seen++, expect(f.facing).toBe('N'));
    expect(seen).toBeGreaterThan(0);
    const none = run('home', map({ 1: { roles: ['wall'] }, 2: { roles: ['floor'] }, 4: { roles: ['table'] } }), 3);
    expect(none.furniture.some((f) => f.role === 'chair')).toBe(false);
    expect(none.notes.join(' ')).toContain('No chair block');
  });

  it('works with only walls and floor, and fits the smallest area', () => {
    const bare = map({ 1: { roles: ['wall'] }, 2: { roles: ['floor'] } });
    for (const kind of ['home', 'shop'] as const) {
      const res = run(kind, bare, 4, { x: 0, y: 0, w: 12, h: 10 });
      expect(verifyReach(res).ok).toBe(true);
      expect(res.furniture).toHaveLength(0);
    }
    expect(generate(bare, { kind: 'home', seed: 1, rect: { x: 0, y: 0, w: 11, h: 10 } })).toMatchObject({ ok: false });
  });
});

describe('castle', () => {
  const roles = map({
    1: { roles: ['wall'] },
    2: { roles: ['floor'] },
    3: { roles: ['door'] },
    5: { roles: ['path'] },
    6: { roles: ['decoration'] },
    7: { roles: ['locked-door'], pair: 1 },
    8: { roles: ['key'], pair: 1 },
    9: { roles: ['treasure'] },
  });
  it('is reachable from the gate, closed at the edge but for the gate, and proven (100 seeds)', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const res = run('castle', roles, seed, { x: 0, y: 0, w: 40, h: 30 });
      const { w, h } = res.rect;
      expect(verifyReach(res).ok, `seed ${seed}`).toBe(true);
      const p = proveResult(res);
      expect([p.reach, p.keysFirst, p.collectable], `seed ${seed}`).toEqual([true, true, true]);
      const edge: number[] = [];
      for (let x = 0; x < w; x++) edge.push(res.kinds[x], res.kinds[(h - 1) * w + x]);
      for (let y = 0; y < h; y++) edge.push(res.kinds[y * w], res.kinds[y * w + w - 1]);
      expect(edge.filter((k) => k !== 0 && k !== 11)).toEqual([]);
      expect(edge.filter((k) => k === 11)).toHaveLength(2);
      expect(res.blocks[res.exit]).toBeDefined();
    }
  });
  it('uses the door block at the gate and refuses a small area', () => {
    const res = run('castle', roles, 5, { x: 0, y: 0, w: 40, h: 30 });
    expect(res.blocks[res.rect.h * res.rect.w - res.rect.w / 2]).toBe(3);
    expect(generate(roles, { kind: 'castle', seed: 1, rect: { x: 0, y: 0, w: 29, h: 30 } })).toMatchObject({ ok: false });
  });
});
