// Choosing a file visually instead of from a drop-down: a dialog of thumbnails of this
// game's files of one kind, a tab with the CD library's, and buttons to make a new one or
// add one from your computer. Library files are copied into the game when chosen.
import './filePicker.css';
import { h, clear, modal, pickFiles, toast } from './core/ui';
import { KIND_LABELS, Project, kindOf, type FileKind } from './core/project';
import { fileThumb, KIND_ICON } from './thumbs';
import { libraryFile, libraryGame, libraryItems, libraryThumbSource, type LibraryItem } from './library';
import { templateFor } from './templates';
import { GameFiles, normalize } from '../project/files';
import { previewButton, stopPreview } from './preview';
import { parseBackdrop } from '../formats/graphicScripts';
import { decodeVoc, isVoc } from '../formats/voc';
import { classifySound, SOUND_GROUPS, type SoundGroup } from '../audio/soundProfile';

export interface PickOptions {
  title?: string;
  current?: string;
  /** Offer "None" (an empty slot). */
  allowNone?: boolean;
  /** What "None" means here, e.g. "Scene palette". */
  noneLabel?: [string, string];
  /** Extra kinds that also fit (graphic slots take gif/fli/bkd/txt/lst). */
  kinds?: FileKind[];
  /** Adding a file: start on the library and leave out this game's own files. */
  adding?: boolean;
  /** More ways to make a file (convert an image, record a sound...); each resolves with the new file's name. */
  actions?: { label: string; run: () => Promise<string | undefined> }[];
}

/** Kinds whose library files can be fetched alone: their thumbnails need no neighbours. */
const ALONE = new Set<FileKind>(['voc', 'cmf', 'snd', 'fli', 'gif', 'pal']);
const fetched = new Map<string, Promise<Uint8Array>>();

/** One library file, fetched by itself (cheaper than its whole game). */
function libraryFileAlone(item: LibraryItem): Promise<Uint8Array> {
  const key = `${item.game.id}/${item.name}`;
  let p = fetched.get(key);
  if (!p) {
    p = fetch(`./${item.game.path}${item.name}`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.statusText))))
      .then((b) => new Uint8Array(b))
      .catch(() => libraryFile(item));
    fetched.set(key, p);
  }
  return p;
}

/** The sound group of a .VOC (remembered: library sounds are measured once). */
const groups = new Map<string, SoundGroup | undefined>();
function vocGroup(key: string, bytes: Uint8Array | undefined): SoundGroup | undefined {
  if (!groups.has(key) || key.startsWith('mine:')) {
    let g: SoundGroup | undefined;
    try {
      if (bytes && isVoc(bytes)) {
        const v = decodeVoc(bytes);
        g = v.samples.length ? classifySound(v.samples, v.sampleRate) : undefined;
      }
    } catch {
      g = undefined;
    }
    groups.set(key, g);
  }
  return groups.get(key);
}

