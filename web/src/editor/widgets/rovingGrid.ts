// Keyboard and screen reader support for a grid of picture buttons (blocks, colors, monsters):
// the container is a listbox, each button an option; one Tab stop for the whole grid, the arrow
// keys move through it (choosing as they go), Home/End jump to the ends.
// It keeps itself in sync: a button with the class "selected" is the chosen option.

/** How many items fit on one row, read from the layout. */
export function columnsOf(items: HTMLElement[]): number {
  if (items.length < 2) return 1;
  const top = items[0].offsetTop;
  const n = items.findIndex((el) => el.offsetTop !== top);
  return n < 0 ? items.length : n;
}

/** Where the arrow key goes from index i in a grid of n items with cols columns, or -1 to ignore the key. */
export function gridMove(key: string, i: number, n: number, cols: number): number {
  const c = Math.max(1, cols);
  const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: c, ArrowUp: -c };
  if (key === 'Home') return 0;
  if (key === 'End') return n - 1;
  if (!(key in step)) return -1;
  return Math.max(0, Math.min(n - 1, i + step[key]));
}

export function rovingGrid(container: HTMLElement, label: string, opts: { multiselect?: boolean } = {}): HTMLElement {
  container.setAttribute('role', 'listbox');
  container.setAttribute('aria-label', label);
  if (opts.multiselect) container.setAttribute('aria-multiselectable', 'true');
  const items = () => [...container.children].filter((el): el is HTMLElement => el instanceof HTMLElement && el.matches('button'));
  let syncing = false;
  const sync = () => {
    if (syncing) return;
    syncing = true;
    const all = items();
    const active = all.find((el) => el === document.activeElement);
    const chosen = all.find((el) => el.classList.contains('selected'));
    const stop = active ?? chosen ?? all[0];
    for (const el of all) {
      if (el.getAttribute('role') !== 'option') el.setAttribute('role', 'option');
      const sel = String(el.classList.contains('selected'));
      if (el.getAttribute('aria-selected') !== sel) el.setAttribute('aria-selected', sel);
      const ti = el === stop ? '0' : '-1';
      if (el.getAttribute('tabindex') !== ti) el.setAttribute('tabindex', ti);
    }
    syncing = false;
  };
  new MutationObserver(sync).observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  container.addEventListener('focusin', sync);
  container.addEventListener('keydown', (e) => {
    const all = items();
    const i = all.indexOf(document.activeElement as HTMLElement);
    if (i < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    const to = gridMove(e.key, i, all.length, columnsOf(all));
    if (to < 0) return;
    e.preventDefault();
    if (to === i) return;
    all[to].focus();
    all[to].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: e.shiftKey }));
    // the click may have redrawn the grid
    const now = items()[to];
    if (now && document.activeElement !== now) now.focus();
    now?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    sync();
  });
  sync();
  return container;
}
