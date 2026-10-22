// COMMAND.COM for the retro PC: the C:\> prompt, built-in commands, and running
// programs found in the current folder or on the PATH. This is the port's own stand-in
// for MS-DOS, not a port of Game-Maker code; it imitates DOS 6.22 messages.
import type { TextScreen } from '../text/textScreen';
import { readLine, type TextKeys } from '../text/textInput';
import { commas, deskDate, dirLine, dirWide, dosMatch, resolvePath, splitName, type DosNode, type FileSystem, type ProgramRef } from './vfs';
import { toCp437 } from '../text/cp437';

export interface ShellHost {
  screen: TextScreen;
  keys: TextKeys;
  fs: FileSystem;
  /** Runs a program; the shell waits until it returns. */
  run(ref: ProgramRef, args: string[], at: { drive: string; parts: string[] }): Promise<void>;
  /** MD: returns an error message, or undefined when the folder was made. */
  makeDir?(drive: string, parts: string[]): Promise<string | undefined>;
}

// The fixed search path, and the extensions a program may have.
const PATH = ['C:\\DOS', 'C:\\GM', 'C:\\COMM'];
const EXTS = ['COM', 'EXE', 'BAT'];

export class Shell {
  drive = 'C';
  // Like DOS, each drive remembers its own current folder (path parts below the root).
  private cwd = new Map<string, string[]>();
  private history: string[] = [];
  private host: ShellHost;
  private stopped = false;

  constructor(host: ShellHost) {
    this.host = host;
  }

  private get screen(): TextScreen {
    return this.host.screen;
  }

  cwdOf = (d: string): string[] => this.cwd.get(d) ?? [];

  get prompt(): string {
    return `${this.drive}:\\${this.cwdOf(this.drive).join('\\')}>`;
  }

  private out(text = ''): void {
    this.screen.print(toCp437(text) + '\n');
  }

  stop(): void {
    this.stopped = true;
  }

  async loop(): Promise<void> {
    this.stopped = false;
    while (!this.stopped) {
      this.screen.cursorVisible = true;
      this.screen.print(this.prompt);
      const line = await readLine(this.screen, this.host.keys, this.history);
      this.screen.print('\n');
      if (this.stopped) break;
      if (line) await this.execute(line);
      if (this.screen.cursorX !== 0) this.screen.print('\n');
      this.out();
    }
  }

  async execute(line: string): Promise<void> {
    const trimmed = line.trim();
    if (!trimmed) return;
    // "A:" alone switches drives.
    if (/^[A-Za-z]:$/.test(trimmed)) return this.changeDrive(trimmed[0].toUpperCase());
    // Built-ins may be followed directly by a path or switch: "CD..", "DIR/W", "CD\GM".
    const b = /^(dir|cd|chdir|md|mkdir|rd|rmdir|del|erase|cls|ver|vol|type|echo|mem|date|time|help|path|\?)(?=$|[\s.\\/])(.*)$/i.exec(trimmed);
    // Anything that is not a built-in is a program name; its arguments are the words after it.
    const cmd = b ? b[1].toUpperCase() : '';
    const rest = b ? b[2].trim() : trimmed.split(/\s+/).slice(1).join(' ');
    const args = rest ? rest.split(/\s+/) : [];
    switch (cmd) {
      case 'DIR':
        return this.dir(args);
      case 'CD':
      case 'CHDIR':
        return this.cd(rest);
      case 'MD':
      case 'MKDIR':
        return this.md(rest);
      case 'RD':
      case 'RMDIR':
        return this.rd(rest);
      case 'DEL':
      case 'ERASE':
        return this.del(args);
      case 'CLS':
        this.screen.clear();
        return;
      case 'VER':
        this.out('DOS Version 6.22');
        return;
      case 'VOL':
        return this.vol(this.drive);
      case 'TYPE':
        return this.type(rest);
      case 'ECHO':
        this.out(rest);
        return;
      case 'MEM':
        this.out('Memory Type        Total  =   Used  +   Free');
        this.out('----------------  -------   -------   -------');
        this.out('Conventional         640K       73K      567K');
        this.out('Extended (XMS)     3,072K      384K    2,688K');
        this.out();
        this.out('Largest executable program size        567K (580,112 bytes)');
        return;
      case 'DATE':
        this.out(`Current date is ${deskDate().toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit', year: 'numeric' }).replace(',', '')}`);
        return;
      case 'TIME':
        this.out(`Current time is ${new Date().toLocaleTimeString('en-US')}`);
        return;
      case 'HELP':
      case '?':
        return this.help();
      case 'PATH':
        this.out(`PATH=${PATH.join(';')}`);
        return;
    }
    // EGG.EXE answers from anywhere, though no folder lists it and HELP never mentions it
    if (/^(?:[a-z]:)?\\?egg(?:\.exe)?$/i.test(trimmed.split(/\s+/)[0])) {
      this.screen.cursorVisible = false;
      await this.host.run({ kind: 'egg' }, args, { drive: this.drive, parts: this.cwdOf(this.drive) });
      this.screen.cursorVisible = true;
      return;
    }
    const prog = await this.findProgram(trimmed.split(/\s+/)[0]);
    if (!prog) {
      this.out('Bad command or file name');
      return;
    }
    this.screen.cursorVisible = false;
    await this.host.run(prog.node.run!, args, prog.at);
    this.screen.cursorVisible = true;
  }

