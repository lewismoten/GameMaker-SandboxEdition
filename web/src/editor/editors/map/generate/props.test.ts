import { describe, expect, it } from 'vitest';
import { newBlockSet } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { generate } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { checkLayout } from './verifyOffer';
import { place, placeMonsters } from './place';

const roles: RoleMap = {
  1: { roles: ['wall'] },
  2: { roles: ['floor'] },
  10: { roles: ['locked-door'], pair: 1 },
  11: { roles: ['key'], pair: 1 },
  20: { roles: ['treasure'] },
};
const rect = { x: 10, y: 10, w: 60, h: 50 };
const gen = (seed: number, monsters?: number[]) => {
  const o = generate(roles, { kind: 'dungeon', seed, rect, monsters });
  if (!o.ok) throw new Error(o.message);
  return o.result;
};
/** Walls solid; a locked door solid but costing a counter (so it can open); everything else open. */
const bg = newBlockSet('bbl');
bg[1].solid = 15;
Object.assign(bg[10], { solid: 15, effect: 20, eamt: -1 });

describe('placing monsters', () => {
  it('clears the area first, fills free slots, keeps outside monsters, and indexes them', () => {
    const map = newMap();
    Object.assign(map.monsters[0], { monnum: 5, curx: 12, cury: 12 });
    Object.assign(map.monsters[1], { monnum: 6, curx: 90, cury: 90 });
    const r = gen(8, [3, 4]);
    const { placed, dropped } = placeMonsters(map, r);
    expect(dropped).toBe(0);
    expect(placed).toBe(r.monsters.length);
    expect(map.monsters.filter((m) => m.monnum < 64 && m.curx === 90).length).toBe(1);
    expect(map.monsters.some((m) => m.curx === 12 && m.cury === 12 && m.monnum === 5)).toBe(false);
    for (const m of r.monsters) expect(map.mons[(rect.y + Math.floor(m.cell / rect.w)) * MLEN + rect.x + (m.cell % rect.w)]).toBeLessThan(200);
  });
  it('leaves an untouched map byte for byte (no result, no change)', () => {
    const map = newMap();
    const before = serializeMap(map);
    place(map.blocks, gen(2), roles, []);
    expect(serializeMap(map)).toEqual(before);
  });
});

describe('the Verified chip', () => {
  it('verifies layouts whose locked door can open (30 seeds)', () => {
    for (let s = 1; s <= 30; s++) {
      const r = gen(s);
      const c = checkLayout(r, place(new Uint8Array(MLEN * MLEN), r, roles, []).blocks, bg);
      expect(c.problems, `seed ${s}`).toEqual([]);
      expect(c.verified).toBe(true);
    }
  });
  it('says Not proven, as a suggestion, when the locked door block can never open', () => {
    const shut = newBlockSet('bbl');
    shut[1].solid = 15;
    shut[10].solid = 15;
    const r = gen(1);
    expect(r.locks.length).toBeGreaterThan(0);
    const c = checkLayout(r, place(new Uint8Array(MLEN * MLEN), r, roles, []).blocks, shut);
    expect(c.verified).toBe(false);
    expect(c.problems.join(' ')).toMatch(/looks sealed in by block settings/);
  });
});
