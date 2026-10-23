// The phone's keypad, big enough to use: shown while the handset is off the hook. An LCD
// with the number and what's happening on the line, captions of what people say, the
// twelve keys (with their letters), memory buttons labeled by hand, and Hang up.
import './dialPad.css';
import { h, clear } from '../../../editor/core/ui';
import { keypadDigits } from '../../../retro/bbs/modem';
import { SPEED_DIAL } from './calls';
import { notes } from '../phoneNotes';

const KEYS: [string, string][] = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PRS'],
  ['8', 'TUV'],
  ['9', 'WXY'],
  ['*', ''],
  ['0', 'OPER'],
  ['#', ''],
];

/** 5550148 → 555-0148; 18005550142 → 1-800-555-0142 (as far as it's been dialed). */
export function formatNumber(d: string): string {
  const local = (s: string) => (s.length > 3 ? `${s.slice(0, 3)}-${s.slice(3)}` : s);
  if (d.startsWith('911')) return d;
  if (d.startsWith('1')) return ['1', d.slice(1, 4), local(d.slice(4))].filter(Boolean).join('-');
  if (d.startsWith('412') && d.length > 7) return `${d.slice(0, 3)}-${local(d.slice(3))}`;
  return local(d);
}

export interface DialPad {
  el: HTMLElement;
  number(digits: string): void;
  status(text: string): void;
  caption(who: string, text: string): void;
  close(): void;
}

export function openDialPad(press: (k: string) => void, hangUp: () => void): DialPad {
  const number = h('div', { class: 'pp-number' }, ' ');
  const status = h('div', { class: 'pp-status', 'aria-live': 'polite' });
  const caption = h('div', { class: 'pp-caption', 'aria-live': 'polite' });
  const button = (k: string, letters: string) =>
    h(
      'button',
      {
        class: 'pp-key',
        onclick: () => press(k),
        'aria-label': k === '*' ? 'star' : k === '#' ? 'pound' : k,
      },
      h('b', null, k),
      h('small', null, letters || ' '),
    );
  const memory = SPEED_DIAL.map(([name, digits]) =>
    h(
      'button',
      {
        class: 'pp-mem',
        title: `Dial ${name}: ${formatNumber(digits)}`,
        onclick: () => [...digits].forEach((k, i) => setTimeout(() => press(k), i * 110)),
      },
      name,
    ),
  );
  const el = h(
    'div',
    { class: 'phone-pad', role: 'dialog', 'aria-label': 'Telephone keypad' },
    h('div', { class: 'pp-lcd' }, number, status),
    caption,
    h('div', { class: 'pp-keys' }, ...KEYS.map(([k, l]) => button(k, l))),
    h('div', { class: 'pp-memory' }, h('span', null, 'MEMORY'), ...memory),
    h('button', { class: 'pp-hang', onclick: hangUp }, 'Hang up (Esc)'),
  );

  // the computer's keyboard dials too (letters as on the keypad: 555-SAND)
  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    e.stopImmediatePropagation(); // not for the PC underneath
    if (e.key === 'Escape') hangUp();
    else if (/^[0-9*#]$/.test(e.key)) press(e.key);
    else if (/^[a-z]$/i.test(e.key)) press(keypadDigits(e.key));
    else return; // Tab, Enter and Space still work the pad's buttons
    e.preventDefault();
  };
  window.addEventListener('keydown', onKey, true);
  // Mom's notes from under the phone, beside the keypad, so the numbers are at hand
  const card = h(
    'aside',
    {
      class: 'pn-small pp-notes',
      'aria-label': 'Mom’s notes from under the phone',
    },
    notes(),
  );
  document.body.append(el, card);
  el.querySelector<HTMLButtonElement>('.pp-key')?.focus({
    preventScroll: true,
  });

  return {
    el,
    number: (d) => (number.textContent = d ? formatNumber(d) : ' '),
    status: (text) => (status.textContent = text),
    caption: (who, text) => clear(caption, ...(text ? [h('b', null, `${who}: `), text] : [])),
    close() {
      window.removeEventListener('keydown', onKey, true);
      el.remove();
      card.remove();
    },
  };
}