  private async changeDrive(d: string): Promise<void> {
    if (!this.host.fs.drives.has(d)) {
      this.out('Invalid drive specification');
      return;
    }
    const root = await this.host.fs.drives.get(d)!.root();
    // A null root is an empty drive (no disk), answered with DOS's critical error text.
    if (root === null) {
      this.out(`Not ready reading drive ${d}`);
      this.out('Abort, Retry, Fail?F');
      return;
    }
    this.drive = d;
  }

  private async vol(d: string): Promise<void> {
    const drv = this.host.fs.drives.get(d);
    this.out(` Volume in drive ${d} ${drv?.label ? `is ${drv.label}` : 'has no label'}`);
    this.out(` Volume Serial Number is 1994-0${d.charCodeAt(0) - 64}20`);
  }

  private async dir(args: string[]): Promise<void> {
    const wide = args.some((a) => /^\/W$/i.test(a));
    const pause = args.some((a) => /^\/P$/i.test(a));
    const target = args.find((a) => !a.startsWith('/')) ?? '';
    let { drive, parts } = resolvePath(target, this.drive, this.cwdOf);
    let pattern: RegExp | undefined;
    let list = await this.host.fs.listDir(drive, parts);
    // When the last part is not a folder but looks like a wildcard or file name, list its
    // parent folder filtered by it (* any run of characters, ? one character).
    if (list === undefined && parts.length && /[*?.]/.test(parts[parts.length - 1])) {
      // DIR *.GAM
      const glob = parts.pop()!;
      pattern = new RegExp(`^${glob.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.')}$`);
      list = await this.host.fs.listDir(drive, parts);
    }
    if (list === null) {
      this.out(`Not ready reading drive ${drive}`);
      return;
    }
    if (list === undefined) {
      this.out('File not found');
      return;
    }
    const items = list.filter((n) => !pattern || pattern.test(n.name));
    await this.vol(drive);
    this.out(` Directory of ${drive}:\\${parts.join('\\')}`);
    this.out();
    const lines: string[] = [];
    // Folders below the root list the . and .. entries first.
    if (parts.length) lines.push(...(['.', '..'].map((n) => (wide ? `[${n}]`.padEnd(16) : dirLine({ name: n, dir: true, size: 0, date: new Date(1994, 9, 20, 11, 42) })))));
    // DIR /W: names in five 16-column cells a line.
    if (wide) {
      const cells = [...lines.splice(0), ...items.map(dirWide)];
      for (let i = 0; i < cells.length; i += 5) lines.push(cells.slice(i, i + 5).join('').trimEnd());
    } else lines.push(...items.map(dirLine));
    let shown = 0;
    for (const l of lines) {
      this.out(l);
      if (pause && ++shown % 20 === 0) {
        this.out('Press any key to continue . . .');
        await this.host.keys.next();
      }
    }
    const files = items.filter((n) => !n.dir);
    const total = files.reduce((n, f) => n + f.size, 0);
    this.out(`${String(files.length).padStart(9)} file(s)${commas(total).padStart(15)} bytes`);
    this.out(`${' '.repeat(18)}${commas(this.host.fs.drives.get(drive)?.free ?? 0).padStart(15)} bytes free`);
  }

  private async cd(arg: string): Promise<void> {
    if (!arg) {
      this.out(`${this.drive}:\\${this.cwdOf(this.drive).join('\\')}`);
      return;
    }
    const { drive, parts } = resolvePath(arg, this.drive, this.cwdOf);
    const node = await this.host.fs.find(drive, parts);
    if (node === null) this.out(`Not ready reading drive ${drive}`);
    else if (!node?.dir) this.out('Invalid directory');
    else this.cwd.set(drive, parts);
  }

  private async md(arg: string): Promise<void> {
    if (!arg) {
      this.out('Required parameter missing');
      return;
    }
    const { drive, parts } = resolvePath(arg, this.drive, this.cwdOf);
    if (await this.host.fs.find(drive, parts)) {
      this.out('Directory already exists');
      return;
    }
    const err = this.host.makeDir ? await this.host.makeDir(drive, parts) : 'Unable to create directory';
    if (err) this.out(err);
  }

