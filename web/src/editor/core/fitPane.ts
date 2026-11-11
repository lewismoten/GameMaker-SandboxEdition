// Keeps an editor's columns inside one window: tells each element how much room is left
// between where it starts and the editor pane's bottom edge (CSS `--room`), so a long column
// scrolls by itself and the pane, like the page, needn't scroll. Measured, not guessed, so a
// wrapping toolbar or a longer tip above it is allowed for. Each editor's CSS decides where
// `--room` applies (usually wide screens only; a phone's editor scrolls as one column).

/** Keeps `--room` (px) on each element up to date while it is on the page. */
export function fitToPane(...els: HTMLElement[]): void {
  if (!els[0]) return;
  // The observer lives as long as the pane it watches, and nothing tells it when the editor is closed, so its
  // callback must not hold the editor: weak references let a closed editor (thousands of nodes) be collected.
  const refs = els.map((el) => new WeakRef(el));
  let main: HTMLElement | null = null;
  const fit = () => {
    const first = refs[0].deref();
    if (!first?.isConnected) {
      watch.disconnect();
      return;
    }
    main ??= first.closest('main');
    if (!main) return;
    const box = main.getBoundingClientRect();
    const bottom = main.clientHeight - (parseFloat(getComputedStyle(main).paddingBottom) || 0) - 4;
    for (const ref of refs) {
      const el = ref.deref();
      if (!el) continue;
      const room = `${Math.round(bottom - (el.getBoundingClientRect().top - box.top + main.scrollTop))}px`;
      if (el.style.getPropertyValue('--room') !== room) el.style.setProperty('--room', room);
    }
  };
  const watch = new ResizeObserver(() => requestAnimationFrame(fit));
  // once the element is in the page: its pane (the window), and the editor in it (any change above)
  requestAnimationFrame(() => {
    fit();
    if (!main) return;
    watch.observe(main);
    for (const c of main.children) watch.observe(c);
  });
}