/** Resolves with the chosen file name, '' for none, or undefined if cancelled. */
export function pickFile(project: Project, kind: FileKind, opts: PickOptions = {}): Promise<string | undefined> {
  const kinds = opts.kinds ?? [kind];
  const grouped = kinds.length === 1 && kind === 'voc';
  return modal<string>(opts.title ?? `Choose ${KIND_LABELS[kind].toLowerCase()}`, (close0) => {
    const close = (v: string | undefined) => {
      stopPreview();
      close0(v);
    };
    const grid = h('div', { class: 'pick-grid' });
    const filters = h('div', { class: 'pick-filters', role: 'group', 'aria-label': 'Sound groups' });
    const tabs = h('div', { class: 'pick-tabs', role: 'tablist' });
    let tab: 'mine' | 'library' = 'mine';
    let filter: SoundGroup | 'all' = 'all';
    let io: IntersectionObserver | undefined;
    let shown = 0; // which listing is current, so a slow library load doesn't land on another tab

    const card = (label: string, thumb: HTMLElement, meta: string, onPick: () => void, selected = false, preview?: HTMLElement | null) => {
      const cell = h(
        'div',
        { class: 'pick-cell' },
        h(
          'button',
          { class: `pick-card ${selected ? 'selected' : ''}`, onclick: onPick, title: label },
          thumb,
          h('strong', null, label),
          h('small', null, meta),
        ),
        preview ?? null,
      );
      return cell;
    };
    const thumbCanvas = (cell: HTMLElement) => () => cell.querySelector<HTMLCanvasElement>('canvas.thumb');

    /** Lays the cards out under a heading per sound group, with chips to show one group. */
    const layout = (cells: { el: HTMLElement; group?: SoundGroup; none?: boolean }[], empty: HTMLElement | null) => {
      if (!grouped) {
        clear(grid, ...cells.map((c) => c.el), cells.length ? null : empty);
        return;
      }
      const count = (g: SoundGroup) => cells.filter((c) => c.group === g).length;
      const chip = (id: SoundGroup | 'all', text: string, n: number, hint = '') =>
        h(
          'button',
          {
            type: 'button',
            class: 'pick-chip',
            'aria-pressed': String(filter === id),
            title: hint,
            onclick: () => {
              filter = id;
              layout(cells, empty);
            },
          },
          text,
          h('small', null, String(n)),
        );
      clear(
        filters,
        chip('all', 'All', cells.filter((c) => !c.none).length),
        ...SOUND_GROUPS.filter((g) => count(g.id)).map((g) => chip(g.id, `${g.icon} ${g.label}`, count(g.id), `Sounds like: ${g.hint}`)),
      );
      const none = cells.filter((c) => !c.group);
      const parts: (HTMLElement | null)[] = filter === 'all' ? none.map((c) => c.el) : [];
      for (const g of SOUND_GROUPS) {
        if (filter !== 'all' && filter !== g.id) continue;
        const list = cells.filter((c) => c.group === g.id);
        if (!list.length) continue;
        parts.push(h('h3', { class: 'pick-group' }, `${g.icon} ${g.label}`, h('small', null, ` · ${g.hint}`)), ...list.map((c) => c.el));
      }
      clear(grid, ...parts, cells.length ? null : empty);
    };

    const showMine = () => {
      shown++;
      io?.disconnect();
      const names = kinds.flatMap((k) => project.files.byExtension(k));
      const none = opts.allowNone
        ? card(
            opts.noneLabel?.[0] ?? 'None',
            h('span', { class: 'thumb icon' }, '∅'),
            opts.noneLabel?.[1] ?? 'leave the slot empty',
            () => close(''),
            opts.current === '',
          )
        : null;
      const cells = names.map((n) => {
        const bytes = project.files.get(n);
        const el = card(
          n.toUpperCase(),
          fileThumb(n, bytes, { files: project.files, palette: project.paletteFor(n).palette }),
          `${(bytes?.length ?? 0).toLocaleString()} bytes · used ${project.usesOf(n).length}×`,
          () => close(n),
          normalize(opts.current ?? '') === n,
        );
        el.append(previewButton(n, async () => project.files.get(n), thumbCanvas(el)) ?? '');
        return { el, group: grouped ? vocGroup(`mine:${n}`, bytes) : undefined };
      });
      const empty = h(
        'p',
        { class: 'hint' },
        `This game has no ${KIND_LABELS[kind].toLowerCase()} yet. Make a new one, add one from your computer, or take one from the library.`,
      );
      layout(none ? [{ el: none, none: true }, ...cells] : cells, empty);
    };

    const showLibrary = async () => {
      const me = ++shown;
      io?.disconnect();
      clear(filters);
      clear(grid, h('p', { class: 'hint' }, 'Loading the library…'));
      const items = (await Promise.all(kinds.map((k) => libraryItems(k)))).flat();
      if (me !== shown) return;
      // Draw each thumbnail when it scrolls into view: library games load on demand.
      io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io!.unobserve(e.target);
          const item = (e.target as HTMLElement & { item?: LibraryItem }).item!;
          const k = kindOf(item.name);
          const src = ALONE.has(k) ? Promise.resolve({ files: new GameFiles() }) : libraryThumbSource(item);
          void Promise.all([ALONE.has(k) ? libraryFileAlone(item) : libraryFile(item), src])
            .then(([bytes, s]) => e.target.querySelector('.thumb')?.replaceWith(fileThumb(item.name, bytes, s)))
            .catch(() => undefined);
        }
      });
      const cells = items.map((item) => {
        const el = card(
          item.name.toUpperCase(),
          h('span', { class: 'thumb icon' }, KIND_ICON[kindOf(item.name)]),
          `${item.game.title} · ${item.size.toLocaleString()} bytes`,
          () => void take(item),
        ) as HTMLElement & {
          item?: LibraryItem;
        };
        el.item = item;
        el.append(previewButton(item.name, () => libraryFileAlone(item), thumbCanvas(el)) ?? '');
        return { el, item, group: undefined as SoundGroup | undefined };
      });
      const empty = h('p', { class: 'hint' }, 'Nothing of this kind in the library.');
      if (grouped && cells.length) {
        // listen to every sound once to sort them into groups
        const progress = h('p', { class: 'hint' }, `Listening to ${cells.length} sounds to sort them…`);
        clear(grid, progress);
        let done = 0;
        await Promise.all(
          cells.map(async (c) => {
            const key = `${c.item.game.id}/${c.item.name}`;
            const bytes = groups.has(key) ? undefined : await libraryFileAlone(c.item).catch(() => undefined);
            if (bytes) await new Promise((r) => setTimeout(r, 0)); // let the dialog breathe
            c.group = vocGroup(key, bytes);
            progress.textContent = `Listening to ${cells.length} sounds to sort them… ${++done}`;
          }),
        );
        if (me !== shown) return;
      }
      layout(cells, empty);
      for (const c of cells) io.observe(c.el);
    };

    /** Copies a library file into the game (renaming it if the name is taken). */
    const take = async (item: LibraryItem) => {
      const bytes = await libraryFile(item);
      const existing = project.files.get(item.name);
      let name = item.name;
      if (existing && (existing.length !== bytes.length || existing.some((b, i) => b !== bytes[i])))
        name = project.freeName(item.name.replace(/\..*$/, ''), item.name.split('.').pop()!);
      if (!existing || name !== item.name) project.files.set(name, bytes.slice());
      const itemKind = kindOf(item.name);
      // Pictures of blocks need their colors: a game with no palette gets the one they came with.
      const extras: string[] = [];
      if (['bbl', 'mbl', 'cbl', 'mon', 'chr', 'map'].includes(itemKind) && !project.files.byExtension('pal').length) {
        const files = await libraryGame(item.game);
        const src = Project.fromFiles(files, item.game.title, `lib-${item.game.id}`).paletteFor(item.name).source;
        if (files.has(src)) {
          project.files.set(src, files.get(src)!.slice());
          extras.push(`its palette ${src.toUpperCase()}`);
        }
      }
      // A backdrop is a window on a GIF picture: bring the picture along.
      if (itemKind === 'bkd') {
        try {
          const gif = normalize(parseBackdrop(bytes).gif);
          if (gif && !project.files.has(gif)) {
            const files = await libraryGame(item.game);
            const pic = files.get(gif);
            if (pic) {
              project.files.set(gif, pic.slice());
              extras.push(`its picture ${gif.toUpperCase()}`);
            }
          }
        } catch {
          /* a backdrop that can't be read just comes alone */
        }
      }
      toast(`Copied ${name.toUpperCase()}${extras.length ? ` and ${extras.join(' and ')}` : ''} from ${item.game.title}.`);
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
      stopPreview();
      [...tabs.children].forEach((b) => b.setAttribute('aria-selected', String(b.textContent === 'This game' ? t === 'mine' : t === 'library')));
      if (t === 'mine') showMine();
      else void showLibrary();
    };
    if (!opts.adding) tabs.append(h('button', { role: 'tab', onclick: () => setTab('mine') }, 'This game'));
    tabs.append(h('button', { role: 'tab', onclick: () => setTab('library') }, '📀 Library (CD samples)'));
    setTab(opts.adding ? 'library' : 'mine');
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
        ...(opts.actions ?? []).map((a) =>
          h(
            'button',
            {
              onclick: async () => {
                stopPreview();
                const name = await a.run();
                if (name) close(name);
              },
            },
            a.label,
          ),
        ),
      ),
      grouped ? filters : null,
      grid,
    );
  });
}

