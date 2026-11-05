// The counter ledger: a door's finding says what the whole game supplies, by scene and source.
import { describe, expect, it } from 'vitest';
import { emptyMonster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { scenesOf, type SceneData } from '../sceneData';
import { testGame } from '../testGame';
import { counters, counterSources } from './blockChecks';
import { counterLedger } from './counterLedger';

const ROWS = ['######################', '#....................#', '#E.S.................#', '######################'];

/** Two scenes: a hub with a door that takes `take` of counter 21, and a side scene with `coins` +1 blocks. */
function twoScenes(take: number, coins: number, hubCoins = 0): [SceneData, SceneData] {
  const [hub, side] = [scenesOf(testGame(ROWS).game, testGame(ROWS))[0], scenesOf(testGame(ROWS).game, testGame(ROWS))[0]];
  side.scene = 7;
  side.name = 'Tail Cave';
  for (const d of [hub, side]) {
    Object.assign(d.bbl[20], { effect: 21, eamt: 1, touchBl: 0 });
    Object.assign(d.bbl[21], { effect: 21, eamt: -take, solid: 15, touchBl: 0 });
  }
  hub.map.blocks[220] = 21;
  for (let x = 1; x <= hubCoins; x++) hub.map.blocks[100 + x] = 20;
  for (let x = 1; x <= coins; x++) side.map.blocks[100 + x] = 20;
  return [hub, side];
}

describe('counter ledger', () => {
  it('says other scenes give enough, as an info', () => {
    const [hub, side] = twoScenes(4, 4);
    const f = counters(hub, counterSources([hub, side]), counterLedger([hub, side]));
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe('info');
    expect(f[0].title).toBe('Counter 21: the gate needs 4; this scene gives 0; Tail Cave gives 4');
    expect(f[0].detail).toContain('Tail Cave 4');
  });

  it('warns when the whole game falls short', () => {
    const [hub, side] = twoScenes(20, 4, 3);
    const f = counters(hub, counterSources([hub, side]), counterLedger([hub, side]));
    expect(f.map((x) => x.severity)).toEqual(['warning']);
    expect(f[0].title).toContain('this scene gives 3');
    expect(f[0].title).toContain('not enough in the whole game');
  });

  it('is quiet when the scene itself gives enough', () => {
    const [hub, side] = twoScenes(4, 9, 6);
    expect(counters(hub, counterSources([hub, side]), counterLedger([hub, side]))).toEqual([]);
  });

  it('counts monsters that turn into a pickup when they die as their own line', () => {
    const [hub, side] = twoScenes(2, 0);
    side.mon.push(...Array.from({ length: 64 }, emptyMonster));
    side.mon[0].pic[0] = [20, 0];
    side.mbl = side.bbl;
    for (let i = 0; i < 3; i++) side.map.monsters[i] = { ...side.map.monsters[i], monnum: 0, curx: 3 + i, cury: 1 };
    const l = counterLedger([hub, side]);
    expect(l.get(21)).toEqual([expect.objectContaining({ scene: 7, blocks: 0, monsters: 3, monsterCount: 3 })]);
    const f = counters(hub, counterSources([hub, side]), l);
    expect(f[0].detail).toContain('3 from 3 monsters');
  });

  it('keeps a monster-fed shortfall an info: monsters respawn and drop what the map does not show', () => {
    const [hub, side] = twoScenes(20, 0);
    side.mon.push(...Array.from({ length: 64 }, emptyMonster));
    side.mon[0].pic[0] = [20, 0];
    side.mbl = side.bbl;
    side.map.monsters[0] = { ...side.map.monsters[0], monnum: 0, curx: 3, cury: 1 };
    const f = counters(hub, counterSources([hub, side]), counterLedger([hub, side]));
    expect(f.map((x) => x.severity)).toEqual(['info']);
    expect(f[0].title).toContain('not enough in the whole game as drawn');
  });

  it('adds nothing without a ledger', () => {
    const [hub, side] = twoScenes(4, 4);
    expect(counters(hub, counterSources([hub, side]))).toEqual([]);
  });
});
