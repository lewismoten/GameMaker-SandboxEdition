// The project workspace: file list on the left, the selected file's editor on the right.
import { h, clear, download, pickFiles, toast, promptText, confirmDialog, modal } from './ui';
import { Project, kindOf, KIND_LABELS, validDosName, type FileKind } from './project';
import { pickFile } from './filePicker';
import { MAKERS } from './makers';
import { KIND_ICON } from './thumbs';
import { editors, fileInfo } from './editors';
import { GameFiles, loadFileList, normalize } from '../project/files';
import { createZip } from '../project/zip';
import { exportWebApp } from '../export/exportWebApp';
import { exportSinglePage } from '../export/exportSinglePage';
import { exportDos } from '../export/exportDos';
import { mountPlayer, type PlayerHandle } from '../player/player';

const ORDER: FileKind[] = ['gam', 'pal', 'bbl', 'mbl', 'cbl', 'mon', 'chr', 'map', 'snd', 'gif', 'fli', 'bkd', 'txt', 'lst', 'cmf', 'voc', 'rec', 'his', 'other'];
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



export class Workspace {
  readonly project: Project;
  private sidebar = h('nav', { class: 'sidebar', 'aria-label': 'Game files' });
  private main = h('section', { class: 'editor' });
  private current?: string;
  private cleanup?: () => void;
  private player?: PlayerHandle;
  private unlisten: () => void;

  constructor(root: HTMLElement, project: Project, file?: string) {
    this.project = project;
    clear(root, h('div', { class: 'workspace' }, this.sidebar, this.main));
    this.unlisten = project.onChange((name) => {
      if (!this.listed.has(name)) this.renderSidebar();
    });
    this.renderSidebar();
    this.open(file && project.files.has(file) ? file : project.gam);
  }

  private listed = new Set<string>();

  get currentFile(): string | undefined {
    return this.current;
  }

  dispose(): void {
    this.cleanup?.();
    this.player?.stop();
    this.unlisten();
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
    clear(
      this.sidebar,
      h(
        'div',
        { class: 'stack' },
        h('button', { class: 'primary', onclick: () => this.play() }, '▶ Play test'),
        h('div', { class: 'toolbar' }, h('button', { onclick: () => void this.newFile() }, '+ Add a file…'), h('button', { onclick: () => void this.addFiles(), title: 'Bring in several files from your computer at once' }, '⬆ Import…')),
      ),
      h('details', { class: 'export-menu' }, h('summary', null, 'Save & share'), h('div', { class: 'stack' }, h('button', { onclick: () => void this.downloadZip() }, 'Download .zip'), h('button', { onclick: () => void this.exportApp() }, 'Export web app'), h('button', { onclick: () => void this.exportPage(), title: 'One .html file with the game and player inside: double-click to play, even offline' }, 'Export as one web page'), h('button', { onclick: () => void this.exportForDos() }, 'Export for DOS'))),
      ...sections.map((k) =>
        h(
          'section',
          { class: 'file-section' },
          h(
            'h4',
            null,
            h('span', null, KIND_LABELS[k]),
            k === 'gam' ? null : h('button', { class: 'add', title: `Add ${KIND_LABELS[k].toLowerCase()}`, 'aria-label': `Add ${KIND_LABELS[k].toLowerCase()}`, onclick: () => void this.addOfKind(k) }, '+'),
          ),
          ...(groups.get(k) ?? []).map((n) =>
            h(
              'div',
              { class: `file-row ${n === this.current ? 'active' : ''}` },
              h('button', { class: 'file', onclick: () => this.open(n), title: `Edit ${n}` }, n),
              h('button', { class: 'icon-btn', title: `Edit ${n}`, 'aria-label': `Edit ${n}`, onclick: () => this.open(n) }, '✎'),
              n === p.gam ? null : h('button', { class: 'icon-btn danger', title: `Delete ${n}`, 'aria-label': `Delete ${n}`, onclick: () => void this.remove(n) }, '🗑'),
            ),
          ),
          groups.has(k) ? null : h('p', { class: 'empty' }, 'none yet'),
        ),
      ),
    );
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
    location.replace(`#/p/${this.project.id}/${encodeURIComponent(file)}`);
    this.renderSidebar();
    const body = h('div');
    const isGam = file === this.project.gam;
    clear(
      this.main,
      h(
        'div',
        { class: 'row', style: 'justify-content:space-between;align-items:center;margin-bottom:8px' },
        h('h2', null, file),
        h(
          'div',
          { class: 'toolbar' },
          !isGam && h('button', { onclick: () => void this.rename(file) }, 'Rename'),
          h('button', { onclick: () => void this.duplicate(file) }, 'Duplicate'),
          h('button', { onclick: () => download(file.toUpperCase(), this.project.files.get(file)!) }, 'Download'),
          !isGam && h('button', { class: 'danger', onclick: () => void this.remove(file) }, 'Delete'),
        ),
      ),
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

  private play(): void {
    this.cleanup?.();
    this.cleanup = undefined;
    this.current = undefined;
    this.renderSidebar();
    const host = h('div', { class: 'player-host' });
    clear(
      this.main,
      h('div', { class: 'row', style: 'justify-content:space-between;align-items:center;margin-bottom:8px' }, h('h2', null, `Playing ${this.project.name}`), h('button', { onclick: () => this.open(this.project.gam) }, 'Stop')),
      host,
      h('p', { class: 'hint' }, 'Play testing uses a copy of the files: high scores and saved games are not added to your project.'),
    );
    const copy = new GameFiles(this.project.files.entries());
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
      const { name, zip, exe } = await exportDos(this.project.files, { title, gam: this.project.gam });
      download(name, zip, 'application/zip');
      toast(`Saved ${name}. In DOSBox, run ${exe} from the unzipped folder.`);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  private async exportPage(): Promise<void> {
    try {
      toast('Building web page…');
      const title = this.project.game().scenes[0]?.desc || this.project.name;
      const { name, html } = await exportSinglePage(this.project.files, { title, gam: this.project.gam });
      download(name, html, 'text/html');
      toast(`Saved ${name}. Open it in any browser to play — no internet needed.`);
    } catch (e) {
      toast((e as Error).message, 'error');
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
      toast((e as Error).message, 'error');
    }
  }
}
