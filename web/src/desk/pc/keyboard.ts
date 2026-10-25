// The PC's keyboard: a 101-key layout of raised keycaps (function row, main block,
// arrows and keypad). Keys go down when the matching key is pressed on the real keyboard,
// and can be pressed with the mouse or a finger (held as long as the pointer stays down;
// Shift, Ctrl and Alt stick for the next key): input/virtualKeys.ts sends them to the PC as
// real key events, so F-keys a Mac or the browser keeps (F4, F5, F6...) still reach it.
// Behind the function keys lies Game-Maker's printed key template, as software of the
// day shipped: what Esc and the F-keys do while a game plays. Its words are buttons too,
// the keyboard-reachable way to press those keys. On a phone, where the board is too small to
// tap, a strip of finger-sized keys under the PC (keyStrip) presses the ones a game asks for,
// and behind its F2–F10 key the rest of the template's; there the template's words are print only.
// Over the keypad, the Num Lock, Caps Lock and Scroll Lock lights: each lock key turns its own
// on and off (as the real keyboard reports it, when it does), Num Lock comes on when the PC
// starts, as a 1994 BIOS left it, and all three are dark while the PC is off.
import './keyboard.css';
import { h } from '../../editor/core/ui';
import { GLOBAL_KEYS } from '../../editor/keymap/keyMap';
import { VirtualKeys } from '../../input/virtualKeys';
import { audioContext, unlock } from '../../audio/context';
import { output } from '../../audio/output';

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
/** The board is 7.6 units deep: the template's strip, the function row, a gap, five rows and a front edge. */
const DEPTH = 7.6;
const TOP = 1;

/** The template's word for each key: PLAYGAME's own (GLOBAL_KEYS), spelled out a little. */
const TEMPLATE: Record<string, string> = { F8: 'Joy', F9: 'Setup' };

/** The phone's strip: [label, KeyboardEvent.code, its name]. */
const STRIP: [string, string, string][] = [
  ['Esc', 'Escape', 'Press Esc: leave the level'],
  ['F1', 'F1', 'Press F1: help'],
  ['Enter', 'Enter', 'Press Enter'],
  ['Space', 'Space', 'Press Space'],
  ['←', 'ArrowLeft', 'Press the left arrow'],
  ['↑', 'ArrowUp', 'Press the up arrow'],
  ['↓', 'ArrowDown', 'Press the down arrow'],
  ['→', 'ArrowRight', 'Press the right arrow'],
];

/** The template's keys the phone's strip doesn't show (F2 to F10): its row behind the F2–F10 key. */
const stripFnKeys = () => GLOBAL_KEYS.filter((g) => !STRIP.some(([, code]) => code === (g.name === 'Esc' ? 'Escape' : g.name)));

/** Every KeyboardEvent.code the phone's strip can press, its F2–F10 row included. */
export const stripCodes = () => [...STRIP.map(([, code]) => code), ...stripFnKeys().map((g) => g.name)];

