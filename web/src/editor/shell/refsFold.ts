// On a phone the "Used by" and "Uses" lines fold into one button ("Used by 1 · Uses 2 ▸") so the
// editor below starts higher up (editorHead.css). A wide screen shows the lines as they are.
import { h } from '../core/ui';

/** Adds the phone's disclosure button to the .file-refs row and returns it. */
export function foldRefs(refs: HTMLElement): HTMLElement {
  const by = refs.querySelector<HTMLElement>('.used-by:not(.uses)');
  const uses = refs.querySelector<HTMLElement>('.uses');
  const parts: string[] = [];
  if (by) parts.push(`Used by ${by.dataset.count}`);
  if (uses) parts.push(`Uses ${uses.dataset.count}`);
  const btn = h('button', { type: 'button', class: 'refs-toggle', 'aria-expanded': 'false' });
  const label = parts.join(' · ');
  const show = (open: boolean) => {
    refs.classList.toggle('refs-open', open);
    btn.textContent = `${label} ${open ? '▾' : '▸'}`;
    btn.setAttribute('aria-expanded', String(open));
    btn.title = open ? 'Hide where this file is used' : 'Show where this file is used';
  };
  btn.addEventListener('click', () => show(!refs.classList.contains('refs-open')));
  show(false);
  refs.prepend(btn);
  return refs;
}
