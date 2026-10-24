// The walkthrough's made-up Top Ten: blanks filled near the game's own scores, real ones kept.
import { describe, expect, it } from 'vitest';
import { fillBlankScores } from './madeUpScores';

const blank = () => Array.from({ length: 10 }, () => ({ score: 0, name: '' }));

describe('made-up high scores', () => {
  it('fills an empty table best first, in the game’s own steps, the same every time', () => {
    const t = fillBlankScores(blank(), 12400, 7);
    expect(t).toHaveLength(10);
    expect(t.every((e) => e.score > 0 && e.score % 100 === 0 && e.name)).toBe(true);
    expect(t.map((e) => e.score)).toEqual([...t.map((e) => e.score)].sort((a, b) => b - a));
    expect(t[0].score).toBeGreaterThan(12400);
    expect(fillBlankScores(blank(), 12400, 7)).toEqual(t);
  });

  it('keeps real entries and leaves a game that never scores blank', () => {
    const table = blank();
    table[0] = { score: 99999, name: 'A REAL PLAYER' };
    const t = fillBlankScores(table, 500, 1);
    expect(t[0]).toEqual({ score: 99999, name: 'A REAL PLAYER' });
    expect(t.filter((e) => e.score > 0)).toHaveLength(10);
    expect(fillBlankScores(blank(), 0, 1)).toEqual(blank());
  });
});
