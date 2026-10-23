// On a phone an editor's opening hint folds to one line with a More button (workspace.css), so
// the editor itself starts higher up. Unfolding or folding it is remembered for every editor.
import { h } from '../core/ui';

const KEY = 'gm-hint-open';

function isOpen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function remember(open: boolean): void {
  try {
    if (open) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: just for now */
  }
}

/** Makes an editor's hint foldable (only a phone's layout folds it). */
export function foldHint(hint: HTMLElement | null): void {
  if (!hint || hint.querySelector('.hint-toggle')) return;
  const btn = h('button', { type: 'button', class: 'hint-toggle' }) as HTMLButtonElement;
  const show = (open: boolean) => {
    hint.classList.toggle('folded', !open);
    btn.textContent = open ? 'Less' : 'More';
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Fold the tip to one line' : 'Show the whole tip');
    fits();
  };
  // a tip that fits on its line anyway needs no More (measured folded, all on one line)
  const fits = () => {
    if (!hint.classList.contains('folded')) return;
    const r = document.createRange();
    r.selectNodeContents(hint);
    r.setStartAfter(btn);
    hint.classList.toggle('hint-short', r.getBoundingClientRect().width <= hint.clientWidth);
  };
  new ResizeObserver(fits).observe(hint);
  btn.addEventListener('click', () => {
    const open = hint.classList.contains('folded');
    remember(open);
    show(open);
  });
  hint.classList.add('hint-fold');
  hint.prepend(btn);
  show(isOpen());
}
