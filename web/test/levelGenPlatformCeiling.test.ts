// The reach model against the real engine below solid ceilings. Originally seeds 15, 156 and 200
// jumped above the generated rectangle into unknown map cells, landing 36, 36 and 20 px short.
// Keep those boundary regressions and check exact landings at ceiling edges inside the known area.
import { describe, expect, it } from 'vitest';
import { BLEN, CHARBL, newBlockSet, serializeBlocks, SOLTOP } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { ADVTYPE, emptyScene, newGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, MWID, newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { generatePlatform, heroPhysics, reachFrom, type Step } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { newArea, SKY, WALL } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen/grid';
import { SceneSim } from '../src/editor/check/sim';
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

/** Seeds that originally sent a jump above the generated rectangle. */
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

// Compare a planned jump with the engine, including the horizontal snap at a ceiling edge.
it.each([1, -1])('matches exact landings below a ceiling edge when steering %i', async (dir) => {
  const hero = tallHero();
  const hp = heroPhysics(hero);
  if (!hp.ok) throw new Error(hp.message);
  const failures: unknown[] = [];
  let jumps = 0;
  const source = dir === 1 ? 4 : 15;
  const a = newArea(20, 16, SKY);
  for (let y = 9; y < a.h; y++) for (let x = 0; x < a.w; x++) if (x === source || ((dir === 1 ? x >= 8 : x <= 11) && y >= 14)) a.cells[y * a.w + x] = WALL;
  for (let x = 0; x < a.w; x++) if (dir === 1 ? x <= source : x >= source) a.cells[4 * a.w + x] = WALL;
  const reach = reachFrom(a, hp.physics, 8 * a.w + source, true, { route: true });
  const steps = new Map<string, Step>();
  for (let c = 0; c < a.cells.length; c++) for (const st of reach.routeTo(c) ?? []) if (st.kind === 'jump') steps.set(JSON.stringify(st), st);
  // The edge snap adds four pixels to this jump: without it the model predicts 152 / 228 px.
  expect([...steps.values()]).toContainEqual(
    expect.objectContaining({
      from: { X: source * BLEN, row: 8 },
      steerTicks: 18,
      to: { X: source * BLEN + dir * 76, row: 13 },
    }),
  );
  for (const st of steps.values()) {
    jumps++;
    const map = newMap();
    for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) map.blocks[y * MLEN + x] = a.cells[y * a.w + x] === WALL ? 5 : 0;
    const game = newGame('Ceiling');
    const scene = emptyScene(ADVTYPE);
    scene.files = ['', 'x.map', 'x.bbl', '', '', 'x.chr', 'x.cbl', ...new Array(13).fill('')];
    game.scenes.push(scene);
    const files = new Map([
      ['x.map', serializeMap(map)],
      ['x.bbl', serializeBlocks(starterBlocks())],
      ['x.chr', serializeCharacter(hero)],
      ['x.cbl', serializeBlocks(newBlockSet('cbl'))],
    ]);
    const sim = new SceneSim(game, 2, { get: (n) => files.get(n.toLowerCase()) }, { x: Math.floor(st.from.X / BLEN), y: st.from.row });
    sim.w.chr.x[1] = st.from.X % BLEN;
    for (let t = 0; t < 6; t++) await sim.tick();
    const key = st.dir === 1 ? hp.physics.keys.right : hp.physics.keys.left!;
    sim.hold(st.dir ? [key, hp.physics.keys.jump] : [hp.physics.keys.jump]);
    for (let t = 0; t < 90; t++) {
      await sim.tick();
      sim.hold(st.dir && t + 1 <= st.steerTicks ? [key] : []);
      if (t > 3 && sim.w.chr.y[0] === st.to.row && sim.w.chr.y[1] === 0 && sim.w.ci.gravy === 0) break;
    }
    const landed = { X: sim.w.chr.x[0] * BLEN + sim.w.chr.x[1], Y: sim.w.chr.y[0] * BLEN + sim.w.chr.y[1] };
    if (landed.X !== st.to.X || landed.Y !== st.to.row * BLEN) failures.push({ dir, st, landed });
  }
  expect(jumps).toBeGreaterThan(0);
  expect(failures).toEqual([]);
});
