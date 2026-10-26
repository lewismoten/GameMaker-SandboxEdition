// Tests: The lines of a game's handwritten key card (desk/pc/keyCardRows.ts): Move first, with
// its arrow pad, corners as diagonal arrows, and how a Mac makes them.
import { describe, expect, it } from 'vitest';
import { keyCard } from '../src/desk/pc/keyCardRows';
import type { GameKeyMap } from '../src/editor/keymap/keyMap';

type Binding = GameKeyMap['keys'][number];
const ARROW: Record<string, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  'up-left': '↖',
  'up-right': '↗',
  'down-left': '↙',
  'down-right': '↘',
};
const kindOf = (title: string) =>
  title === '-' ? 'nothing' : /^(Move|Push) /.test(title) ? 'move' : /^Fire/.test(title) ? 'fire' : /^Jump/.test(title) ? 'jump' : 'action';
const key = (scan: number, name: string, ...titles: string[]): Binding =>
  ({
    scan,
    name,
    uses: titles.map((title) => ({ action: { title, kind: kindOf(title), short: ARROW[title.split(' ')[1]] ?? title } })),
  }) as unknown as Binding;

const up = (t = 'Move up') => key(72, 'Up / Pad 8', t);
const left = (t = 'Move left') => key(75, 'Left / Pad 4', t);
const right = (t = 'Move right') => key(77, 'Right / Pad 6', t);
const down = (t = 'Move down') => key(80, 'Down / Pad 2', t);
const home = (t = 'Move up-left') => key(71, 'Home / Pad 7', t);
const pgUp = (t = 'Move up-right') => key(73, 'PgUp / Pad 9', t);
const end = (t = 'Move down-left') => key(79, 'End / Pad 1', t);
const pgDn = (t = 'Move down-right') => key(81, 'PgDn / Pad 3', t);
const space = key(57, 'Space', 'Fire');
const keys = (r: { keys: { key: string }[] }) => r.keys.map((k) => k.key);

describe('the key card: Move first, on an arrow pad', () => {
  const eight = [space, up(), left(), right(), down(), home(), pgUp(), end(), pgDn()];

  it('draws the arrows and corners that move as a 3×3 pad, then the actions', () => {
    const { rows } = keyCard(eight, true, false);
    expect(rows.map((r) => r.does)).toEqual(['Move', 'Fire']);
    expect(rows[0].pad).toEqual(['↖', '↑', '↗', '←', undefined, '→', '↙', '↓', '↘']);
    expect(keys(rows[0])).toEqual([]); // the pad says it all on the small card
  });

  it('leaves blank the directions the game has no key for', () => {
    expect(keyCard([up(), left(), right(), down()], true, false).rows[0].pad).toEqual([
      undefined,
      '↑',
      undefined,
      '←',
      undefined,
      '→',
      undefined,
      '↓',
      undefined,
    ]);
  });

  it('on a PC the big card names the corner keys beside the pad: "Home ↖"', () => {
    expect(keys(keyCard(eight, false, false).rows[0])).toEqual(['Home ↖', 'PgUp ↗', 'End ↙', 'PgDn ↘']);
  });

  it('on a Mac, with no Home or keypad, the pad and the note are enough', () => {
    expect(keys(keyCard(eight, false, true).rows[0])).toEqual([]);
  });

  it('says how to make the corners: two arrows held at once', () => {
    expect(keyCard(eight, true, true).note).toBe('↖ ↗ ↙ ↘ = two arrows at once');
    expect(keyCard(eight, true, false).note).toBe('↖ ↗ ↙ ↘ = two arrows at once');
    expect(keyCard([up(), home()], true, true).note).toBe('↖ = ↑ and ← at once');
    expect(keyCard([up(), left(), space], true, true).note).toBeUndefined();
  });

  it('writes letters that move beside the pad, and on the big card which way', () => {
    const wasd = [key(17, 'W', 'Move up'), key(30, 'A', 'Move left'), up(), space];
    expect(keyCard(wasd, true).rows.map((r) => [keys(r), r.does])).toEqual([
      [['W', 'A'], 'Move'],
      [['Space'], 'Fire'],
    ]);
    expect(keys(keyCard(wasd, false).rows[0])).toEqual(['W ↑', 'A ←']);
  });

  it('says Push when the keys push', () => {
    expect(keyCard([up('Push up'), left('Push left')], true).rows[0].does).toBe('Push');
  });

  it('shows in the pad which way a key really moves', () => {
    expect(keyCard([down('Move right')], true).rows[0].pad?.[7]).toBe('→');
  });
});

