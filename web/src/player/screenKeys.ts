// On-screen keys for the player (play page, web-exported games, today's editor's test runs):
// a button that opens a panel of keys to click or tap. The short panel has Esc and F1-F10
// (each with what PLAYGAME does with it: Help, Sound, Save, Load...) plus Enter, Space, the
// arrows and Y/N for the game's prompts; "ABC" opens the letters and digits too. Every key
// goes to the game as a real key event (input/virtualKeys.ts), so the F-keys a Mac turns into
// media keys, or the browser keeps (F5 reloads, F6 goes to the address bar), still work.
import './screenKeys.css';
import { GLOBAL_KEYS } from '../editor/keymap/keyMap';
import { VirtualKeys } from '../input/virtualKeys';

/** [label, code, accessible name, small word under the label] */
type K = [string, string, string?, string?];

const FKEYS: K[] = [['Esc', 'Escape'], ...Array.from({ length: 10 }, (_, i): K => [`F${i + 1}`, `F${i + 1}`])].map(([label, code]) => {
  const g = GLOBAL_KEYS.find((k) => k.name === label);
  return [label, code, g ? `${label}: ${g.title}` : label, g?.short];
});

const NAV: K[] = [
  ['Enter', 'Enter'],
  ['Space', 'Space'],
  ['←', 'ArrowLeft', 'Left arrow'],
  ['↑', 'ArrowUp', 'Up arrow'],
  ['↓', 'ArrowDown', 'Down arrow'],
  ['→', 'ArrowRight', 'Right arrow'],
  ['Y', 'KeyY', 'Y (yes)'],
  ['N', 'KeyN', 'N (no)'],
];

const letters = (s: string): K[] => s.split('').map((c) => [c, /\d/.test(c) ? `Digit${c}` : `Key${c}`]);
const FULL: K[][] = [
  [...letters('1234567890'), ['⌫', 'Backspace', 'Backspace']],
  [['Tab', 'Tab'], ...letters('QWERTYUIOP')],
  [...letters('ASDFGHJKL'), ['Del', 'Delete', 'Delete']],
  [['Shift', 'ShiftLeft'], ...letters('ZXCVBNM'), ['Ctrl', 'ControlLeft'], ['Alt', 'AltLeft']],
];

const PREF = 'gm-screen-keys';
const remembered = (): string | null => {
  try {
    return localStorage.getItem(PREF);
  } catch {
    return null;
  }
};
const remember = (v: string) => {
  try {
    localStorage.setItem(PREF, v);
  } catch {
    /* private mode */
  }
};

let ids = 0;

