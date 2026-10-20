// PC/XT keyboard scan code set 1, which GameMaker stores in character key bindings
// (high byte of sequence.key) and demo recordings.

export const SCAN: Record<string, number> = {
  Escape: 1, Digit1: 2, Digit2: 3, Digit3: 4, Digit4: 5, Digit5: 6, Digit6: 7, Digit7: 8, Digit8: 9, Digit9: 10, Digit0: 11,
  Minus: 12, Equal: 13, Backspace: 14, Tab: 15,
  KeyQ: 16, KeyW: 17, KeyE: 18, KeyR: 19, KeyT: 20, KeyY: 21, KeyU: 22, KeyI: 23, KeyO: 24, KeyP: 25,
  BracketLeft: 26, BracketRight: 27, Enter: 28, NumpadEnter: 28, ControlLeft: 29, ControlRight: 29,
  KeyA: 30, KeyS: 31, KeyD: 32, KeyF: 33, KeyG: 34, KeyH: 35, KeyJ: 36, KeyK: 37, KeyL: 38,
  Semicolon: 39, Quote: 40, Backquote: 41, ShiftLeft: 42, Backslash: 43,
  KeyZ: 44, KeyX: 45, KeyC: 46, KeyV: 47, KeyB: 48, KeyN: 49, KeyM: 50,
  Comma: 51, Period: 52, Slash: 53, NumpadDivide: 53, ShiftRight: 54, NumpadMultiply: 55, AltLeft: 56, AltRight: 56, Space: 57, CapsLock: 58,
  F1: 59, F2: 60, F3: 61, F4: 62, F5: 63, F6: 64, F7: 65, F8: 66, F9: 67, F10: 68,
  NumLock: 69, ScrollLock: 70,
  Numpad7: 71, Home: 71, Numpad8: 72, ArrowUp: 72, Numpad9: 73, PageUp: 73, NumpadSubtract: 74,
  Numpad4: 75, ArrowLeft: 75, Numpad5: 76, Numpad6: 77, ArrowRight: 77, NumpadAdd: 78,
  Numpad1: 79, End: 79, Numpad2: 80, ArrowDown: 80, Numpad3: 81, PageDown: 81,
  Numpad0: 82, Insert: 82, NumpadDecimal: 83, Delete: 83,
  F11: 87, F12: 88,
};

const NAMES: Record<number, string> = {
  1: 'Esc', 14: 'Backspace', 15: 'Tab', 28: 'Enter', 29: 'Ctrl', 42: 'Left Shift', 54: 'Right Shift', 56: 'Alt', 57: 'Space', 58: 'Caps Lock',
  69: 'Num Lock', 70: 'Scroll Lock', 71: 'Home / Pad 7', 72: 'Up / Pad 8', 73: 'PgUp / Pad 9', 74: 'Pad -', 75: 'Left / Pad 4', 76: 'Pad 5',
  77: 'Right / Pad 6', 78: 'Pad +', 79: 'End / Pad 1', 80: 'Down / Pad 2', 81: 'PgDn / Pad 3', 82: 'Ins / Pad 0', 83: 'Del / Pad .', 55: 'Pad *',
};

// Unshifted ASCII for each scan code (the "ascii" xlat table).
const ASCII = '\0\x1b1234567890-=\b\tqwertyuiop[]\r\0asdfghjkl;\'`\0\\zxcvbnm,./\0*\0 ';

export function scanToAscii(scan: number): number {
  return ASCII.charCodeAt(scan & 0x7f) || 0;
}

export function scanName(scan: number): string {
  if (!scan) return 'None';
  if (NAMES[scan]) return NAMES[scan];
  if (scan >= 59 && scan <= 68) return `F${scan - 58}`;
  const a = scanToAscii(scan);
  return a > 32 ? String.fromCharCode(a).toUpperCase() : `Scan ${scan}`;
}

/** All bindable keys, for key pickers. */
export function bindableScans(): number[] {
  return [...new Set(Object.values(SCAN))].filter((s) => s !== 1 && !(s >= 59 && s <= 68)).sort((a, b) => a - b);
}