describe('the key card: corners that do something else', () => {
  const jumps = [up('Jump'), home('Jump left'), pgUp('Jump right'), left(), right()];

  it('writes the corner as its key and diagonal arrow on a PC', () => {
    const { rows } = keyCard(jumps, true, false);
    expect(rows.map((r) => [keys(r), r.does])).toEqual([
      [[], 'Move'],
      [['↑', 'Home ↖', 'PgUp ↗'], 'Jump'],
    ]);
    expect(keys(keyCard(jumps, false, false).rows[2])).toEqual(['Home ↖ / Pad 7']);
  });

  it('writes only the diagonal arrow on a Mac, and on the big card which arrows make it', () => {
    expect(keys(keyCard(jumps, true, true).rows[1])).toEqual(['↑', '↖', '↗']);
    expect(keyCard(jumps, false, true).rows[2].keys).toEqual([{ key: '↖', how: '↑ and ← together' }]);
    expect(keyCard(jumps, false, true).rows[3].keys).toEqual([{ key: '↗', how: '↑ and → together' }]);
  });

  it('the keypad center is ↑↓ on a Mac', () => {
    const five = key(76, 'Pad 5', 'Pick up');
    expect(keys(keyCard([five], true, false).rows[0])).toEqual(['5']);
    expect(keys(keyCard([five], true, true).rows[0])).toEqual(['↑↓']);
    expect(keyCard([five], true, true).note).toBe('↑↓ = ↑ and ↓ at once');
    expect(keyCard([five], true, false).note).toBeUndefined();
  });
});

describe('the key card: actions', () => {
  it('writes each thing to do once, with all its keys', () => {
    const { rows } = keyCard([key(25, 'P', 'Pick up'), space, home('Fire'), key(48, 'B', 'Fire'), key(16, 'Q', '-')], false, false);
    expect(rows.map((r) => [keys(r), r.does])).toEqual([
      [['P'], 'Pick up'],
      [['Space', 'Home ↖ / Pad 7', 'B'], 'Fire'],
    ]);
  });

  it('keeps an arrow key that does more than move, as an arrow', () => {
    const { rows } = keyCard([key(72, 'Up / Pad 8', 'Move up', 'Fire')], true);
    expect(rows.map((r) => [keys(r), r.does])).toEqual([[['↑'], 'Move up …']]);
    expect(keys(keyCard([key(72, 'Up / Pad 8', 'Move up', 'Fire')], false).rows[0])).toEqual(['↑ / Pad 8']);
  });

  it('the small card names only the first use of a key', () => {
    const k = key(72, 'Up / Pad 8', 'Fire, moving up', 'Jump');
    expect(keyCard([k]).rows[0].does).toBe('Fire, moving up / Jump');
    expect(keyCard([k], true).rows[0].does).toBe('Fire, moving up …');
  });

  it('merges "Jump left", "Jump right" into one line on the small card, a lone one stays', () => {
    expect(keyCard([key(36, 'J', 'Jump left'), key(37, 'K', 'Jump right')], true).rows.map((r) => r.does)).toEqual(['Jump']);
    expect(keyCard([key(36, 'J', 'Jump left'), key(25, 'P', 'Pick up')], true).rows.map((r) => r.does)).toEqual(['Jump left', 'Pick up']);
  });

  it('Mac keys a Mac has another way to press', () => {
    expect(keys(keyCard([key(83, 'Del / Pad .', 'Fire')], true, true).rows[0])).toEqual(['fn ⌫']);
  });
});
