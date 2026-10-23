// The project workspace: file list on the left, the selected file's editor on the right.
import { currentRoute, formatHash, setHashParams } from '../../urlState';
import { h, clear, download, pickFiles, toast, promptText, confirmDialog, modal } from '../core/ui';
import { Project, kindOf, KIND_LABELS, validDosName, type FileKind } from '../core/project';
import { pickFile } from '../widgets/filePicker';
import { MAKERS } from '../tools/makers';
import { KIND_ICON } from '../widgets/thumbs';
import { keyboardIcon, showShortcuts, wantsShortcuts } from '../widgets/shortcuts';
import { editors, fileInfo } from '../editors/registry';
import { GameFiles, loadFileList, normalize } from '../../project/files';
import { createZip } from '../../project/zip';
import { exportWebApp } from '../../export/exportWebApp';
import { exportSinglePage } from '../../export/exportSinglePage';
import { macDownload } from './macDownload';
import { winDownload } from './winDownload';
import { linuxDownload } from './linuxDownload';
import { mountPlayer, type PlayerHandle } from '../../player/player';
import { parseGame, serializeGame, type Game } from '../../formats/game';
import { levelForMap, startingAt } from '../editors/integrator/startAt';
import './workspace.css';
import { SHORT } from '../../edition';
import { plainError } from '../core/plainError';

const ORDER: FileKind[] = [
  'gam',
  'pal',
  'bbl',
  'mbl',
  'cbl',
  'mon',
  'chr',
  'map',
  'snd',
  'gif',
  'fli',
  'bkd',
  'txt',
  'lst',
  'cmf',
  'voc',
  'rec',
  'his',
  'other',
];
/** The kinds always listed and offered in "Add a file" (4 x 4). */
const SECTIONS: FileKind[] = ['pal', 'bbl', 'mbl', 'cbl', 'mon', 'chr', 'map', 'snd', 'gif', 'fli', 'cmf', 'voc', 'txt', 'lst', 'bkd', 'rec'];
const KIND_HELP: Partial<Record<FileKind, string>> = {
  pal: '256 colors to paint with',
  bbl: 'the scenery, 150 blocks',
  mbl: 'monster pictures, 100 blocks',
  cbl: 'hero pictures, 50 blocks',
  mon: '64 monsters and how they move',
  chr: 'the hero: moves, keys, items',
  map: 'a 100x100 level',
  snd: '30 sound effects',
  gif: 'a 320x200 picture',
  fli: 'an animation',
  cmf: 'Sound Blaster music',
  voc: 'a Sound Blaster sound',
  txt: 'words on screen',
  lst: 'pictures one after another',
  bkd: 'part of a big picture',
  rec: 'a recorded demo',
};

/** Sections with more files than this can be folded away. */
const FOLD_AT = 8;
const FOLD_KEY = 'gm-file-folds';

function folds(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(FOLD_KEY) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

/** Folded unless chosen otherwise; very long lists start folded. */
function isFolded(kind: FileKind, count: number): boolean {
  return folds()[kind] ?? count > 24;
}

function setFolded(kind: FileKind, folded: boolean): void {
  try {
    localStorage.setItem(FOLD_KEY, JSON.stringify({ ...folds(), [kind]: folded }));
  } catch {
    /* private mode: the fold just isn't remembered */
  }
}

/** Search: every word must appear in the name ("lev map" finds level1.map). */
export function matchesFile(name: string, query: string): boolean {
  const n = name.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => n.includes(w));
}

export class Workspace {
  readonly project: Project;
  private sidebar = h('nav', { class: 'sidebar', 'aria-label': 'Game files' });
  private main = h('main', { class: 'editor', 'aria-label': 'Editor' });
  private current?: string;
  private cleanup?: () => void;
  private player?: PlayerHandle;
  private unlisten: () => void;

