// The project workspace: file list on the left, the selected file's editor on the right.
import { onPatchesChanged } from '../../dosPlayer/patchesChanged';
import { currentRoute, formatHash, setHashParams } from '../../urlState';
import { overviewTabFrom, TAB_TITLES, type OverviewTab } from './overviewLink';
import { migrateCounterNames } from '../core/gameControls';
import { h, clear, download, pickFiles, toast, promptText, confirmDialog, modal } from '../core/ui';
import { Project, kindOf, KIND_LABELS, validDosName, type FileKind } from '../core/project';
import { pickFile } from '../widgets/filePicker';
import { MAKERS } from '../tools/makers';
import { KIND_ICON } from '../widgets/thumbs';
import { keyboardIcon, showShortcuts, wantsShortcuts } from '../widgets/shortcuts';
import { icon } from './homeIcons';
import { loadEditor, type EditorFn } from '../editors/registry';
import { loadFileList, normalize } from '../../project/files';
import { takeCompanion } from '../../project/companion';
import { chooseDownload } from './download';
import { gameTitle } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parsePick, pickParam, playChoices, type PlayPick } from './playLevel';
import { WorkspaceSidebar } from './workspaceSidebar';
import { WorkspacePlay } from './workspacePlay';
import './workspace.css';
import './shellTouch.css';
import { noteLastPlace, resumeLastPlace, watchLastPlace } from './lastPlace';
import { FILE_ORDER as ORDER, ADD_KINDS as SECTIONS, FILE_KIND_HELP as KIND_HELP } from './fileKinds';
import { fileActions } from './fileActions';
import { foldHint } from './hintFold';
import { SHORT } from '../../edition';
import { noteOpened, quickOpen } from './quickOpen';
import { usedByLine, mapUsesLine, deleteMessage } from './usedBy';
import { viewChanged } from './viewSync';
import { firstStepsState, notePlayed } from './firstSteps';
import type { FirstStepsPanel } from './firstStepsPanel';
import { readOnlyBar } from './released';
import { saveNote } from './saveNote';
import { crumbs } from './crumbs';
import { foldRefs } from './refsFold';
import './editorHead.css';
import { restoreScroll, savedScroll, stampEntry, watchScroll } from './scrollMemory';
import { assistantHost, setAssistantHost, type AssistantHost } from '../../assistant/hostSlot';
import type { RunOptions } from '@lewismoten/gamemaker-sandbox-engine/engine/game';

