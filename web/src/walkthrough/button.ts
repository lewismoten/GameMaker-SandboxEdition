// "Walkthrough" for a Sandbox game whose catalog entry names a walkthrough. The player
// (and the engine it runs) loads only when the button is pressed; the button says so meanwhile.
import { h } from '../editor/core/ui';
import { icon } from '../editor/shell/homeIcons';
import type { CatalogEntry, GameFiles } from '../project/files';

export function walkthroughButton(entry: CatalogEntry | undefined, files: () => Promise<GameFiles>): HTMLElement | null {
  if (!entry?.walkthrough || !entry.gam) return null;
  const label = h('span', null, 'Walkthrough');
  const idle = () => {
    b.removeAttribute('aria-busy');
    label.textContent = 'Walkthrough';
  };
  const b = h(
    'button',
    {
      type: 'button',
      class: 'with-ico',
      title: 'Watch the whole game played from start to finish, or save it as an MP4',
      'aria-label': `Watch the ${entry.title} walkthrough`,
      onclick: async () => {
        if (b.getAttribute('aria-busy') === 'true') return;
        b.setAttribute('aria-busy', 'true');
        label.textContent = 'Loading…';
        try {
          await (await import('./player')).watchWalkthrough(entry, files, idle);
        } finally {
          idle();
        }
      },
    },
    icon('route'),
    label,
  );
  return b;
}
