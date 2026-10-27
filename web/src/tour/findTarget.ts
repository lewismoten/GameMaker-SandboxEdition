// Finding a step's control on the page (steps.ts Target): the first visible match of its
// selectors, opening the menu it is in when it needs to be shown.
import { cssList, type Target } from './steps';

/** Drawn and taking up room (not display:none, not in a closed menu, not cut off by a box it overflows). */
export function visible(el: Element): boolean {
  // a closed <details>' contents can still report a size
  const details = el.closest('details');
  if (details && !details.open && !el.closest('summary')) return false;
  if (el.checkVisibility && !el.checkVisibility({ visibilityProperty: true })) return false;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return false;
  // cut off by a box that hides what overflows it (a phone's tip folded to one line)
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(p);
    if (!/hidden|clip/.test(overflowX + overflowY)) continue;
    const b = p.getBoundingClientRect();
    if (r.left >= b.right || r.right <= b.left || r.top >= b.bottom || r.bottom <= b.top) return false;
  }
  return true;
}

const textOf = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

/** The first visible element a target names (its text starting with `text` when given). */
export function findTarget(t: Target, root: ParentNode = document): HTMLElement | undefined {
  for (const css of cssList(t.css)) {
    for (const el of root.querySelectorAll<HTMLElement>(css)) {
      if (!visible(el)) continue;
      // the text after an icon: "⤓ Play offline" matches "Play offline"
      if (
        t.text &&
        !textOf(el)
          .replace(/^[^A-Za-z0-9]+/, '')
          .startsWith(t.text)
      )
        continue;
      return el;
    }
  }
  return undefined;
}

/** The menu button that shows a hidden target: the first visible one of its `reveal`. */
export const revealer = (t: Target): HTMLElement | undefined => findTarget({ label: 'menu', css: cssList(t.reveal) });

/** Whether a menu button's menu is open (a ⚙ button's aria-expanded, the ⋯ menu's details, a panel toggle's aria-pressed). */
export function menuOpen(button: HTMLElement): boolean {
  const details = button.closest('details');
  if (button.tagName === 'SUMMARY' && details) return details.open;
  // a menu button says it is expanded; a panel's toggle (the Level check) that it is pressed
  return button.getAttribute('aria-expanded') === 'true' || button.getAttribute('aria-pressed') === 'true';
}

/** Closes a menu or panel the tour opened (clicking its button again toggles it shut). */
export function closeMenu(button: HTMLElement): void {
  if (!button.isConnected || !menuOpen(button)) return;
  const details = button.closest('details');
  if (button.tagName === 'SUMMARY' && details) details.open = false;
  else button.click();
}

/** Waits for a selector to be on the page and visible, up to `ms`. */
export function waitFor(css: string, ms = 8000): Promise<HTMLElement | undefined> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const look = () => {
      const el = findTarget({ label: 'page', css });
      if (el || performance.now() - t0 > ms) resolve(el);
      else setTimeout(look, 100);
    };
    look();
  });
}
