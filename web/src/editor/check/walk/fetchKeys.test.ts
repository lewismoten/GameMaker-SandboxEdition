// The walkthrough bot fetches a key that sits off the route before the locked door on it.
import { describe, expect, it } from 'vitest';
import { newBlockSet, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { GameFiles } from '../../../project/files';
import { startCharInfo } from '../sim';
import { testGame, type TestGame } from '../testGame';
import { autoWalk } from './autoWalk';
import { fetchKeys, locksAtEntry } from './fetchKeys';
import { verifyWalk } from './verify';

// the start is in the middle: the key is to the left, the door and the exit to the right
// prettier-ignore
const ROWS = [
  '################',
  '#..............#',
  '#..............#',
  '#k.....S...D..E#',
  '################',
];
const KEY = 4;
const DOOR = 5;

/** testGame's level with the key and door painted in: both read counter 20, the door takes 1. */
function lockedGame(): TestGame {
  const t = testGame(ROWS);
  const bbl = parseBlocks(t.files.get('test.bbl')!, newBlockSet('bbl').length);
  Object.assign(bbl[KEY], { grav: 4, effect: 20, eamt: 1, touchBl: 0 });
  bbl[KEY].pixels.fill(14);
  Object.assign(bbl[DOOR], { solid: 15, effect: 20, eamt: -1, touchBl: 0 });
  bbl[DOOR].pixels.fill(6);
  const map = parseMap(t.files.get('test.map')!);
  ROWS.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === 'k') map.blocks[y * MLEN + x] = KEY;
      if (ch === 'D') map.blocks[y * MLEN + x] = DOOR;
    }),
  );
  t.files.set('test.bbl', serializeBlocks(bbl));
  t.files.set('test.map', serializeMap(map));
  return t;
}

describe('fetching keys', () => {
  it('sees the door and what adds to its counter', () => {
    const t = lockedGame();
    const l = locksAtEntry(t.game, t, 2, { start: { x: 7, y: 3 }, ci: startCharInfo(), clock: 1 });
    expect([...l.wanted]).toEqual([20]);
    expect(l.sources).toHaveLength(1);
  });

  it('fetches the key and then takes the link', async () => {
    const t = lockedGame();
    const entry = { start: { x: 7, y: 3 }, ci: startCharInfo(), clock: 1 };
    const locks = locksAtEntry(t.game, t, 2, entry);
    const r = await fetchKeys(t.game, t, 2, entry, locks, { goal: [3 * MLEN + 14], wanted: new Set([0]), budgetMs: 10_000 });
    expect(r?.link).toBe(0);
    // the key is 6 cells back, the door 4 forward: far more than the direct 7 cells to the exit
    expect(r!.ticks).toBeGreaterThan(60);
  }, 60_000);

  it('still finishes the level, and the engine agrees', async () => {
    const t = lockedGame();
    const r = await autoWalk(t.game, t, 'test', { budgetMs: 10_000 });
    expect(r.won).toBe(true);
    const v = await verifyWalk(new GameFiles(t.files), 'test.gam', r.walk!, { maxMinutes: 2 });
    expect(v.won).toBe(true);
  }, 60_000);
});
