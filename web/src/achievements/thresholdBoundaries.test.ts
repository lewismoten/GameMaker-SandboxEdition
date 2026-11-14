// Edges the other achievement tests leave out (housekeeping 14): each score-trophy tier at
// n-1, n and n+1 points, the same after a Reset (relock), the repeat tiers (1, 3, 10 events),
// games that are not in the catalog never counting, and old stored shapes read as the current one.
import { describe, expect, it } from 'vitest';
import { THRESHOLDS, tierOf, type TrophyKind } from '../scoreTrophies/tiers';
import { addEnd, emptyScores, parseScores } from '../scoreTrophies/scores';
import { goalProgress } from './goals';
import { REPEAT_TIERS, repeatProgress } from './repeatGoals';
import { mergeRecords, parseRecord } from './store';
import { scoresAfter, type ResetMark } from './resetMark';

const bytes = (o: unknown) => new TextEncoder().encode(typeof o === 'string' ? o : JSON.stringify(o));
const mark = (m: Partial<ResetMark>): ResetMark => ({ at: 1, hearts: [], eggs: [], best: 0, total: 0, ...m });

describe('score trophy tiers at every threshold', () => {
  for (const kind of ['best', 'total'] as TrophyKind[]) {
    it(`${kind}: one point short earns the tier below, the threshold and more earn it`, () => {
      THRESHOLDS[kind].forEach((at, i) => {
        expect(tierOf(kind, at - 1)).toBe(i);
        expect(tierOf(kind, at)).toBe(i + 1);
        expect(tierOf(kind, at + 1)).toBe(i + 1);
      });
    });

    it(`${kind}: after a Reset a tier relocks until the growth since reaches it`, () => {
      THRESHOLDS[kind].forEach((at, i) => {
        const at0 = mark({ [kind]: at, best: kind === 'best' ? at : 0, total: kind === 'total' ? at : 0 });
        const sums = (n: number) => ({ best: kind === 'best' ? n : 0, total: kind === 'total' ? n : 0 });
        // what the saves held at the reset counts for nothing; only growth does
        expect(tierOf(kind, scoresAfter(sums(at), at0)[kind])).toBe(0);
        expect(tierOf(kind, scoresAfter(sums(at + THRESHOLDS[kind][0] - 1), at0)[kind])).toBe(0);
        expect(tierOf(kind, scoresAfter(sums(at + THRESHOLDS[kind][i]), at0)[kind])).toBe(i + 1);
      });
    });
  }

  it('a total that fell below the reset mark never goes negative', () => {
    expect(scoresAfter({ best: 5, total: 5 }, mark({ best: 6, total: 6 }))).toEqual({ best: 0, total: 0 });
  });
});

describe('repeat tiers (wins, losses, lives)', () => {
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `e${i}`);
  it('a game reaches a tier with its n-th distinct event, not the one before', () => {
    for (const times of REPEAT_TIERS) {
      expect(repeatProgress(['a'], { 'won:a': ids(times - 1) }, 'won', times)).toEqual({ n: 0, of: 1 });
      expect(repeatProgress(['a'], { 'won:a': ids(times) }, 'won', times)).toEqual({ n: 1, of: 1 });
      expect(repeatProgress(['a'], { 'won:a': ids(times + 1) }, 'won', times)).toEqual({ n: 1, of: 1 });
    }
  });

  it('events of another outcome, or of a game outside the targets, do not count', () => {
    const sets = { 'lost:a': ids(10), 'won:imported': ids(10) };
    expect(repeatProgress(['a'], sets, 'won', 1)).toEqual({ n: 0, of: 1 });
    expect(repeatProgress(['a'], sets, 'lost', 10)).toEqual({ n: 1, of: 1 });
  });
});

describe('games that are not in the catalog', () => {
  it('an imported or unknown id never counts toward a goal', () => {
    expect(goalProgress(['a', 'b'], ['imported-game', 'project:x', 'bundle:y'])).toEqual({ n: 0, of: 2 });
    expect(goalProgress(['a', 'b'], ['a', 'a', 'imported-game'])).toEqual({ n: 1, of: 2 });
    expect(goalProgress([], ['a'])).toEqual({ n: 0, of: 0 });
  });
});

describe('older stored shapes read as the current one', () => {
  it('scores written before the play count existed', () => {
    expect(parseScores(bytes({ best: { teddy: 100 }, total: 150 }))).toEqual({ best: { teddy: 100 }, total: 150, plays: 0 });
    expect(parseScores(bytes({ total: 7.9, plays: 2.5 }))).toEqual({ best: {}, total: 7, plays: 2 });
    expect(parseScores(bytes('[]'))).toEqual(emptyScores());
    expect(addEnd(parseScores(bytes({ best: { teddy: 100 }, total: 150 })), 'teddy', 120).plays).toBe(1);
  });

  it('achievements written before progress, sets or a reset mark existed', () => {
    expect(parseRecord(bytes({ unlocked: { 'play-first': 5 } }))).toEqual({ unlocked: { 'play-first': 5 }, progress: {}, sets: {} });
    const odd = parseRecord(
      bytes({ unlocked: { a: 'x', b: 2 }, progress: { c: { n: 1 }, d: { n: 2, of: 5 } }, sets: { e: ['a', 3, 'b'], f: 'no' }, reset: { at: 'then' } }),
    );
    expect(odd).toEqual({ unlocked: { b: 2 }, progress: { d: { n: 2, of: 5 } }, sets: { e: ['a', 'b'] } });
    // a reset mark from before the highScores field: read, with the field left out
    const old = parseRecord(bytes({ reset: { at: 9, hearts: ['h'], eggs: [], best: 3, total: 4 } }));
    expect(old.reset).toEqual({ at: 9, hearts: ['h'], eggs: [], best: 3, total: 4 });
  });

  it('merging an older backup keeps the later reset and the earlier unlock', () => {
    const now = parseRecord(bytes({ unlocked: { a: 20 }, reset: { at: 50, best: 10, total: 10 } }));
    const backup = parseRecord(bytes({ unlocked: { a: 10, b: 5 } }));
    const m = mergeRecords(now, backup);
    expect(m.unlocked).toEqual({ a: 10, b: 5 });
    expect(m.reset?.at).toBe(50);
  });
});
