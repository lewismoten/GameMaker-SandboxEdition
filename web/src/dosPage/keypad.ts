// The DOS page's keys for a phone or tablet with no keyboard (dos.html): the keys DOS, Game-Maker's
// menus and the games need most (Esc, Enter, the arrows, Space, Y and N, the F-keys), and a line
// to type text into, all sent to the PC's screen as real key presses (input/virtualKeys.ts, as the
// desk's drawn keyboard does). The footer folds it away until it is wanted (footer.ts).
import { h } from '../editor/core/ui';
import { VirtualKeys } from '../input/virtualKeys';

const KEYS: [label: string, code: string, name: string][] = [
  ['Esc', 'Escape', 'Escape'],
  ['Tab', 'Tab', 'Tab'],
  ['↑', 'ArrowUp', 'Up arrow'],
  ['↓', 'ArrowDown', 'Down arrow'],
  ['←', 'ArrowLeft', 'Left arrow'],
  ['→', 'ArrowRight', 'Right arrow'],
  ['Space', 'Space', 'Space'],
  ['Y', 'KeyY', 'Y'],
  ['N', 'KeyN', 'N'],
  ['Enter', 'Enter', 'Enter'],
  ['⌫', 'Backspace', 'Backspace'],
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n): [string, string, string] => [`F${n}`, `F${n}`, `F${n}`]),
];

/** Codes for the characters a typed line can hold (a US keyboard's, unshifted or shifted). */
function codeOf(c: string): [code: string, shift: boolean] | undefined {
  if (/^[a-z]$/.test(c)) return [`Key${c.toUpperCase()}`, false];
  if (/^[A-Z]$/.test(c)) return [`Key${c}`, true];
  if (/^[0-9]$/.test(c)) return [`Digit${c}`, false];
  const plain: Record<string, string> = {
    ' ': 'Space',
    '.': 'Period',
    ',': 'Comma',
    '-': 'Minus',
    '=': 'Equal',
    '/': 'Slash',
    '\\': 'Backslash',
    ';': 'Semicolon',
    "'": 'Quote',
  };
  const shifted: Record<string, string> = { ':': 'Semicolon', _: 'Minus', '?': 'Slash', '!': 'Digit1', '*': 'Digit8', '"': 'Quote', '+': 'Equal' };
  if (plain[c]) return [plain[c], false];
  if (shifted[c]) return [shifted[c], true];
  return undefined;
}

export function keypad(screen: HTMLElement): HTMLElement {
  /** What has the focus on the PC's screen, else the screen's own canvas (text, VGA or a game). */
  const target = (): HTMLElement | null => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && screen.contains(active)) return active;
    const shown = [...screen.querySelectorAll<HTMLElement>('.crt-game canvas[tabindex], canvas[tabindex]')].find((c) => !c.hidden && c.offsetParent);
    shown?.focus();
    return shown ?? null;
  };
  const vk = new VirtualKeys(target);
  const tap = (code: string) => {
    vk.press(code);
    setTimeout(() => vk.release(code), 60);
  };

  const line = h('input', { id: 'dos-type', type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: false, maxLength: 60 });
  const form = h(
    'form',
    {
      class: 'dos-type',
      onsubmit: (e: Event) => {
        e.preventDefault();
        void typeLine(line.value);
        line.value = '';
      },
    },
    h('label', { for: 'dos-type' }, 'Type'),
    line,
    h('button', { type: 'submit', class: 'dos-btn' }, 'Send + Enter'),
  );

  async function typeLine(text: string): Promise<void> {
    for (const c of text) {
      const k = codeOf(c);
      if (!k) continue;
      if (k[1]) vk.press('ShiftLeft');
      tap(k[0]);
      if (k[1]) vk.release('ShiftLeft');
      await new Promise((r) => setTimeout(r, 70));
    }
    tap('Enter');
  }

  return h(
    'div',
    { class: 'dos-keypad' },
    h(
      'div',
      { class: 'dos-keyrow', role: 'group', 'aria-label': 'Keys' },
      ...KEYS.map(([label, code, name]) =>
        h(
          'button',
          {
            type: 'button',
            class: 'dos-btn dos-key',
            'aria-label': name,
            // the PC keeps the keyboard focus
            onmousedown: (e: MouseEvent) => e.preventDefault(),
            onclick: () => tap(code),
          },
          label,
        ),
      ),
    ),
    form,
  );
}