/** The keyboard, and the phone's strip of large keys that press the same keys on the PC. */
export function keyboard(onClick: () => void): { board: HTMLElement; strip: HTMLElement } {
  const board = h('div', {
    class: 'keyboard',
    role: 'group',
    'aria-label': 'Keyboard: type on yours, or click a key to press it on the PC',
    title: 'Keyboard: click a key to press it on the PC, or type',
    onclick: onClick,
  });
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
        const el = h('span', { class: `key ${label.length > 2 ? 'small' : ''}`, dataset: { code }, 'aria-hidden': 'true' }, label);
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

  // the template: a printed strip on the board behind Esc and F1-F12, a word over each key
  const template = h('div', { class: 'key-template', role: 'group', 'aria-label': 'Game-Maker key template' });
  template.style.left = `${0.15 * UNIT}%`;
  template.style.width = `${14.95 * UNIT}%`;
  template.style.top = `${(0.06 / DEPTH) * 100}%`;
  template.style.height = `${((TOP - 0.1) / DEPTH) * 100}%`;
  let x = 0;
  for (const k of MAIN[0]) {
    if (typeof k === 'number') {
      x += k;
      continue;
    }
    const name = k[0];
    const g = GLOBAL_KEYS.find((gk) => gk.name === name);
    if (g) {
      const shown = TEMPLATE[name] ?? g.short;
      const label = h(
        'button',
        {
          type: 'button',
          class: `kt-label kt-${name.toLowerCase()}`,
          title: `${name}: ${g.title}`,
          // the word printed on the template first when the key's title doesn't say it (QUIT, JOY)
          'aria-label': g.title.toLowerCase().includes(shown.toLowerCase()) ? `Press ${name}: ${g.title}` : `${shown}: press ${name}, ${g.title}`,
          dataset: { code: k[2] },
        },
        shown,
      );
      label.style.left = `${((x + 0.1 + k[1] / 2) / 14.95) * 100}%`;
      template.append(label);
    }
    x += k[1];
  }
  // the maker's name on the blank stretch over F11 and F12
  template.append(h('span', { class: 'kt-brand' }, 'GAME-MAKER SE'));
  board.prepend(template);

  // ---- the lock lights over the keypad ----
  const LOCKS: [string, string, string][] = [
    ['NumLock', 'Num Lock', 'Num'],
    ['CapsLock', 'Caps Lock', 'Caps'],
    ['ScrollLock', 'Scroll Lock', 'Scroll'],
  ];
  const locked = new Map<string, boolean>(LOCKS.map(([code]) => [code, code === 'NumLock']));
  const lights = h('div', { class: 'kb-locks', role: 'group', 'aria-label': 'Lock lights' });
  lights.style.left = `${(19.25 * UNIT).toFixed(2)}%`;
  lights.style.width = `${(3.75 * UNIT).toFixed(2)}%`;
  lights.style.top = `${((TOP + 0.05) / DEPTH) * 100}%`;
  lights.style.height = `${(0.8 / DEPTH) * 100}%`;
  const leds = new Map<string, HTMLElement>();
  for (const [code, name, short] of LOCKS) {
    const led = h('span', { class: 'led green' });
    leds.set(code, led);
    lights.append(h('span', { class: 'kb-lock', title: name }, led, h('span', { class: 'kb-lock-name' }, short)));
  }
  board.append(lights);
  const showLocks = () => {
    const on = !off();
    for (const [code, led] of leds) {
      const lit = on && locked.get(code) === true;
      led.classList.toggle('on', lit);
      led.parentElement!.setAttribute('aria-label', `${led.parentElement!.title}: ${lit ? 'on' : 'off'}`);
    }
  };
  /**
   * A lock key's event (typed, or clicked: a clicked key's event comes past here too). Caps
   * Lock typed on the real keyboard says its own state, on its key-down and its key-up alike (a
   * Mac sends only a key-down turning it on and only a key-up turning it off); otherwise a
   * key-down toggles the light (a Mac never reports Num Lock or Scroll Lock).
   */
  const lockKey = (code: string, e: KeyboardEvent) => {
    if (!leds.has(code)) return;
    if (code === 'CapsLock' && e.isTrusted) locked.set(code, e.getModifierState('CapsLock'));
    else if (e.type === 'keydown') locked.set(code, !locked.get(code));
    else return;
    showLocks();
  };
  // power on: Num Lock on, as the BIOS leaves it; power off: all dark
  let wasOff: boolean | undefined;
  const power = new MutationObserver(() => {
    const now = off();
    if (wasOff === true && !now) {
      locked.set('NumLock', true);
      locked.set('CapsLock', false);
      locked.set('ScrollLock', false);
    }
    wasOff = now;
    showLocks();
  });
  requestAnimationFrame(() => {
    const d = desk();
    wasOff = off();
    showLocks();
    if (d) power.observe(d, { attributes: true, attributeFilter: ['data-power'] });
  });

  // ---- pressing keys with the pointer ----
  const desk = () => board.closest<HTMLElement>('.desk');
  const crt = () => desk()?.querySelector<HTMLElement>('.crt') ?? document.querySelector<HTMLElement>('.crt');
  /** Where a clicked key goes: what has the focus on the PC's screen, else the screen itself. */
  const target = (): HTMLElement | null => {
    // a desk taken off the page (releaseAll below, as you leave for today's web) has no PC to
    // press keys on: asking for one here would switch the old desk's PC on, BIOS beep and all
    if (!board.isConnected) return null;
    const screen = crt();
    if (!screen) return null;
    const inside = () => (document.activeElement instanceof HTMLElement && screen.contains(document.activeElement) ? document.activeElement : null);
    const now = inside();
    if (now) return now;
    onClick(); // the text screen takes the focus back
    const shown = [...screen.querySelectorAll<HTMLElement>('.crt-game canvas[tabindex], canvas[tabindex]')].find((c) => !c.hidden && c.offsetParent);
    if (!inside()) shown?.focus();
    return inside() ?? shown ?? null;
  };
  const vk = new VirtualKeys(target, (mods) => {
    for (const [code, els] of keys) if (/^(Shift|Control|Alt)/.test(code)) els.forEach((el) => el.classList.toggle('latched', mods.has(code)));
  });
  const off = () => desk()?.dataset.power === 'off';
  /** Pointers holding a key down, so a finger can hold Shift while another taps a letter. */
  const holding = new Map<number, string>();
  // the template's other keys (F2 to F10) in a row of their own behind a toggle: on a phone the
  // template's words are too small and close together to press
  const fnRow = h(
    'div',
    { class: 'ks-fn', id: 'ks-fn', role: 'group', 'aria-label': 'Function keys', hidden: true },
    ...stripFnKeys().map((g) =>
      h(
        'button',
        { type: 'button', class: 'ks-key ks-f', dataset: { code: g.name }, title: `${g.name}: ${g.title}` },
        g.name,
        ' ',
        h('small', null, TEMPLATE[g.name] ?? g.short),
      ),
    ),
  );
  const fnToggle = h(
    'button',
    {
      type: 'button',
      class: 'ks-key ks-more',
      'aria-expanded': 'false',
      'aria-controls': 'ks-fn',
      title: 'More keys: F2 to F10',
      onclick: (e: Event) => {
        e.stopPropagation(); // keeps the focus here (the strip's other keys give it back to the PC)
        fnRow.hidden = !fnRow.hidden;
        fnToggle.setAttribute('aria-expanded', String(!fnRow.hidden));
      },
    },
    'F2–F10',
  );
  const strip = h(
    'div',
    { class: 'key-strip', role: 'group', 'aria-label': 'Keys to press on the PC', onclick: onClick },
    ...STRIP.map(([label, code, name]) => h('button', { type: 'button', class: 'ks-key', dataset: { code }, title: name, 'aria-label': name }, label)),
    fnToggle,
    fnRow,
  );
  // where the strip shows, the template's words are print only (a tap on one presses the key under it)
  const phone = matchMedia('(max-width: 600px)');
  const printOnly = () => (template.inert = phone.matches);
  printOnly();
  phone.addEventListener('change', printOnly);
  const down = (e: PointerEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-code]');
    if (!el || e.button > 0) return;
    // the PC keeps the focus (and a switched-off PC just switches on, from the click)
    e.preventDefault();
    if (off()) return;
    const code = el.dataset.code!;
    el.setPointerCapture?.(e.pointerId);
    holding.set(e.pointerId, code);
    click();
    vk.press(code);
  };
  board.addEventListener('pointerdown', down);
  strip.addEventListener('pointerdown', down);
  const lift = (e: PointerEvent) => {
    const code = holding.get(e.pointerId);
    if (code === undefined) return;
    holding.delete(e.pointerId);
    vk.release(code);
  };
  for (const el of [board, strip]) {
    el.addEventListener('pointerup', lift);
    el.addEventListener('pointercancel', lift);
    el.addEventListener('lostpointercapture', lift);
  }
  for (const el of [template, strip]) {
    // the template's words and the strip's keys from the keyboard (Enter or Space on one): a quick tap
    el.addEventListener('click', (e) => {
      const key = (e.target as Element).closest<HTMLElement>('[data-code]');
      if (!key || e.detail !== 0 || off()) return;
      const code = key.dataset.code!;
      vk.press(code);
      setTimeout(() => vk.release(code), 90);
    });
    // Enter or Space on a word must not also reach the game as itself
    el.addEventListener('keydown', (e) => e.stopPropagation());
    el.addEventListener('keyup', (e) => e.stopPropagation());
  }

  const press = (e: KeyboardEvent, down: boolean) => keys.get(e.code)?.forEach((el) => el.classList.toggle('down', down));
  /** The real Caps Lock key's down and up don't pair up on a Mac: its cap only dips for a moment. */
  const dip = (e: KeyboardEvent) => {
    press(e, true);
    setTimeout(() => press(e, false), 120);
  };
  const realCaps = (e: KeyboardEvent) => e.code === 'CapsLock' && e.isTrusted;
  const onDown = (e: KeyboardEvent) => {
    if (realCaps(e)) dip(e);
    else press(e, true);
    if (!e.repeat && !off()) lockKey(e.code, e);
  };
  const onUp = (e: KeyboardEvent) => {
    if (realCaps(e)) {
      if (!off()) lockKey(e.code, e);
      return;
    }
    press(e, false);
  };
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  // Stop listening when the desk is taken off the page.
  const watch = new MutationObserver(() => {
    if (board.isConnected) return;
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    phone.removeEventListener('change', printOnly);
    vk.releaseAll();
    watch.disconnect();
    power.disconnect();
  });
  requestAnimationFrame(() => board.parentElement && watch.observe(document.body, { childList: true, subtree: true }));
  return { board, strip };
}

let clickCtx: AudioContext | undefined;
/** A keycap's click: a short burst of filtered noise, through the desk's volume knob. */
function click(): void {
  try {
    clickCtx ??= audioContext();
    const ctx = clickCtx;
    if (!ctx) return;
    unlock();
    const len = Math.floor(ctx.sampleRate * 0.025);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 2400 + Math.random() * 600;
    band.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.value = 0.35;
    src.connect(band).connect(g).connect(output(ctx));
    src.start();
  } catch {
    /* no audio */
  }
}
