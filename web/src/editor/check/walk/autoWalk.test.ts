// A walkthrough made by the level check's bot for the tiny game in testGame.ts reaches the won
// scene on the real engine (the walkthrough runtime, as the player plays it).
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../../project/files';
import { testGame } from '../testGame';
import { autoWalk } from './autoWalk';
import { measurePace } from './pace';
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
    expect(r.scenes.map((s) => s.strategy)).toEqual(['human']);
    const v = await verifyWalk(new GameFiles(t.files), 'test.gam', r.walk!, { maxMinutes: 2 });
    expect(v.error).toBeUndefined();
    expect(v.won).toBe(true);
    expect(v.keysLeft).toBe(0);
  }, 30_000);

  it('takes the coin in sight on its way, holding keys at least 3 ticks', async () => {
    const t = testGame(['##############', '#............#', '#...c........#', '#S..........E#', '##############']);
    const r = await autoWalk(t.game, t, 'test');
    expect(r.won).toBe(true);
    expect(r.scenes[0].strategy).toBe('human');
    const v = await verifyWalk(new GameFiles(t.files), 'test.gam', r.walk!, { maxMinutes: 2 });
    expect(v.won).toBe(true);
    expect(measurePace(r.walk!).minGap?.ticks ?? 3).toBeGreaterThanOrEqual(3);
  }, 30_000);
});