  /** DEL / ERASE: files matching a name or wildcard; a folder (or *.*) asks first. */
  private async del(args: string[]): Promise<void> {
    const target = args.find((a) => !a.startsWith('/'));
    if (!target) {
      this.out('Required parameter missing');
      return;
    }
    const { drive, parts } = resolvePath(target, this.drive, this.cwdOf);
    const node = await this.host.fs.find(drive, parts);
    if (node === null) {
      this.out(`Not ready reading drive ${drive}`);
      return;
    }
    // DEL FOLDER means every file in it
    const pattern = node?.dir ? '*.*' : (parts.pop() ?? '*.*');
    const list = await this.host.fs.listDir(drive, parts);
    const files = (list ?? []).filter((n) => !n.dir && dosMatch(pattern, n.name));
    if (!files.length) {
      this.out('File not found');
      return;
    }
    if (pattern === '*.*') {
      this.out('All files in directory will be deleted!');
      this.screen.print('Are you sure (Y/N)?');
      const yes = ((await readLine(this.screen, this.host.keys, [], 1)) ?? '').trim().toUpperCase() === 'Y';
      this.screen.print('\n');
      if (!yes) return;
    }
    let denied = false;
    for (const f of files) {
      if (f.remove) await f.remove();
      else denied = true;
    }
    if (denied) this.out('Access denied');
  }

  /** RD / RMDIR: an empty folder. */
  private async rd(arg: string): Promise<void> {
    if (!arg) {
      this.out('Required parameter missing');
      return;
    }
    const { drive, parts } = resolvePath(arg, this.drive, this.cwdOf);
    const node = parts.length ? await this.host.fs.find(drive, parts) : undefined;
    const cwd = this.cwdOf(drive);
    if (node?.dir && parts.length <= cwd.length && parts.every((p, i) => cwd[i] === p)) {
      this.out(`Attempt to remove current directory - ${arg}`);
      return;
    }
    if (!node?.dir || (await node.list?.())?.length) {
      this.out('Invalid path, not directory,');
      this.out('or directory not empty');
      return;
    }
    if (node.remove) await node.remove();
    else this.out('Access denied');
  }

  private async type(arg: string): Promise<void> {
    if (!arg) {
      this.out('Required parameter missing');
      return;
    }
    const { drive, parts } = resolvePath(arg, this.drive, this.cwdOf);
    const node = await this.host.fs.find(drive, parts);
    if (!node || node.dir || !node.read) {
      this.out('File not found');
      return;
    }
    const bytes = await node.read();
    let text = '';
    // Ctrl-Z (0x1A) ends a DOS text file; CRs are dropped so CR LF prints as one line break.
    for (const b of bytes) {
      if (b === 0x1a) break;
      if (b !== 13) text += String.fromCharCode(b);
    }
    this.screen.print(text.endsWith('\n') ? text : text + '\n');
  }

  private help(): void {
    for (const l of [
      'DIR [path] [/W] [/P]   List files          CD [path]   Change folder',
      'MD C:\\GM\\name        Make a folder for a new game',
      'A:  C:  D:             Change drive         TYPE file   Show a text file',
      'DEL file (*.GIF)       Delete files        RD [path]   Remove an empty folder',
      'CLS  VER  VOL  MEM  DATE  TIME  PATH',
      '',
      'GM          Start Game-Maker SE',
      'PLAYGAME    Play a Game-Maker game',
      'TERMINAL    Dial BBSes to download shareware',
      'VPIC        View a GIF or JPEG picture (VPIC \\IMAGES\\TEDDY.GIF)',
      'A:\\<game>   Run the game on the disk in drive A:',
    ])
      this.out(l);
  }

  /**
   * Finds a program: NAME.EXT exactly when an extension is typed, otherwise NAME.COM, NAME.EXE
   * or NAME.BAT. A word with a drive or backslash searches only that folder; a bare name
   * searches the current folder, then each PATH folder in order. Only nodes that can run match.
   */
  private async findProgram(word: string): Promise<{ node: DosNode; at: { drive: string; parts: string[] } } | undefined> {
    const { drive, parts } = resolvePath(word, this.drive, this.cwdOf);
    const name = parts.pop() ?? '';
    const [base, ext] = splitName(name);
    // Like COMMAND.COM: within one folder FOO.COM beats FOO.EXE beats FOO.BAT (EXTS order),
    // and the current folder is searched before each PATH entry.
    const names = ext ? [name] : EXTS.map((e) => `${base}.${e}`);
    const where = word.includes('\\') || word.includes(':') ? [{ drive, parts }] : [{ drive, parts }, ...PATH.map((p) => resolvePath(p, 'C', this.cwdOf))];
    for (const w of where) {
      const list = await this.host.fs.listDir(w.drive, w.parts).catch(() => undefined);
      const node = names.map((want) => list?.find((n) => n.name === want && n.run)).find(Boolean);
      if (node) return { node, at: w };
    }
    return undefined;
  }
}
