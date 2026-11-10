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

it('defers a downstream gate with a circular key until its counter has been collected', () => {
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
    if (i === 5) {
      scene.files[1] = 'gate.map';
      scene.files[2] = 'gate.bbl';
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