/** Adds the on-screen keys button and panel to `container`; keys go to `canvas`. Returns a clean-up. */
export function screenKeys(container: HTMLElement, corner: HTMLElement, canvas: HTMLElement): () => void {
  const id = `gm-osk-${++ids}`;
  const keys = new Map<string, HTMLButtonElement[]>();
  const vk = new VirtualKeys(
    () => {
      if (document.activeElement !== canvas) canvas.focus({ preventScroll: true });
      return canvas;
    },
    (mods) => {
      for (const [code, els] of keys) if (/^(Shift|Control|Alt)/.test(code)) els.forEach((b) => b.setAttribute('aria-pressed', String(mods.has(code))));
    },
  );

  const button = ([label, code, name, word]: K): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gm-osk-key';
    b.dataset.code = code;
    b.textContent = label;
    if (word) {
      const w = document.createElement('small');
      w.textContent = word;
      b.append(w);
    }
    if (name && name !== label) {
      b.setAttribute('aria-label', name);
      b.title = name;
    }
    if (/^(Shift|Control|Alt)/.test(code)) b.setAttribute('aria-pressed', 'false');
    keys.set(code, [...(keys.get(code) ?? []), b]);
    return b;
  };
  const row = (list: K[], cls: string) => {
    const r = document.createElement('div');
    r.className = `gm-osk-row ${cls}`;
    r.append(...list.map(button));
    return r;
  };

  const panel = document.createElement('div');
  panel.className = 'gm-osk';
  panel.id = id;
  panel.hidden = true;
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'On-screen keys');
  const full = document.createElement('div');
  full.className = 'gm-osk-full';
  full.hidden = remembered() !== 'full';
  full.append(...FULL.map((r, i) => row(r, `gm-osk-abc gm-osk-abc${i}`)));
  const abc = document.createElement('button');
  abc.type = 'button';
  abc.className = 'gm-osk-key gm-osk-more';
  abc.textContent = 'ABC';
  abc.setAttribute('aria-label', 'Letters and digits');
  abc.setAttribute('aria-expanded', String(!full.hidden));
  abc.addEventListener('click', () => {
    full.hidden = !full.hidden;
    abc.setAttribute('aria-expanded', String(!full.hidden));
    remember(full.hidden ? 'short' : 'full');
  });
  const nav = row(NAV, 'gm-osk-nav');
  nav.append(abc);
  panel.append(row(FKEYS, 'gm-osk-f'), nav, full);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'gm-osk-toggle';
  toggle.textContent = 'F1–F10';
  toggle.title = 'On-screen keys: Esc, F1–F10, arrows, Enter and more, to click or tap';
  toggle.setAttribute('aria-label', 'On-screen keys');
  toggle.setAttribute('aria-controls', id);
  const show = (on: boolean) => {
    panel.hidden = !on;
    toggle.setAttribute('aria-expanded', String(on));
    container.classList.toggle('gm-osk-open', on);
    if (!on) vk.releaseAll();
  };
  show(remembered() === 'short' || remembered() === 'full');
  toggle.addEventListener('pointerdown', (e) => e.preventDefault()); // the game keeps the focus
  toggle.addEventListener('click', (e) => {
    e.stopPropagation(); // not the start screen's click
    show(panel.hidden);
    remember(panel.hidden ? 'off' : full.hidden ? 'short' : 'full');
  });

  // Pointer: down presses, up lets go (so a key can be held); the game keeps the focus.
  const holding = new Map<number, string>();
  panel.addEventListener('pointerdown', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('.gm-osk-key[data-code]');
    if (!b || e.button > 0) return;
    e.preventDefault();
    b.setPointerCapture?.(e.pointerId);
    holding.set(e.pointerId, b.dataset.code!);
    b.classList.add('down');
    vk.press(b.dataset.code!);
  });
  const lift = (e: PointerEvent) => {
    const code = holding.get(e.pointerId);
    if (code === undefined) return;
    holding.delete(e.pointerId);
    keys.get(code)?.forEach((b) => b.classList.remove('down'));
    vk.release(code);
  };
  panel.addEventListener('pointerup', lift);
  panel.addEventListener('pointercancel', lift);
  panel.addEventListener('lostpointercapture', lift);
  panel.addEventListener('contextmenu', (e) => e.preventDefault());
  // Keyboard: Enter or Space on a key taps it (and doesn't reach the game as itself).
  panel.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = (e.target as Element).closest<HTMLElement>('.gm-osk-key[data-code]');
    if (!b || e.detail !== 0) return;
    const code = b.dataset.code!;
    const t = document.activeElement as HTMLElement | null;
    vk.press(code);
    setTimeout(() => {
      vk.release(code);
      t?.focus({ preventScroll: true }); // stay on the key, for the next press
    }, 90);
  });
  for (const type of ['keydown', 'keyup']) {
    panel.addEventListener(type, (e) => e.stopPropagation());
    toggle.addEventListener(type, (e) => e.stopPropagation());
  }

  corner.prepend(toggle);
  container.append(panel);
  return () => {
    vk.releaseAll();
    toggle.remove();
    panel.remove();
    container.classList.remove('gm-osk-open');
  };
}
