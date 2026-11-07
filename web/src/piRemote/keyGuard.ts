// Keeps the arrow keys and Space from scrolling the Pi remote page while the keyboard switch
// is off (a person pressing the physical arrows to aim at the on-screen ones). Only those keys,
// only when the page or its keyboard has focus (not a text field, button or link that needs
// them), and never with a modifier, so Tab and the browser's own shortcuts stay.

const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'PageUp', 'PageDown']);

/** The physical-key name an on-screen key shows (`data-code`) for a key that scrolls, or undefined. */
export function scrollKeyCode(e: Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'altKey' | 'metaKey'>): string | undefined {
  if (e.ctrlKey || e.altKey || e.metaKey) return undefined;
  return SCROLL_KEYS.has(e.code) ? e.code : undefined;
}

/** True when the focused control needs this key itself (a field, a link, the log, Space on a button). */
export function targetKeepsKey(target: EventTarget | null, code: string): boolean {
  const el = target as HTMLElement | null;
  if (!el || !('tagName' in el)) return false;
  if (el.closest?.('input, textarea, select, [contenteditable="true"], a[href], .pi-log')) return true;
  return code === 'Space' && !!el.closest?.('button, [role="switch"]');
}
