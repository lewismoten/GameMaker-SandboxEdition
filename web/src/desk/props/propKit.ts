// What every little thing in the room shares once it can be clicked (desk/props/): it is
// reached with Tab and pressed with Enter or Space like a button, it answers in a speech
// bubble beside it (read out to a screen reader too), and its first use of the visit tells
// the achievements (a 'gm-achievement' event). Bubbles never take a click: the PC under or
// beside them keeps working.
import './props.css';
import { h } from '../../editor/core/ui';

/** Without motion: no wobbles or flights, just the answer. */
export const stillMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

const told = new Set<string>();
/** The first use this visit of desk-<prop> (the achievements keep what was earned). */
export function achieve(id: string): void {
  if (told.has(id)) return;
  told.add(id);
  window.dispatchEvent(new CustomEvent('gm-achievement', { detail: { id } }));
}

/**
 * Makes `el` a button (or a part of something drawn, given a hit area of its own): a name, a
 * place in the Tab order, and click, Enter and Space all doing `use`.
 */
export function pressable(el: HTMLElement, name: string, use: (e: Event) => void, opts: { id?: string; title?: string } = {}): () => void {
  el.removeAttribute('aria-hidden');
  if (el.tagName !== 'BUTTON') {
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
  }
  if (name) el.setAttribute('aria-label', name);
  // (title "": no tooltip at all, where one would sit over a picture)
  if (opts.title === '') el.removeAttribute('title');
  else el.title = opts.title ?? name;
  el.classList.add('room-prop');
  const go = (e: Event) => {
    if (opts.id) achieve(opts.id);
    use(e);
  };
  const key = (e: KeyboardEvent) => {
    if (el.tagName === 'BUTTON' || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    go(e);
  };
  el.addEventListener('click', go);
  el.addEventListener('keydown', key);
  return () => {
    el.removeEventListener('click', go);
    el.removeEventListener('keydown', key);
  };
}

/** An invisible button over part of a drawing (the knob on the door, the moon in the window). */
export function hitArea(cls: string): HTMLButtonElement {
  return h('button', { class: `prop-hit ${cls}`, type: 'button' });
}

let live: HTMLElement | undefined;
let bubble: HTMLElement | undefined;
let bubbleTimer = 0;
const closeBubble = () => {
  clearTimeout(bubbleTimer);
  bubble?.remove();
  bubble = undefined;
  removeEventListener('resize', closeBubble);
  removeEventListener('scroll', closeBubble);
  removeEventListener('keydown', escape, true);
};
const escape = (e: KeyboardEvent) => e.key === 'Escape' && bubble && closeBubble();

/**
 * A speech bubble beside `anchor` saying `text` (and showing `extra`, a little drawing, if
 * given) for a few seconds; the next one replaces it. Esc, scrolling or resizing closes it.
 * Above `anchor` if there is room, below if not; `beside` puts it to the right instead (the
 * black-light tube's, so it never covers the poster under the tube).
 */
export function say(anchor: Element, text: string, extra?: Node, opts: { beside?: boolean } = {}): void {
  closeBubble();
  live ??= document.body.appendChild(h('div', { class: 'prop-live', role: 'status', 'aria-live': 'polite' }));
  // emptied first, so the same words twice are read twice
  live.textContent = '';
  setTimeout(() => live && (live.textContent = text), 50);
  const b = h('div', { class: 'prop-bubble', 'aria-hidden': 'true' }, extra ?? null, h('p', null, text));
  document.body.append(b);
  bubble = b;
  const r = anchor.getBoundingClientRect();
  const w = b.offsetWidth;
  const ht = b.offsetHeight;
  const gutter = 16;
  if (opts.beside && r.right + 14 + w <= innerWidth - gutter) {
    // to the right of it, level with it, its tail pointing back (clear of what is below it);
    // with no room on the right (the light switch, near the browser window's right edge), above or below it as usual
    b.style.left = `${Math.min(innerWidth - gutter - w, r.right + 14)}px`;
    b.style.top = `${Math.max(gutter, Math.min(innerHeight - ht - gutter, r.top + r.height / 2 - ht / 2))}px`;
    b.classList.add('beside');
    bubbleTimer = window.setTimeout(closeBubble, 1800 + text.length * 35);
    addEventListener('resize', closeBubble);
    addEventListener('scroll', closeBubble);
    addEventListener('keydown', escape, true);
    return;
  }
  const cx = r.left + r.width / 2;
  const left = Math.max(gutter, Math.min(innerWidth - gutter - w, cx - w / 2));
  // above the thing if there is room, below it if not
  const above = r.top - ht - 14 >= gutter;
  const top = above ? r.top - ht - 14 : Math.min(innerHeight - ht - gutter, r.bottom + 14);
  b.style.left = `${left}px`;
  b.style.top = `${Math.max(gutter, top)}px`;
  b.style.setProperty('--tail', `${Math.max(16, Math.min(w - 16, cx - left))}px`);
  b.classList.add(above ? 'above' : 'below');
  bubbleTimer = window.setTimeout(closeBubble, 2600 + text.length * 45);
  addEventListener('resize', closeBubble);
  addEventListener('scroll', closeBubble); // the page scrolling (not a list inside it)
  addEventListener('keydown', escape, true);
}

/** Puts a class on for one play of its animation (or `ms`), then takes it off again. */
export function flash(el: Element, cls: string, ms = 1200): void {
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth; // restart the animation
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}

/** Takes turns through a list, starting at a random place so every visit isn't the same. */
export function turns<T>(list: readonly T[]): () => T {
  let i = Math.floor(Math.random() * list.length);
  return () => list[i++ % list.length];
}

/** Removes the bubble (the desk going away). */
export const hideBubble = closeBubble;
