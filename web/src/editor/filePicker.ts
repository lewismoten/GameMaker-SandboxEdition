// Choosing a file visually instead of from a drop-down: a dialog of thumbnails of this
// game's files of one kind, a tab with the CD library's, and buttons to make a new one or
// add one from your computer. Library files are copied into the game when chosen.
import { h, clear, modal, pickFiles, toast } from './ui';
import { KIND_LABELS, type FileKind, type Project } from './project';
import { fileThumb, KIND_ICON } from './thumbs';
import { libraryFile, libraryItems, libraryThumbSource, type LibraryItem } from './library';
import { templateFor } from './templates';
import { normalize } from '../project/files';

export interface PickOptions {
  title?: string;
  current?: string;
  /** Offer "None" (an empty slot). */
  allowNone?: boolean;
  /** Extra kinds that also fit (graphic slots take gif/fli/bkd/txt/lst). */
  kinds?: FileKind[];
}

/** Resolves with the chosen file name, '' for none, or undefined if cancelled. */
export function pickFile(project: Project, kind: FileKind, opts: PickOptions = {}): Promise<string | undefined> {
  const kinds = opts.kinds ?? [kind];
  return modal<string>(opts.title ?? `Choose ${KIND_LABELS[kind].toLowerCase()}`, (close) => {
    const grid = h('div', { class: 'pick-grid' });
    const tabs = h('div', { class: 'pick-tabs', role: 'tablist' });
    let tab: 'mine' | 'library' = 'mine';

    const card = (label: string, thumb: HTMLElement, meta: string, onPick: () => void, selected = false) =>
      h('button', { class: `pick-card ${selected ? 'selected' : ''}`, onclick: onPick, title: label }, thumb, h('strong', null, label), h('small', null, meta));

    const showMine = () => {
      const names = kinds.flatMap((k) => project.files.byExtension(k));
      clear(
        grid,
        opts.allowNone ? card('None', h('span', { class: 'thumb icon' }, '∅'), 'leave the slot empty', () => close(''), opts.current === '') : null,
        ...names.map((n) =>
          card(
            n.toUpperCase(),
            fileThumb(n, project.files.get(n), { files: project.files, palette: project.paletteFor(n).palette }),
            `${(project.files.get(n)?.length ?? 0).toLocaleString()} bytes · used ${project.usesOf(n).length}×`,
            () => close(n),
            normalize(opts.current ?? '') === n,
          ),
        ),
        names.length ? null : h('p', { class: 'hint' }, `This game has no ${KIND_LABELS[kind].toLowerCase()} yet. Make a new one, add one from your computer, or take one from the library.`),
      );
    };

    const showLibrary = async () => {
      clear(grid, h('p', { class: 'hint' }, 'Loading the library…'));
      const items = (await Promise.all(kinds.map((k) => libraryItems(k)))).flat();
      clear(grid);
      if (!items.length) grid.append(h('p', { class: 'hint' }, 'Nothing of this kind in the library.'));
      // Draw each thumbnail when it scrolls into view: library games load on demand.
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          const item = (e.target as HTMLElement & { item?: LibraryItem }).item!;
          void Promise.all([libraryFile(item), libraryThumbSource(item)])
            .then(([bytes, src]) => e.target.querySelector('.thumb')?.replaceWith(fileThumb(item.name, bytes, src)))
            .catch(() => undefined);
        }
      });
      for (const item of items) {
        const el = card(item.name.toUpperCase(), h('span', { class: 'thumb icon' }, KIND_ICON[kind]), `${item.game.title} · ${item.size.toLocaleString()} bytes`, () => void take(item)) as HTMLElement & { item?: LibraryItem };
        el.item = item;
        grid.append(el);
        io.observe(el);
      }
    };

    /** Copies a library file into the game (renaming it if the name is taken). */
    const take = async (item: LibraryItem) => {
      const bytes = await libraryFile(item);
      const existing = project.files.get(item.name);
      let name = item.name;
      if (existing && (existing.length !== bytes.length || existing.some((b, i) => b !== bytes[i]))) name = project.freeName(item.name.replace(/\..*$/, ''), item.name.split('.').pop()!);
      if (!existing || name !== item.name) project.files.set(name, bytes.slice());
      toast(`Copied ${name.toUpperCase()} from ${item.game.title}.`);
      close(name);
    };

    const makeNew = () => {
      const t = templateFor(kind);
      if (!t) return;
      const name = project.freeName(project.gam.replace(/\.gam$/, ''), kind);
      project.files.set(name, t.make(project));
      close(name);
    };

    const upload = async () => {
      const list = await pickFiles({ multiple: false, accept: kinds.map((k) => `.${k}`).join(',') });
      const f = list[0];
      if (!f) return;
      const name = normalize(f.name);
      project.files.set(name, new Uint8Array(await f.arrayBuffer()));
      close(name);
    };

    const setTab = (t: typeof tab) => {
      tab = t;
      [...tabs.children].forEach((b, i) => b.setAttribute('aria-selected', String((i === 0) === (t === 'mine'))));
      if (t === 'mine') showMine();
      else void showLibrary();
    };
    tabs.append(
      h('button', { role: 'tab', onclick: () => setTab('mine') }, 'This game'),
      h('button', { role: 'tab', onclick: () => setTab('library') }, '📀 Library (CD samples)'),
    );
    setTab('mine');
    return h(
      'div',
      { class: 'file-picker' },
      h(
        'div',
        { class: 'pick-bar' },
        tabs,
        h('span', { class: 'spacer' }),
        templateFor(kind) ? h('button', { class: 'primary', onclick: makeNew }, `+ New ${KIND_LABELS[kind].toLowerCase().replace(/s$/, '')}`) : null,
        h('button', { onclick: () => void upload() }, '⬆ From my computer…'),
      ),
      grid,
    );
  });
}
