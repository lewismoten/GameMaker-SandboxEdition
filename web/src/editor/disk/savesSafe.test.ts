import { describe, expect, it } from 'vitest';
import { emptyCompanion, setMenuVersion } from '../../project/companion';
import { GameFiles } from '../../project/files';
import { optimizedName, packedFrom } from './optimizedCopy';
import { SAVE_SAFE_KINDS, savesRisk } from './savesSafe';

describe('savesRisk', () => {
  const at = (m: [number, number][]) => [{ file: 'a', into: 'b', at: new Map(m) }];
  it('is none for steps that touch no number', () => {
    for (const kind of SAVE_SAFE_KINDS) expect(savesRisk({ kind })).toBeUndefined();
    expect(savesRisk({ kind: 'bbl', moves: at([[3, 3]]) })).toBeUndefined();
  });
  it('names the numbers that change', () => {
    expect(savesRisk({ kind: 'mon' })).toMatch(/monsters/);
    expect(savesRisk({ kind: 'look', moves: at([[5, 2]]) })).toMatch(/map cells/);
    expect(savesRisk({ kind: 'mbl', moves: at([[1, 7]]) })).toMatch(/blocks/);
  });
});

describe('optimized copy label', () => {
  it('names the source and does not stack labels or repeat a taken name', () => {
    const n = optimizedName('Tune-Up', 'v2.0', []);
    expect(n).toBe('Tune-Up (optimized from v2.0)');
    expect(optimizedName(n, 'v2.1', [n])).toBe('Tune-Up (optimized from v2.1)');
    expect(optimizedName('Tune-Up', 'v2.0', [n])).toBe('Tune-Up (optimized from v2.0) 2');
  });
  it('uses the menu version, else the date', () => {
    const c = emptyCompanion();
    setMenuVersion(c, '2.0', true);
    expect(packedFrom([], new GameFiles(), c)).toBe('v2.0');
    expect(packedFrom([], new GameFiles(), undefined, new Date(2026, 10, 2))).toMatch(/2/);
  });
});
