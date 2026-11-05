import { describe, expect, it } from 'vitest';
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { checkNeeds, generate, offerSeed, verifyReach, type GenKind } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';

const set = (...pairs: [number, string[]][]): RoleMap => Object.fromEntries(pairs.map(([n, roles]) => [n, { roles }])) as RoleMap;
const dungeonRoles = set([1, ['wall']], [2, ['floor']], [3, ['decoration']]);
const forestRoles = set([4, ['floor']], [5, ['tree']], [6, ['path']], [7, ['rock']], [8, ['decoration']]);
const whole = { x: 0, y: 0, w: 100, h: 100 };

const run = (kind: GenKind, roles: RoleMap, seed: number, rect = whole) => {
  const o = generate(roles, { kind, seed, rect });
  if (!o.ok) throw new Error(o.message);
  return o.result;
};

describe('needs', () => {
  it('says what to mark, plainly', () => {
    expect(checkNeeds('dungeon', {}).message).toBe("Needs a wall block and a floor block. Mark them in the block editor's Uses tab.");
    expect(checkNeeds('forest', set([4, ['floor']])).message).toBe("Needs a tree block. Mark one in the block editor's Uses tab.");
  });
  it('lists skipped wants but still runs', () => {
    const n = checkNeeds('forest', set([4, ['floor']], [5, ['tree']]));
    expect(n.ok).toBe(true);
    expect(n.skipped).toHaveLength(5);
  });
});

describe('generate', () => {
  it('refuses without a needed role and on a tiny area', () => {
    expect(generate({}, { kind: 'dungeon', seed: 1, rect: whole })).toMatchObject({ ok: false });
    expect(generate(dungeonRoles, { kind: 'dungeon', seed: 1, rect: { x: 0, y: 0, w: 8, h: 40 } })).toMatchObject({ ok: false });
  });
  it('gives the same blocks for the same seed and different ones for another', () => {
    const a = run('dungeon', dungeonRoles, 7),
      b = run('dungeon', dungeonRoles, 7),
      c = run('dungeon', dungeonRoles, 8);
    expect([...a.blocks]).toEqual([...b.blocks]);
    expect([...a.blocks]).not.toEqual([...c.blocks]);
    expect([...offerSeed(5, 0).toString()]).toBeTruthy();
    expect(new Set([0, 1, 2, 3].map((i) => offerSeed(5, i))).size).toBe(4);
  });
  it('uses only blocks that hold the roles', () => {
    const r = run('dungeon', dungeonRoles, 3);
    expect(new Set(r.blocks)).toEqual(new Set([1, 2, 3]));
    const f = run('forest', forestRoles, 3);
    for (const b of new Set(f.blocks)) expect([4, 5, 6, 7, 8]).toContain(b);
  });
  it('skips what has no block', () => {
    const f = run('forest', set([4, ['floor']], [5, ['tree']]), 11);
    expect(new Set(f.blocks)).toEqual(new Set([4, 5]));
    expect(f.notes).toHaveLength(5);
  });
  it('closes dungeon walls at the area edge and fits a small area', () => {
    const r = run('dungeon', dungeonRoles, 9, { x: 10, y: 10, w: 30, h: 20 });
    for (let x = 0; x < 30; x++) expect([r.kinds[x], r.kinds[19 * 30 + x]]).toEqual([0, 0]);
    expect(verifyReach(r).ok).toBe(true);
  });
  for (const kind of ['dungeon', 'forest'] as const) {
    it(`${kind}: every open cell is reachable from the entry on 200 seeds`, () => {
      const roles = kind === 'dungeon' ? dungeonRoles : forestRoles;
      for (let seed = 1; seed <= 200; seed++) {
        const rect = seed % 3 ? whole : { x: 0, y: 0, w: 12 + (seed % 40), h: 12 + (seed % 25) };
        const r = run(kind, roles, seed, rect);
        const v = verifyReach(r);
        expect(v.ok, `seed ${seed}`).toBe(true);
        expect(r.kinds[r.entry]).toBeLessThan(3);
        expect(r.kinds[r.exit]).toBeLessThan(3);
        expect(v.open, `seed ${seed} not empty`).toBeGreaterThan(rect.w * rect.h * 0.08);
      }
    });
  }
  it('forest trail runs from the entry to the exit', () => {
    const r = run('forest', forestRoles, 21);
    expect(r.terrainCells.path!.length).toBeGreaterThan(20);
    expect(r.terrainCells.path).toContain(r.entry);
    expect(r.terrainCells.path).toContain(r.exit);
  });
});
