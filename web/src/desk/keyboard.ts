// The PC's keyboard: a 101-key layout of raised keycaps (function row, main block,
// arrows and keypad). Keys go down when the matching key is pressed on the real keyboard.
import { h } from '../editor/core/ui';

/** [label, width in key units, KeyboardEvent.code] or a number for a gap. */
type Key = [string, number, string] | number;

const F = (n: number): Key => [`F${n}`, 1, `F${n}`];
const L = (c: string): Key => [c, 1, `Key${c}`];
const D = (n: string): Key => [n, 1, `Digit${n}`];

const MAIN: Key[][] = [
  [['Esc', 1, 'Escape'], 1, F(1), F(2), F(3), F(4), 0.5, F(5), F(6), F(7), F(8), 0.5, F(9), F(10), F(11), F(12)],
  [['`', 1, 'Backquote'], ...'1234567890'.split('').map(D), ['-', 1, 'Minus'], ['=', 1, 'Equal'], ['←', 2, 'Backspace']],
  [['Tab', 1.5, 'Tab'], ...'QWERTYUIOP'.split('').map(L), ['[', 1, 'BracketLeft'], [']', 1, 'BracketRight'], ['\\', 1.5, 'Backslash']],
  [['Caps', 1.75, 'CapsLock'], ...'ASDFGHJKL'.split('').map(L), [';', 1, 'Semicolon'], ["'", 1, 'Quote'], ['Enter', 2.25, 'Enter']],
  [['Shift', 2.25, 'ShiftLeft'], ...'ZXCVBNM'.split('').map(L), [',', 1, 'Comma'], ['.', 1, 'Period'], ['/', 1, 'Slash'], ['Shift', 2.75, 'ShiftRight']],
  [['Ctrl', 1.5, 'ControlLeft'], 1, ['Alt', 1.5, 'AltLeft'], ['', 7, 'Space'], ['Alt', 1.5, 'AltRight'], 1, ['Ctrl', 1.5, 'ControlRight']],
];

const NAV: Key[][] = [
  [
    ['PrSc', 1, 'PrintScreen'],
    ['Scrl', 1, 'ScrollLock'],
    ['Brk', 1, 'Pause'],
  ],
  [
    ['Ins', 1, 'Insert'],
    ['Home', 1, 'Home'],
    ['PgUp', 1, 'PageUp'],
  ],
  [
    ['Del', 1, 'Delete'],
    ['End', 1, 'End'],
    ['PgDn', 1, 'PageDown'],
  ],
  [],
  [1, ['↑', 1, 'ArrowUp']],
  [
    ['←', 1, 'ArrowLeft'],
    ['↓', 1, 'ArrowDown'],
    ['→', 1, 'ArrowRight'],
  ],
];

const PAD: Key[][] = [
  [],
  [
    ['Num', 1, 'NumLock'],
    ['/', 1, 'NumpadDivide'],
    ['*', 1, 'NumpadMultiply'],
    ['-', 1, 'NumpadSubtract'],
  ],
  [
    ['7', 1, 'Numpad7'],
    ['8', 1, 'Numpad8'],
    ['9', 1, 'Numpad9'],
    ['+', 1, 'NumpadAdd'],
  ],
  [
    ['4', 1, 'Numpad4'],
    ['5', 1, 'Numpad5'],
    ['6', 1, 'Numpad6'],
  ],
  [
    ['1', 1, 'Numpad1'],
    ['2', 1, 'Numpad2'],
    ['3', 1, 'Numpad3'],
    ['Ent', 1, 'NumpadEnter'],
  ],
  [
    ['0', 2, 'Numpad0'],
    ['.', 1, 'NumpadDecimal'],
  ],
];

/** Keys that are two rows tall on the keypad. */
const TALL = new Set(['NumpadAdd', 'NumpadEnter']);

const UNIT = 100 / 23.5; // the board is 15 + 0.5 + 3 + 0.5 + 4 = 23 units wide, plus margins
/** The board is 6.9 units deep: a margin, the function row, a gap, five rows and a front edge. */
const DEPTH = 6.9;
const TOP = 0.3;

export function keyboard(onClick: () => void): HTMLElement {
  const board = h('div', { class: 'keyboard', title: 'Keyboard: click, then type', onclick: onClick });
  const keys = new Map<string, HTMLElement[]>();
  const place = (rows: Key[][], x0: number) =>
    rows.forEach((row, r) => {
      let x = x0;
      const y = r === 0 ? 0 : r + 0.35; // the function row stands apart
      for (const k of row) {
        if (typeof k === 'number') {
          x += k;
          continue;
        }
        const [label, w, code] = k;
        const el = h('span', { class: `key ${label.length > 2 ? 'small' : ''}` }, label);
        el.style.left = `${(x + 0.25) * UNIT}%`;
        // every key stays on the board: the last row ends 0.25 units short of its front edge
        el.style.top = `${((TOP + y) / DEPTH) * 100}%`;
        el.style.width = `${w * UNIT - 0.45}%`;
        el.style.height = `${(((TALL.has(code) ? 2 : 1) - 0.14) / DEPTH) * 100}%`;
        board.append(el);
        keys.set(code, [...(keys.get(code) ?? []), el]);
        x += w;
      }
    });
  place(MAIN, 0);
  place(NAV, 15.5);
  place(PAD, 19);

  const press = (e: KeyboardEvent, down: boolean) => keys.get(e.code)?.forEach((el) => el.classList.toggle('down', down));
  const onDown = (e: KeyboardEvent) => press(e, true);
  const onUp = (e: KeyboardEvent) => press(e, false);
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  // Stop listening when the desk is taken off the page.
  const watch = new MutationObserver(() => {
    if (board.isConnected) return;
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    watch.disconnect();
  });
  requestAnimationFrame(() => board.parentElement && watch.observe(document.body, { childList: true, subtree: true }));
  return board;
}
