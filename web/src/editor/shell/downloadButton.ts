// The Download button alone, so a page that shows one (the home page's panel, a game of yours'
// card) loads the chooser (download.ts) and its exports only when it is pressed.
import { h } from '../core/ui';
import { icon } from './homeIcons';

/** The Download button: `open` opens the chooser (download.ts chooseDownload) for the game. */
export function downloadButton(title: string, open: () => unknown): HTMLElement {
  return h(
    'button',
    {
      type: 'button',
      class: 'with-ico',
      'aria-haspopup': 'dialog',
      'aria-label': `Download ${title}`,
      title: 'Download it to play on Windows, a Mac, Linux, the web or DOS',
      onclick: () => void open(),
    },
    icon('inbox'),
    'Download',
  );
}
