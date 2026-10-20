import { describe, expect, it } from 'vitest';
import { cardKeys, keyLabel, manualKeyText } from '../src/manual/printables/keys';

describe('key card', () => {
  it('names keys the way the card prints them', () => {
    expect(keyLabel('Up / Pad 8')).toBe('Up');
    expect(keyLabel('↑')).toBe('Up');
    expect(keyLabel('z')).toBe('Z');
    expect(keyLabel('Space')).toBe('Space');
  });

  it('reads key tables from the manual, splitting "P / D"', () => {
    const m = manualKeyText([
      '<table><tr><td><kbd>P</kbd> / <kbd>D</kbd></td><td>Pick up / drop a module</td></tr><tr><td><kbd>Space</kbd></td><td>Fire</td></tr><tr><td><kbd>&uarr;</kbd></td><td>Jump</td></tr></table>',
    ]);
    expect(m.get('P')).toBe('Pick up');
    expect(m.get('D')).toBe('drop a module');
    expect(m.get('Space')).toBe('Fire');
    expect(m.get('Up')).toBe('Jump');
  });

  it('lists bound keys, then the ones PLAYGAME always has', () => {
    const rows = cardKeys(['Space', 'Up / Pad 8', 'Space', 'Q'], new Map([['Space', 'Fire']]), { Q: 'Dash' });
    expect(rows.slice(0, 3)).toEqual([
      { key: 'Space', does: 'Fire' },
      { key: 'Up', does: 'Special move' },
      { key: 'Q', does: 'Dash' },
    ]);
    expect(rows.map((r) => r.key)).toContain('F5');
  });
});
