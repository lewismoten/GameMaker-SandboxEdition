// The reach model against the real engine when the map above a generated side view is solid. The generator draws a
// platform layout into a rectangle of the map (centered, capped in height), and the Generate dialog places it over
// the map that is already there. On a high ledge near the rectangle's top row, the hero's jump carries his head above
// the rectangle: the reach model (platformReach.ts) treats every cell above the area as open air, but PLAYGAME's
// chkUps stops him at whatever the map holds there, so he falls early and lands short of where the model said.
// With open air above the rectangle the same layouts are won (the control case). On develop at c355211b3 the solid
// case lands 36, 36 and 20 px short (seed 15: 1384 px instead of 1420 px), the same drift the slice-7 dialog showed. No DOM.
import { describe, expect, it } from 'vitest';
import { CHARBL, newBlockSet, serializeBlocks, SOLTOP } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { generatePlatform } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { botPlays } from '../src/editor/editors/map/generate/platformBot';
import { place, WHOLE } from '../src/editor/editors/map/generate/place';
import { starterHero } from './platformTestHero';

/** Blocks numbered like the Starters' (First Steps: sky 0, grass 4, dirt 5, plank 7, flower 9, ladder 10, coin 15, spikes 17). */
function starterBlocks() {
  const bbl = newBlockSet('bbl');
  const rules: Record<number, Partial<(typeof bbl)[number]>> = {
    0: { grav: 4 },
    4: { solid: 15, grav: 0 },
    5: { solid: 15, grav: 0 },
    7: { solid: SOLTOP, grav: 4 },
    9: { grav: 4 },
    10: { grav: 0 },
    15: { grav: 4, scorePts: 10, touchBl: 0 },
    17: { solid: 15, grav: 0, chHitPt: -10 },
  };
  for (const [n, r] of Object.entries(rules)) Object.assign(bbl[Number(n)], r);
  [0, 4, 5, 7, 9, 10, 15, 17].forEach((c, n) => bbl[c].pixels.fill(n + 2));
  return bbl;
}

const ROLES: RoleMap = {
  0: { roles: ['sky'] },
  5: { roles: ['wall'] },
  4: { roles: ['wall', 'wall-top'] },
  7: { roles: ['platform'] },
  10: { roles: ['ladder'] },
  15: { roles: ['treasure'] },
  17: { roles: ['hazard'] },
  9: { roles: ['decoration'] },
};

/** Seeds whose layout (the whole map asked for, difficulty 100) has a jump from a ledge on feet row 3 of the area. */
const SEEDS = [15, 156, 200];

/** The test hero two blocks high, as the Starter heroes are: every frame draws a top half, so PLAYGAME checks his head's cells. */
function tallHero() {
  const hero = starterHero();
  for (const s of hero.sequences) for (const f of s.frames) if (f.pic1 === CHARBL) f.pic1 = 0;
  return hero;
}

async function play(seed: number, around: number) {
  const hero = tallHero();
  const files = new Map<string, Uint8Array>([
    ['x.bbl', serializeBlocks(starterBlocks())],
    ['x.chr', serializeCharacter(hero)],
    ['x.cbl', serializeBlocks(newBlockSet('cbl'))],
  ]);
  const o = generatePlatform({ roles: ROLES, hero, seed, rect: WHOLE, difficulty: 100 });
  if (!o.ok) throw new Error(o.message);
  // the Generate dialog draws the layout over the map that is already there; `around` fills the rest of the map
  const { blocks } = place(new Uint8Array(MLEN * MWID).fill(around), o.result, ROLES, []);
  const run = await botPlays({
    files: { get: (n) => files.get(n.toLowerCase()) },
    names: { bbl: 'x.bbl', chr: 'x.chr', cbl: 'x.cbl' },
    blocks,
    result: o.result,
  });
  return { rectY: o.result.rect.y, run };
}

describe('the reach model at the top of a generated side view', () => {
  it('lands where the model says with open sky above the area (control)', async () => {
    const runs: unknown[] = [];
    for (const seed of SEEDS) {
      const { run } = await play(seed, 0);
      runs.push([seed, run.won, run.why]);
    }
    expect(runs).toEqual(SEEDS.map((seed) => [seed, true, undefined]));
  }, 300000);

  it('lands where the model says with solid map above the area', async () => {
    const runs: unknown[] = [];
    for (const seed of SEEDS) {
      const { rectY, run } = await play(seed, 5);
      // the area sits inside the map, so the row above it is the map's own (here dirt), not the area's
      expect(rectY).toBeGreaterThan(0);
      runs.push([seed, run.won, run.why]);
    }
    expect(runs).toEqual(SEEDS.map((seed) => [seed, true, undefined]));
  }, 300000);
});
