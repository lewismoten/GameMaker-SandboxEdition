// Keys pressed with the mouse or a finger: on the desk's drawn keyboard and the play page's
// on-screen keys. Each press becomes a real keydown/keyup on the focused element, so it takes
// the same path as a physical key (the DOS shell and BBS read keydown on the screen, PLAYGAME's
// Keyboard reads it on the window). That also covers what a Mac or a browser keeps from a page:
// F-keys that are media keys without fn, F5 (reload) and F6 (the address bar).
//
// Shift, Ctrl and Alt are sticky: a click holds one down until the next key has been pressed
// and let go (or until it is clicked again); held with one finger they work like real ones.

/** The DOM key a US keyboard gives for each code, unshifted and shifted. */
const CHARS: Record<string, [string, string]> = {
  Backquote: ['`', '~'], Minus: ['-', '_'], Equal: ['=', '+'], BracketLeft: ['[', '{'], BracketRight: [']', '}'], Backslash: ['\\', '|'],
  Semicolon: [';', ':'], Quote: ["'", '"'], Comma: [',', '<'], Period: ['.', '>'], Slash: ['/', '?'], Space: [' ', ' '],
  Digit1: ['1', '!'], Digit2: ['2', '@'], Digit3: ['3', '#'], Digit4: ['4', '$'], Digit5: ['5', '%'], Digit6: ['6', '^'], Digit7: ['7', '&'], Digit8: ['8', '*'], Digit9: ['9', '('], Digit0: ['0', ')'],
  NumpadDivide: ['/', '/'], NumpadMultiply: ['*', '*'], NumpadSubtract: ['-', '-'], NumpadAdd: ['+', '+'], NumpadDecimal: ['.', '.'],
};

/** Keys whose DOM key is a name rather than a character. */
const NAMED: Record<string, string> = {
  Escape: 'Escape', Backspace: 'Backspace', Tab: 'Tab', Enter: 'Enter', NumpadEnter: 'Enter', CapsLock: 'CapsLock',
  ShiftLeft: 'Shift', ShiftRight: 'Shift', ControlLeft: 'Control', ControlRight: 'Control', AltLeft: 'Alt', AltRight: 'Alt',
  ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
  Insert: 'Insert', Delete: 'Delete', Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown',
  PrintScreen: 'PrintScreen', ScrollLock: 'ScrollLock', Pause: 'Pause', NumLock: 'NumLock',
};

/** Legacy keyCode values, for handlers that still read them. */
const KEY_CODES: Record<string, number> = {
  Escape: 27, Backspace: 8, Tab: 9, Enter: 13, NumpadEnter: 13, CapsLock: 20, ShiftLeft: 16, ShiftRight: 16, ControlLeft: 17, ControlRight: 17, AltLeft: 18, AltRight: 18,
  Space: 32, PageUp: 33, PageDown: 34, End: 35, Home: 36, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Insert: 45, Delete: 46,
  Semicolon: 186, Equal: 187, Comma: 188, Minus: 189, Period: 190, Slash: 191, Backquote: 192, BracketLeft: 219, Backslash: 220, BracketRight: 221, Quote: 222,
};

export type Modifier = 'shift' | 'ctrl' | 'alt';

/** Which modifier a code is, if it is one. */
export function modifierOf(code: string): Modifier | undefined {
  return code.startsWith('Shift') ? 'shift' : code.startsWith('Control') ? 'ctrl' : code.startsWith('Alt') ? 'alt' : undefined;
}

/** The DOM key for a code with Shift (and Caps Lock) as given: "a", "A", "!", "F4", "Enter". */
export function keyFor(code: string, shift = false, caps = false): string {
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) return shift !== caps ? letter[1] : letter[1].toLowerCase();
  if (/^F\d+$/.test(code)) return code;
  const pad = /^Numpad(\d)$/.exec(code);
  if (pad) return pad[1];
  if (CHARS[code]) return CHARS[code][shift ? 1 : 0];
  return NAMED[code] ?? 'Unidentified';
}

