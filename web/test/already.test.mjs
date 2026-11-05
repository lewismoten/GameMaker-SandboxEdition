// Tests for the ranking in scripts/already.mjs (npm run already): more of the words wins, then the newer date.
import { describe, expect, it } from 'vitest';
import { rankCommits, rankFiles, scoreNote, searchWords } from '../../scripts/already.mjs';

describe('already', () => {
  it('keeps words of 3+ characters, lowercased, once each', () => {
    expect(searchWords(['Same-Bytes', 'is', 'same'])).toEqual(['same-bytes', 'same']);
  });

  it('ranks a commit that matches more words first, then the newer one', () => {
    const a = { hash: 'a', date: '2026-11-01', subject: 'one' };
    const b = { hash: 'b', date: '2026-11-03', subject: 'two' };
    const c = { hash: 'c', date: '2026-11-02', subject: 'three' };
    const ranked = rankCommits({ x: [a, b], y: [a, c] });
    expect(ranked.map((r) => r.hash)).toEqual(['a', 'b', 'c']);
    expect(ranked[0].words).toEqual(['x', 'y']);
  });

  it('ranks files by distinct words, then lines', () => {
    const ranked = rankFiles({ x: { 'p.ts': 1, 'q.ts': 9 }, y: { 'p.ts': 1 } });
    expect(ranked.map((r) => r.file)).toEqual(['p.ts', 'q.ts']);
  });

  it('scores a note by path and title above a heading, and by distinct words', () => {
    const note = (path, title, headings = []) => ({ path, title, headings });
    const words = ['perf', 'budget'];
    const a = scoreNote(note('perf/budget.md', 'Budget'), words);
    const b = scoreNote(note('x.md', 'Other', ['Perf notes']), words);
    expect(a).toBeGreaterThan(b);
    expect(scoreNote(note('x.md', 'Nothing'), words)).toBe(0);
  });
});
