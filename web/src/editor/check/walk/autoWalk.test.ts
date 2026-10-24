// A walkthrough made by the level check's bot for the tiny game in testGame.ts reaches the won
// scene on the real engine (the walkthrough runtime, as the player plays it).
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../../project/files';
import { testGame } from '../testGame';
import { autoWalk } from './autoWalk';
import { verifyWalk } from './verify';

// prettier-ignore
const ROWS = [
  '##############',
  '#............#',
  '#............#',
  '#S.......^..E#',
  '##############',
];

describe('the walkthrough bot', () => {
  it('walks a level to its exit and the engine agrees', async () => {
    const t = testGame(ROWS);
    const r = await autoWalk(t.game, t, 'test');
    expect(r.won).toBe(true);
    expect(r.scenes.map((s) => s.strategy)).toEqual(['runner']);
    const v = await verifyWalk(new GameFiles(t.files), 'test.gam', r.walk!, { maxMinutes: 2 });
    expect(v.error).toBeUndefined();
    expect(v.won).toBe(true);
    expect(v.keysLeft).toBe(0);
  }, 30_000);
});