export class Workspace implements AssistantHost {
  readonly project: Project;
  private sidebarView: WorkspaceSidebar;
  private get sidebar(): HTMLElement {
    return this.sidebarView.el;
  }
  private main = h('main', { class: 'editor', 'aria-label': 'Editor' });
  private current?: string;
  private readonly unwatchScroll: () => void;
  private assetView?: { kind?: FileKind; tab: OverviewTab };
  private assetReturn?: { kind?: FileKind; tab: OverviewTab };
  private cleanup?: () => void;
  private playSession: WorkspacePlay;
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
    this.playSession = new WorkspacePlay(project, {
      current: () => this.current,
      play: (how, back) => this.play(how, back),
      stopPlay: () => this.stopPlay(),
    });
    this.sidebarView = new WorkspaceSidebar(project, {
      current: () => this.current,
      assetView: () => this.assetView,
      firstSteps: () => this.firstSteps,
      saved: () => this.saved,
      playButton: () => this.playButton(),
      newFile: () => this.newFile(),
      addFiles: () => this.addFiles(),
      chooseDownload: () => this.chooseDownload(),
      openAssets: (kind) => this.openAssets(kind),
      addOfKind: (kind) => this.addOfKind(kind),
      open: (file) => this.open(file),
      remove: (file) => this.remove(file),
    });
    this.unwatchScroll = watchScroll(this.main);
    this.bar = readOnlyBar(project);
    // the map editor's Play here: a play test from a spot of the open level, without changing the game's links
    project.playAt = (to, at) => this.play({ to, at, from: 0, link: 0 });
    this.saved = project.readOnly ? undefined : saveNote(project);
    clear(root, h('div', { class: 'workspace' }, this.sidebar, this.main));
    this.sidebarView.restoreFold(root);
    this.unlisten = project.onChange((name) => this.sidebarView.changed(name));
    // per-character counter names from an older version become the game-wide ones (core/gameControls.ts)
    if (!project.readOnly) migrateCounterNames(project);
    this.renderSidebar();
    // a reload while play testing (…?play) starts the play test again
    const playing = currentRoute().params.play;
    // back from the Games page with no file named: where the editor was last open (lastPlace.ts)
    file ??= resumeLastPlace(project);
    watchLastPlace();
    this.navigate(file);
    if (playing !== undefined) this.play(playing === 'title' ? 'title' : parsePick(playing));
    const unbindSidebar = this.sidebarView.bind();
    // ? lists the open editor's keyboard shortcuts (not while typing or play testing)
    const onHelpKey = (e: KeyboardEvent) => {
      // Ctrl+P / ⌘P: the quick switcher (instead of printing the page)
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === 'p' &&
        !this.playSession.player &&
        !document.querySelector('dialog[open]')
      ) {
        e.preventDefault();
        void this.quickOpen();
        return;
      }
      if (this.playSession.player || !wantsShortcuts(e)) return;
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
    this.unbind = () => (unbindSidebar(), document.removeEventListener('keydown', onHelpKey), offPatches());
    if (firstStepsState(project)) void this.loadFirstSteps();
    setAssistantHost(this);
  }

  // ---- for the Assistant (assistant/hostSlot.ts) ----

  get editorArea(): HTMLElement {
    return this.main;
  }

  get playing(): boolean {
    return !!this.playSession.back;
  }

  playTest(scene: number | undefined, watch: Pick<RunOptions, 'onSession' | 'onPlayEnd'>): boolean {
    if (scene === undefined) {
      this.play('title', this.current ?? this.playSession.back, watch);
      return true;
    }
    const pick = playChoices(this.project.game()).find((c) => c.to === scene);
    if (!pick) return false;
    this.play(pick, this.current ?? this.playSession.back, watch);
    return true;
  }

  stopPlay(): void {
    if (this.assetReturn) return this.openAssets(this.assetReturn.kind, this.assetReturn.tab);
    const back = this.playSession.back;
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

  get currentFile(): string | undefined {
    return this.current;
  }

  dispose(): void {
    this.project.playAt = undefined;
    this.disposed = true;
    this.unwatchScroll();
    this.saved?.dispose();
    this.firstSteps?.dispose();
    this.cleanup?.();
    this.playSession.dispose();
    this.unlisten();
    this.unbind?.();
    if (assistantHost() === this) setAssistantHost(undefined);
  }

  private renderSidebar(): void {
    this.sidebarView.render();
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

  /** Follow a project URL without resetting a file editor for its own view parameters. */
  navigate(file?: string): void {
    if (file && this.project.files.has(file)) {
      if (this.current !== file) this.open(file);
      else viewChanged(); // same file, other settings (?scene=…): the editor follows the address
      return;
    }
    const raw = currentRoute().params.assets;
    const kind = ORDER.includes(raw as FileKind) ? (raw as FileKind) : undefined;
    const tab = overviewTabFrom(currentRoute().params.tab);
    if (!this.assetView || this.assetView.kind !== (tab === 'files' ? kind : undefined) || this.assetView.tab !== tab) this.openAssets(kind, tab);
  }

  /** Opens the Overview page on a tab (Files, optionally in one category; Controls; DOS player). */
  private openAssets(kind?: FileKind, tab: OverviewTab = 'files'): void {
    if (tab !== 'files') kind = undefined;
    noteLastPlace();
    this.cleanup?.();
    this.cleanup = undefined;
    this.playSession.stop();
    this.playSession.clear();
    this.playSession.back = undefined;
    this.assetReturn = undefined;
    this.current = undefined;
    this.assetView = { kind, tab };
    this.sidebar.classList.remove('open');
    this.main.classList.add('asset-editor');
    const left = savedScroll();
    this.main.scrollTop = 0;
    window.scrollTo(0, 0);
    const at = currentRoute();
    const path = formatHash(['p', this.project.id], { assets: kind, tab: tab === 'files' ? undefined : tab });
    const same =
      at.path[0] === 'p' && at.path[1] === this.project.id && !at.path[2] && at.params.assets === kind && at.params.tab === (tab === 'files' ? undefined : tab);
    if (location.hash !== path) {
      const href = `${location.pathname}${location.search}${path}`;
      if (!same && at.path[0] === 'p' && at.path[1] === this.project.id) history.pushState(null, '', href);
      else history.replaceState(null, '', href);
    }
    document.title = `${kind ? `${KIND_LABELS[kind]} · ` : tab !== 'files' ? `${TAB_TITLES[tab]} · ` : ''}${this.project.name} · ${SHORT}`;
    // Back to a page of the Overview lands where it was left
    const shown = stampEntry();
    this.renderSidebar();
    const slot = h('div', { role: 'status' }, 'Opening the overview…');
    this.bar?.classList.add('released-inline'); // the Overview carries it in its heading
    clear(this.main, slot);
    void import('./overview')
      .then(({ overview }) => {
        if (this.disposed || !slot.isConnected || !this.assetView) return;
        const page = overview({
          project: this.project,
          tab,
          kind,
          bar: this.bar,
          all: () => this.openAssets(),
          category: (k) => this.openAssets(k),
          open: (file) => this.open(file),
          add: (k) => void this.addOfKind(k),
          play: () => this.play('title'),
          download: () => void this.chooseDownload(),
          firstSteps: () => (this.firstSteps ? () => this.firstSteps?.toggle(true) : undefined),
          tabChanged: (next) => {
            if (!this.assetView || this.assetView.tab === next) return;
            this.assetView = { kind: undefined, tab: next };
            setHashParams({ tab: next === 'files' ? undefined : next, assets: undefined }, ['p', this.project.id]);
            document.title = `${next !== 'files' ? `${TAB_TITLES[next]} · ` : ''}${this.project.name} · ${SHORT}`;
          },
        });
        slot.replaceWith(page.el);
        this.cleanup = () => page.dispose();
        if (shown) restoreScroll(this.main, left);
      })
      .catch((error: unknown) => {
        if (slot.isConnected) clear(slot, h('p', { class: 'hint' }, `The overview could not open: ${(error as Error).message}`));
      });
  }

  open(file: string): void {
    const fromAssets = !!this.assetView;
    const prev = this.current;
    const left = savedScroll();
    this.assetView = this.assetReturn = undefined;
    this.main.classList.remove('asset-editor');
    this.cleanup?.();
    this.cleanup = undefined;
    this.playSession.stop();
    this.playSession.clear();
    this.playSession.back = undefined;
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
      if (at.path[0] === 'p' && at.path[1] === this.project.id && (at.path[2] || fromAssets)) history.pushState(null, '', next);
      else history.replaceState(null, '', next);
    }
    setHashParams({ play: undefined });
    // the entry remembers which file opened this one (Back to it is offered above the title)
    const stamp = stampEntry(!fromAssets && prev && prev !== file ? prev : undefined);
    const from = stamp ? stamp.from : !fromAssets && prev && prev !== file ? prev : undefined;
    if (stamp) restoreScroll(this.main, left);
    // the tab names the open file first (phones show little of a tab's title)
    document.title = `${file} · ${this.project.name} · ${SHORT}`;
    this.renderSidebar();
    const body = h('div');
    const isGam = file === this.project.gam;
    const changes = !this.looking;
    // beside the title row's other parts, so a phone puts it next to the Read-only chip (editorHead.css)
    const refs = isGam
      ? null
      : foldRefs(h('div', { class: 'file-refs' }, usedByLine(this.project, file), kindOf(file) === 'map' ? mapUsesLine(this.project, file) : null));
    this.bar?.classList.add('released-inline'); // beside the file's title
    clear(
      this.main,
      crumbs(file, {
        overview: () => this.openAssets(),
        category: () => this.openAssets(kindOf(file)),
        from: from && this.project.files.has(from) ? from : undefined,
        back: () => history.back(),
      }),
      h(
        'div',
        { class: 'row file-head', style: 'justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px' },
        h('h1', { class: 'file-title' }, file),
        this.bar,
        h(
          'div',
          { class: 'toolbar' },
          h('button', { type: 'button', title: 'Browse this file category', onclick: () => this.openAssets(kindOf(file)) }, 'Assets'),
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
            // the phone's header keeps only this menu; the buttons beside it move in
            { label: 'Assets', title: 'Browse this file category', phone: true, run: () => this.openAssets(kindOf(file)) },
            { label: 'Open a file by name', phone: true, run: () => void this.quickOpen() },
            { label: 'Keyboard shortcuts', phone: true, run: () => void showShortcuts(kindOf(file)) },
            { label: 'Assistant', phone: true, run: () => void import('../../assistant/chat/panel').then((m) => m.toggleChat()) },
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
        refs,
      ),
      isGam ? this.nextSteps() : null,
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

  private playButton(): HTMLElement {
    return this.playSession.button();
  }

  /**
   * Play tests the game: from the title screen, from a Play Level pick, or (no pick: the First
   * steps' Play, an old address) from the level being edited when a level's map is open. Play
   * Game shows the title and menu first, as in DOS; a level's play test skips them (RunOptions
   * skipTitle, on the test copy only) and its menu comes after play ends. Stop goes back to that file.
   */
  private play(how?: 'title' | PlayPick, back = this.current, watch?: Pick<RunOptions, 'onSession' | 'onPlayEnd'>): void {
    if (this.assetView) this.assetReturn = this.assetView;
    this.assetView = undefined;
    this.main.classList.remove('asset-editor');
    document.title = `Playing ${this.project.name} · ${SHORT}`;
    const level = how === 'title' ? undefined : (how ?? this.playSession.defaultPick(back));
    notePlayed(this.project);
    setHashParams({ play: level ? pickParam(level) : 'title' });
    this.cleanup?.();
    this.cleanup = undefined;
    this.playSession.stop();
    this.playSession.clear();
    this.current = undefined;
    this.playSession.back = back ?? this.project.gam;
    this.renderSidebar();
    this.playSession.mount(this.main, this.bar, level, back, !!this.assetReturn, watch);
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
    (await import('../widgets/bigVocWarning')).warnBigVocs(files.entries());
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
    const { assetCommands } = await import('./assetCommands');
    await assetCommands(this.project, (name) => this.open(name)).duplicate(file);
  }

  private async remove(file: string): Promise<void> {
    if (!(await confirmDialog('Delete file', deleteMessage(this.project, file), 'Delete'))) return;
    this.project.files.delete(file);
    this.open(this.project.gam);
  }

  /** The Download chooser (download.ts) for this game, as it is now. */
  private chooseDownload(): Promise<void> {
    const title = gameTitle(this.project.game()) || this.project.name;
    return chooseDownload({
      title,
      gam: this.project.gam,
      files: async () => this.project.files,
      pocketContext: async () => {
        const [{ pocketProjectUid }, { parseCompanion }, { isImported }] = await Promise.all([
          import('../../export/pocketLibrary'),
          import('../../project/companion'),
          import('./homeOrigin'),
        ]);
        this.project.companion ??= parseCompanion(undefined);
        const uid = pocketProjectUid(this.project.companion);
        await this.project.saveNow();
        return { uid, category: isImported(this.project.id) ? ['imported', 'unsorted'] : ['mine'] };
      },
      project: true,
      companion: () => this.project.companion,
      setPreviews: (on) => this.project.setExportPreviews(on),
    });
  }
}
