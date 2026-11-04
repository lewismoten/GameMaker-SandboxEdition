// One Tab stop for a group of controls: the arrow keys, Home and End move focus (they do not act;
// Enter or Space on the focused item does, as it always did). Type-ahead jumps to the next item whose
// label starts with the typed letters. Unlike rovingGrid.ts it never clicks, for lists whose items open or add.
import { gridMove } from './rovingGrid';

/** The next index whose label starts with the typed text, searching after `from` and wrapping; -1 when none. */
export function typeAheadIndex(labels: string[], from: number, typed: string): number {
  const q = typed.toLowerCase();
  if (!q) return -1;
  const n = labels.length;
  // the same letter repeated (aaa) steps through items that start with it
  const same = [...q].every((c) => c === q[0]);
  const want = same ? q[0] : q;
  for (let k = same ? 1 : 0; k <= n; k++) {
    const i = (((from + k) % n) + n) % n;
    if (labels[i].toLowerCase().startsWith(want)) return i;
  }
  return -1;
}

/** How many items sit on the first row (1 for a vertical list), read from the layout. */
function columnsOf(items: HTMLElement[]): number {
  if (items.length < 2) return 1;
  const top = items[0].offsetTop;
  const n = items.findIndex((el) => el.offsetTop !== top);
  return n < 0 ? items.length : n;
}

export function rovingFocus(container: HTMLElement, itemSelector: string, opts: { label?: (el: HTMLElement) => string; list?: boolean } = {}): void {
  const items = () => [...container.querySelectorAll<HTMLElement>(itemSelector)].filter((el) => !el.closest('[hidden]') && el.getClientRects().length > 0);
  let typed = '';
  let timer = 0;
  const sync = () => {
    const all = [...container.querySelectorAll<HTMLElement>(itemSelector)];
    const vis = items();
    const stop = vis.find((el) => el === document.activeElement) ?? vis.find((el) => el.getAttribute('tabindex') === '0') ?? vis[0];
    for (const el of all) {
      const ti = el === stop ? '0' : '-1';
      if (el.getAttribute('tabindex') !== ti) el.setAttribute('tabindex', ti);
    }
  };
  let busy = false;
  new MutationObserver(() => {
    if (busy) return;
    busy = true;
    sync();
    busy = false;
  }).observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
  container.addEventListener('focusin', (e) => {
    if ((e.target as HTMLElement).matches?.(itemSelector)) sync();
  });
  container.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (!t.matches?.(itemSelector) || e.altKey || e.ctrlKey || e.metaKey) return;
    const all = items();
    const i = all.indexOf(t);
    if (i < 0) return;
    let to = -1;
    if (e.key.length === 1 && e.key !== ' ' && opts.label) {
      window.clearTimeout(timer);
      typed += e.key;
      timer = window.setTimeout(() => (typed = ''), 700);
      to = typeAheadIndex(all.map(opts.label), i, typed);
    } else {
      let key = e.key;
      if (opts.list) key = key === 'ArrowLeft' || key === 'ArrowRight' ? '' : key === 'ArrowDown' ? 'ArrowRight' : key === 'ArrowUp' ? 'ArrowLeft' : key;
      if (key) to = gridMove(key, i, all.length, opts.list ? 1 : columnsOf(all));
    }
    if (to < 0) return;
    e.preventDefault();
    if (to === i) return;
    all[to].focus();
    all[to].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    sync();
  });
  sync();
}