function keyCodeFor(code: string): number {
  const m = /^(?:Key|Digit)(\w)$/.exec(code);
  if (m) return m[1].charCodeAt(0);
  const f = /^F(\d+)$/.exec(code);
  if (f) return 111 + Number(f[1]);
  const n = /^Numpad(\d)$/.exec(code);
  if (n) return 96 + Number(n[1]);
  return KEY_CODES[code] ?? 0;
}

/** Sends one keydown or keyup to `target`, as the browser would for a real key. */
export function sendKey(target: EventTarget, code: string, down: boolean, mods: Record<Modifier, boolean>, opts: { caps?: boolean; repeat?: boolean } = {}): boolean {
  const e = new KeyboardEvent(down ? 'keydown' : 'keyup', {
    key: keyFor(code, mods.shift, opts.caps),
    code,
    shiftKey: mods.shift,
    ctrlKey: mods.ctrl,
    altKey: mods.alt,
    repeat: !!opts.repeat,
    location: /Right$/.test(code) && modifierOf(code) ? 2 : /Left$/.test(code) && modifierOf(code) ? 1 : code.startsWith('Numpad') ? 3 : 0,
    bubbles: true,
    cancelable: true,
    composed: true,
  });
  const kc = keyCodeFor(code);
  Object.defineProperty(e, 'keyCode', { get: () => kc });
  Object.defineProperty(e, 'which', { get: () => kc });
  return target.dispatchEvent(e);
}

/**
 * The pointer's keyboard: presses and lets go of keys on whatever `target()` returns, keeping
 * the sticky modifiers and Caps Lock. `onChange` hears which modifiers are latched, for drawing.
 */
export class VirtualKeys {
  /** Modifiers down, and whether each was clicked (latched) rather than held. */
  private mods = new Map<string, { latched: boolean; used: boolean }>();
  private held = new Map<string, EventTarget>();
  caps = false;

  constructor(
    private target: () => EventTarget | null | undefined,
    private onChange: (latched: ReadonlySet<string>) => void = () => {},
  ) {}

  private state(): Record<Modifier, boolean> {
    const on = (m: Modifier) => [...this.mods.keys()].some((c) => modifierOf(c) === m);
    return { shift: on('shift'), ctrl: on('ctrl'), alt: on('alt') };
  }

  /** The codes of the modifiers that are down now. */
  modifiers(): ReadonlySet<string> {
    return new Set(this.mods.keys());
  }

  /** The key a pointer went down on. */
  press(code: string): void {
    const t = this.target();
    if (!t) return;
    if (modifierOf(code)) {
      const m = this.mods.get(code);
      if (m?.latched) return this.letGoModifier(code, t); // a second click lets go
      if (!m) {
        this.mods.set(code, { latched: false, used: false });
        sendKey(t, code, true, this.state());
      }
      return this.onChange(this.modifiers());
    }
    if (this.held.has(code)) return;
    for (const m of this.mods.values()) m.used = true;
    this.held.set(code, t);
    if (code === 'CapsLock') this.caps = !this.caps;
    sendKey(t, code, true, this.state(), { caps: this.caps });
  }

  /** The pointer came up (or left) the key. */
  release(code: string): void {
    if (modifierOf(code)) {
      const m = this.mods.get(code);
      if (!m) return;
      // Clicked and let go with nothing pressed meanwhile: it stays down for the next key.
      if (!m.used && !m.latched) {
        m.latched = true;
        return this.onChange(this.modifiers());
      }
      if (!m.latched) {
        const t = this.target();
        if (t) this.letGoModifier(code, t);
      }
      return;
    }
    const t = this.held.get(code);
    if (!t) return;
    this.held.delete(code);
    sendKey(t, code, false, this.state(), { caps: this.caps });
    // a latched modifier lasts for one key
    for (const [c, m] of [...this.mods]) if (m.latched) this.letGoModifier(c, t);
  }

  private letGoModifier(code: string, t: EventTarget): void {
    this.mods.delete(code);
    sendKey(t, code, false, this.state());
    this.onChange(this.modifiers());
  }

  /** Lets go of everything (the keyboard is taken away). */
  releaseAll(): void {
    for (const code of [...this.held.keys()]) this.release(code);
    const t = this.target();
    for (const code of [...this.mods.keys()]) if (t) this.letGoModifier(code, t);
    this.mods.clear();
  }
}