  constructor(root: HTMLElement, project: Project, file?: string) {
    this.project = project;
    clear(root, h('div', { class: 'workspace' }, this.sidebar, this.main));
    this.unlisten = project.onChange((name) => {
      if (this.listed.has(name) !== project.files.has(name)) this.renderSidebar();
    });
    this.renderSidebar();
    // a reload while play testing (…?play) starts the play test again
    const playing = currentRoute().params.play;
    this.open(file && project.files.has(file) ? file : project.gam);
    if (playing !== undefined) this.play(playing === 'title');
    // Phones: the dropped-down file list closes on Escape or a tap outside it.
    const close = () => {
      if (!this.sidebar.classList.contains('open')) return;
      this.sidebar.classList.remove('open');
      this.sidebar.querySelector('.files-toggle')?.setAttribute('aria-expanded', 'false');
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.sidebar.classList.contains('open')) {
        close();
        this.sidebar.querySelector<HTMLElement>('.files-toggle')?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!this.sidebar.contains(e.target as Node)) close();
    };
    this.sidebar.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    // ? lists the open editor's keyboard shortcuts (not while typing or play testing)
    const onHelpKey = (e: KeyboardEvent) => {
      if (this.player || !wantsShortcuts(e)) return;
      e.preventDefault();
      void showShortcuts(this.current ? kindOf(this.current) : undefined);
    };
    document.addEventListener('keydown', onHelpKey);
    this.unbind = () => (document.removeEventListener('pointerdown', onDown), document.removeEventListener('keydown', onHelpKey));
  }

  private unbind?: () => void;

  private listed = new Set<string>();

  get currentFile(): string | undefined {
    return this.current;
  }

  dispose(): void {
    this.cleanup?.();
    this.player?.stop();
    this.unlisten();
    this.unbind?.();
  }

  private renderSidebar(): void {
    const p = this.project;
    const names = p.files.names();
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
        h(
          'button',
          {
            class: 'files-toggle',
            'aria-expanded': String(open),
            'aria-controls': 'side-files',
            onclick: () => {
              const now = this.sidebar.classList.toggle('open');
              this.sidebar.querySelector('.files-toggle')?.setAttribute('aria-expanded', String(now));
            },
          },
          h('span', { 'aria-hidden': 'true' }, '☰ '),
          `Files (${names.length})`,
          this.current ? h('span', { class: 'files-toggle-current' }, ` · ${this.current}`) : null,
        ),
        this.playButton(),
      ),
      h(
        'div',
        { class: 'side-files', id: 'side-files' },
        h(
          'div',
          { class: 'toolbar side-actions' },
          h('button', { onclick: () => void this.newFile() }, '+ Add a file…'),
          h('button', { onclick: () => void this.addFiles(), title: 'Bring in several files from your computer at once' }, '⬆ Import…'),
        ),
        h(
          'details',
          { class: 'export-menu' },
          h('summary', null, 'Save & share'),
          h(
            'div',
            { class: 'stack' },
            h('button', { onclick: () => void this.downloadZip() }, 'Download .zip'),
            h('button', { onclick: () => void this.exportApp() }, 'Export web app'),
            h(
              'button',
              { onclick: () => void this.exportPage(), title: 'One .html file with the game and player inside: double-click to play, even offline' },
              'Export as one web page',
            ),
            h('button', { onclick: () => void this.exportForDos() }, 'Export for DOS'),
            h('button', { onclick: () => void this.exportForMac(), title: 'A Mac app of the game (.dmg or .zip), built here' }, 'Download for Mac'),
            h('button', { onclick: () => void this.exportForWindows(), title: 'A Windows program of the game (.exe or .zip), built here' }, 'Download for Windows'),
            h('button', { onclick: () => void this.exportForLinux(), title: 'The game for Linux (a .tar.gz folder with a small player), built here' }, 'Download for Linux'),
          ),
        ),
        this.search,
        ...sections.map((k) => this.section(k, groups.get(k) ?? [])),
      ),
    );
    this.filter();
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
    }) as HTMLInputElement;
    return h('div', { class: 'file-search' }, input, h('span', { class: 'file-search-count', 'aria-live': 'polite' }));
  })();

  private get query(): string {
    return (this.search.querySelector('input') as HTMLInputElement).value.trim().toLowerCase();
  }

  /** One kind of file: a heading (with a fold toggle once there are many) and its files. */
  private section(k: FileKind, files: string[]): HTMLElement {
    const p = this.project;
    const foldable = files.length > FOLD_AT;
    const folded = foldable && isFolded(k, files.length);
    const sec = h('section', {
      class: `file-section${foldable ? ' foldable' : ''}${folded ? ' folded' : ''}${files.length ? '' : ' none'}`,
      'data-kind': k,
    });
    const toggle = () => {
      const now = !sec.classList.contains('folded');
      sec.classList.toggle('folded', now);
      setFolded(k, now);
      head.setAttribute('aria-expanded', String(!now));
    };
    const head = foldable
      ? h(
          'button',
          { class: 'fold', 'aria-expanded': String(!folded), title: 'Show or hide these files', onclick: toggle },
          h('span', { class: 'chev', 'aria-hidden': 'true' }, '▸'),
          h('span', null, KIND_LABELS[k]),
          h('span', { class: 'count' }, String(files.length)),
        )
      : h('span', null, KIND_LABELS[k], files.length ? null : h('span', { class: 'none-yet' }, ' · none yet'));
    const parts: (HTMLElement | null)[] = [
      h(
        'h2',
        { class: 'file-kind' },
        head,
        k === 'gam'
          ? null
          : h(
              'button',
              {
                class: 'add',
                title: `Add ${KIND_LABELS[k].toLowerCase()}`,
                'aria-label': `Add ${KIND_LABELS[k].toLowerCase()}`,
                onclick: () => void this.addOfKind(k),
              },
              '+',
            ),
      ),
      ...files.map((n) =>
        h(
          'div',
          { class: `file-row ${n === this.current ? 'active' : ''}`, 'data-name': n },
          h('button', { class: 'file', onclick: () => this.open(n), title: `Edit ${n}` }, n),
          h('button', { class: 'icon-btn', title: `Edit ${n}`, 'aria-label': `Edit ${n}`, onclick: () => this.open(n) }, '✎'),
          n === p.gam
            ? null
            : h('button', { class: 'icon-btn danger', title: `Delete ${n}`, 'aria-label': `Delete ${n}`, onclick: () => void this.remove(n) }, '🗑'),
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

  /** Adds a file of one kind: new, from the library, or from your computer. */
  private async addOfKind(kind: FileKind): Promise<void> {
    const name = await pickFile(this.project, kind, { adding: true, title: `Add ${KIND_LABELS[kind].toLowerCase()}`, actions: this.makers(kind) });
    if (name) this.open(name);
  }

  /** Extra ways to make files of a kind (converters, recorders); filled in by tools. */
  private makers(kind: FileKind): { label: string; run: () => Promise<string | undefined> }[] {
    return (MAKERS[kind] ?? []).map((m) => ({ label: m.label, run: () => m.run(this.project) }));
  }

  open(file: string): void {
    this.cleanup?.();
    this.cleanup = undefined;
    this.player?.stop();
    this.player = undefined;
    this.current = file;
    this.sidebar.classList.remove('open');
    // a new file starts at its top (phones scroll the window, wide screens the editor)
    window.scrollTo(0, 0);
    this.main.scrollTop = 0;
    // the address names the file: a new history entry when moving to it, and the settings after
    // the ? (the editor's tab, selection…) kept when the address already names it (a reload, Back)
    const at = currentRoute();
    if (at.path[0] !== 'p' || at.path[1] !== this.project.id || at.path[2] !== file) {
      const next = `${location.pathname}${location.search}${formatHash(['p', this.project.id, file])}`;
      if (at.path[0] === 'p' && at.path[1] === this.project.id && at.path[2]) history.pushState(null, '', next);
      else history.replaceState(null, '', next);
    }
    setHashParams({ play: undefined });
    // the tab names the open file first (phones show little of a tab's title)
    document.title = `${file} · ${this.project.name} · ${SHORT}`;
    this.renderSidebar();
    const body = h('div');
    const isGam = file === this.project.gam;
    clear(
      this.main,
      h(
        'div',
        { class: 'row', style: 'justify-content:space-between;align-items:center;margin-bottom:8px' },
        h('h1', { class: 'file-title' }, file),
        h(
          'div',
          { class: 'toolbar' },
          h(
            'button',
            { class: 'keys-btn', title: 'Keyboard shortcuts (?)', 'aria-label': 'Keyboard shortcuts', 'aria-keyshortcuts': 'Shift+?', onclick: () => void showShortcuts(kindOf(file)) },
            keyboardIcon(),
          ),
          !isGam && h('button', { onclick: () => void this.rename(file) }, 'Rename'),
          h('button', { onclick: () => void this.duplicate(file) }, 'Duplicate'),
          h('button', { onclick: () => download(file.toUpperCase(), this.project.files.get(file)!) }, 'Download'),
          !isGam && h('button', { class: 'danger', onclick: () => void this.remove(file) }, 'Delete'),
        ),
      ),
      isGam ? this.nextSteps() : null,
      body,
    );
    const editor = editors[kindOf(file)] ?? fileInfo;
    try {
      this.cleanup = editor(body, this.project, file) || undefined;
    } catch (e) {
      console.error(e);
      clear(body, h('p', { class: 'hint' }, `This file could not be opened: ${(e as Error).message}`));
    }
  }

  /** On the game's own page: one-click ways into the files that make the game its own (can be hidden). */
  private nextSteps(): HTMLElement | null {
    const key = `gm-next-hidden-${this.project.id}`;
    try {
      if (localStorage.getItem(key)) return null;
    } catch {
      /* private mode: always shown */
    }
    const steps: [FileKind, string, string, string][] = [
      ['map', '🗺', 'Change the level', 'Add a map'],
      ['bbl', '🧱', 'Paint the scenery', 'Add scenery blocks'],
      ['chr', '🦸', 'The hero', 'Add a hero'],
      ['mon', '👾', 'Monsters', 'Add monsters'],
      ['snd', '🔊', 'Sounds', 'Add sounds'],
    ];
    const strip = h(
      'nav',
      { class: 'next-steps', 'aria-label': 'Make it yours' },
      h('strong', null, 'Make it yours:'),
      ...steps.map(([kind, icon, label, addLabel]) => {
        const first = this.project.files.byExtension(kind)[0];
        return first
          ? h('button', { title: `Edit ${first}`, onclick: () => this.open(first) }, h('span', { 'aria-hidden': 'true' }, `${icon} `), label)
          : h(
              'button',
              { title: `This game has no ${KIND_LABELS[kind].toLowerCase()} yet`, onclick: () => void this.addOfKind(kind) },
              h('span', { 'aria-hidden': 'true' }, '＋ '),
              addLabel,
            );
      }),
      h(
        'button',
        {
          title: 'Download it, or export it to play on the web or in DOS',
          onclick: () => {
            const menu = this.sidebar.querySelector<HTMLDetailsElement>('.export-menu');
            if (!menu) return;
            this.sidebar.classList.add('open');
            menu.open = true;
            menu.querySelector('button')?.focus();
          },
        },
        h('span', { 'aria-hidden': 'true' }, '💾 '),
        'Save & share',
      ),
      h(
        'button',
        {
          class: 'next-steps-hide',
          title: 'Hide these shortcuts for this game',
          'aria-label': 'Hide these shortcuts',
          onclick: () => {
            try {
              localStorage.setItem(key, '1');
            } catch {
              /* private mode */
            }
            strip.remove();
          },
        },
        '×',
      ),
    );
    return strip;
  }

  /** The level whose map is open (play testing starts there), if any. */
  private levelHere(file = this.current): { game: Game; scene: number } | undefined {
    if (!file || kindOf(file) !== 'map') return undefined;
    try {
      const game = parseGame(this.project.files.get(this.project.gam)!);
      const scene = levelForMap(game, file);
      return scene >= 0 ? { game, scene } : undefined;
    } catch {
      return undefined;
    }
  }

  private playButton(): HTMLButtonElement {
    const level = this.levelHere();
    const name = level ? level.game.scenes[level.scene].desc || `level ${level.scene}` : '';
    return level
      ? h('button', { class: 'primary side-play', onclick: () => this.play(), title: `Play test from ${name}, the level that uses this map` }, '▶ Play this level')
      : h('button', { class: 'primary side-play', onclick: () => this.play(), title: 'Play the game from its title screen' }, '▶ Play test');
  }

  /** Play tests the game: from the level being edited when a level's map is open, else from the title screen. Stop goes back to that file. */
  private play(fromTitle = false, back = this.current): void {
    const level = fromTitle ? undefined : this.levelHere(back);
    setHashParams({ play: fromTitle ? 'title' : true });
    this.cleanup?.();
    this.cleanup = undefined;
    this.player?.stop();
    this.player = undefined;
    this.current = undefined;
    this.renderSidebar();
    const host = h('div', { class: 'player-host' });
    const levelName = level ? level.game.scenes[level.scene].desc || `level ${level.scene}` : '';
    clear(
      this.main,
      h(
        'div',
        { class: 'row', style: 'justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px' },
        h('h1', { class: 'file-title' }, level ? `Playing ${levelName}` : `Playing ${this.project.name}`),
        h(
          'div',
          { class: 'toolbar' },
          level && h('button', { onclick: () => this.play(true, back), title: 'Play the whole game from its title screen' }, 'From the title screen'),
          h('button', { onclick: () => this.open(back && this.project.files.has(back) ? back : this.project.gam), title: back ? `Stop and go back to ${back}` : 'Stop' }, 'Stop'),
        ),
      ),
      host,
      h(
        'p',
        { class: 'hint' },
        level ? `Starts at ${levelName}, the level that uses ${back}. ` : '',
        'Play testing uses a copy of the files: high scores and saved games are not added to your project.',
      ),
    );
    const copy = new GameFiles(this.project.files.entries());
    if (level) copy.set(this.project.gam, serializeGame(startingAt(level.game, level.scene)));
    this.player = mountPlayer(host, copy, this.project.gam, { title: this.project.name });
  }

  /** The "Add a file" dialog: a grid of every kind of file, with a picture of each. */
  private async newFile(): Promise<void> {
    const kind = await modal<FileKind>('Add a file', (close) =>
      h(
        'div',
        { class: 'kind-grid' },
        ...SECTIONS.map((k) =>
          h(
            'button',
            { class: 'kind-card', onclick: () => close(k) },
            h('span', { class: 'kind-icon' }, KIND_ICON[k]),
            h('strong', null, KIND_LABELS[k]),
            h('small', null, KIND_HELP[k] ?? `.${k.toUpperCase()}`),
          ),
        ),
      ),
    );
    if (kind) await this.addOfKind(kind);
  }

  private async askName(title: string, value: string, ext: string): Promise<string | undefined> {
    for (;;) {
      const raw = await promptText(title, 'DOS file name (up to 8 letters, then the extension)', value);
      if (!raw) return undefined;
      const name = normalize(raw.includes('.') ? raw : `${raw}.${ext}`);
      if (!validDosName(name)) {
        toast('Use up to 8 letters/digits, a dot, and a 1-3 letter extension.', 'error');
        value = raw;
        continue;
      }
      if (this.project.files.has(name)) {
        toast(`${name} already exists.`, 'error');
        value = raw;
        continue;
      }
      return name;
    }
  }

  private async addFiles(): Promise<void> {
    const list = await pickFiles({ multiple: true });
    const files = await loadFileList(list);
    for (const [n, b] of files.entries()) this.project.files.set(n, b);
    if (files.size) toast(`Added ${files.size} file(s).`);
    this.renderSidebar();
  }

  private async rename(file: string): Promise<void> {
    const ext = file.split('.').pop()!;
    const name = await this.askName(`Rename ${file}`, file, ext);
    if (!name) return;
    const p = this.project;
    p.files.set(name, p.files.get(file)!);
    p.files.delete(file);
    // Point the scenes that used the old name at the new one.
    const game = p.game();
    let changed = false;
    for (const s of game.scenes)
      s.files.forEach((f, i) => {
        if (normalize(f) === file) {
          s.files[i] = name;
          changed = true;
        }
      });
    if (changed) p.saveGame(game);
    this.open(name);
  }

  private async duplicate(file: string): Promise<void> {
    const ext = file.split('.').pop()!;
    const name = await this.askName(`Duplicate ${file}`, this.project.freeName(file.replace(/\.[^.]+$/, ''), ext), ext);
    if (!name) return;
    this.project.files.set(name, this.project.files.get(file)!.slice());
    this.open(name);
  }

  private async remove(file: string): Promise<void> {
    const uses = this.project.usesOf(file);
    const note = uses.length ? ` It is used by ${uses.length} scene slot(s).` : '';
    if (!(await confirmDialog('Delete file', `Delete ${file}?${note}`, 'Delete'))) return;
    this.project.files.delete(file);
    this.open(this.project.gam);
  }

  private async downloadZip(): Promise<void> {
    const zip = await createZip(this.project.files.entries().map(([name, data]) => ({ name: name.toUpperCase(), data })));
    download(`${this.project.gam.replace(/\.gam$/, '')}.zip`, zip, 'application/zip');
  }

  private async exportForDos(): Promise<void> {
    try {
      const title = this.project.game().scenes[0]?.desc || this.project.name;
      const { name, zip, exe } = await (await import('../../export/exportDos')).exportDos(this.project.files, { title, gam: this.project.gam });
      download(name, zip, 'application/zip');
      toast(`Saved ${name}. In DOSBox, run ${exe} from the unzipped folder.`);
    } catch (e) {
      toast(plainError(e), 'error');
    }
  }

  private exportForMac(): Promise<void> {
    const title = this.project.game().scenes[0]?.desc || this.project.name;
    return macDownload(title, async () => ({ title, gam: this.project.gam, files: this.project.files }));
  }

  private exportForWindows(): Promise<void> {
    const title = this.project.game().scenes[0]?.desc || this.project.name;
    return winDownload(title, async () => ({ title, gam: this.project.gam, files: this.project.files }));
  }

  private exportForLinux(): Promise<void> {
    const title = this.project.game().scenes[0]?.desc || this.project.name;
    return linuxDownload(title, async () => ({ title, gam: this.project.gam, files: this.project.files }));
  }

  private async exportPage(): Promise<void> {
    try {
      toast('Building web page…');
      const title = this.project.game().scenes[0]?.desc || this.project.name;
      const { name, html } = await exportSinglePage(this.project.files, { title, gam: this.project.gam });
      download(name, html, 'text/html');
      toast(`Saved ${name}. Open it in any browser to play — no internet needed.`);
    } catch (e) {
      toast(plainError(e), 'error');
    }
  }

  private async exportApp(): Promise<void> {
    try {
      toast('Building web app…');
      const title = this.project.game().scenes[0]?.desc || this.project.name;
      const { name, zip } = await exportWebApp(this.project.files, { title, gam: this.project.gam });
      download(name, zip, 'application/zip');
      toast(`Saved ${name}. Unzip it onto any static web host to publish it.`);
    } catch (e) {
      toast(plainError(e), 'error');
    }
  }
}
