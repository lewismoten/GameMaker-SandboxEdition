// Where games come into My games and Imported: the import tile (drop files on it, or click to
// pick them or a folder), and files dropped anywhere in the library, which light the tile up.
import { h, pickFiles } from '../core/ui';
import { icon } from './homeIcons';
import type { HomeNav } from './home';

/** New game and importing (homeImport.ts), loaded when first used. */
export const homeImport = () => import('./homeImport');

/** Picks a game's files (or a folder of them, or of games or zips) and opens them; `onAdded` hears of several imported at once. */
function pickAndImport(nav: HomeNav, directory?: boolean, onAdded?: () => void): void {
  void pickFiles({ multiple: true, directory }).then(async (list) => {
    if (list.length) await (await homeImport()).importPicked(nav, list, onAdded);
  });
}

/** The import tile, one more tile among your games. */
export function importTile(nav: HomeNav, refresh: () => void): HTMLElement {
  return h(
    'div',
    { class: 'card dropzone lib-drop-tile' },
    h(
      'button',
      { type: 'button', class: 'lib-drop-pick', 'aria-describedby': 'lib-drop-hint', onclick: () => pickAndImport(nav, false, refresh) },
      h('span', { class: 'lib-drop-art', 'aria-hidden': 'true' }, icon('inbox')),
      h('span', { class: 'tile-title' }, 'Drop files or click to import'),
    ),
    h('span', { class: 'vh', id: 'lib-drop-hint' }, 'A game’s files, a .zip or a one-page .html export'),
    h(
      'p',
      { class: 'lib-drop-hint' },
      h('button', { type: 'button', class: 'lib-drop-folder', onclick: () => pickAndImport(nav, true, refresh) }, 'or open a game folder…'),
    ),
  );
}

/** On My games and Imported (`open()`), files dropped anywhere in the library come in (the tile lights up). */
export function libraryDrops(library: HTMLElement, dropTile: HTMLElement, open: () => boolean, nav: HomeNav, refresh: () => void): void {
  const takesDrop = (e: DragEvent) => open() && !!e.dataTransfer?.types.includes('Files');
  library.addEventListener('dragover', (e) => {
    if (!takesDrop(e)) return;
    e.preventDefault();
    dropTile.classList.add('over');
  });
  library.addEventListener('dragleave', (e) => {
    if (!library.contains(e.relatedTarget as Node | null)) dropTile.classList.remove('over');
  });
  library.addEventListener('drop', (e) => {
    if (!takesDrop(e)) return;
    e.preventDefault();
    dropTile.classList.remove('over');
    // the drop's entries and files can only be read now, while the event lasts
    const dt = e.dataTransfer!;
    const entries = [...dt.items].map((i) => i.webkitGetAsEntry?.()).filter((x): x is FileSystemEntry => !!x);
    const files = [...dt.files];
    void homeImport().then((m) => m.importDropped(nav, entries, files, refresh));
  });
}
