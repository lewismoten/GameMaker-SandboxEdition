import { describe, expect, it } from 'vitest';
import { ArrowChords, chordKeys } from '../src/input/chords';
import { Keyboard } from '../src/input/keyboard';
import { macHint, withMacHint } from '../src/input/macKeys';
import { cardRows } from '../src/desk/pc/keyCardRows';
import type { GameKeyMap } from '../src/editor/keymap/keyMap';

const UP = 72,
  LEFT = 75,
  RIGHT = 77,
  DOWN = 80,
  HOME = 71,
  PGUP = 73,
  END = 79,
  PGDN = 81,
  PAD5 = 76;
const all = () => true;

describe('arrow chords', () => {
  it('maps each arrow pair to its keypad key', () => {
    expect([...chordKeys(new Set([UP, LEFT]), all)]).toEqual([HOME]);
    expect([...chordKeys(new Set([RIGHT, UP]), all)]).toEqual([PGUP]);
    expect([...chordKeys(new Set([DOWN, LEFT]), all)]).toEqual([END]);
    expect([...chordKeys(new Set([DOWN, RIGHT]), all)]).toEqual([PGDN]);
    expect([...chordKeys(new Set([UP, DOWN]), all)]).toEqual([PAD5]);
  });

  it('leaves arrows alone when the game does not bind the keypad key', () => {
    expect([...chordKeys(new Set([UP, LEFT]), (s) => s !== HOME)].sort()).toEqual([UP, LEFT].sort());
    const c = new ArrowChords(() => false);
    expect(c.arrow(UP, true)).toEqual([UP]);
    expect(c.arrow(LEFT, true)).toEqual([LEFT]);
    expect(c.arrow(UP, false)).toEqual([UP | 0x80]);
    expect(c.arrow(LEFT, false)).toEqual([LEFT | 0x80]);
  });

  it('swaps the held arrow for the chord and back, releases first', () => {
    const c = new ArrowChords(all);
    expect(c.arrow(UP, true)).toEqual([UP]);
    expect(c.arrow(LEFT, true)).toEqual([UP | 0x80, HOME]);
    expect(c.arrow(UP, false)).toEqual([HOME | 0x80, LEFT]);
    expect(c.arrow(DOWN, true)).toEqual([LEFT | 0x80, END]);
    expect(c.arrow(DOWN, false)).toEqual([END | 0x80, LEFT]);
    expect(c.arrow(LEFT, false)).toEqual([LEFT | 0x80]);
  });

  it('feeds the keyboard scan codes as PLAYGAME would get them from Home and the arrows', () => {
    const k = new Keyboard();
    k.chordable = (s) => s === HOME;
    const g = globalThis as { window?: unknown };
    g.window ??= new EventTarget(); // the blur listener
    const t = new EventTarget();
    k.attach(t);
    const key = (type: string, code: string, key: string, repeat = false) => {
      const e = new Event(type, { cancelable: true }) as KeyboardEvent;
      Object.defineProperty(e, 'code', { value: code });
      Object.defineProperty(e, 'key', { value: key });
      Object.defineProperty(e, 'repeat', { value: repeat });
      Object.defineProperty(e, 'metaKey', { value: false });
      t.dispatchEvent(e);
    };
    key('keydown', 'ArrowUp', 'ArrowUp');
    key('keydown', 'ArrowLeft', 'ArrowLeft');
    key('keydown', 'ArrowLeft', 'ArrowLeft', true); // auto-repeat: nothing new for the game
    key('keydown', 'ArrowRight', 'ArrowRight'); // PgUp is not bound: a plain arrow
    key('keyup', 'ArrowRight', 'ArrowRight');
    key('keyup', 'ArrowLeft', 'ArrowLeft');
    key('keyup', 'ArrowUp', 'ArrowUp');
    // a Mac's fn+← is Home
    key('keydown', 'ArrowLeft', 'Home');
    key('keyup', 'ArrowLeft', 'Home');
    key('keydown', 'End', 'End');
    key('keyup', 'End', 'End');
    expect(k.events).toEqual([UP, UP | 0x80, HOME, RIGHT, RIGHT | 0x80, HOME | 0x80, UP, UP | 0x80, HOME, HOME | 0x80, END, END | 0x80]);
    expect(k.down.size).toBe(0);
    k.detach();
  });
});

describe('Mac key names', () => {
  it('says how to make keys a Mac lacks, only on a Mac', () => {
    expect(macHint(71, true)).toBe('↑+← or fn ←');
    expect(macHint(81, true)).toBe('↓+→ or fn ↓');
    expect(macHint(57, true)).toBeUndefined();
    expect(macHint(71, false)).toBeUndefined();
    expect(withMacHint('End / Pad 1', 79, true)).toBe('End / Pad 1 (↓+← or fn →)');
    expect(withMacHint('End / Pad 1', 79, false)).toBe('End / Pad 1');
  });

  it('key cards write the chord on a Mac', () => {
    const b = (scan: number, name: string, title: string) =>
      ({ scan, name, uses: [{ action: { title, kind: /^Move/.test(title) ? 'move' : 'action' } }] }) as unknown as GameKeyMap['keys'][number];
    const keys = [b(71, 'Home / Pad 7', 'Move up-left'), b(73, 'PgUp / Pad 9', 'Move up-right'), b(57, 'Space', 'Jump')];
    expect(cardRows(keys, true, true)).toEqual([
      { keys: ['↑+←', '↑+→'], does: 'Move' },
      { keys: ['Space'], does: 'Jump' },
    ]);
    expect(cardRows(keys, true, false)[0].keys).toEqual(['Home', 'PgUp']);
    expect(cardRows(keys, false, true)[0].keys).toEqual(['Home / Pad 7', '↑+←']);
  });
});
