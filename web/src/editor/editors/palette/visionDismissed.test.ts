// Dismissed Color vision warnings: the key each goes by, and leaving dismissed ones out.
import { describe, expect, it } from 'vitest';
import { dismissKey, splitDismissed } from './visionDismissed';
import type { Warning } from './visionWarnings';

const pair: Warning = { kind: 'pair', id: 'pair:3:9', a: 3, b: 9, views: ['gray'], count: 40 };
const mon: Warning = { kind: 'monster', id: 'mon:4', n: 4, color: 12, behind: 30, views: ['deutan'], ratio: 1.1, cell: 0 };
const ramp: Warning = { kind: 'ramp', id: 'ramp:16', ramp: [16, 17, 18], step: [16, 17], views: ['normal'] };

describe('dismissed color vision warnings', () => {
  it('keys a pair or ramp by the palette alone, and a monster by its .mon file too', () => {
    expect(dismissKey(pair, 'forest.mon')).toBe('pair:3:9');
    expect(dismissKey(ramp)).toBe('ramp:16');
    expect(dismissKey(mon, 'FOREST.MON')).toBe('mon:4@forest.mon');
  });

  it('splits warnings into still flagged and dismissed', () => {
    const r = splitDismissed([pair, mon, ramp], ['pair:3:9', 'mon:4@cave.mon'], 'forest.mon');
    expect(r.dismissed).toEqual([pair]);
    expect(r.open).toEqual([mon, ramp]);
    expect(splitDismissed([mon], ['mon:4@cave.mon'], 'cave.mon').dismissed).toEqual([mon]);
  });
});
