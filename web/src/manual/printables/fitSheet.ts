// Keeps what's printed on its paper: when a sheet's contents would run off its foot, its
// pictures are made smaller (or its parts chosen) until everything fits. Measured once, off screen, as the hint book
// and the catalog measure their pages; a sheet that fits is left exactly as it was.
import { h } from '../../editor/core/ui';
import type { Sheet } from './kit';

/** Runs `use` with `s` laid out off screen; `over()` tells whether its contents run off it. */
export function measured<T>(s: Sheet, use: (over: () => boolean) => T): T {
  const host = h('div', { class: 'gmb-measure' });
  document.body.append(host);
  try {
    s.el.style.width = '850px';
    host.replaceChildren(s.el);
    const inner = s.el.firstElementChild as HTMLElement;
    return use(() => inner.scrollHeight > inner.clientHeight + 1);
  } finally {
    host.remove();
    s.el.style.width = '';
  }
}

/**
 * Calls `size(f)` with the largest f in [min, 1] that keeps everything on `s` (f = 1: the
 * pictures' full size). Does nothing when the sheet fits as it is.
 */
export function fitSheet(s: Sheet, size: (f: number) => void, min = 0.2): void {
  measured(s, (over) => {
    if (!over()) return;
    let lo = min;
    let hi = 1;
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2;
      size(mid);
      if (over()) hi = mid;
      else lo = mid;
    }
    size(lo);
  });
}

/** A size for fitSheet: `part`, whose pictures scale with its width, narrowed and centered. */
export const narrower = (part: HTMLElement) => (f: number) => {
  part.style.width = `${(f * 100).toFixed(1)}%`;
  part.style.marginInline = 'auto';
};
