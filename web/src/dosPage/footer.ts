// The DOS page's footer (dos.html): one row with the on-screen keys and the page's links as
// toggles, and the status line taking what is left (cut short with … on screen; the whole line
// is its title, and a screen reader hears it all from the live region). An open toggle's panel
// slides up over the bottom of the screen instead of making the footer taller; one at a time.
import { h } from '../editor/core/ui';

export interface Fold {
  icon: string;
  /** Shown beside the icon (on a phone too: short). */
  word: string;
  /** Its accessible name and tooltip. */
  name: string;
  content: HTMLElement;
}

/** `extra`: shown before the status line (the modem speed's hint). */
export function footer(folds: Fold[], status: HTMLElement, extra?: HTMLElement): HTMLElement {
  const all: HTMLDetailsElement[] = [];
  const row = h('footer', { class: 'dos-foot' });
  for (const f of folds) {
    const d = h(
      'details',
      { class: 'dos-fold' },
      h(
        'summary',
        { 'aria-label': f.name, title: f.name },
        h('span', { class: 'dos-ico', 'aria-hidden': 'true' }, f.icon),
        h('span', { class: 'dos-fold-word' }, f.word),
      ),
      h('div', { class: 'dos-fold-panel', role: 'region', 'aria-label': f.name }, f.content),
    );
    d.addEventListener('toggle', () => {
      if (d.open) for (const o of all) if (o !== d) o.open = false;
    });
    d.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !d.open) return;
      d.open = false;
      d.querySelector('summary')?.focus();
    });
    all.push(d);
    row.append(d);
  }
  // the whole line as its title, whatever it says now
  new MutationObserver(() => (status.title = status.textContent ?? '')).observe(status, { childList: true, characterData: true, subtree: true });
  if (extra) row.append(extra);
  row.append(status);
  return row;
}
