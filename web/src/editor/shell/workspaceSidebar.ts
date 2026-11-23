// Sidebar rendering, persistent folds, filename filtering and file-list focus.
import { h, clear } from '../core/ui';
import { type Project, kindOf, KIND_LABELS, type FileKind } from '../core/project';
import { sceneFileLabels, refreshSceneFileLabels } from './sceneFileLabels';
import { companionOrigin, originText } from '../../dosPlayer/playerOrigin';
import { rovingFocus } from '../widgets/rovingFocus';
import { KIND_ICON } from '../widgets/thumbs';
import { downloadButton } from './download';
import { ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { FILE_ORDER as ORDER, ADD_KINDS as SECTIONS } from './fileKinds';
import { keepScroll } from './keepScroll';
import type { OverviewTab } from './overviewLink';
import type { FirstStepsPanel } from './firstStepsPanel';

interface SidebarHost {
  current(): string | undefined;
  assetView(): { kind?: FileKind; tab: OverviewTab } | undefined;
  firstSteps(): FirstStepsPanel | undefined;
  saved(): { el: HTMLElement } | undefined;
  playButton(): HTMLElement;
  newFile(): Promise<void>;
  addFiles(): Promise<void>;
  chooseDownload(): Promise<void>;
  openAssets(kind?: FileKind): void;
  addOfKind(kind: FileKind): Promise<void>;
  open(file: string): void;
  remove(file: string): Promise<void>;
}

/** Sections with more files than this can be folded away; in a game this big, every section can. */
const FOLD_AT = 8;
/** A game with this many files opens with every section folded (but the open file's). */
const FOLD_ALL_AT = 20;
/** Each game's folds, by project id then kind. */
const FOLD_KEY = 'gm-file-folds-by-game';

function folds(project: string): Record<string, boolean> {
  try {
    return (JSON.parse(localStorage.getItem(FOLD_KEY) ?? '{}') as Record<string, Record<string, boolean>>)[project] ?? {};
  } catch {
    return {};
  }
}

/** Folded unless chosen otherwise: a big game's sections start folded, and a very long list does. */
function isFolded(project: string, kind: FileKind, count: number, total: number): boolean {
  return folds(project)[kind] ?? (total >= FOLD_ALL_AT || count > 24);
}

function setFolded(project: string, kind: FileKind, folded: boolean): void {
  try {
    const all = JSON.parse(localStorage.getItem(FOLD_KEY) ?? '{}') as Record<string, Record<string, boolean>>;
    localStorage.setItem(FOLD_KEY, JSON.stringify({ ...all, [project]: { ...all[project], [kind]: folded } }));
  } catch {
    /* private mode: the fold just isn't remembered */
  }
}

/** Each kind's hue, for the colored extension that tells files apart at a glance (editor.css .ext). */
const KIND_HUE: Partial<Record<FileKind, number>> = {
  gam: 0,
  pal: 320,
  bbl: 25,
  mbl: 280,
  cbl: 200,
  mon: 350,
  chr: 240,
  map: 140,
  snd: 45,
  gif: 180,
  fli: 260,
  bkd: 100,
  txt: 215,
  lst: 300,
  cmf: 160,
  voc: 10,
  rec: 60,
  his: 35,
};

/** A file's name with its extension colored by kind. */
function fileLabel(name: string, k: FileKind): (string | HTMLElement)[] {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || KIND_HUE[k] === undefined) return [name];
  return [name.slice(0, dot), h('span', { class: 'ext', style: `--ext-h:${KIND_HUE[k]}` }, name.slice(dot))];
}

/** Search: every word must appear in the name ("lev map" finds level1.map). */
function matchesFile(name: string, query: string): boolean {
  const n = name.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => n.includes(w));
}

const RAIL_KEY = 'gm-files-folded';

function storedFolded(): boolean {
  try {
    return localStorage.getItem(RAIL_KEY) === '1';
  } catch {
    return false;
  }
}

export class WorkspaceSidebar {
  readonly el = h('nav', { class: 'sidebar', 'aria-label': 'Game files' });
  private get sidebar(): HTMLElement {
    return this.el;
  }
  private listed = new Set<string>();
  private playEl?: HTMLElement;
  constructor(
    private project: Project,
    private host: SidebarHost,
  ) {}

