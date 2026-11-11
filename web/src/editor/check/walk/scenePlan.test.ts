// A hub should try the key-bearing branch before committing to a branch with an unpaid gate.
import { expect, it } from 'vitest';
import { newBlockSet, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeGame, emptyScene, ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseMap, newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { autoWalk } from './autoWalk';
import { verifyWalk } from './verify';
import { GameFiles } from '../../../project/files';
import { startCharInfo } from '../sim';
import { testGame } from '../testGame';
import { preferSuppliedBranches } from './scenePlan';

it('defers an inherited downstream gate with a circular key until its counter has been collected', () => {
  const t = testGame(['#####', '#S.E#', '#####']);
  const bbl = newBlockSet('bbl');
  Object.assign(bbl[5], { solid: 15, effect: 20, eamt: -1, touchBl: 6 });
  Object.assign(bbl[6], { effect: 20, eamt: 1 });
  const map = newMap();
  map.blocks[101] = 5;
  t.files.set('gate.bbl', serializeBlocks(bbl));
  t.files.set('gate.map', serializeMap(map));
  for (let i = 3; i <= 5; i++) {
    const scene = emptyScene(ADVTYPE);
    scene.files = [...t.game.scenes[2].files];
    if (i === 3) scene.files[2] = 'gate.bbl';
    if (i === 5) {
      scene.files[1] = 'gate.map';
      scene.files[2] = ''; // Inherit the preceding branch's blocks, not the hub's blocks.
    }
    scene.links[0] = { from: { x: 3, y: 1 }, to: { x: 1, y: 1 }, toScene: i === 3 ? 5 : 2 };
    t.game.scenes.push(scene);
  }
  const ways = [3, 4].map((toScene) => ({ from: { x: toScene, y: 1 }, to: { x: 1, y: 1 }, toScene }));
  const entry = { start: { x: 1, y: 1 }, ci: startCharInfo(), clock: 1 };
  expect(preferSuppliedBranches(t.game, t, 2, entry, ways).map((l) => l.toScene)).toEqual([4]);
  entry.ci.meter[0] = 1;
  entry.ci.meter[20] = 2;
  expect(preferSuppliedBranches(t.game, t, 2, entry, ways)).toEqual(ways);
});

it('backs out of a refused gate, collects a key in another room, and replays to a win', async () => {
  const t = testGame(['############', '#..........#', '#..........#', '#....S.E...#', '############']);
  const room = testGame(['############', '#..........#', '#..........#', '#.S.......E#', '############']);
  const bbl = newBlockSet('bbl');
  bbl[0].grav = 4;
  bbl[1].solid = 15;
  Object.assign(bbl[4], { grav: 4, effect: 20, eamt: 1, touchBl: 0 });
  Object.assign(bbl[5], { solid: 15, effect: 20, eamt: -1, touchBl: 0 });
  t.files.set('test.bbl', serializeBlocks(bbl));
  const gated = parseMap(room.files.get('test.map')!);
  gated.blocks[3 * 100 + 6] = 5;
  gated.blocks[4] = 4; // Sealed above the corridor, and no jump key exists in this character.
  t.files.set('gated.map', serializeMap(gated));
  const keys = parseMap(room.files.get('test.map')!);
  keys.blocks[3 * 100 + 5] = 4;
  t.files.set('keys.map', serializeMap(keys));
  for (const [i, map] of [
    [3, 'gated.map'],
    [4, 'keys.map'],
  ] as const) {
    const s = emptyScene(ADVTYPE);
    s.files = [...t.game.scenes[2].files];
    s.files[1] = map;
    s.links[0] = { from: { x: 10, y: 3 }, to: { x: 5, y: 3 }, toScene: i === 3 ? 1 : 2 };
    s.links[1] = { from: { x: 1, y: 3 }, to: { x: 5, y: 3 }, toScene: 2 };
    t.game.scenes.push(s);
  }
  t.game.scenes[2].links[0] = { from: { x: 7, y: 3 }, to: { x: 2, y: 3 }, toScene: 3 };
  t.game.scenes[2].links[1] = { from: { x: 1, y: 3 }, to: { x: 2, y: 3 }, toScene: 4 };
  // Keep the serialized game in step for verification in a fresh engine.
  t.files.set('test.gam', serializeGame(t.game));
  const r = await autoWalk(t.game, t, 'test', { human: false, budgetMs: 1000 });
  expect(r.won).toBe(true);
  expect(r.scenes.map((s) => s.scene)).toEqual([2, 3, 2, 4, 2, 3]);
  const verified = await verifyWalk(new GameFiles(t.files), 'test.gam', r.walk!, { maxMinutes: 2 });
  expect(verified.won).toBe(true);
}, 30_000);

it('returns from an unpassed branch without a counter gate and tries another hub branch', async () => {
  const t = testGame(['##############', '#............#', '#............#', '#.....S......#', '##############']);
  const bad = testGame(['##############', '#............#', '#............#', '#..S.#......E#', '##############']);
  const good = testGame(['##############', '#............#', '#............#', '#S.........E.#', '##############']);
  t.files.set('bad.map', bad.files.get('test.map')!);
  t.files.set('good.map', good.files.get('test.map')!);
  for (const n of [3, 4, 5]) {
    const s = emptyScene(ADVTYPE);
    s.files = [...t.game.scenes[2].files];
    s.files[1] = n === 3 ? 'bad.map' : 'good.map';
    s.links[0] = { from: { x: n === 3 ? 12 : 11, y: 3 }, to: { x: 1, y: 3 }, toScene: n === 3 ? 5 : 1 };
    if (n === 3) s.links[1] = { from: { x: 1, y: 3 }, to: { x: 6, y: 3 }, toScene: 2 };
    t.game.scenes.push(s);
  }
  t.game.scenes[2].links[0] = { from: { x: 9, y: 3 }, to: { x: 3, y: 3 }, toScene: 3 };
  t.game.scenes[2].links[1] = { from: { x: 1, y: 3 }, to: { x: 1, y: 3 }, toScene: 4 };
  t.files.set('test.gam', serializeGame(t.game));
  const result = await autoWalk(t.game, t, 'test', { human: false, budgetMs: 1000 });
  expect(result.won).toBe(true);
  expect(result.scenes.map((s) => s.scene)).toEqual([2, 3, 2, 4]);
  expect((await verifyWalk(new GameFiles(t.files), 'test.gam', result.walk!, { maxMinutes: 2 })).won).toBe(true);
}, 30_000);

it('fetches an exit key for a later gate that inherits blocks across a nonadjacent scene link', async () => {
  const t = testGame(['############', '#..........#', '#..........#', '#....S.....#', '############']);
  const side = testGame(['############', '#..........#', '#..........#', '#.S........#', '############']);
  const gate = testGame(['############', '#..........#', '#..........#', '#.S.......E#', '############']);
  const blocks = newBlockSet('bbl');
  blocks[0].grav = 4;
  blocks[1].solid = 15;
  Object.assign(blocks[4], { grav: 4, effect: 20, eamt: 1, touchBl: 0 });
  t.files.set('test.bbl', serializeBlocks(blocks));
  const gateBlocks = newBlockSet('bbl');
  gateBlocks[0].grav = 4;
  gateBlocks[1].solid = 15;
  Object.assign(gateBlocks[5], { solid: 15, effect: 20, eamt: -1, touchBl: 0 });
  t.files.set('gate.bbl', serializeBlocks(gateBlocks));
  t.files.set('plain.map', gate.files.get('test.map')!);
  const sm = parseMap(side.files.get('test.map')!);
  sm.blocks[301] = 4;
  const gm = parseMap(gate.files.get('test.map')!);
  gm.blocks[305] = 5;
  t.files.set('side.map', serializeMap(sm));
  t.files.set('gate.map', serializeMap(gm));
  for (const n of [3, 4]) {
    const s = emptyScene(ADVTYPE);
    s.files = [...t.game.scenes[2].files];
    s.files[1] = n === 3 ? 'side.map' : 'plain.map';
    if (n === 4) s.files[2] = 'gate.bbl';
    s.links[0] = { from: { x: n === 3 ? 3 : 10, y: 3 }, to: { x: n === 3 ? 1 : 5, y: 3 }, toScene: n === 3 ? 2 : 6 }; // Empty exit lands somewhere new; the key exit returns to the known arrival.
    s.links[1] = { from: { x: 1, y: 3 }, to: { x: 5, y: 3 }, toScene: 2 };
    t.game.scenes.push(s);
  }
  const unused = emptyScene(ADVTYPE);
  unused.files = [...t.game.scenes[2].files];
  t.game.scenes.push(unused);
  const last = emptyScene(ADVTYPE);
  last.files = [...t.game.scenes[2].files];
  last.files[1] = 'gate.map';
  last.files[2] = '';
  last.links[0] = { from: { x: 10, y: 3 }, to: { x: 0, y: 0 }, toScene: 1 };
  t.game.scenes.push(last);
  t.game.scenes[2].links[0] = { from: { x: 7, y: 3 }, to: { x: 2, y: 3 }, toScene: 3 };
  t.game.scenes[2].links[1] = { from: { x: 1, y: 3 }, to: { x: 2, y: 3 }, toScene: 4 };
  t.files.set('test.gam', serializeGame(t.game));
  const result = await autoWalk(t.game, t, 'test', { human: false, budgetMs: 1000 });
  expect(result.won).toBe(true);
  expect(result.scenes.map((s) => s.scene)).toEqual([2, 3, 2, 4, 6]);
  expect(result.scenes[1].strategy).toBe('keys');
  expect((await verifyWalk(new GameFiles(t.files), 'test.gam', result.walk!, { maxMinutes: 2 })).won).toBe(true);
}, 30_000);

it('starts before a one-way shortcut while keeping cyclic hub branches available', () => {
  const t = testGame(['#####', '#S.E#', '#####']);
  for (let i = 3; i <= 4; i++) {
    const s = emptyScene(ADVTYPE);
    s.files = [...t.game.scenes[2].files];
    s.links[0] = { from: { x: 3, y: 1 }, to: { x: 1, y: 1 }, toScene: i === 3 ? 4 : 1 };
    t.game.scenes.push(s);
  }
  const ways = [4, 3].map((toScene) => ({ from: { x: toScene, y: 1 }, to: { x: 1, y: 1 }, toScene }));
  const entry = { start: { x: 1, y: 1 }, ci: startCharInfo(), clock: 1 };
  expect(preferSuppliedBranches(t.game, t, 2, entry, ways)).toEqual([ways[1]]);
  t.game.scenes[4].links[0].toScene = 3;
  expect(preferSuppliedBranches(t.game, t, 2, entry, ways)).toEqual(ways);
});
