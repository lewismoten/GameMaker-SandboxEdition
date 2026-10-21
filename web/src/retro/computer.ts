// The 90s PC on the desk: boots to a DOS prompt, runs the DOS-look Game-Maker, the BBS
// terminal and games, with drive A: (floppy), C: (hard disk) and D: (the CD).
import { TextScreen, attr } from './text/textScreen';
import { TextKeys } from './text/textInput';
import { Shell } from './dos/shell';
import { FileSystem, file, folder, liveFolder, textFile, type DosNode, type ProgramRef } from './dos/vfs';
import { dosDirName, hardDiskGames, hdFiles, hdProject, makeGameFolder, restoreInstalled, type HdGame } from './dos/hardDisk';
import { exportDos } from '../export/exportDos';
import { Downloads, type FolderGame, type InsertedDisk, type RetroHost } from './host';
import { errorBox, askText } from './text/textUi';
import { runGameMaker, playgame } from './gm';
import { runTerminal } from './bbs/bbs';
import type { Disk } from './dos/disks';
import { mountPlayer } from '../player/player';
import { loadCatalog, loadHostedGame, type CatalogEntry, GameFiles } from '../project/files';
import { loadProject } from '../project/storage';
import { Project } from '../editor/core/project';
import { editors, fileInfo } from '../editor/editors/registry';
import { kindOf } from '../editor/core/project';
import { Vga } from '../vga/shared/vga';
import { output } from '../audio/output';
import { h, clear, download } from '../editor/core/ui';
import type { SpeedSetting } from '../engine/scene';
import type { GmInstallEntry } from '../../scripts/cdGames';

/** gfx: today's editors full screen; vga: the designers' own 320x200 graphics. */
export type MonitorMode = 'off' | 'text' | 'game' | 'gfx' | 'vga';

export interface ComputerOptions {
  speed: SpeedSetting;
  onModeChange?: (mode: MonitorMode) => void;
  onDisksChanged?: (insert?: string) => void;
  /** A drive is being read (DIR, loading a game or Game-Maker, ...): light its LED. */
  onDriveAccess?: (drive: string) => void;
  /** A game starts on the monitor (its files), or stops (undefined): the desk sets out its key card. */
  onGame?: (game?: { files: GameFiles; gam: string; title: string }) => void;
  openModern: (projectId: string, file?: string) => void;
}

const AUTOEXEC = [
  '@ECHO OFF',
  'PROMPT $P$G',
  'PATH C:\\DOS;C:\\GM;C:\\COMM',
  'LH C:\\DOS\\MSCDEX.EXE /D:MSCD001 /L:D',
  'LH C:\\DOS\\DOSKEY',
  'LH C:\\DOS\\MOUSE',
  'SET BLASTER=A220 I7 D1 T4',
  'CD \\',
];
const CONFIG_SYS = [
  'DEVICE=C:\\DOS\\HIMEM.SYS',
  'DEVICE=C:\\DOS\\EMM386.EXE NOEMS',
  'DOS=HIGH,UMB',
  'DEVICEHIGH=C:\\CDROM\\CDROM.SYS /D:MSCD001',
  'FILES=40',
  'BUFFERS=20',
  'STACKS=9,256',
];

export class Computer implements RetroHost {
  readonly screen: TextScreen;
  readonly keys = new TextKeys();
  readonly fs = new FileSystem();
  readonly downloads = new Downloads();
  readonly shell: Shell;
  private inserted?: InsertedDisk;
  private cdIn = false;
  private textEl: HTMLCanvasElement;
  private layer: HTMLElement;
  private vgaScreen?: Vga;
  private mode: MonitorMode = 'off';
  private catalogCache?: Promise<CatalogEntry[]>;
  private gmIndex?: Promise<GmInstallEntry[]>;
  private gmFiles = new Map<string, Promise<Uint8Array | undefined>>();
  private audioCtx?: AudioContext;
  busy = false;
  powered = false;

