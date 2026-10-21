import { describe, expect, it } from 'vitest';
import { cardRows, shortKey } from '../src/desk/keyCardRows';
import type { GameKeyMap } from '../src/editor/keymap/keyMap';

type Binding = GameKeyMap['keys'][number];
const key = (name: string, ...titles: string[]): Binding =>
  ({ scan: 0, name, uses: titles.map((title) => ({ action: { title, kind: title === '-' ? 'nothing' : 'move' } })) }) as unknown as Binding;

const KEYS = [
  key('Up / Pad 8', 'Move up'),
  key('Left / Pad 4', 'Move left'),
  key('P', 'Pick up'),
  key('Space', 'Fire'),
  key('Home / Pad 7', 'Fire'),
  key('B', 'Fire'),
  key('Q', '-'),
];

describe('key card rows', () => {
  it('writes each thing to do once, with all its keys', () => {
    expect(cardRows(KEYS)).toEqual([
      { keys: ['Up / Pad 8'], does: 'Move up' },
      { keys: ['Left / Pad 4'], does: 'Move left' },
      { keys: ['P'], does: 'Pick up' },
      { keys: ['Space', 'Home / Pad 7', 'B'], does: 'Fire' },
    ]);
  });

  it('the small card merges the moves and shortens key names', () => {
    expect(cardRows(KEYS, true)).toEqual([
      { keys: ['↑', '←'], does: 'Move' },
      { keys: ['P'], does: 'Pick up' },
      { keys: ['Space', 'Home', 'B'], does: 'Fire' },
    ]);
  });

  it('leaves a lone direction alone', () => {
    expect(cardRows([key('J', 'Jump left'), key('P', 'Pick up')], true).map((r) => r.does)).toEqual(['Jump left', 'Pick up']);
  });

  it('short key names', () => {
    expect(shortKey('Down / Pad 2')).toBe('↓');
    expect(shortKey('PgUp / Pad 9')).toBe('PgUp');
  });
});

describe('key card rows, several uses', () => {
  it('the small card names only the first use of a key', () => {
    const k = key('Up / Pad 8', 'Fire, moving up', 'Jump');
    expect(cardRows([k])[0].does).toBe('Fire, moving up / Jump');
    expect(cardRows([k], true)[0].does).toBe('Fire, moving up …');
  });
});