/**
 * A file slot shown as its thumbnail and name, with buttons to choose another (the
 * visual picker) and to edit it. Replaces drop-down lists of file names.
 */
export function fileField(
  project: Project,
  label: string,
  kinds: FileKind[],
  get: () => string,
  set: (name: string) => void,
  opts: { allowNone?: boolean; title?: string; noneLabel?: [string, string] } = {},
): HTMLElement {
  const body = h('div', { class: 'file-field-body' });
  const render = () => {
    const name = get();
    const exists = !!name && project.files.has(name);
    clear(
      body,
      h(
        'button',
        {
          class: 'file-field-choose',
          title: `Choose ${label.toLowerCase()}`,
          onclick: async () => {
            const picked = await pickFile(project, kinds[0], {
              kinds,
              current: name,
              allowNone: opts.allowNone ?? true,
              noneLabel: opts.noneLabel,
              title: label,
            });
            if (picked === undefined) return;
            set(picked);
            render();
          },
        },
        exists
          ? fileThumb(name, project.files.get(name), { files: project.files, palette: project.paletteFor(name).palette })
          : h('span', { class: 'thumb icon' }, name ? '⚠' : '＋'),
        h(
          'span',
          { class: 'file-field-name' },
          name ? name.toUpperCase() : (opts.noneLabel?.[0] ?? 'none'),
          name && !exists ? h('small', null, ' (missing)') : null,
        ),
      ),
      exists
        ? h('a', { class: 'file-field-edit', href: `#/p/${project.id}/${encodeURIComponent(name)}`, title: `Edit ${name}`, 'aria-label': `Edit ${name}` }, '✎')
        : null,
    );
  };
  render();
  return h('div', { class: 'field file-field', title: opts.title }, h('span', null, label), body);
}
