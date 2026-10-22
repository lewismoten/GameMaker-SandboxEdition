// Tests: The printed key card in a game's box (manual/printables/keys.ts).
import { describe, expect, it } from 'vitest';
import { cardKeys, keyLabel, manualKeyText, splitKeys, type BoundKey } from '../src/manual/printables/keys';

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

  it('sorts directions from actions: arrows, pad corners, and letters that run the same moves', () => {
    const k = (name: string, dx: number, dy: number, sig = `${dx},${dy}`): BoundKey => ({ name, dx, dy, sig });
    const { moves, actions } = splitKeys(
      [
        k('Up / Pad 8', 0, -20),
        k('W', 0, -20),
        k('Left / Pad 4', -20, 0),
        k('A', -20, 0, 'other'),
        k('Q', -14, 0),
        k('E', 10, -22),
        k('Home / Pad 7', -1, -1),
        k('Space', 0, 0),
      ],
      new Map([['Up', 'Hop']]),
      { Q: 'Dash Boots (left)' },
    );
    expect(moves.map((m) => [m.dir, m.keys, m.pad, m.does])).toEqual([
      ['up', ['Up', 'W'], true, 'Hop'],
      ['left', ['Left', 'A'], true, 'Move left'],
      ['up-left', ['Home'], true, 'Move up-left'],
      ['up-right', ['E'], false, 'Move up-right'],
    ]);
    expect(actions.slice(0, 2).map((a) => a.key)).toEqual(['Q', 'Space']);
  });
});
