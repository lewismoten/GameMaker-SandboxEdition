// Every check is classed with a reason, hard checks match the flag, and an old companion that accepted a hard error shows it again.
import { describe, expect, it } from 'vitest';
import { CHECK_CLASS } from './checkClass';
import { findingKey, splitAccepted, wasAcceptedButHard } from './accepted';
import { CHECKS, isHard, kindOf, type CheckId, type Finding } from './findings';
import { findingRows } from '../widgets/checkRows';

const ids = Object.keys(CHECKS) as CheckId[];
const missing: Finding = { check: 'missing-file', severity: 'error', title: 'Level 3 names LEVEL3.MAP, which isn’t in the game', where: { scene: 3 } };
const hold: Finding = { check: 'hurt-lock', severity: 'warning', title: 'Monster 9 holds the hero while it hurts', where: { scene: 2 } };

describe('check classes', () => {
  it('classes every check, with a one-line reason', () => {
    expect(Object.keys(CHECK_CLASS).sort()).toEqual([...ids].sort());
    for (const id of ids) expect(CHECK_CLASS[id][1].length).toBeGreaterThan(10);
  });

  it('agrees with the taste and hard flags', () => {
    for (const id of ids) {
      const info = CHECKS[id] as { taste?: true; hard?: true };
      expect(CHECK_CLASS[id][0] === 'taste', id).toBe(!!info.taste);
      expect(CHECK_CLASS[id][0] === 'hard', id).toBe(!!info.hard);
    }
  });

  it('is hard only at error severity', () => {
    expect(isHard(missing)).toBe(true);
    expect(isHard({ ...missing, severity: 'warning' })).toBe(false);
    expect(isHard(hold)).toBe(false);
    expect(kindOf(missing)).toBe('error');
  });

  it('keeps an old accepted hard error loading, but open again', () => {
    const keys = [findingKey(missing), findingKey(hold)];
    const r = splitAccepted([missing, hold], keys);
    expect(r.open).toEqual([missing]);
    expect(r.accepted).toEqual([hold]);
    expect(r.reopened).toEqual([missing]);
    expect(wasAcceptedButHard(missing, keys)).toBe(true);
    expect(wasAcceptedButHard(missing, [])).toBe(false);
    expect(findingRows([missing, hold], keys).map((x) => x.status)).toEqual(['open', 'accepted']);
  });
});
