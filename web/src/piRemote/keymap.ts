// Linux input key codes (include/uapi/linux/input-event-codes.h) for the Pi remote: by
// KeyboardEvent.code for the physical keyboard, and the on-screen keyboard's layout.

/** KeyboardEvent.code to the Linux code the kernel's synthetic keyboard takes. */
export const LINUX_KEYS: Readonly<Record<string, number>> = (() => {
  const map: Record<string, number> = {
    Escape: 1,
    Minus: 12,
    Equal: 13,
    Backspace: 14,
    Tab: 15,
    BracketLeft: 26,
    BracketRight: 27,
    Enter: 28,
    ControlLeft: 29,
    Semicolon: 39,
    Quote: 40,
    Backquote: 41,
    ShiftLeft: 42,
    Backslash: 43,
    Comma: 51,
    Period: 52,
    Slash: 53,
    ShiftRight: 54,
    NumpadMultiply: 55,
    AltLeft: 56,
    Space: 57,
    CapsLock: 58,
    NumLock: 69,
    ScrollLock: 70,
    Numpad7: 71,
    Numpad8: 72,
    Numpad9: 73,
    NumpadSubtract: 74,
    Numpad4: 75,
    Numpad5: 76,
    Numpad6: 77,
    NumpadAdd: 78,
    Numpad1: 79,
    Numpad2: 80,
    Numpad3: 81,
    Numpad0: 82,
    NumpadDecimal: 83,
    F11: 87,
    F12: 88,
    NumpadEnter: 96,
    ControlRight: 97,
    NumpadDivide: 98,
    AltRight: 100,
    Home: 102,
    ArrowUp: 103,
    PageUp: 104,
    ArrowLeft: 105,
    ArrowRight: 106,
    End: 107,
    ArrowDown: 108,
    PageDown: 109,
    Insert: 110,
    Delete: 111,
  };
  '1234567890'.split('').forEach((d, i) => (map[`Digit${d}`] = 2 + i));
  const rows: [string, number][] = [
    ['QWERTYUIOP', 16],
    ['ASDFGHJKL', 30],
    ['ZXCVBNM', 44],
  ];
  for (const [letters, first] of rows) letters.split('').forEach((l, i) => (map[`Key${l}`] = first + i));
  for (let f = 1; f <= 10; f++) map[`F${f}`] = 58 + f;
  return map;
})();

/** One on-screen key: what it says, its KeyboardEvent.code, its width in key units. */
export interface ScreenKey {
  code: string;
  label: string;
  /** Its accessible name when the label is a symbol. */
  name?: string;
  width?: number;
  /** Shift, Ctrl and Alt latch: a click holds them until the next key or a second click. */
  latch?: boolean;
}

const k = (code: string, label: string, extra: Partial<ScreenKey> = {}): ScreenKey => ({ code, label, ...extra });
const letters = (s: string) => s.split('').map((l) => k(`Key${l}`, l));

/** The main block, row by row. */
export const MAIN_ROWS: ScreenKey[][] = [
  [k('Escape', 'Esc', { width: 1.5 }), ...Array.from({ length: 12 }, (_, i) => k(`F${i + 1}`, `F${i + 1}`))],
  [
    k('Backquote', '`', { name: 'Grave accent' }),
    ...'1234567890'.split('').map((d) => k(`Digit${d}`, d)),
    k('Minus', '-', { name: 'Minus' }),
    k('Equal', '=', { name: 'Equals' }),
    k('Backspace', 'Backspace', { width: 2 }),
  ],
  [
    k('Tab', 'Tab', { width: 1.5 }),
    ...letters('QWERTYUIOP'),
    k('BracketLeft', '[', { name: 'Left bracket' }),
    k('BracketRight', ']', { name: 'Right bracket' }),
    k('Backslash', '\\', { name: 'Backslash', width: 1.5 }),
  ],
  [
    k('CapsLock', 'Caps', { name: 'Caps Lock', width: 1.75 }),
    ...letters('ASDFGHJKL'),
    k('Semicolon', ';', { name: 'Semicolon' }),
    k('Quote', "'", { name: 'Apostrophe' }),
    k('Enter', 'Enter', { width: 2.25 }),
  ],
  [
    k('ShiftLeft', 'Shift', { width: 2.25, latch: true }),
    ...letters('ZXCVBNM'),
    k('Comma', ',', { name: 'Comma' }),
    k('Period', '.', { name: 'Period' }),
    k('Slash', '/', { name: 'Slash' }),
    k('ShiftRight', 'Shift', { name: 'Right Shift', width: 2.75, latch: true }),
  ],
  [
    k('ControlLeft', 'Ctrl', { width: 1.5, latch: true }),
    k('AltLeft', 'Alt', { width: 1.5, latch: true }),
    k('Space', 'Space', { width: 9 }),
    k('AltRight', 'Alt', { name: 'Right Alt', width: 1.5, latch: true }),
    k('ControlRight', 'Ctrl', { name: 'Right Ctrl', width: 1.5, latch: true }),
  ],
];

/** Insert to Page Down, three by two. */
export const EDIT_ROWS: ScreenKey[][] = [
  [k('Insert', 'Ins', { name: 'Insert' }), k('Home', 'Home'), k('PageUp', 'PgUp', { name: 'Page Up' })],
  [k('Delete', 'Del', { name: 'Delete' }), k('End', 'End'), k('PageDown', 'PgDn', { name: 'Page Down' })],
];

/** The arrows, as an upside-down T (null is a gap). */
export const ARROW_ROWS: (ScreenKey | null)[][] = [
  [null, k('ArrowUp', '↑', { name: 'Up' }), null],
  [k('ArrowLeft', '←', { name: 'Left' }), k('ArrowDown', '↓', { name: 'Down' }), k('ArrowRight', '→', { name: 'Right' })],
];

/** The number pad (its diagonals are the games' diagonal moves). */
export const NUMPAD_ROWS: ScreenKey[][] = [
  [
    k('NumLock', 'Num', { name: 'Num Lock' }),
    k('NumpadDivide', '/', { name: 'Pad divide' }),
    k('NumpadMultiply', '*', { name: 'Pad times' }),
    k('NumpadSubtract', '-', { name: 'Pad minus' }),
  ],
  [k('Numpad7', '7', { name: 'Pad 7' }), k('Numpad8', '8', { name: 'Pad 8' }), k('Numpad9', '9', { name: 'Pad 9' }), k('NumpadAdd', '+', { name: 'Pad plus' })],
  [
    k('Numpad4', '4', { name: 'Pad 4' }),
    k('Numpad5', '5', { name: 'Pad 5' }),
    k('Numpad6', '6', { name: 'Pad 6' }),
    k('NumpadEnter', 'Ent', { name: 'Pad Enter' }),
  ],
  [
    k('Numpad1', '1', { name: 'Pad 1' }),
    k('Numpad2', '2', { name: 'Pad 2' }),
    k('Numpad3', '3', { name: 'Pad 3' }),
    k('NumpadDecimal', '.', { name: 'Pad period' }),
  ],
  [k('Numpad0', '0', { name: 'Pad 0', width: 2 })],
];
