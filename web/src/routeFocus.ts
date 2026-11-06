// Focus after a person's own navigation: when a link or button takes someone to another page of
// today's web, focus moves to the new page's h1 (or its main area), so a screen reader says where
// they are and the next Tab starts in the new page. Never on the first load, on a change made by
// code (the map's ?x=&y= updates, a file change inside one project), on Back or Forward, or while a
// dialog, a text box or a canvas has focus. The header never moves.
import { parseHash } from './urlState';

/** How long after a click or key press a hash change still counts as that person's choice. */
const FRESH_MS = 4000;

/** A different page, not the same page with other parts or another file of the same project. */
export function viewChanged(from: string, to: string): boolean {
  const a = parseHash(from).path;
  const b = parseHash(to).path;
  return a[0] !== b[0] || a[1] !== b[1];
}

/** The last press or click was moments ago. */
export function startedByPerson(lastInput: number, now: number): boolean {
  return lastInput > 0 && now - lastInput >= 0 && now - lastInput <= FRESH_MS;
}

let lastInput = 0;
/** Starts noting presses and clicks (Enter and Space on links and buttons, any click). */
export function trackPersonInput(): void {
  const note = () => (lastInput = Date.now());
  addEventListener('pointerdown', note, true);
  window.addEventListener('keydown', (e: KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && note(), true);
}

/** Where a person is working that a page change must not pull focus from. */
function keepsFocus(active: Element | null): boolean {
  if (!active || active === document.body || !active.isConnected) return false;
  return (
    !!active.closest('dialog[open], [aria-modal="true"]') ||
    /^(input|textarea|select|canvas)$/i.test(active.tagName) ||
    (active as HTMLElement).isContentEditable
  );
}

/** After the new view is drawn: focus its h1, else its main area, else the content area, without scrolling. */
export function focusNewView(content: HTMLElement, from: string, to: string): void {
  if (!viewChanged(from, to) || !startedByPerson(lastInput, Date.now())) return;
  if (keepsFocus(document.activeElement)) return;
  const target = content.querySelector<HTMLElement>('h1') ?? content.querySelector<HTMLElement>('main, [role="main"]') ?? content;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.style.outline = 'none';
  target.addEventListener('blur', () => target.style.removeProperty('outline'), { once: true });
  target.focus({ preventScroll: true });
}