  restoreFold(root: HTMLElement): void {
    if (storedFolded()) root.querySelector('.workspace')?.classList.add('rail-folded');
  }

  changed(name: string): void {
    if (/\.(gam|map|bbl|lst)$/i.test(name)) refreshSceneFileLabels(this.project, this.sidebar);
    if (this.listed.has(name) !== this.project.files.has(name)) this.render();
    // links changed (the map's markers, the integrator): Play Level's menu follows
    else if (name === this.project.gam) this.playEl?.replaceWith((this.playEl = this.host.playButton()));
  }

  bind(): () => void {
    // Phones: the dropped-down file list closes on Escape or a tap outside it.
    const close = () => {
      if (!this.el.classList.contains('open')) return;
      this.el.classList.remove('open');
      this.el.querySelector('.files-toggle')?.setAttribute('aria-expanded', 'false');
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.el.classList.contains('open')) {
        close();
        this.el.querySelector<HTMLElement>('.files-toggle')?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!this.el.contains(e.target as Node)) close();
    };
    this.el.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }

  /** An empty game's "Describe a game…": the Assistant chat, ready to build one. */
  private describeButton(): HTMLElement | null {
    if (this.project.readOnly || this.project.game().scenes.some((s) => s.gametype === ADVTYPE)) return null;
    return h(
      'button',
      {
        class: 'describe-btn',
        title: 'Say what the game should be, and your own AI builds a first level',
        onclick: () => void import('../../assistant/chat/panel').then((m) => m.openChat('describe')),
      },
      h('span', { 'aria-hidden': 'true' }, '✦ '),
      'Describe a game…',
    );
  }

  render(): void {
    // the list keeps its place (the phone's drop-down list is the other scroller)
    keepScroll(this.sidebar, '.side-files', () => this.drawSidebar());
  }

  private drawSidebar(): void {
    const p = this.project;
    const names = p.files.names();
    const current = this.host.current();
    const filesLabel = `Files (${names.length})`;
    this.listed = new Set(names);
    const groups = new Map<FileKind, string[]>();
    for (const n of names) {
      const k = kindOf(n);
      groups.set(k, [...(groups.get(k) ?? []), n]);
    }
    // Every kind of file a game can use is listed, even with nothing in it yet.
    const sections = ORDER.filter((k) => k === 'gam' || SECTIONS.includes(k) || groups.has(k));
    const open = this.sidebar.classList.contains('open');
    clear(
      this.sidebar,
      h(
        'div',
        { class: 'side-top' },
        this.railToggle(),
        this.railHome(),
        h(
          'button',
          {
            class: 'files-toggle',
            'aria-label': current ? `${filesLabel} · ${current}` : filesLabel,
            'aria-expanded': String(open),
            'aria-controls': 'side-files',
            onclick: () => {
              const now = this.sidebar.classList.toggle('open');
              this.sidebar.querySelector('.files-toggle')?.setAttribute('aria-expanded', String(now));
            },
          },
          h('span', { 'aria-hidden': 'true' }, '☰ '),
          h('span', { class: 'files-toggle-prefix' }, current ? `${filesLabel} ·` : filesLabel),
          current ? h('span', { class: 'files-toggle-current' }, h('bdi', null, current)) : null,
        ),
        (this.playEl = this.host.playButton()),
        this.host.firstSteps()?.button(),
        this.describeButton(),
      ),
      h(
        'div',
        { class: 'side-files', id: 'side-files' },
        this.project.readOnly
          ? null
          : h(
              'div',
              { class: 'toolbar side-actions' },
              h('button', { onclick: () => void this.host.newFile() }, '+ Add a file…'),
              h('button', { onclick: () => void this.host.addFiles(), title: 'Bring in several files from your computer at once' }, '⬆ Import…'),
            ),
        h(
          'div',
          { class: 'toolbar side-actions' },
          downloadButton(this.project.name, () => this.host.chooseDownload()),
        ),
        this.host.saved()?.el,
        h(
          'button',
          {
            type: 'button',
            class: 'asset-home',
            onclick: () => this.host.openAssets(),
            'aria-current': this.host.assetView() && !this.host.assetView()!.kind ? 'page' : undefined,
          },
          '▦ Overview',
        ),
        this.search,
        ...sections.map((k) => this.section(k, groups.get(k) ?? [])),
        this.playerEntry(),
      ),
    );
    this.filter();
    this.roveFiles();
  }

  /** The file buttons are one Tab stop: arrows, Home/End and typed letters move between them; Delete removes the focused file. */
  private roveFiles(): void {
    const box = this.sidebar.querySelector<HTMLElement>('.side-files');
    if (!box) return;
    rovingFocus(box, '.file-row .file', { list: true, label: (el) => el.closest<HTMLElement>('.file-row')?.dataset.name ?? '' });
    // the focused row's Delete button joins the Tab order (it is visible then), the others stay out
    box.addEventListener('focusin', () => {
      for (const b of box.querySelectorAll<HTMLElement>('.file-row .icon-btn.danger'))
        b.tabIndex = b.closest('.file-row')?.contains(document.activeElement) ? 0 : -1;
    });
    box.addEventListener('keydown', (e) => {
      const t = e.target as HTMLElement;
      if (e.key !== 'Delete' || !t.matches('.file-row .file')) return;
      e.preventDefault();
      t.closest('.file-row')?.querySelector<HTMLElement>('.icon-btn.danger')?.click();
    });
  }

  /** Wide screens: the button that folds the file list into a thin bar and back (remembered per browser). */
  private railToggle(): HTMLElement {
    const folded = this.railFolded();
    const b = h(
      'button',
      {
        type: 'button',
        class: 'rail-toggle',
        'aria-expanded': String(!folded),
        'aria-controls': 'side-files',
        'aria-label': folded ? 'Show files' : 'Hide files',
        title: folded ? 'Show files' : 'Hide files',
        onclick: () => {
          const now = !this.railFolded();
          this.sidebar.parentElement?.classList.toggle('rail-folded', now);
          try {
            localStorage.setItem(RAIL_KEY, now ? '1' : '0');
          } catch {
            /* storage may be blocked: the bar still works for this visit */
          }
          const label = now ? 'Show files' : 'Hide files';
          b.setAttribute('aria-expanded', String(!now));
          b.setAttribute('aria-label', label);
          b.title = label;
          b.firstElementChild!.textContent = now ? '»' : '«';
        },
      },
      h('span', { 'aria-hidden': 'true' }, folded ? '»' : '«'),
      h('span', { class: 'rail-label' }, ' Hide files'),
    );
    return b;
  }

  /** A game imported with its own player .EXE: a Player entry under the files, showing what it was (playerInfo.ts). */
  private playerEntry(): HTMLElement | null {
    const o = companionOrigin(this.project.companion, this.project.gam);
    if (!o) return null;
    return h(
      'button',
      {
        type: 'button',
        class: 'asset-home side-player',
        title: `${o.exe}: ${originText(o)}`,
        onclick: () => void import('./playerInfo').then((m) => m.showPlayerInfo(this.project)),
      },
      '▣ Player',
    );
  }

  /** In the folded bar, a button to the game's Overview (the same as ▦ Overview in the list). */
  private railHome(): HTMLElement {
    return h(
      'button',
      { type: 'button', class: 'rail-home', 'aria-label': 'Overview', title: 'Overview', onclick: () => this.host.openAssets() },
      h('span', { 'aria-hidden': 'true' }, '▦'),
    );
  }

  private railFolded(): boolean {
    return this.sidebar.parentElement?.classList.contains('rail-folded') ?? storedFolded();
  }

  /** The file search box (kept across sidebar redraws so typing is never interrupted). */
  private search: HTMLElement = (() => {
    const input = h('input', {
      type: 'search',
      placeholder: 'Find a file…',
      'aria-label': 'Find a file',
      oninput: () => this.filter(),
      onkeydown: (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          input.value = '';
          this.filter();
        } else if (e.key === 'Enter') {
          const first = this.sidebar.querySelector<HTMLElement>('.file-row:not([hidden]) button.file');
          first?.click();
        }
      },
    });
    return h('div', { class: 'file-search' }, input, h('span', { class: 'file-search-count', 'aria-live': 'polite' }));
  })();

  private get query(): string {
    return (this.search.querySelector('input') as HTMLInputElement).value.trim().toLowerCase();
  }

  /** One kind of file: a heading (with a fold toggle once there are many) and its files. */
  private section(k: FileKind, files: string[]): HTMLElement {
    const p = this.project;
    const total = p.files.names().length;
    const foldable = k !== 'gam' && (files.length > FOLD_AT || (total >= FOLD_ALL_AT && files.length > 0));
    // the open file's section is never folded away from it
    const folded = foldable && !(this.host.current() && files.includes(this.host.current()!)) && isFolded(p.id, k, files.length, total);
    const sec = h('section', {
      class: `file-section${foldable ? ' foldable' : ''}${folded ? ' folded' : ''}${files.length ? '' : ' none'}`,
      'data-kind': k,
    });
    const toggle = () => {
      const now = !sec.classList.contains('folded');
      sec.classList.toggle('folded', now);
      setFolded(p.id, k, now);
      head.setAttribute('aria-expanded', String(!now));
    };
    const head = foldable
      ? h(
          'button',
          { class: 'fold', 'aria-expanded': String(!folded), title: 'Show or hide these files', onclick: toggle },
          h('span', { class: 'chev', 'aria-hidden': 'true' }, '▸'),
          h('span', { class: 'kind-emoji', 'aria-hidden': 'true' }, KIND_ICON[k]),
          h('span', null, KIND_LABELS[k]),
          h('span', { class: 'count' }, String(files.length)),
        )
      : h(
          'span',
          null,
          h('span', { class: 'kind-emoji', 'aria-hidden': 'true' }, KIND_ICON[k]),
          KIND_LABELS[k],
          files.length ? null : h('span', { class: 'none-yet' }, ' · none yet'),
        );
    const parts: (HTMLElement | null)[] = [
      h(
        'h2',
        { class: 'file-kind' },
        head,
        k === 'gam' || this.project.readOnly
          ? null
          : h(
              'button',
              {
                class: 'add',
                title: `Add ${KIND_LABELS[k].toLowerCase()}`,
                'aria-label': `Add ${KIND_LABELS[k].toLowerCase()}`,
                onclick: () => void this.host.addOfKind(k),
              },
              '+',
            ),
      ),
      ...files.map((n) =>
        h(
          'div',
          { class: `file-row ${n === this.host.current() ? 'active' : ''}`, 'data-name': n },
          h('button', { class: 'file', onclick: () => this.host.open(n), title: `Edit ${n}` }, ...fileLabel(n, k), sceneFileLabels(p, n)),
          // a pointer shortcut to the same action as the file button beside it: out of the Tab order and the reading order
          h('button', { class: 'icon-btn', title: `Edit ${n}`, tabindex: '-1', 'aria-hidden': 'true', onclick: () => this.host.open(n) }, '✎'),
          n === p.gam || this.project.readOnly
            ? null
            : h(
                'button',
                { class: 'icon-btn danger', title: `Delete ${n}`, tabindex: '-1', 'aria-label': `Delete ${n}`, onclick: () => void this.host.remove(n) },
                '🗑',
              ),
        ),
      ),
    ];
    sec.append(...parts.filter((x): x is HTMLElement => !!x));
    return sec;
  }

  /** Applies the search box: matching files only, sections with no match hidden. */
  private filter(): void {
    const q = this.query;
    this.sidebar.classList.toggle('searching', !!q);
    let shown = 0;
    let total = 0;
    for (const sec of this.sidebar.querySelectorAll<HTMLElement>('.file-section')) {
      let any = false;
      for (const row of sec.querySelectorAll<HTMLElement>('.file-row')) {
        const hit = !q || matchesFile(row.dataset.name ?? '', q);
        row.hidden = !hit;
        total++;
        if (hit) {
          shown++;
          any = true;
        }
      }
      sec.hidden = !!q && !any && !matchesFile(KIND_LABELS[sec.dataset.kind as FileKind] ?? '', q);
    }
    const count = this.search.querySelector('.file-search-count')!;
    count.textContent = q ? `${shown} of ${total}` : '';
  }
}
