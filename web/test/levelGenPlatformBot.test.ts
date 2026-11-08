// The walkthrough bot on generated side views: a sample of layouts on made-up blocks and the Starter hero's character.
import { describe, expect, it } from 'vitest';
import { newBlockSet, serializeBlocks, SOLTOP } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { generatePlatform } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { botPlays } from '../src/editor/editors/map/generate/platformBot';
import { place } from '../src/editor/editors/map/generate/place';
import { starterHero } from './platformTestHero';

const ROLES: RoleMap = {
  0: { roles: ['sky'] },
  1: { roles: ['wall'] },
  2: { roles: ['platform'] },
  3: { roles: ['ladder'] },
  4: { roles: ['hazard'] },
  5: { roles: ['treasure'] },
  6: { roles: ['life'] },
};

function blockSet() {
  const bbl = newBlockSet('bbl');
  const paint = (n: number, c: number) => bbl[n].pixels.fill(c);
  Object.assign(bbl[0], { grav: 4 });
  Object.assign(bbl[1], { solid: 15 });
  Object.assign(bbl[2], { solid: SOLTOP, grav: 4 });
  Object.assign(bbl[3], { grav: 0 });
  Object.assign(bbl[4], { grav: 4, chHitPt: -5 });
  Object.assign(bbl[5], { grav: 4, scorePts: 10, touchBl: 0 });
  Object.assign(bbl[6], { grav: 4, scorePts: 10, touchBl: 0 });
  [3, 7, 14, 13, 9, 12, 10].forEach((c, n) => paint(n, c));
  return bbl;
}

describe('the bot on generated platform layouts', () => {
  it('wins on a sample of seeds', async () => {
    const hero = starterHero();
    const cbl = newBlockSet('cbl');
    const files = new Map<string, Uint8Array>([
      ['x.bbl', serializeBlocks(blockSet())],
      ['x.chr', serializeCharacter(hero)],
      ['x.cbl', serializeBlocks(cbl)],
    ]);
    let won = 0;
    const seeds = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    for (const seed of seeds) {
      const o = generatePlatform({ roles: ROLES, hero, seed, rect: { x: 4, y: 60, w: 90, h: 24 } });
      if (!o.ok) throw new Error(o.message);
      const base = new Uint8Array(MLEN * MWID).fill(1);
      const { blocks } = place(base, o.result, ROLES, []);
      const run = await botPlays({
        files: { get: (n) => files.get(n.toLowerCase()) },
        names: { bbl: 'x.bbl', chr: 'x.chr', cbl: 'x.cbl' },
        blocks,
        result: o.result,
      });
      expect([seed, run.won, run.why]).toEqual([seed, true, undefined]);
      if (run.won) won++;
    }
    expect(won).toBe(seeds.length);
  }, 300000);

  it('lands where the reach model says on blocks numbered like the Starters (the ground check nudges him off an edge)', async () => {
    const bbl = newBlockSet('bbl');
    const rules: Record<number, Partial<(typeof bbl)[number]>> = {
      0: { grav: 4 },
      4: { solid: 15, grav: 4 },
      5: { solid: 15, grav: 4 },
      7: { solid: SOLTOP, grav: 4 },
      9: { grav: 4 },
      10: { grav: 0 },
      15: { grav: 4, scorePts: 10, touchBl: 0 },
      17: { grav: 4, chHitPt: -5 },
    };
    for (const [n, r] of Object.entries(rules)) Object.assign(bbl[Number(n)], r);
    const roles: RoleMap = {
      0: { roles: ['sky'] },
      5: { roles: ['wall'] },
      4: { roles: ['wall', 'wall-top'] },
      7: { roles: ['platform'] },
      10: { roles: ['ladder'] },
      15: { roles: ['treasure'] },
      17: { roles: ['hazard'] },
      9: { roles: ['decoration'] },
    };
    [0, 4, 5, 7, 9, 10, 15, 17].forEach((c, n) => bbl[c].pixels.fill(n + 2));
    const hero = starterHero();
    const files = new Map<string, Uint8Array>([
      ['x.bbl', serializeBlocks(bbl)],
      ['x.chr', serializeCharacter(hero)],
      ['x.cbl', serializeBlocks(newBlockSet('cbl'))],
    ]);
    // 255374 landed 24 px past the model (the nudge off an edge); 255377 and 2 slid on down a ladder (its fade, and steering on)
    for (const seed of [255374, 255377, 2, 255375, 255376, 1, 17, 99, 4242, 77777, 101, 102, 103, 104, 105, 106]) {
      const o = generatePlatform({ roles, hero, seed, rect: { x: 4, y: 60, w: 90, h: 24 } });
      if (!o.ok) continue;
      const { blocks } = place(new Uint8Array(MLEN * MWID).fill(0), o.result, roles, []);
      const run = await botPlays({
        files: { get: (n) => files.get(n.toLowerCase()) },
        names: { bbl: 'x.bbl', chr: 'x.chr', cbl: 'x.cbl' },
        blocks,
        result: o.result,
      });
      expect([seed, run.won, run.why]).toEqual([seed, true, undefined]);
    }
  }, 300000);
});