  constructor(
    readonly monitor: HTMLElement,
    private opts: ComputerOptions,
  ) {
    this.textEl = h('canvas', { class: 'crt-text', tabIndex: 0, 'aria-label': 'Computer screen' });
    this.layer = h('div', { class: 'crt-layer' });
    // .crt-picture: what the tube shows, which the desk curves like the glass
    monitor.append(h('div', { class: 'crt-picture' }, this.textEl, this.layer));
    this.screen = new TextScreen(this.textEl);
    // Draw the text as large as it is shown, so it stays sharp at any size.
    // (measured as shown, after any scaling of the desk around it)
    const fit = () => this.screen.setScale((this.textEl.getBoundingClientRect().width * devicePixelRatio) / 640);
    new ResizeObserver(fit).observe(this.textEl);
    addEventListener('resize', () => requestAnimationFrame(fit));
    this.screen.clear(0);
    this.screen.cursorVisible = false;
    this.keys.attach(this.textEl);
    this.shell = new Shell({
      screen: this.screen,
      keys: this.keys,
      fs: this.fs,
      run: (ref, args) => this.run(ref, args),
      makeDir: (drive, parts) => this.makeDir(drive, parts),
    });
    this.downloads.onChange = () => this.opts.onDisksChanged?.();
    this.fs.onAccess = (drive) => this.opts.onDriveAccess?.(drive);
    this.buildDrives();
    this.setMode('off');
  }

  focus(): void {
    if (this.mode === 'text') this.textEl.focus();
  }

  private setMode(mode: MonitorMode): void {
    this.mode = mode;
    this.monitor.dataset.mode = mode;
    this.textEl.hidden = mode !== 'text' && mode !== 'off';
    this.layer.hidden = mode === 'text' || mode === 'off';
    this.opts.onModeChange?.(mode);
    if (mode === 'text') queueMicrotask(() => this.textEl.focus());
  }

  // ---- power ------------------------------------------------------------------------

  async powerOn(): Promise<void> {
    if (this.powered) return;
    this.powered = true;
    this.unlockAudio();
    this.setMode('text');
    const s = this.screen;
    s.resetPalette();
    s.clear(attr(7, 0));
    s.cursorVisible = false;
    const turbo = !this.opts.speed.ticksPerSecond;
    s.print(`AwkWard Modular BIOS v4.20  (C) 1993 AwkWard Software\n${turbo ? '486DX2-66 Turbo' : '486DX2-66 (Turbo off)'}\n\n`);
    for (let k = 0; k <= 4096; k += 256) {
      s.cursorX = 0;
      s.print(`Memory Test: ${String(k).padStart(5)}K${k === 4096 ? ' OK' : ''}`);
      await sleep(30);
    }
    this.postBeep(); // one short beep: the power-on self test passed
    s.print('\n\nStarting MS-DOS...\n\n');
    await sleep(500);
    // CONFIG.SYS
    s.print('HIMEM is testing extended memory...');
    await sleep(turbo ? 350 : 1100);
    s.print('done.\n');
    await sleep(150);
    s.print('EMM386 successfully installed.\n  Available Upper Memory     :  91 KB\n\n');
    await sleep(250);
    s.print('  ATAPI CD-ROM Device Driver  Version 2.14\n  Drive 0: CD-ROM 2X (MSCD001)\n\n');
    await sleep(turbo ? 400 : 900);
    // AUTOEXEC.BAT
    for (const l of AUTOEXEC.slice(1)) {
      if (l.includes('MSCDEX')) {
        s.print('MSCDEX Version 2.23\n        Drive D: = Driver MSCD001 unit 0\n');
        await sleep(300);
      } else if (l.includes('DOSKEY')) s.print('DOSKEY installed.\n');
      else if (l.includes('MOUSE')) s.print('Mouse driver installed\n');
    }
    s.print('\nType HELP for commands, GM to start Game-Maker, TERMINAL to call the BBS.\n\n');
    s.cursorVisible = true;
    void this.shell.loop();
  }

