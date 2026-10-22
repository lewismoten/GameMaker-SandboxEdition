// The retro PC's parts and its drives: the screen modes, the keyboard queue, and the file
// system with A: (the floppy in the drive), C: (the hard disk, with Game-Maker installed
// and your games) and D: (the Game-Maker CD), filled lazily from the game files.
// The PC is one class in layers, each extending the one before: drives -> folders (game
// folders on the disks) -> Computer (power, running programs, in computer.ts).
import { TextScreen } from '../text/textScreen';
import { TextKeys } from '../text/textInput';
import { Shell } from '../dos/shell';
import { FileSystem, file, folder, liveFolder, textFile, type DosNode, type ProgramRef } from '../dos/vfs';
import { hardDiskGames, hdFiles, type HdGame } from '../dos/hardDisk';
import { Downloads, type InsertedDisk } from '../host';
import type { Disk } from '../dos/disks';
import { loadCatalog, loadHostedGame, type CatalogEntry, GameFiles } from '../../project/files';
import { Vga } from '../../vga/shared/vga';
import { h } from '../../editor/core/ui';
import type { GmInstallEntry } from '../../../scripts/cdGames';
import { MonitorMode, ComputerOptions, AUTOEXEC, CONFIG_SYS } from './setup';
import bbsGifs from '../bbs/gallery.json';

export abstract class ComputerDrives {
  // Defined by a later layer (see the chain in the header comment).
  abstract run(ref: ProgramRef, _args: string[]): Promise<void>;
  abstract makeDir(drive: string, parts: string[]): Promise<string | undefined>;

  readonly screen: TextScreen;
  readonly keys = new TextKeys();
  readonly fs = new FileSystem();
  readonly downloads = new Downloads();
  readonly shell: Shell;
  protected inserted?: InsertedDisk;
  protected cdIn = false;
  protected textEl: HTMLCanvasElement;
  protected layer: HTMLElement;
  protected vgaScreen?: Vga;
  protected mode: MonitorMode = 'off';
  protected gmIndex?: Promise<GmInstallEntry[]>;
  protected gmFiles = new Map<string, Promise<Uint8Array | undefined>>();
  protected audioCtx?: AudioContext;
  busy = false;
  powered = false;

  constructor(
    readonly monitor: HTMLElement,
    protected opts: ComputerOptions,
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

  protected setMode(mode: MonitorMode): void {
    this.mode = mode;
    this.monitor.dataset.mode = mode;
    this.textEl.hidden = mode !== 'text' && mode !== 'off';
    this.layer.hidden = mode === 'text' || mode === 'off';
    this.opts.onModeChange?.(mode);
    if (mode === 'text') queueMicrotask(() => this.textEl.focus());
  }

  // ---- power ------------------------------------------------------------------------

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

  protected buildDrives(): void {
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
          nodes.unshift(
            file(exe, 160_598, {
              run: { kind: 'game', title: d.disk.title, gam: d.disk.gam, files: async () => new Map(d.files.entries()), diskId: d.disk.id, saveId: d.disk.id.startsWith('cd:') ? `game:${d.disk.id.slice(3)}` : undefined },
            }),
          );
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
          ['COMMAND.COM', 'HIMEM.SYS', 'EMM386.EXE', 'MSCDEX.EXE', 'DOSKEY.COM', 'MOUSE.COM', 'MEM.EXE', 'EDIT.COM'].map((n) =>
            file(n, 20_000 + n.length * 1357),
          ),
        ),
        folder('CDROM', () => [file('CDROM.SYS', 18_432)]),
        liveFolder('GM', () => this.gmFolder(true)),
        folder('COMM', () => [
          file('TERMINAL.EXE', 211_340, { run: { kind: 'terminal' } }),
          file('VPIC.EXE', 77_221, { run: { kind: 'vpic' } }),
          textFile(
            'PHONE.LST',
            'THE -= S A N D B O X =- BBS  1-412-555-SAND  14400 N81  Renegade\nTHE SOFA                     1-412-555-0177  14400 N81  Major BBS, 8 lines\n',
          ),
        ]),
        liveFolder('DOWNLOAD', async () => {
          const cat = await this.catalog();
          const dl = this.downloads;
          return dl.list().flatMap((id) => {
            const g = cat.find((c) => c.id === id);
            if (!g) return [];
            // DEL takes files out one by one; RD removes the emptied folder (and the download)
            const gone = (n: DosNode) => {
              n.remove = () => dl.deleteFile(id, n.name);
              return !dl.isDeleted(id, n.name);
            };
            const node = liveFolder(g.id, async () =>
              [
                ...(g.exe
                  ? [
                      file(g.exe, 155_156, {
                        run: { kind: 'game', title: g.title, gam: g.gam!, files: () => this.catalogFiles(g), notice: g.notice, saveId: `game:${g.id}` } as ProgramRef,
                      }),
                    ]
                  : []),
                ...(await gameFolder(g).list!()),
              ].filter(gone),
            );
            node.remove = () => dl.remove(id);
            return [node];
          });
        }),
        // pictures from the BBS's GIF Gallery; the folder is made with the first one
        ...(this.downloads.hasDir('IMAGES') || bbsGifs.some((f) => this.downloads.has(f.name))
          ? [
              Object.assign(
                liveFolder('IMAGES', () =>
                  bbsGifs
                    .filter((f) => this.downloads.has(f.name))
                    .map((f) =>
                      file(f.name, f.bytes, {
                        read: () => fetch(`./bbs/${f.name}`).then(async (r) => (r.ok ? new Uint8Array(await r.arrayBuffer()) : new Uint8Array())),
                        remove: () => this.downloads.remove(f.name),
                      }),
                    ),
                ),
                { remove: () => this.downloads.setDir('IMAGES', false) },
              ),
            ]
          : []),
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
          textFile(
            'README.TXT',
            'Game-Maker: Sandbox Edition 3.00\nBased on Game-Maker 3.00 by\nRecreational Software Designs, 1994\n\nGame-Maker is already installed in C:\\GM. Type GM to start it.\n',
          ),
        ];
      },
    });
  }

  protected gmIndexList(): Promise<GmInstallEntry[]> {
    return (this.gmIndex ??= fetch('./gm/index.json')
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []));
  }

  /** The game folders in C:\GM: installed with Game-Maker, plus yours. */
  async hdGames(): Promise<HdGame[]> {
    const index = await this.gmIndexList();
    return hardDiskGames(
      await this.catalog(),
      index.filter((e) => e.dir).map((e) => e.name),
    );
  }

  /** C:\GM (hard disk, with your games and changes) or D:\GM (the CD, as shipped). */
  protected async gmFolder(hardDisk: boolean): Promise<DosNode[]> {
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

  protected catalogFileCache = new Map<string, Promise<Map<string, Uint8Array>>>();
  protected catalogFiles(g: CatalogEntry): Promise<Map<string, Uint8Array>> {
    let p = this.catalogFileCache.get(g.id);
    if (!p) {
      p = loadHostedGame(g).then((f) => new Map(f.entries()));
      this.catalogFileCache.set(g.id, p);
    }
    return p;
  }

  catalog(): Promise<CatalogEntry[]> {
    // not kept here: loadCatalog keeps it, and forgets it when a secret game is revealed or hidden again
    return loadCatalog().catch(() => []);
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
}
