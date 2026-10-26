// The opening fields' little screen: a ▶ beside each intro plays it there (the editor's FLI
// preview, widgets/preview.ts, round and round until stopped), and the still picture is shown
// on it. Each file is fetched from the site only when its button is pressed.
import { h, toast } from '../../core/ui';
import { paintIndexed } from '../../core/draw';
import { previewButton, stopPreview } from '../../widgets/preview';
import { fetchIntro, introOf, type OpeningStyle } from './openingIntros';

interface OpeningPreview {
  /** The screen, with a caption. */
  el: HTMLElement;
  /** The button that previews this intro, or null when there is nothing to show. */
  button(style: OpeningStyle): HTMLButtonElement | null;
}

export function openingPreview(): OpeningPreview {
  const screen = h('canvas', { class: 'opening-screen', width: 320, height: 200, role: 'img', 'aria-label': 'Preview of the opening' });
  const ctx = screen.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 320, 200);
  }
  const el = h('figure', { class: 'opening-preview' }, screen, h('figcaption', { class: 'hint' }, 'Press ▶ beside an opening to watch it here.'));
  // on a narrow screen it sits below the list: bring it into view
  const show = () => screen.scrollIntoView({ block: 'nearest' });
  return {
    el,
    button(style) {
      const { file, label } = introOf(style);
      if (!file) return null;
      const name = `Preview ${label}`;
      if (/\.fli$/i.test(file)) {
        const btn = previewButton(
          file,
          () => fetchIntro(style),
          () => screen,
        );
        btn?.classList.add('opening-play');
        btn?.addEventListener('click', show);
        btn?.setAttribute('aria-label', name);
        btn?.setAttribute('title', name);
        return btn;
      }
      // a still picture: shown, nothing to stop
      return h(
        'button',
        {
          type: 'button',
          class: 'opening-play',
          'aria-label': name,
          title: name,
          onclick: async () => {
            stopPreview();
            show();
            const [bytes, { decodeGif }] = await Promise.all([fetchIntro(style), import('../../../formats/gif')]);
            if (!bytes) return toast(`${file.toUpperCase()} could not be loaded.`, 'error');
            const g = decodeGif(bytes);
            paintIndexed(screen, g.pixels, g.width, g.height, g.palette);
          },
        },
        '▶',
      );
    },
  };
}
