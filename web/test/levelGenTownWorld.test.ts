import { describe, expect, it } from 'vitest';
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { generate, proveResult, verifyReach, type GenKind } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';

const set = (...pairs: [number, string[]][]): RoleMap => Object.fromEntries(pairs.map(([n, roles]) => [n, { roles }])) as RoleMap;
const townRoles = set([1, ['wall']], [2, ['floor']], [3, ['path']], [4, ['tree']], [5, ['door']], [6, ['decoration']], [7, ['wall-top']]);
const worldRoles = set([2, ['floor']], [8, ['water']], [4, ['tree']], [9, ['rock']], [3, ['path']], [5, ['door']], [6, ['decoration']]);
const whole = { x: 0, y: 0, w: 100, h: 100 };
const run = (kind: GenKind, roles: RoleMap, seed: number, wrap = false, rect = whole) => {
  const o = generate(roles, { kind, seed, rect, wrap });
  if (!o.ok) throw new Error(o.message);
  return o.result;
};

describe('town', () => {
  it('is reachable, proved and links every house door and gate, over many seeds', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const r = run('town', townRoles, seed);
      expect(verifyReach(r).ok, `seed ${seed}`).toBe(true);
      const p = proveResult(r);
      expect(p.linked && p.reach, `seed ${seed}`).toBe(true);
      expect(r.links.filter((l) => l.kind === 'overworld')).toHaveLength(2);
      expect(r.links.filter((l) => l.kind === 'home' || l.kind === 'shop').length, `seed ${seed}`).toBeGreaterThanOrEqual(6);
      expect(r.rect.w).toBeLessThanOrEqual(80);
    }
  });
  it('puts each house door on a street: a path cell touches it', () => {
    const r = run('town', townRoles, 5);
    for (const l of r.links.filter((x) => x.kind === 'home' || x.kind === 'shop')) {
      const x = l.cell % r.rect.w,
        y = (l.cell / r.rect.w) | 0;
      const near = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => r.kinds[(y + dy) * r.rect.w + x + dx] === 2);
      expect(near, `${l.label}`).toBe(true);
    }
  });
  it('is the same for the same seed and runs with only the needed roles', () => {
    expect([...run('town', townRoles, 9).blocks]).toEqual([...run('town', townRoles, 9).blocks]);
    const bare = run('town', set([1, ['wall']], [2, ['floor']]), 3);
    expect(proveResult(bare).reach).toBe(true);
  });
  it('refuses a small area', () => {
    expect(generate(townRoles, { kind: 'town', seed: 1, rect: { x: 0, y: 0, w: 30, h: 30 } })).toMatchObject({ ok: false });
  });
});

describe('overworld', () => {
  it('is proved reachable to every site over many seeds, wrapped or not', () => {
    for (const wrap of [false, true])
      for (let seed = 1; seed <= 40; seed++) {
        const r = run('overworld', worldRoles, seed, wrap);
        const p = proveResult(r);
        expect(p.reach && p.linked, `seed ${seed} wrap ${wrap}`).toBe(true);
        expect(r.links.length, `seed ${seed}`).toBeGreaterThanOrEqual(3);
        expect(r.terrainCells.water!.length).toBeGreaterThan(500);
      }
  });
  it('lines the land up across the seam more when wrapping than when not', () => {
    const match = (wrap: boolean) => {
      let same = 0;
      for (let seed = 1; seed <= 12; seed++) {
        const r = run('overworld', worldRoles, seed, wrap);
        for (let y = 0; y < r.rect.h; y++) if ((r.kinds[y * r.rect.w] === 12) === (r.kinds[y * r.rect.w + r.rect.w - 1] === 12)) same++;
      }
      return same / 12;
    };
    expect(match(true)).toBeGreaterThan(match(false) + 15);
  });
  it('is repeatable and different for another seed', () => {
    expect([...run('overworld', worldRoles, 4).blocks]).toEqual([...run('overworld', worldRoles, 4).blocks]);
    expect([...run('overworld', worldRoles, 4).blocks]).not.toEqual([...run('overworld', worldRoles, 5).blocks]);
  });
  it('needs water and floor', () => {
    expect(generate(set([2, ['floor']]), { kind: 'overworld', seed: 1, rect: whole })).toMatchObject({ ok: false });
  });
});
