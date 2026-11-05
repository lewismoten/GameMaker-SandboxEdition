// A stopped keys strategy preserves its compact fetch diagnostics for callers such as walk:auto.
import { describe, expect, it } from 'vitest';
import { newBlockSet, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { testGame, type TestGame } from '../testGame';
import { autoWalk } from './autoWalk';

const KEY = 4;
const DOOR = 5;

// prettier-ignore
const ROWS = [
  '################',
  '#...###........#',
  '#...###........#',
  '#k..###..S.D.E.#',
  '################',
];

function lockedGame(rows: string[] = ROWS): TestGame {
  const t = testGame(rows);
  const bbl = parseBlocks(t.files.get('test.bbl')!, newBlockSet('bbl').length);
  Object.assign(bbl[KEY], { grav: 4, effect: 20, eamt: 1, touchBl: 0 });
  bbl[KEY].pixels.fill(14);
  Object.assign(bbl[DOOR], { solid: 15, effect: 20, eamt: -1, touchBl: 0 });
  bbl[DOOR].pixels.fill(6);
  const map = parseMap(t.files.get('test.map')!);
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === 'k') map.blocks[y * MLEN + x] = KEY;
      if (ch === 'D') map.blocks[y * MLEN + x] = DOOR;
    }),
  );
  t.files.set('test.bbl', serializeBlocks(bbl));
  t.files.set('test.map', serializeMap(map));
  return t;
}

describe('keys strategy scene outcome', () => {
  it('retains failed fetch diagnostics on the stopped scene', async () => {
    const t = lockedGame();
    const result = await autoWalk(t.game, t, 'test', { budgetMs: 10_000, human: false });
    expect(result.won).toBe(false);
    expect(result.scenes[0].keys).toMatchObject({
      cutoff: 'no-reachable-state',
    });
    expect(result.scenes[0].keys?.rounds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'key',
          source: { counter: 20, cell: 3 * MLEN + 1 },
          complete: true,
          cutoff: 'no-reachable-state',
        }),
      ]),
    );
  }, 60_000);
});
