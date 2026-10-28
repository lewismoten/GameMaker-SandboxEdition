// The readers' "⤓ ePub" button: it makes the book shown (its builder loads only when pressed),
// packs it (pack.ts) and saves the .epub, saying on itself while it works and if it fails.
// A reader that shows several pieces in turn points it at the one shown (`use`).
import { download, h } from '../../editor/core/ui';
import type { EpubBook } from './book';

/** A piece that can be had as an ePub: its file name and how to make it. */
export interface EpubSource {
  /** e.g. 'snowbound-manual.epub'. */
  file: string;
  make(): Promise<EpubBook>;
}

const HOW = 'Download it as an ePub, to read offline in any e-book reader';

export interface EpubControl {
  el: HTMLButtonElement;
  /** The piece the button saves; undefined hides it. */
  use(source: EpubSource | undefined): void;
}

/** `wide` (a class) keeps the word "ePub" to wide windows, like the bar's other labels. */
export function epubControl(o: { wide?: string; cls?: string } = {}): EpubControl {
  let source: EpubSource | undefined;
  const word = h('span', { class: o.wide, 'aria-hidden': 'true' }, ' ePub');
  const el = h(
    'button',
    { type: 'button', class: o.cls, title: HOW, 'aria-label': 'Download ePub', onclick: () => void save() },
    h('span', { 'aria-hidden': 'true' }, '⤓'),
    word,
  );
  const show = (text: string | undefined, busy = false) => {
    word.textContent = ` ${text ?? 'ePub'}`;
    el.setAttribute('aria-label', text ?? 'Download ePub');
    el.setAttribute('aria-busy', String(busy));
    el.disabled = busy;
  };
  const save = async () => {
    const at = source;
    if (!at || el.disabled) return;
    show('Making ePub…', true);
    try {
      const book = await at.make();
      const { packEpub } = await import('./pack');
      download(at.file, await packEpub(book), 'application/epub+zip');
      show(undefined);
    } catch (e) {
      console.error(e);
      show('ePub failed: try again');
      setTimeout(() => source === at && !el.disabled && show(undefined), 6000);
    }
  };
  return {
    el,
    use: (s) => {
      source = s;
      el.hidden = !s;
      if (!el.disabled) show(undefined);
    },
  };
}
