// The "Saves & scores" button beside a game on the home page; the panel loads when pressed.
import { h } from '../editor/core/ui';
import { icon } from '../editor/shell/homeIcons';
import type { SavesTarget } from './panelState';

export function savesButton(target: SavesTarget | undefined): { el: HTMLElement; open(initial?: string): Promise<void> } | null {
  if (!target?.gam) return null;
  const open = async (initial?: string) => {
    el.setAttribute('aria-busy', 'true');
    try {
      const p = (await import('./savesPanel')).openSaves(target, initial);
      el.removeAttribute('aria-busy');
      await p;
    } finally {
      el.removeAttribute('aria-busy');
    }
  };
  const el = h(
    'button',
    {
      type: 'button',
      class: 'with-ico',
      title: 'See and change the saved games and the high scores, and back them up',
      'aria-label': `Saves & scores of ${target.title}`,
      onclick: () => void open(),
    },
    icon('disk'),
    'Saves & scores',
  );
  return { el, open };
}
