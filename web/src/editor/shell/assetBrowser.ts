// A project's asset overview and native file galleries, with lazy pictures and scoped listeners.
import './assetBrowser.css';
import { h, clear, toast } from '../core/ui';
import { KIND_LABELS, type FileKind, type Project } from '../core/project';
import { groupedKinds } from './assetGroups';
import { scenesUsing, usedByShort, usedByText } from './assetUsedBy';
import { assetNames } from './assetFiles';
import { assetCommands } from './assetCommands';
import { copiedAsset, onAssetCopy } from './assetClipboard';
import { assetMenu } from './assetMenu';
import { fileThumb, KIND_ICON } from '../widgets/thumbs';
import { PLAYABLE, playButton, stopThumbPlayback } from '../widgets/thumbPlayButton';
import { diskStatus, floppyFor, openOptimize } from '../disk/diskCard';
import { assetSearch } from './assetSearch';
import { SHORT_KIND_LABELS } from './assetShortNames';
import { companionPatches } from '../../dosPlayer/playerRecord';
import { companionOrigin, originText } from '../../dosPlayer/playerOrigin';
import { parsePalette, type Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

/** The palette a tile is drawn in: the one picked in the file's editor ("Show with palette", kept in the companion), else the scene's. */
function shownPalette(project: Project, file: string): Palette {
  const saved = project.extras<string>(file, 'showPalette', '');
  return saved && project.files.has(saved) ? parsePalette(project.files.get(saved)!) : project.paletteFor(file).palette;
}

interface BrowserHost {
  project: Project;
  kind?: FileKind;
  all: () => void;
  category: (kind: FileKind) => void;
  open: (file: string) => void;
  add: (kind: FileKind) => void;
  /** Search results that live in Overview's other tabs. */
  /** The Read-only bar of a game opened to look inside, shown inline in the heading. */
  bar?: HTMLElement | null;
  openControls?: () => void;
  openPlayerField?: (patch: string) => void;
}

/** The floppy that opens Optimize (the Tools card's picture and dialog), small enough to sit beside the heading. */
function optimizeEntry(project: Project): HTMLElement {
  const floppy = floppyFor(project, 40);
  return h(
    'button',
    { type: 'button', class: 'asset-optimize', title: diskStatus(project), onclick: () => openOptimize(project) },
    floppy ? h('span', { class: 'asset-optimize-pic', 'aria-hidden': 'true' }, floppy) : null,
    'Optimize…',
  );
}

export function assetBrowser(host: BrowserHost): { el: HTMLElement; dispose(): void } {
  const { project, kind } = host;
  const commands = assetCommands(project, host.open);
  const title = kind ? KIND_LABELS[kind] : 'Game assets';
  const count = h('p', { class: 'meta asset-count', role: 'status', 'aria-live': 'polite' });
  const grid = h('div', { class: 'asset-grid', role: 'region', tabindex: 0, 'aria-label': kind ? `${title} files` : 'Asset categories' });
  const searchSlot = h('div', { class: 'asset-search-slot' });
  const el = h(
    'section',
    { class: 'asset-browser', 'aria-label': title },
    h(
      'header',
      { class: 'asset-heading' },
      h(
        'div',
        { class: 'asset-titles' },
        h('div', { class: 'row' }, kind ? h('button', { type: 'button', onclick: host.all }, '← All assets') : null, h('h1', null, title)),
        h('p', { class: 'asset-project' }, project.name),
        count,
      ),
      host.bar ?? null,
      kind ? null : optimizeEntry(project),
    ),
    searchSlot,
    grid,
  );
  let frame = 0;
  let closeMenu: (() => void) | undefined;
  let pasteButton: HTMLButtonElement | undefined;
  const pictures = new WeakMap<Element, string>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const file = pictures.get(entry.target);
        if (!file || !entry.target.isConnected) continue;
        try {
          const patches = companionPatches(project.companion, project.gam);
          const show = (boardAt?: Map<number, { x: number; y: number }>) =>
            clear(entry.target, fileThumb(file, project.files.get(file), { files: project.files, palette: shownPalette(project, file), patches, boardAt }));
          show();
          // the game's own tile draws the Integrator board the author last had open (loaded when first needed)
          if (file === project.gam)
            void import('../editors/integrator/activeBoard').then((m) => {
              const at = m.activeBoardPositions(project, project.game());
              if (at && entry.target.isConnected) (show(at), fillPreview(entry.target as HTMLElement));
            });
          fillPreview(entry.target as HTMLElement);
        } catch {
          clear(entry.target, fileThumb(file, project.files.get(file), { files: project.files }));
        }
      }
    },
    { root: grid, rootMargin: '100px' },
  );
  /** Scales a small picture up by whole pixels to fill the preview box (larger ones stay shrunk to fit by CSS). */
  function fillPreview(box: HTMLElement): void {
    const c = box.querySelector('canvas');
    const [bw, bh] = [box.clientWidth, box.clientHeight];
    if (!c || !bw || !bh) return;
    const k = Math.floor(Math.min(bw / c.width, bh / c.height));
    if (k >= 2) {
      c.style.width = `${c.width * k}px`;
      c.style.height = `${c.height * k}px`;
      c.style.maxHeight = 'none';
    }
  }
  /** The file a category card shows: for palettes, the one the game's pictures use, never a solid-color one. */
  function representative(files: string[], k: FileKind): string | undefined {
    if (k !== 'pal') return files[0];
    const chosen = project.paletteFor('').source;
    return files.find((f) => f.toLowerCase() === chosen.toLowerCase()) ?? files[0];
  }
  function preview(file: string | undefined, k: FileKind): HTMLElement {
    const box = h('span', { class: 'asset-preview', 'aria-hidden': 'true' }, KIND_ICON[k]);
    if (file) {
      pictures.set(box, file);
      observer.observe(box);
    }
    return box;
  }
  function updatePaste(): void {
    if (!pasteButton || !kind) return;
    const asset = copiedAsset(kind);
    pasteButton.disabled = !!project.readOnly || !asset;
    pasteButton.textContent = asset ? `Paste ${asset.name.toUpperCase()}` : 'Paste copied file';
    pasteButton.title = asset ? 'Paste a new file from the clipboard' : 'Copy a file of this type first';
  }
  function addCard(k: FileKind): HTMLElement {
    pasteButton = h('button', { type: 'button', onclick: () => void commands.paste(k) });
    const card = h(
      'div',
      { class: 'asset-card asset-add', role: 'group', 'aria-label': `Add ${KIND_LABELS[k].toLowerCase()}`, 'data-add-kind': k },
      h('h2', null, 'Add a file'),
      h('small', null, project.readOnly ? 'Open an editable copy to add files.' : 'Drop matching files here'),
      h('button', { type: 'button', disabled: !!project.readOnly, onclick: () => host.add(k) }, 'Add a file…'),
      h(
        'button',
        { type: 'button', disabled: !!project.readOnly || !assetNames(project, k).length, onclick: () => void commands.copyHere(k) },
        'From this game…',
      ),
      pasteButton,
    );
    card.addEventListener('dragover', (e) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = project.readOnly ? 'none' : 'copy';
      card.classList.toggle('drop-ready', !project.readOnly);
    });
    card.addEventListener('dragleave', (e) => {
      if (!(e.relatedTarget instanceof Node) || !card.contains(e.relatedTarget)) card.classList.remove('drop-ready');
    });
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove('drop-ready');
      if (project.readOnly) return;
      void commands.importFiles(k, Array.from(e.dataTransfer?.files ?? []));
    });
    return card;
  }
  function fileCard(file: string, k: FileKind): HTMLElement {
    const box = preview(file, k);
    const open = h(
      'button',
      { type: 'button', class: 'asset-open', title: `Edit ${file.toUpperCase()}`, onclick: () => host.open(file) },
      box,
      h('strong', null, file.toUpperCase()),
      h('small', null, `${(project.files.get(file)?.byteLength ?? 0).toLocaleString()} bytes`),
    );
    const more = h(
      'button',
      { type: 'button', class: 'asset-more', 'aria-label': `Actions for ${file.toUpperCase()}`, 'aria-haspopup': 'menu', 'aria-expanded': 'false' },
      '⋯',
    );
    const card = h('article', { class: 'asset-card asset-file', 'data-file': file }, open, more, PLAYABLE.has(k) ? playButton(box, file, k, project) : null);
    const menu = (point?: { x: number; y: number }) => {
      closeMenu?.();
      closeMenu = assetMenu(more, commands.actions(file), point);
    };
    more.addEventListener('click', () => menu());
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      menu({ x: e.clientX, y: e.clientY });
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
        e.preventDefault();
        e.stopPropagation();
        menu();
      }
    });
    return card;
  }
  /** A game imported with its own player .EXE: what it was (read-only; playerInfo.ts). */
  function playerCard(): HTMLElement | null {
    const o = companionOrigin(project.companion, project.gam);
    if (!o) return null;
    return h(
      'button',
      {
        type: 'button',
        class: 'asset-card asset-category',
        'data-category': 'player',
        onclick: () => void import('./playerInfo').then((m) => m.showPlayerInfo(project)),
      },
      h('span', { class: 'asset-preview', 'aria-hidden': 'true' }, '▣'),
      h('strong', null, 'Player'),
      h('small', null, `${o.exe} · ${originText(o)}${o.stock ? '' : ', patched'}`),
    );
  }

  function render(): void {
    closeMenu?.();
    stopThumbPlayback();
    observer.disconnect();
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement.closest<HTMLElement>('[data-file]')?.dataset.file : undefined;
    pasteButton = undefined;
    grid.classList.toggle('asset-groups', !kind);
    if (!kind) {
      const all = project.files.names();
      count.textContent = `${all.length.toLocaleString()} files · ${sizeText(project, all)}`;
      clear(
        grid,
        ...groupedKinds().map((g) =>
          h(
            'section',
            {
              class: `asset-group-box${g.kinds.length <= 2 ? ' asset-group-small' : ''}`,
              'aria-labelledby': `asset-group-${g.id}`,
              style: `--n:${g.kinds.length}`,
            },
            h('h2', { class: 'asset-group', id: `asset-group-${g.id}` }, g.title),
            h(
              'div',
              { class: 'asset-group-cards' },
              ...g.kinds.map((k) => {
                const files = assetNames(project, k);
                const usedCount = scenesUsing(files, (f) => project.usesOf(f));
                const usedBy = usedByText(usedCount);
                return h(
                  'button',
                  { type: 'button', class: 'asset-card asset-category', 'data-category': k, onclick: () => host.category(k) },
                  preview(representative(files, k), k),
                  // on a phone the short name shows and the count line goes; screen readers still get both in full
                  h(
                    'strong',
                    null,
                    h('span', { class: 'name-full' }, KIND_LABELS[k]),
                    h('span', { class: 'name-short', 'aria-hidden': 'true' }, SHORT_KIND_LABELS[k]),
                  ),
                  h(
                    'small',
                    { class: 'asset-card-count' },
                    files.length ? `${files.length.toLocaleString()} ${files.length === 1 ? 'file' : 'files'} · ${sizeText(project, files)}` : 'None yet',
                  ),
                  usedBy
                    ? h(
                        'small',
                        { class: 'asset-card-used' },
                        h('span', { class: 'used-full' }, usedBy),
                        // on a phone the card is narrow: the short form shows, screen readers still get the full one
                        h('span', { class: 'used-short', 'aria-hidden': 'true' }, usedByShort(usedCount)),
                      )
                    : null,
                );
              }),
            ),
          ),
        ),
        playerCard(),
      );
    } else {
      const files = assetNames(project, kind);
      count.textContent = `${files.length.toLocaleString()} ${files.length === 1 ? 'file' : 'files'} · ${sizeText(project, files)}`;
      clear(grid, addCard(kind), ...files.map((file) => fileCard(file, kind)));
      updatePaste();
    }
    if (focused) {
      const next = Array.from(grid.querySelectorAll<HTMLElement>('[data-file]'))
        .find((c) => c.dataset.file === focused)
        ?.querySelector<HTMLElement>('.asset-more');
      (next ?? grid.querySelector<HTMLElement>('button:not(:disabled)'))?.focus({ preventScroll: true });
    }
  }
  let searching = false;
  const search = assetSearch({
    project,
    grid,
    preview,
    play: (box, file, kind) => (PLAYABLE.has(kind) ? playButton(box, file, kind, project) : null),
    open: (file) => host.open(file),
    openControls: () => host.openControls?.(),
    openPlayerField: (patch) => host.openPlayerField?.(patch),
    active: (on) => {
      if (on === searching) return;
      searching = on;
      count.hidden = on;
      if (on) {
        closeMenu?.();
        stopThumbPlayback();
        observer.disconnect();
        clear(grid);
      } else render();
    },
  });
  searchSlot.append(search.el);
  el.querySelector('.asset-heading')?.append(search.button);
  const off = project.onChange(() => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!el.isConnected) return;
      if (searching) search.refresh();
      else render();
    });
  });
  const offCopy = onAssetCopy(updatePaste);
  const onKey = (e: KeyboardEvent) => {
    if (!kind || project.readOnly || !(e.ctrlKey || e.metaKey) || e.altKey || e.key.toLowerCase() !== 'v' || document.querySelector('dialog[open]')) return;
    if (e.target instanceof HTMLElement && e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (!copiedAsset(kind)) return;
    e.preventDefault();
    void commands.paste(kind);
  };
  window.addEventListener('keydown', onKey);
  el.addEventListener('dragover', (e) => {
    if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
  });
  el.addEventListener('drop', (e) => {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    toast('Drop files on the Add a file card.');
  });
  render();
  return {
    el,
    dispose() {
      cancelAnimationFrame(frame);
      search.dispose();
      off();
      offCopy();
      observer.disconnect();
      stopThumbPlayback();
      closeMenu?.();
      window.removeEventListener('keydown', onKey);
    },
  };
}

/** The files' total size, as a DOS directory listing would round it: bytes, KB or MB (1 KB = 1,024 bytes). */
function sizeText(project: Project, names: readonly string[]): string {
  const bytes = names.reduce((n, name) => n + (project.files.get(name)?.byteLength ?? 0), 0);
  if (bytes < 1024) return `${bytes.toLocaleString()} bytes`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024).toLocaleString()} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
}