  /** The BIOS's single beep through the PC speaker: a short square wave. */
  private postBeep(): void {
    const ctx = this.audioCtx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 1046;
    const t = ctx.currentTime + 0.02;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.005);
    g.gain.setValueAtTime(0.06, t + 0.2);
    g.gain.linearRampToValueAtTime(0, t + 0.21);
    o.connect(g).connect(output(ctx));
    o.start(t);
    o.stop(t + 0.22);
  }

  unlockAudio(): void {
    try {
      this.audioCtx ??= new AudioContext();
      void this.audioCtx.resume();
    } catch {
      /* no audio */
    }
  }

  audio(): AudioContext | undefined {
    return this.audioCtx;
  }

  turbo(): boolean {
    return !this.opts.speed.ticksPerSecond;
  }

  /** Types a command at the prompt, as if on the keyboard. */
  typeCommand(cmd: string): boolean {
    if (!this.powered || this.busy) return false;
    this.focus();
    this.keys.type(`${cmd}\n`);
    return true;
  }

  // ---- drives -------------------------------------------------------------------------

  insertDisk(disk: Disk, files: GameFiles): void {
    this.inserted = { disk, files };
  }

  eject(): Disk | undefined {
    const d = this.inserted?.disk;
    this.inserted = undefined;
    return d;
  }

  insertCd(): void {
    this.cdIn = true;
  }

  ejectCd(): void {
    this.cdIn = false;
  }

  get cdInserted(): boolean {
    return this.cdIn;
  }

  disk(): InsertedDisk | undefined {
    if (this.inserted) this.opts.onDriveAccess?.('A');
    return this.inserted;
  }

  private buildDrives(): void {
    const gameFolder = (g: CatalogEntry): DosNode =>
      folder(g.id, async () => {
        const nodes = g.files.map((f) => file(f, 0, { read: async () => (await this.catalogFiles(g)).get(f) ?? new Uint8Array() }));
        // Sizes come from the files themselves, loaded when the folder is opened.
        const files = await this.catalogFiles(g);
        for (const n of nodes) n.size = files.get(n.name.toLowerCase())?.length ?? 0;
        return nodes;
      });

    this.fs.addDrive({
      letter: 'A',
      label: '',
      free: 0,
      root: async () => {
        const d = this.inserted;
        if (!d || d.disk.kind === 'blank') return null;
        const nodes = d.files.entries().map(([n, b]) => file(n, b.length, { read: async () => b }));
        if (d.disk.gam) {
          const exe = d.disk.gam.replace(/\.gam$/i, '.exe');
          nodes.unshift(file(exe, 160_598, { run: { kind: 'game', title: d.disk.title, gam: d.disk.gam, files: async () => new Map(d.files.entries()), diskId: d.disk.id } }));
        }
        return nodes;
      },
    });

    this.fs.addDrive({
      letter: 'C',
      label: 'GAMEMAKER',
      free: 48_234_496,
      root: async () => [
        folder('DOS', () =>
          ['COMMAND.COM', 'HIMEM.SYS', 'EMM386.EXE', 'MSCDEX.EXE', 'DOSKEY.COM', 'MOUSE.COM', 'MEM.EXE', 'EDIT.COM'].map((n) => file(n, 20_000 + n.length * 1357)),
        ),
        folder('CDROM', () => [file('CDROM.SYS', 18_432)]),
        liveFolder('GM', () => this.gmFolder(true)),
        folder('COMM', () => [file('TERMINAL.EXE', 211_340, { run: { kind: 'terminal' } }), textFile('PHONE.LST', 'THE -= S A N D B O X =- BBS  1-412-555-SAND  14400 N81  Renegade\nTHE SOFA                     412-555-0177  14400 N81  Major BBS, 8 lines\n')]),
        liveFolder('DOWNLOAD', async () => {
          const cat = await this.catalog();
          return this.downloads.list().flatMap((id) => {
            const g = cat.find((c) => c.id === id);
            if (!g) return [];
            return [
              folder(g.id, async () => [
                ...(g.exe
                  ? [file(g.exe, 155_156, { run: { kind: 'game', title: g.title, gam: g.gam!, files: () => this.catalogFiles(g), notice: g.notice } as ProgramRef })]
                  : []),
                ...(await gameFolder(g).list!()),
              ]),
            ];
          });
        }),
        textFile('AUTOEXEC.BAT', AUTOEXEC.join('\n') + '\n'),
        textFile('CONFIG.SYS', CONFIG_SYS.join('\n') + '\n'),
        file('COMMAND.COM', 54_645),
      ],
    });

    this.fs.addDrive({
      letter: 'D',
      label: 'GAMEMAKER_3',
      free: 0,
      root: async () => {
        if (!this.cdIn) return null;
        const cat = await this.catalog();
        return [
          folder('GM', () => this.gmFolder(false)),
          folder('GAMEWARE', () => cat.filter((g) => g.kind === 'gameware').map(gameFolder)),
          file('INSTALL.EXE', 61_421, { run: { kind: 'install' } }),
          textFile('README.TXT', 'Game-Maker: Sandbox Edition 3.00\nBased on Game-Maker 3.00 by\nRecreational Software Designs, 1994\n\nGame-Maker is already installed in C:\\GM. Type GM to start it.\n'),
        ];
      },
    });
  }

  private gmIndexList(): Promise<GmInstallEntry[]> {
    return (this.gmIndex ??= fetch('./gm/index.json')
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []));
  }

  /** The game folders in C:\GM: installed with Game-Maker, plus yours. */
  async hdGames(): Promise<HdGame[]> {
    const index = await this.gmIndexList();
    return hardDiskGames(await this.catalog(), index.filter((e) => e.dir).map((e) => e.name));
  }

  /** C:\GM (hard disk, with your games and changes) or D:\GM (the CD, as shipped). */
  private async gmFolder(hardDisk: boolean): Promise<DosNode[]> {
    const index = await this.gmIndexList();
    const runs: Record<string, ProgramRef> = { 'GM.EXE': { kind: 'gm' }, 'MENU.EXE': { kind: 'gm' }, 'PLAYGAME.EXE': { kind: 'playgame' } };
    const programs = index
      .filter((e) => !e.dir)
      .map((e) => {
        const text = /\.(hlp|txt)$/i.test(e.name);
        return file(e.name, e.size, { run: runs[e.name], read: text ? async () => (await this.gmFile(e.name)) ?? new Uint8Array() : undefined });
      });
    const games = hardDisk ? await this.hdGames() : (await this.hdGames()).filter((g) => g.source === 'installed');
    const folders = games.map((g) =>
      liveFolder(g.dir, async () => {
        const files = hardDisk ? await hdFiles(g) : new GameFiles(await this.catalogFiles(g.catalog!));
        return files.entries().map(([n, b]) => file(n, b.length, { read: async () => b }));
      }),
    );
    return [...folders, ...programs];
  }

  private catalogFileCache = new Map<string, Promise<Map<string, Uint8Array>>>();
  private catalogFiles(g: CatalogEntry): Promise<Map<string, Uint8Array>> {
    let p = this.catalogFileCache.get(g.id);
    if (!p) {
      p = loadHostedGame(g).then((f) => new Map(f.entries()));
      this.catalogFileCache.set(g.id, p);
    }
    return p;
  }

  catalog(): Promise<CatalogEntry[]> {
    return (this.catalogCache ??= loadCatalog().catch(() => []));
  }

  gmFile(name: string): Promise<Uint8Array | undefined> {
    const key = name.toLowerCase();
    let p = this.gmFiles.get(key);
    if (!p) {
      p = fetch(`./gm/${key}`)
        .then(async (r) => (r.ok ? new Uint8Array(await r.arrayBuffer()) : undefined))
        .catch(() => undefined);
      this.gmFiles.set(key, p);
    }
    return p;
  }

  // ---- programs -----------------------------------------------------------------------

  async run(ref: ProgramRef, _args: string[]): Promise<void> {
    this.busy = true;
    try {
      switch (ref.kind) {
        case 'gm':
          this.opts.onDriveAccess?.(this.shell.drive);
          await runGameMaker(this);
          break;
        case 'playgame':
          this.screen.gameMakerColors();
          await playgame(this);
          this.screen.resetPalette();
          this.screen.clear();
          break;
        case 'terminal':
          await runTerminal(this);
          break;
        case 'install':
          this.screen.print('Game-Maker SE 3.00 is already installed in C:\\GM.\nType GM to start it.\n');
          break;
        case 'game': {
          this.opts.onDriveAccess?.(ref.diskId ? 'A' : this.shell.drive);
          const files = new GameFiles(await ref.files());
          await this.playGame(files, ref.gam, ref.title, ref.notice);
          break;
        }
        case 'batch':
          for (const l of ref.lines) await this.shell.execute(l);
          break;
      }
    } finally {
      this.busy = false;
      this.screen.resetPalette();
      this.setMode('text');
    }
  }

  playGame(files: GameFiles, gam: string, title: string, notice?: string): Promise<void> {
    this.unlockAudio();
    this.keys.enabled = false;
    this.setMode('game');
    const host = h('div', { class: 'crt-game' });
    clear(this.layer, host);
    this.opts.onGame?.({ files, gam, title });
    return new Promise<void>((resolve) => {
      mountPlayer(host, files, gam, {
        title,
        notice,
        autoStart: true,
        noKeysButton: true,
        exactPixels: true, // the monitor's size is never a whole multiple of 320x200
        speed: this.opts.speed,
        onQuit: () => false, // back to DOS
        onExit: () => {
          this.opts.onGame?.(undefined);
          clear(this.layer);
          this.keys.enabled = true;
          this.keys.clear();
          resolve();
        },
      });
    });
  }

  openEditor(project: Project, fileName: string, program: string): Promise<void> {
    this.setMode('gfx');
    this.keys.enabled = false;
    return new Promise<void>((resolve) => {
      let cleanup: void | (() => void);
      const close = () => {
        if (typeof cleanup === 'function') cleanup();
        window.removeEventListener('keydown', onKey, true);
        clear(this.layer);
        this.keys.enabled = true;
        this.keys.clear();
        this.setMode('text');
        resolve();
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          close();
        }
      };
      window.addEventListener('keydown', onKey, true);
      const body = h('div', { class: 'vga-body' });
      clear(
        this.layer,
        h(
          'div',
          { class: 'vga-editor' },
          h(
            'div',
            { class: 'vga-titlebar' },
            h('span', null, `${program}  ·  ${fileName.toUpperCase()}`),
            h('span', { class: 'spacer' }),
            h('button', { onclick: () => this.openModern(project.id, fileName), title: 'Open this file in today’s web editor' }, '⤢ Today’s web'),
            h('button', { onclick: close }, 'Quit (Esc)'),
          ),
          body,
        ),
      );
      const editor = editors[kindOf(fileName)] ?? fileInfo;
      cleanup = editor(body, project, fileName);
    });
  }

  /** Switches the monitor to VGA mode 13h (clearing video memory, as setting the mode did). */
  graphMode(): Vga {
    this.keys.enabled = false;
    if (this.vgaScreen) this.vgaScreen.mem.fill(0);
    else {
      const holder = h('div', { class: 'crt-vga' });
      clear(this.layer, holder);
      this.vgaScreen = new Vga(holder);
    }
    this.setMode('vga');
    this.vgaScreen.canvas.focus();
    return this.vgaScreen;
  }

  /** Back to 80x25 text mode: a blank screen in Game-Maker's text colors. */
  textMode(): void {
    this.vgaScreen?.destroy();
    this.vgaScreen = undefined;
    clear(this.layer);
    this.screen.gameMakerColors();
    this.screen.clear(attr(7, 0));
    this.keys.enabled = true;
    this.keys.clear();
    this.setMode('text');
  }

  openModern(projectId: string, fileName?: string): void {
    this.opts.openModern(projectId, fileName);
  }

  /** Makes the disk in A: editable, formatting blank disks and copying originals. */
  async writableProject(): Promise<Project | undefined> {
    const d = this.inserted;
    if (!d) {
      await errorBox(this, 'Drive A: is empty.', 'Choose a disk from the disk box.  (C)ontinue');
      return undefined;
    }
    if (d.disk.kind === 'blank') {
      const r = await errorBox(this, 'The disk in drive A: is not formatted.', '(F)ormat it for a new game   (E)xit');
      if (r !== 'F' && r !== 'Enter') return undefined;
      const name = (await askText(this, 'Name of your new game:', 19, 'My Game'))?.trim();
      if (!name) return undefined;
      const project = Project.create(name);
      await project.saveNow();
      await this.swapInProject(project);
      return project;
    }
    if (d.disk.writeProtected) return this.copyToHardDisk(d.disk.title, d.files, d.disk.gam, d.disk.catalog?.id, `${d.disk.title}: the disk is write-protected.`);
    const stored = d.disk.projectId ? await loadProject(d.disk.projectId) : undefined;
    if (!stored) return undefined;
    const project = Project.fromFiles(stored.files, stored.record.name, d.disk.projectId);
    project.gam = stored.record.gam;
    d.files = project.files;
    return project;
  }

  // ---- game folders -----------------------------------------------------------------

  workDir(): { drive: string; parts: string[] } {
    return { drive: this.shell.drive, parts: this.shell.cwdOf(this.shell.drive) };
  }

  /** The game in a folder (A:\, C:\GM\X, C:\DOWNLOAD\X, D:\GM\X, D:\GAMEWARE\X). */
  async gameIn(drive: string, parts: string[]): Promise<FolderGame | undefined> {
    const path = `${drive}:\\${parts.join('\\')}`;
    this.opts.onDriveAccess?.(drive);
    if (drive === 'A' && !parts.length) {
      const d = this.inserted;
      if (!d || d.disk.kind === 'blank') return undefined;
      return { title: d.disk.title, files: d.files, where: path, kind: 'disk' };
    }
    const [top, dir] = parts;
    if (parts.length !== 2 || !dir) return undefined;
    const cat = await this.catalog();
    if (drive === 'C' && top === 'GM') {
      const g = (await this.hdGames()).find((x) => x.dir === dir);
      return g ? { title: g.title, files: await hdFiles(g), where: path, kind: 'hd', hd: g } : undefined;
    }
    if (drive === 'C' && top === 'DOWNLOAD') {
      const g = cat.find((c) => c.id.toUpperCase() === dir && this.downloads.has(c.id));
      return g ? { title: g.title, files: new GameFiles(await this.catalogFiles(g)), where: path, kind: 'shareware', notice: g.notice } : undefined;
    }
    if (drive === 'D' && this.cdIn && (top === 'GAMEWARE' || top === 'GM')) {
      const g = cat.find((c) => c.kind === 'gameware' && c.id.toUpperCase() === dir);
      return g ? { title: g.title, files: new GameFiles(await this.catalogFiles(g)), where: path, kind: 'cd', catalogId: g.id } : undefined;
    }
    return undefined;
  }

  /** A project for editing the game in a folder: copies read-only games to the hard disk first. */
  async editableGameIn(drive: string, parts: string[]): Promise<Project | undefined> {
    if (drive === 'A') return this.writableProject();
    const g = await this.gameIn(drive, parts);
    if (!g) {
      await errorBox(this, `There is no game in ${drive}:\\${parts.join('\\')}.`, 'Type MD C:\\GM\\NAME at the DOS prompt to make one.  (C)ontinue');
      return undefined;
    }
    if (g.kind === 'hd') return hdProject(g.hd!);
    if (g.kind === 'shareware') {
      await errorBox(this, `${g.title} is shareware: it can be played, not changed.`, 'Register it with its author!  (C)ontinue');
      return undefined;
    }
    const gam = g.files.mainGame();
    return this.copyToHardDisk(g.title, g.files, gam, g.catalogId, `${g.where} is on the CD-ROM, which can't be changed.`);
  }

  /** Copies a game into C:\GM (or into its installed folder, if it is one of those). */
  private async copyToHardDisk(title: string, files: GameFiles, gam: string | undefined, catalogId: string | undefined, why: string): Promise<Project | undefined> {
    const installed = catalogId ? (await this.hdGames()).find((x) => x.source === 'installed' && x.catalog?.id === catalogId) : undefined;
    const dir = installed?.dir ?? dosDirName(gam ?? title);
    const r = await errorBox(this, why, `(C)opy it to C:\\GM\\${dir} on the hard disk   (E)xit`);
    if (r !== 'C' && r !== 'Enter') return undefined;
    if (installed) return hdProject(installed);
    const project = Project.fromFiles(new GameFiles(files.entries()), title);
    if (gam) project.gam = gam;
    await project.saveNow();
    this.opts.onDisksChanged?.();
    return project;
  }

  /** MD C:\GM\NAME makes a new game folder; nothing else can be created here. */
  async makeDir(drive: string, parts: string[]): Promise<string | undefined> {
    if (drive !== 'C' || parts.length !== 2 || parts[0] !== 'GM' || !/^[A-Z0-9_]{1,8}$/.test(parts[1])) {
      return 'Unable to create directory (make game folders as C:\\GM\\NAME, up to 8 letters)';
    }
    if ((await this.hdGames()).some((g) => g.dir === parts[1])) return 'Directory already exists';
    await this.newGameFolder(parts[1]);
    return undefined;
  }

  async newGameFolder(dir: string, title?: string): Promise<Project> {
    const p = await makeGameFolder(dir, title ?? dir);
    this.opts.onDisksChanged?.();
    return p;
  }

  async restoreGame(g: HdGame): Promise<void> {
    await restoreInstalled(g);
  }

  /** Utilities > Transfer: puts a stand-alone copy of a game on the blank disk in A:. */
  async transferToFloppy(game: FolderGame): Promise<boolean> {
    const d = this.inserted;
    if (!d) {
      await errorBox(this, "I can't access the disk!  Did you remember to insert one?", 'Put a blank disk from the disk box in drive A:.  (C)ontinue');
      return false;
    }
    if (d.disk.kind !== 'blank') {
      await errorBox(this, `The disk in drive A: (${d.disk.title}) isn't blank.`, 'Put a blank disk from the disk box in drive A:.  (C)ontinue');
      return false;
    }
    const project = Project.fromFiles(new GameFiles(game.files.entries()), game.title);
    const gam = game.files.mainGame();
    if (gam) project.gam = gam;
    await project.saveNow();
    await this.swapInProject(project);
    const r = await errorBox(this, 'Transfer Done!', '(D)ownload it too, to run in DOSBox   (C)ontinue');
    if (r === 'D' && gam) {
      try {
        const { name, zip } = await exportDos(project.files, { title: game.title, gam });
        download(name, zip, 'application/zip');
      } catch (e) {
        await errorBox(this, (e as Error).message.slice(0, 70), '(C)ontinue');
      }
    }
    return true;
  }

  private async swapInProject(project: Project): Promise<void> {
    this.inserted = {
      disk: {
        id: `project:${project.id}`,
        kind: 'project',
        title: project.name,
        label: project.name,
        color: '#d8d2c0',
        stripe: '#1565c0',
        density: 'HD',
        gam: project.gam,
        bytes: 0,
        writeProtected: false,
        projectId: project.id,
        load: async () => project.files,
      },
      files: project.files,
    };
    this.opts.onDisksChanged?.(`project:${project.id}`);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
