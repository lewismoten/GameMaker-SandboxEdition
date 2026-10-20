// The project workspace: file list on the left, the selected file's editor on the right.
import { h, clear, download, pickFiles, toast, promptText, confirmDialog, modal } from './ui';
import { Project, kindOf, KIND_LABELS, validDosName, type FileKind } from './project';
import { editors, fileInfo } from './editors';
import { GameFiles, loadFileList, normalize } from '../project/files';
import { createZip } from '../project/zip';
import { exportWebApp } from '../export/exportWebApp';
import { mountPlayer, type PlayerHandle } from '../player/player';
import { newBlockSet, serializeBlocks, type BlockKind } from '../formats/blocks';
import { defaultPalette, serializePalette } from '../formats/palette';
import { newMonsterSet, serializeMonsters } from '../formats/monster';
import { newCharacter, serializeCharacter } from '../formats/character';
import { newMap, serializeMap } from '../formats/map';
import { newSoundSet, serializeSoundSet } from '../formats/sound';
import { serializeBackdrop, serializeSlideList } from '../formats/graphicScripts';
import { textBytes } from '../formats/binary';

const ORDER: FileKind[] = ['gam', 'pal', 'bbl', 'mbl', 'cbl', 'mon', 'chr', 'map', 'snd', 'gif', 'fli', 'bkd', 'txt', 'lst', 'cmf', 'voc', 'rec', 'his', 'other'];

const TEMPLATES: { kind: FileKind; label: string; make: (p: Project) => Uint8Array }[] = [
  { kind: 'pal', label: 'Palette', make: (p) => serializePalette(p.paletteFor('').palette.slice() || defaultPalette()) },
  ...(['bbl', 'mbl', 'cbl'] as BlockKind[]).map((k) => ({ kind: k as FileKind, label: KIND_LABELS[k], make: () => serializeBlocks(newBlockSet(k)) })),
  { kind: 'mon', label: 'Monsters', make: () => serializeMonsters(newMonsterSet()) },
  { kind: 'chr', label: 'Character', make: () => serializeCharacter(newCharacter()) },
  { kind: 'map', label: 'Map', make: () => serializeMap(newMap()) },
  { kind: 'snd', label: 'Sound set', make: () => serializeSoundSet(newSoundSet()) },
  { kind: 'txt', label: 'Text screen', make: () => textBytes('Write your text here.\r\nLines are 31 characters wide.\r\n') },
  { kind: 'lst', label: 'Slide show', make: () => serializeSlideList([]) },
  { kind: 'bkd', label: 'Backdrop', make: () => serializeBackdrop({ x: 0, y: 0, gif: '' }) },
];

export class Workspace {
  private project: Project;
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
    clear(
      this.sidebar,
      h('div', { class: 'stack' }, h('button', { class: 'primary', onclick: () => this.play() }, '▶ Play test'), h('div', { class: 'toolbar' }, h('button', { onclick: () => void this.newFile() }, '+ New'), h('button', { onclick: () => void this.addFiles() }, 'Add files…'))),
      h('div', { class: 'toolbar', style: 'margin-top:8px' }, h('button', { onclick: () => void this.downloadZip() }, 'Download .zip'), h('button', { onclick: () => void this.exportApp() }, 'Export web app')),
      ...ORDER.filter((k) => groups.has(k)).map((k) => [
        h('h4', null, KIND_LABELS[k]),
        ...groups.get(k)!.map((n) => h('button', { class: `file ${n === this.current ? 'active' : ''}`, onclick: () => this.open(n), title: n }, n)),
      ]),
    );
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

  private async newFile(): Promise<void> {
    const kind = await modal<FileKind>('New file', (close) =>
      h('div', { class: 'stack' }, ...TEMPLATES.map((t) => h('button', { onclick: () => close(t.kind) }, `${t.label} (.${t.kind})`))),
    );
    if (!kind) return;
    const t = TEMPLATES.find((x) => x.kind === kind)!;
    const suggested = this.project.freeName(this.project.gam.replace(/\.gam$/, ''), kind);
    const name = await this.askName('Name the new file', suggested, kind);
    if (!name) return;
    this.project.files.set(name, t.make(this.project));
    this.open(name);
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
