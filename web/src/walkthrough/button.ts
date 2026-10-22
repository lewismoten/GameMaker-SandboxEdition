// "Watch walkthrough" for a Sandbox game whose catalog entry names a walkthrough. The player
// (and the engine it runs) loads only when the button is pressed.
import { h } from '../editor/core/ui';
import { icon } from '../editor/shell/homeIcons';
import type { CatalogEntry, GameFiles } from '../project/files';

export function walkthroughButton(entry: CatalogEntry | undefined, files: () => Promise<GameFiles>): HTMLElement | null {
  if (!entry?.walkthrough || !entry.gam) return null;
  return h(
    'button',
    {
      type: 'button',
      class: 'with-ico',
      title: 'Watch the whole game played from start to finish, or save it as an MP4',
      onclick: async () => (await import('./player')).watchWalkthrough(entry, files),
    },
    icon('film'),
    'Watch walkthrough',
  );
}
