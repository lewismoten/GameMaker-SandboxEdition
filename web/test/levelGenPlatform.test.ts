// The platform generator: every layout over many seeds is proven by the reach model built from the hero's real
// jump, with margin at the default difficulty; the same seed gives the same blocks; roles that are missing
// leave their parts out.
import { describe, expect, it } from 'vitest';
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { generate, generatePlatform, proveResult, type GenResult } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { heroPhysics, weaker } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen/jumpModel';
import { capability } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen/platformCap';
import { reachFrom } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen/platformReach';
import { newArea, type Area } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen/grid';
import { newCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { starterHero } from './platformTestHero';

const ROLES: RoleMap = {
  0: { roles: ['sky'] },
  1: { roles: ['wall'] },
  2: { roles: ['platform'] },
  3: { roles: ['ladder'] },
  4: { roles: ['hazard'] },
  5: { roles: ['treasure'] },
  6: { roles: ['life'] },
  7: { roles: ['locked-door'], pair: 1 },
  8: { roles: ['key'], pair: 1 },
  9: { roles: ['wall-top'] },
  10: { roles: ['decoration'] },
};
const BASIC: RoleMap = { 0: { roles: ['sky'] }, 1: { roles: ['wall'] } };
const rect = { x: 0, y: 0, w: 96, h: 26 };
const hero = starterHero();
const physics = (() => {
  const o = heroPhysics(hero);
  if (!o.ok) throw new Error(o.message);
  return o.physics;
})();

function make(roles: RoleMap, seed: number, difficulty?: number, monsters?: number[]): GenResult {
  const o = generatePlatform({ roles, hero, seed, rect, difficulty, monsters });
  if (!o.ok) throw new Error(o.message);
  return o.result;
}
const area = (r: GenResult): Area => ({ w: r.rect.w, h: r.rect.h, cells: r.kinds });
const SEEDS = Array.from({ length: 10 }, (_, i) => i * 7919 + 3);

describe('platform generator', () => {
  it('proves every layout reachable by the real jump, every pickup collectable and every lock holding', () => {
    for (const seed of SEEDS) {
      const r = make(ROLES, seed, undefined, [1, 2]);
      const p = proveResult(r);
      expect([seed, p.reach, p.keysFirst, p.collectable]).toEqual([seed, true, true, true]);
      // played again from outside: with the lock open (the key has been picked up) the exit is reachable
      const again = reachFrom(area(r), physics, r.entry, true);
      expect(again.stood[r.exit]).toBe(1);
      for (const c of [...r.treasure, ...r.locks.map((l) => l.key)]) expect(again.touched[c]).toBe(1);
      expect(r.platform!.proof.exit).toBe(true);
    }
  });

  it('keeps a margin: at 50% a weaker hero (85% speed, 95% push) still gets through every layout', () => {
    const weak = weaker(physics, 0.85, 0.95);
    for (const seed of SEEDS) {
      const r = make(ROLES, seed, 50);
      expect([seed, reachFrom(area(r), weak, r.entry, true).stood[r.exit]]).toEqual([seed, 1]);
    }
  });

  it('asks no more pit width and step height than the share of the hero’s most that the difficulty names', () => {
    const cap = capability(physics);
    const most = { 30: { rise: 0, gap: 0 }, 100: { rise: 0, gap: 0 } };
    for (const d of [30, 100] as const) {
      for (const seed of SEEDS) {
        const r = make(BASIC, seed, d);
        const asked = r.platform!.asked;
        const share = r.platform!.difficulty;
        expect(asked.rise).toBeLessThanOrEqual(Math.max(1, Math.floor(cap.maxRise * share)));
        expect(asked.gap).toBeLessThanOrEqual(Math.max(1, Math.floor(cap.maxGap * share)));
        most[d].rise = Math.max(most[d].rise, asked.rise);
        most[d].gap = Math.max(most[d].gap, asked.gap);
      }
    }
    expect(most[100].gap).toBeGreaterThan(most[30].gap);
    expect(most[100].rise).toBeGreaterThanOrEqual(most[30].rise);
    expect(most[100].gap).toBeLessThanOrEqual(cap.maxGap);
  });

  it('is the same every time for a seed, and different for another', () => {
    const a = make(ROLES, 11),
      b = make(ROLES, 11),
      c = make(ROLES, 12);
    expect(Array.from(a.blocks)).toEqual(Array.from(b.blocks));
    expect(Array.from(a.blocks)).not.toEqual(Array.from(c.blocks));
  });

  it('needs sky and wall blocks and the hero’s character file, and says so', () => {
    expect(generate({ 1: { roles: ['wall'] } }, { kind: 'platform', seed: 1, rect, hero }).ok).toBe(false);
    const o = generate(BASIC, { kind: 'platform', seed: 1, rect });
    expect(o.ok).toBe(false);
    if (!o.ok) expect(o.message).toMatch(/character file/);
    const noJump = generate(BASIC, { kind: 'platform', seed: 1, rect, hero: newCharacter() });
    expect(noJump.ok).toBe(false);
  });

  it('leaves out what the block set cannot draw: no ladders without a ladder block, none without a hero who climbs', () => {
    const r = make(BASIC, 5);
    expect(Array.from(r.blocks).every((b) => b === 0 || b === 1)).toBe(true);
    expect(r.treasure).toHaveLength(0);
    const climber = make(ROLES, 5);
    expect(climber.blocks.some((b) => b === 3)).toBe(true);
    const noClimb = starterHero();
    noClimb.sequences[7].key = 0;
    noClimb.sequences[8].key = 0;
    const o = generatePlatform({ roles: ROLES, hero: noClimb, seed: 5, rect });
    expect(o.ok && o.result.blocks.some((b) => b === 3)).toBe(false);
  });

  it('draws spikes in pits and over the ground, coins over pits, ledges and a tall locked door', () => {
    let spikes = 0,
      coins = 0,
      ledges = 0,
      doors = 0;
    for (const seed of SEEDS) {
      const r = make(ROLES, seed);
      for (const b of r.blocks) {
        if (b === 4) spikes++;
        if (b === 5) coins++;
        if (b === 2) ledges++;
        if (b === 7) doors++;
      }
    }
    expect(spikes).toBeGreaterThan(0);
    expect(coins).toBeGreaterThan(SEEDS.length * 3);
    expect(ledges).toBeGreaterThan(0);
    expect(doors).toBeGreaterThan(0);
  });

  it('proposes the entry on the left and the exit on the right, on the ground', () => {
    const r = make(ROLES, 99);
    expect(r.entry % r.rect.w).toBeLessThan(r.rect.w / 4);
    expect(r.exit % r.rect.w).toBeGreaterThan((r.rect.w * 3) / 4);
    expect(newArea(1, 1, 0).cells.length).toBe(1);
  });
});
