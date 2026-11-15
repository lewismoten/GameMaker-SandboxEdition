import { describe, expect, it } from 'vitest';
import { newBlockSet } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { checkNeeds } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { openFrom } from '../../../check/checks/sealed';
import { newTerrain, type Terrain } from '../tools/autotile';
import { WHOLE, offers, place, terrainFor } from './place';
import { generate } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';

const roles: RoleMap = { 1: { roles: ['wall'] }, 2: { roles: ['floor'] }, 3: { roles: ['tree'] }, 4: { roles: ['path'] } };
const wallSet: Terrain = { ...newTerrain('w', 'Wall', 'edges', 2), tiles: [10, 11, 12, 13, 1, 14, 15, 16, 17, 18, 19, 20, 21] };
const treeSet: Terrain = { ...newTerrain('t', 'Trees', 'bits16', 2), tiles: [...Array.from({ length: 15 }, (_, i) => 30 + i), 3] };

/** A block set where the wall pieces and trees are solid, the rest open. */
const bg = newBlockSet('bbl');
for (const n of [1, 3, ...Array.from({ length: 12 }, (_, i) => 10 + i), ...Array.from({ length: 16 }, (_, i) => 30 + i)]) bg[n].solid = 15;

const solidAt = (blocks: Uint8Array) => blocks.map((b) => (bg[b].solid === 15 ? 1 : 0));

describe('placing a layout', () => {
  it('finds the terrain whose fill holds the role', () => {
    expect(terrainFor([wallSet, treeSet], roles, 'wall')).toBe(wallSet);
    expect(terrainFor([wallSet, treeSet], roles, 'tree')).toBe(treeSet);
    expect(terrainFor([wallSet], roles, 'tree')).toBeUndefined();
  });

  it('draws only inside the area (plus edge fix-ups at its border) and leaves the rest of the map alone', () => {
    const base = new Uint8Array(MLEN * MWID).fill(9);
    const o = generate(roles, { kind: 'dungeon', seed: 4, rect: { x: 20, y: 30, w: 40, h: 30 } });
    if (!o.ok) throw new Error(o.message);
    const { changed } = place(base, o.result, roles, [wallSet]);
    for (const i of changed) {
      const x = i % MLEN,
        y = (i / MLEN) | 0;
      expect(x >= 19 && x <= 60 && y >= 29 && y <= 60).toBe(true);
    }
  });

  it('uses edge blocks on walls and keeps every open cell reachable from the entry (60 seeds)', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const base = new Uint8Array(MLEN * MWID).fill(1);
      const rect = seed % 2 ? WHOLE : { x: 10, y: 10, w: 20 + (seed % 50), h: 20 + (seed % 30) };
      const o = generate(roles, { kind: 'dungeon', seed, rect });
      if (!o.ok) throw new Error(o.message);
      const { blocks } = place(base, o.result, roles, [wallSet]);
      expect(new Set(blocks).has(10) || new Set(blocks).has(14), `seed ${seed} edges`).toBe(true);
      const solid = solidAt(blocks);
      const entry = (rect.y + ((o.result.entry / rect.w) | 0)) * MLEN + rect.x + (o.result.entry % rect.w);
      const seen = openFrom(blocks, bg, [entry]);
      for (let i = 0; i < blocks.length; i++) expect(seen[i] === 1, `seed ${seed} cell ${i}`).toBe(!solid[i]);
    }
  }, 30_000); // 1 to 2 s alone, over 5 s when the machine is loaded

  it('forest with tree edges and a path stays reachable', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const base = new Uint8Array(MLEN * MWID).fill(2);
      const o = generate(roles, { kind: 'forest', seed, rect: WHOLE });
      if (!o.ok) throw new Error(o.message);
      const { blocks } = place(base, o.result, roles, [treeSet]);
      const solid = solidAt(blocks);
      const seen = openFrom(blocks, bg, [o.result.entry]);
      // the map wraps, so cells the forest closed off from the far side still count as one region: check reached >= open
      let open = 0,
        reached = 0;
      for (let i = 0; i < blocks.length; i++) if (!solid[i]) (open++, seen[i] && reached++);
      expect(reached, `seed ${seed}`).toBe(open);
    }
  });

  it('offers four different, working layouts and nothing when a role is missing', () => {
    const four = offers(new Uint8Array(MLEN * MWID).fill(1), roles, [], 'dungeon', 100, WHOLE);
    expect(four).toHaveLength(4);
    expect(new Set(four.map((f) => f.seed)).size).toBe(4);
    expect(four.every((f) => f.outcome.ok && f.blocks)).toBe(true);
    expect(checkNeeds('dungeon', { 1: { roles: ['wall'] } }).ok).toBe(false);
  });
});
