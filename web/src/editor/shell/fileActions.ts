// The open file's actions beside its name (Rename, Duplicate, Download file, Delete): buttons on
// a wide screen, one ⋯ menu on a phone (workspace.css shows one or the other), so the editor
// below starts higher up.
import { h } from '../core/ui';

interface FileAction {
  label: string;
  run(): void;
  title?: string;
  danger?: boolean;
}

export function fileActions(acts: FileAction[]): HTMLElement {
  const cls = (a: FileAction) => (a.danger ? 'danger' : '');
  const wide = h(
    'span',
    { class: 'file-acts' },
    ...acts.map((a) => h('button', { type: 'button', class: cls(a), title: a.title, onclick: () => a.run() }, a.label)),
  );
  const summary = h('summary', { title: 'More actions', 'aria-label': `File actions: ${acts.map((a) => a.label.toLowerCase()).join(', ')}` }, '⋯');
  const more = h('details', { class: 'file-more' });
  const shut = () => {
    more.open = false;
    summary.focus();
  };
  const menu = h(
    'div',
    { class: 'file-more-menu' },
    ...acts.map((a) =>
      h(
        'button',
        {
          type: 'button',
          class: cls(a),
          title: a.title,
          onclick: () => {
            more.open = false;
            a.run();
          },
        },
        a.label,
      ),
    ),
  );
  more.append(summary, menu);
  // Esc or a tap anywhere else closes it; opening it puts the keyboard on its first item
  more.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && more.open) {
      e.stopPropagation();
      shut();
    }
  });
  const outside = (e: PointerEvent) => {
    if (!more.contains(e.target as Node)) more.open = false;
  };
  more.addEventListener('toggle', () => {
    if (more.open) {
      document.addEventListener('pointerdown', outside);
      menu.querySelector<HTMLElement>('button')?.focus();
    } else document.removeEventListener('pointerdown', outside);
  });
  return h('span', { class: 'file-actions' }, wide, more);
}
