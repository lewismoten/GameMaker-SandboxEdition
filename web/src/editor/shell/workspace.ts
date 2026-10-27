// The project workspace: file list on the left, the selected file's editor on the right.
import { onPatchesChanged } from '../../dosPlayer/patchesChanged';
import { currentRoute, formatHash, setHashParams } from '../../urlState';
import { h, clear, download, pickFiles, toast, promptText, confirmDialog, modal } from '../core/ui';
import { Project, kindOf, KIND_LABELS, validDosName, type FileKind } from '../core/project';
import { pickFile } from '../widgets/filePicker';
import { MAKERS } from '../tools/makers';
import { KIND_ICON } from '../widgets/thumbs';
import { keyboardIcon, showShortcuts, wantsShortcuts } from '../widgets/shortcuts';
import { icon } from './homeIcons';
import { loadEditor, type EditorFn } from '../editors/registry';
import { GameFiles, loadFileList, normalize } from '../../project/files';
import { takeCompanion } from '../../project/companion';
import { chooseDownload, downloadButton } from './download';
import type { PlayerHandle } from '../../player/player';
import { ADVTYPE, parseGame, serializeGame, type Game } from '../../formats/game';
import { levelForMap } from '../editors/integrator/startAt';
import { sceneName, sourceName } from '../editors/integrator/linkSpots';
import { playButtons } from './playButtons';
import { currentPick, gameFor, parsePick, pickParam, playChoices, type PlayPick } from './playLevel';
import { keepPick, lastPick } from './playPickStore';
import './workspace.css';
import { fileActions } from './fileActions';
import { foldHint } from './hintFold';
import { SHORT } from '../../edition';
import { noteOpened, quickOpen } from './quickOpen';
import { usedByLine, deleteMessage } from './usedBy';
import { firstStepsState, notePlayed } from './firstSteps';
import type { FirstStepsPanel } from './firstStepsPanel';
import { readOnlyBar } from './released';
import { saveNote } from './saveNote';
import { assistantHost, setAssistantHost, type AssistantHost } from '../../assistant/hostSlot';
import type { RunOptions } from '../../engine/game';

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

export class Workspace implements AssistantHost {
  readonly project: Project;
  private sidebar = h('nav', { class: 'sidebar', 'aria-label': 'Game files' });
  private main = h('main', { class: 'editor', 'aria-label': 'Editor' });
  private current?: string;
  private cleanup?: () => void;
  private player?: PlayerHandle;
  private unlisten: () => void;
  /** The beginner's checklist, in games started from the starter (firstSteps.ts). */
  private firstSteps?: FirstStepsPanel;
  /** A game opened to look inside (released.ts): its bar over the editor, and no ways to add, rename or delete files. */
  private readonly bar: HTMLElement | null;
  private get looking(): boolean {
    return !!this.project.readOnly;
  }

