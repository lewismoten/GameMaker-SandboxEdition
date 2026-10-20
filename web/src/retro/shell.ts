// COMMAND.COM for the retro PC: the C:\> prompt, built-in commands, and running
// programs found in the current folder or on the PATH.
import type { TextScreen } from './textScreen';
import { readLine, type TextKeys } from './textInput';
import { commas, dirLine, dirWide, resolvePath, splitName, type DosNode, type FileSystem, type ProgramRef } from './vfs';
import { toCp437 } from './cp437';

export interface ShellHost {
  screen: TextScreen;
  keys: TextKeys;
  fs: FileSystem;
  /** Runs a program; the shell waits until it returns. */
  run(ref: ProgramRef, args: string[], at: { drive: string; parts: string[] }): Promise<void>;
}

const PATH = ['C:\\DOS', 'C:\\GM', 'C:\\COMM'];
const EXTS = ['COM', 'EXE', 'BAT'];

export class Shell {
  drive = 'C';
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
    if (/^[A-Za-z]:$/.test(trimmed)) return this.changeDrive(trimmed[0].toUpperCase());
    // Built-ins may be followed directly by a path or switch: "CD..", "DIR/W", "CD\GM".
    const b = /^(dir|cd|chdir|cls|ver|vol|type|echo|mem|date|time|help|path|\?)(?=$|[\s.\\/])(.*)$/i.exec(trimmed);
    const cmd = b ? b[1].toUpperCase() : '';
    const rest = b ? b[2].trim() : trimmed.split(/\s+/).slice(1).join(' ');
    const args = rest ? rest.split(/\s+/) : [];
    switch (cmd) {
      case 'DIR':
        return this.dir(args);
      case 'CD':
      case 'CHDIR':
        return this.cd(rest);
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
        this.out(`Current date is ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit', year: 'numeric' }).replace(',', '')}`);
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
    if (parts.length) lines.push(...(['.', '..'].map((n) => (wide ? `[${n}]`.padEnd(16) : dirLine({ name: n, dir: true, size: 0, date: new Date(1994, 9, 20, 11, 42) })))));
    if (wide) {
      const cells = [...lines.splice(0), ...items.map(dirWide)];
      for (let i = 0; i < cells.length; i += 5) lines.push(cells.slice(i, i + 5).join(''));
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
    for (const b of bytes) {
      if (b === 0x1a) break;
      if (b !== 13) text += String.fromCharCode(b);
    }
    this.screen.print(text.endsWith('\n') ? text : text + '\n');
  }

  private help(): void {
    for (const l of [
      'DIR [path] [/W] [/P]   List files          CD [path]   Change folder',
      'A:  C:  D:             Change drive         TYPE file   Show a text file',
      'CLS  VER  VOL  MEM  DATE  TIME  PATH',
      '',
      'GM          Start Game-Maker (C:\\GM)',
      'PLAYGAME    Play a Game-Maker game',
      'TERMINAL    Dial the Game-Maker shareware BBS',
      'A:\\<game>   Run the game on the disk in drive A:',
    ])
      this.out(l);
  }

  /** Finds NAME, NAME.EXE/.COM/.BAT in the current folder (or the given path), then the PATH. */
  private async findProgram(word: string): Promise<{ node: DosNode; at: { drive: string; parts: string[] } } | undefined> {
    const { drive, parts } = resolvePath(word, this.drive, this.cwdOf);
    const name = parts.pop() ?? '';
    const [base, ext] = splitName(name);
    const names = ext ? [name] : EXTS.map((e) => `${base}.${e}`);
    const where = word.includes('\\') || word.includes(':') ? [{ drive, parts }] : [{ drive, parts }, ...PATH.map((p) => resolvePath(p, 'C', this.cwdOf))];
    for (const w of where) {
      const list = await this.host.fs.listDir(w.drive, w.parts).catch(() => undefined);
      const node = list?.find((n) => names.includes(n.name) && n.run);
      if (node) return { node, at: w };
    }
    return undefined;
  }
}