  constructor(root: HTMLElement, project: Project, file?: string) {
    this.project = project;
    this.bar = readOnlyBar(project);
    this.saved = project.readOnly ? undefined : saveNote(project);
    clear(root, h('div', { class: 'workspace' }, this.sidebar, this.main));
    this.unlisten = project.onChange((name) => {
      if (this.listed.has(name) !== project.files.has(name)) this.renderSidebar();
      // links changed (the map's markers, the integrator): Play Level's menu follows
      else if (name === project.gam) this.playEl?.replaceWith((this.playEl = this.playButton()));
    });
    this.renderSidebar();
    // a reload while play testing (…?play) starts the play test again
    const playing = currentRoute().params.play;
    this.open(file && project.files.has(file) ? file : project.gam);
    if (playing !== undefined) this.play(playing === 'title' ? 'title' : parsePick(playing));
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
      // Ctrl+P / ⌘P: the quick switcher (instead of printing the page)
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'p' && !this.player && !document.querySelector('dialog[open]')) {
        e.preventDefault();
        void this.quickOpen();
        return;
      }
      if (this.player || !wantsShortcuts(e)) return;
      e.preventDefault();
      void showShortcuts(this.current ? kindOf(this.current) : undefined);
    };
    document.addEventListener('keydown', onHelpKey);
    // the desk's PLAYHACK saved this game's DOS player patches: take them in, so the next autosave keeps them
    const offPatches = onPatchesChanged((id, patches) => {
      if (id !== project.id || project.readOnly) return;
      void import('../../dosPlayer/playerRecord').then(({ companionPatches, playerRecord, PLAYER_SECTION }) => {
        if (JSON.stringify(companionPatches(project.companion, project.gam)) !== JSON.stringify(patches))
          project.setExtras(project.gam, PLAYER_SECTION, playerRecord(patches));
      });
    });
    this.unbind = () => (document.removeEventListener('pointerdown', onDown), document.removeEventListener('keydown', onHelpKey), offPatches());
    if (firstStepsState(project)) void this.loadFirstSteps();
    setAssistantHost(this);
  }

  // ---- for the Assistant (assistant/hostSlot.ts) ----

  get editorArea(): HTMLElement {
    return this.main;
  }

  get playing(): boolean {
    return !!this.playBack;
  }

  /** The file a play test goes back to; set while one runs. */
  private playBack?: string;

  playTest(scene: number | undefined, watch: Pick<RunOptions, 'onSession' | 'onPlayEnd'>): boolean {
    if (scene === undefined) {
      this.play('title', this.current ?? this.playBack, watch);
      return true;
    }
    const pick = playChoices(this.project.game()).find((c) => c.to === scene);
    if (!pick) return false;
    this.play(pick, this.current ?? this.playBack, watch);
    return true;
  }

  stopPlay(): void {
    const back = this.playBack;
    if (back !== undefined) this.open(this.project.files.has(back) ? back : this.project.gam);
  }

  /** The Assistant button: opens or closes the Assistant chat (its own chunk, loaded on the first press). */
  private assistantButton(): HTMLElement {
    return h(
      'button',
      {
        class: 'assistant-btn',
        title: 'Assistant: your own AI looks at this game, changes it with you and says what to do next',
        'aria-label': 'Assistant',
        'aria-expanded': String(!!document.querySelector('.chat-panel:not([hidden])')),
        onclick: () => void import('../../assistant/chat/panel').then((m) => m.toggleChat()),
      },
      h('span', { 'aria-hidden': 'true' }, '✦'),
    );
  }

  /** An empty game's "Describe a game…": the Assistant chat, ready to build one. */
  private describeButton(): HTMLElement | null {
    if (this.looking || this.project.game().scenes.some((s) => s.gametype === ADVTYPE)) return null;
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

  /** The First steps panel (its own chunk, loaded only for games that have the checklist). */
  private async loadFirstSteps(): Promise<void> {
    const { firstStepsPanel } = await import('./firstStepsPanel');
    if (this.disposed) return;
    this.firstSteps = firstStepsPanel(this.project, {
      open: (f) => this.open(f),
      play: () => this.play('title'),
      upload: () => void import('../widgets/uploadChecklist').then((m) => m.uploadChecklist(this.project)),
    });
    this.renderSidebar();
  }

  private disposed = false;

  /** "Saved in this browser" under Download (not when only looking inside). */
  private saved?: ReturnType<typeof saveNote>;

  private unbind?: () => void;

  /** The quick switcher (Ctrl+P): opens the file chosen. */
  private async quickOpen(): Promise<void> {
    const f = await quickOpen(this.project);
    if (f) this.open(f);
  }

  private listed = new Set<string>();

  get currentFile(): string | undefined {
    return this.current;
  }

  dispose(): void {
    this.disposed = true;
    this.saved?.dispose();
    this.firstSteps?.dispose();
    this.cleanup?.();
    this.player?.stop();
    this.unlisten();
    this.unbind?.();
    if (assistantHost() === this) setAssistantHost(undefined);
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
        (this.playEl = this.playButton()),
        this.firstSteps?.button(),
        this.describeButton(),
      ),
      h(
        'div',
        { class: 'side-files', id: 'side-files' },
        this.looking
          ? null
          : h(
              'div',
              { class: 'toolbar side-actions' },
              h('button', { onclick: () => void this.newFile() }, '+ Add a file…'),
              h('button', { onclick: () => void this.addFiles(), title: 'Bring in several files from your computer at once' }, '⬆ Import…'),
            ),
        h(
          'div',
          { class: 'toolbar side-actions' },
          downloadButton(this.project.name, () => this.chooseDownload()),
        ),
        this.saved?.el,
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
    const folded = foldable && !(this.current && files.includes(this.current)) && isFolded(p.id, k, files.length, total);
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
        k === 'gam' || this.looking
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
          h('button', { class: 'file', onclick: () => this.open(n), title: `Edit ${n}` }, ...fileLabel(n, k)),
          h('button', { class: 'icon-btn', title: `Edit ${n}`, 'aria-label': `Edit ${n}`, onclick: () => this.open(n) }, '✎'),
          n === p.gam || this.looking
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
    await import('../tools/all'); // the converters and recorders offered beside New
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
    this.playBack = undefined;
    this.current = file;
    noteOpened(this.project, file);
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
    const changes = !this.looking;
    clear(
      this.main,
      this.bar,
      h(
        'div',
        { class: 'row', style: 'justify-content:space-between;align-items:center;margin-bottom:8px' },
        h('h1', { class: 'file-title' }, file),
        h(
          'div',
          { class: 'toolbar' },
          h(
            'button',
            {
              class: 'keys-btn',
              title: 'Open a file by name (Ctrl+P)',
              'aria-label': 'Open a file by name',
              'aria-keyshortcuts': 'Control+P Meta+P',
              onclick: () => void this.quickOpen(),
            },
            // drawn, like the keyboard beside it (the ⌕ character came out tiny in most fonts)
            icon('search'),
          ),
          h(
            'button',
            {
              class: 'keys-btn',
              title: 'Keyboard shortcuts (?)',
              'aria-label': 'Keyboard shortcuts',
              'aria-keyshortcuts': 'Shift+?',
              onclick: () => void showShortcuts(kindOf(file)),
            },
            keyboardIcon(),
          ),
          this.assistantButton(),
          fileActions([
            ...(isGam || !changes ? [] : [{ label: 'Rename', run: () => void this.rename(file) }]),
            ...(changes ? [{ label: 'Duplicate', run: () => void this.duplicate(file) }] : []),
            {
              label: 'Download file',
              run: () => download(file.toUpperCase(), this.project.files.get(file)!),
              title: `Save ${file.toUpperCase()} to your computer`,
            },
            ...(isGam || !changes ? [] : [{ label: 'Delete', run: () => void this.remove(file), danger: true }]),
          ]),
        ),
      ),
      isGam ? this.nextSteps() : usedByLine(this.project, file),
      body,
    );
    void this.mountEditor(body, file);
  }

  /** Puts the file's editor in body, fetching it the first time a file of its kind opens (a note shows if that takes a moment). */
  private async mountEditor(body: HTMLElement, file: string): Promise<void> {
    const wait = h('p', { class: 'hint', role: 'status' }, 'Opening the editor…');
    const slow = window.setTimeout(() => body.append(wait), 150);
    let editor: EditorFn;
    try {
      editor = await loadEditor(kindOf(file));
    } catch (e) {
      console.error(e);
      editor = () =>
        clear(body, h('p', { class: 'hint' }, `The editor could not be loaded (${(e as Error).message}). Check the connection and open the file again.`));
    } finally {
      window.clearTimeout(slow);
      wait.remove();
    }
    if (!body.isConnected || this.current !== file) return; // another file (or the player) took its place
    try {
      this.cleanup = editor(body, this.project, file) || undefined;
      foldHint(body.querySelector<HTMLElement>('p.hint'));
    } catch (e) {
      console.error(e);
      clear(body, h('p', { class: 'hint' }, `This file could not be opened: ${(e as Error).message}`));
    }
  }

  /** On the game's own page: one-click ways into the files that make the game its own (can be hidden). */
  private nextSteps(): HTMLElement | null {
    if (this.looking) return null; // its bar offers the copy that would be changed
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
          title: 'Download it to play on Windows, a Mac, Linux, the web or DOS',
          'aria-haspopup': 'dialog',
          onclick: () => void this.chooseDownload(),
        },
        h('span', { 'aria-hidden': 'true' }, '💾 '),
        'Download',
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

  private playEl?: HTMLElement;

  /** Play Game and the Play Level split button (playButtons.ts). */
  private playButton(): HTMLElement {
    return playButtons({
      game: () => {
        try {
          return parseGame(this.project.files.get(this.project.gam)!);
        } catch {
          return undefined;
        }
      },
      here: () => this.levelHere()?.scene,
      last: () => lastPick(this.project.id),
      playGame: () => this.play('title'),
      playLevel: (pick) => (keepPick(this.project.id, pick), this.play(pick)),
    });
  }

  /**
   * Play tests the game: from the title screen, from a Play Level pick, or (no pick: the First
   * steps' Play, an old address) from the level being edited when a level's map is open. Play
   * Game shows the title and menu first, as in DOS; a level's play test skips them (RunOptions
   * skipTitle, on the test copy only) and its menu comes after play ends. Stop goes back to that file.
   */
  private play(how?: 'title' | PlayPick, back = this.current, watch?: Pick<RunOptions, 'onSession' | 'onPlayEnd'>): void {
    const level = how === 'title' ? undefined : (how ?? this.defaultPick(back));
    notePlayed(this.project);
    setHashParams({ play: level ? pickParam(level) : 'title' });
    this.cleanup?.();
    this.cleanup = undefined;
    this.player?.stop();
    this.player = undefined;
    this.current = undefined;
    this.playBack = back ?? this.project.gam;
    this.renderSidebar();
    const host = h('div', { class: 'player-host' });
    const game = parseGame(this.project.files.get(this.project.gam)!);
    const where = level ? `${sceneName(game, level.to)} at ${level.at.x},${level.at.y}` : '';
    clear(
      this.main,
      this.bar,
      h(
        'div',
        { class: 'row', style: 'justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px' },
        h('h1', { class: 'file-title' }, level ? `Playing ${where}` : `Playing ${this.project.name}`),
        h(
          'div',
          { class: 'toolbar' },
          level && h('button', { onclick: () => this.play('title', back), title: 'Play the whole game from its title screen' }, 'From the title screen'),
          h(
            'button',
            { onclick: () => this.open(back && this.project.files.has(back) ? back : this.project.gam), title: back ? `Stop and go back to ${back}` : 'Stop' },
            'Stop',
          ),
        ),
      ),
      host,
      h(
        'p',
        { class: 'hint' },
        level ? `It starts in ${where}, where ${sourceName(game, level)} leads, without the title and menu; they come after play ends. ` : '',
        'Play testing uses a copy of the files: high scores and saved games are not added to your project.',
      ),
    );
    const copy = new GameFiles(this.project.files.entries());
    if (level) {
      const start = gameFor(game, level);
      if (start !== game) copy.set(this.project.gam, serializeGame(start));
    }
    // the player loads with the first play test; not if another file was opened meanwhile
    void Promise.all([import('../../player/player'), import('../../dosPlayer/playerRecord')]).then(([{ mountPlayer }, { companionPatches }]) => {
      const player = companionPatches(this.project.companion, this.project.gam);
      if (!this.disposed && host.isConnected)
        this.player = mountPlayer(host, copy, this.project.gam, { title: this.project.name, player, skipTitle: !!level, ...watch });
    });
  }

  /** Play Level's pick when none is given: the last one, else a way into the open map's level, else the first. */
  private defaultPick(file = this.current): PlayPick | undefined {
    try {
      const game = parseGame(this.project.files.get(this.project.gam)!);
      return currentPick(playChoices(game), lastPick(this.project.id), this.levelHere(file)?.scene);
    } catch {
      return undefined;
    }
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
    // a backup's <game>.GMX adds its editor-only extras, not a file
    const extras = takeCompanion(files);
    for (const [file, sections] of Object.entries(extras?.files ?? {})) for (const [k, v] of Object.entries(sections)) this.project.setExtras(file, k, v);
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
    p.renameExtras(file, name);
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
    if (!(await confirmDialog('Delete file', deleteMessage(this.project, file), 'Delete'))) return;
    this.project.files.delete(file);
    this.open(this.project.gam);
  }

  /** The Download chooser (download.ts) for this game, as it is now. */
  private chooseDownload(): Promise<void> {
    const title = this.project.game().scenes[0]?.desc.trim() || this.project.name;
    return chooseDownload({ title, gam: this.project.gam, files: async () => this.project.files, project: true, companion: () => this.project.companion });
  }
}
