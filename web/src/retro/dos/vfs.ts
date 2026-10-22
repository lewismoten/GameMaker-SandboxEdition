// A small DOS file system for the retro PC: drives of 8.3 named files and folders,
// filled lazily from game disks, the installed Game-Maker and the CD.

export interface DosNode {
  name: string; // upper case 8.3
  dir: boolean;
  size: number;
  date: Date;
  /** Folder contents (loaded on first use). */
  list?: () => Promise<DosNode[]>;
  /** File contents. */
  read?: () => Promise<Uint8Array>;
  /** Running this file starts a program (handled by the computer). */
  run?: ProgramRef;
}

export type ProgramRef =
  | { kind: 'gm' }
  | { kind: 'playgame' }
  | { kind: 'terminal' }
  | { kind: 'vpic' }
  | { kind: 'game'; title: string; gam: string; files: () => Promise<Map<string, Uint8Array>>; notice?: string; editable?: boolean; diskId?: string }
  | { kind: 'install' }
  | { kind: 'batch'; lines: string[] };

export interface Drive {
  letter: string;
  label: string;
  /** Free space for DIR. */
  free: number;
  /** null = "Not ready reading drive A". */
  root: () => Promise<DosNode[] | null>;
}

export const DOS_DATE = new Date(1994, 9, 20, 11, 42);

export function file(name: string, size: number, extra: Partial<DosNode> = {}): DosNode {
  return { name: name.toUpperCase(), dir: false, size, date: DOS_DATE, ...extra };
}

export function folder(name: string, list: () => Promise<DosNode[]> | DosNode[], date = DOS_DATE): DosNode {
  let cache: DosNode[] | undefined;
  return {
    name: name.toUpperCase(),
    dir: true,
    size: 0,
    date,
    list: async () => (cache ??= await list()),
  };
}

/** A folder whose contents can change (re-listed every time). */
export function liveFolder(name: string, list: () => Promise<DosNode[]> | DosNode[], date = DOS_DATE): DosNode {
  return { name: name.toUpperCase(), dir: true, size: 0, date, list: async () => list() };
}

export function textFile(name: string, text: string): DosNode {
  const bytes = new Uint8Array([...text.replace(/\r?\n/g, '\r\n')].map((c) => c.charCodeAt(0) & 255));
  return file(name, bytes.length, { read: async () => bytes });
}

/**
 * Resolves a DOS path ("C:\GM\SAMPLE", "..\FOO", "D:BAR") to a drive and folder
 * parts. Each drive has its own current folder, given by cwdOf.
 */
export function resolvePath(input: string, drive: string, cwdOf: (drive: string) => string[]): { drive: string; parts: string[] } {
  let rest = input.trim().toUpperCase().replace(/\//g, '\\');
  let d = drive;
  const m = /^([A-Z]):/.exec(rest);
  if (m) {
    d = m[1];
    rest = rest.slice(2);
  }
  const parts = rest.startsWith('\\') ? [] : [...cwdOf(d)];
  for (const p of rest.split('\\')) {
    if (!p || p === '.') continue;
    if (p === '..') parts.pop();
    else parts.push(p);
  }
  return { drive: d, parts };
}

export class FileSystem {
  drives = new Map<string, Drive>();
  /** Told whenever a drive is read (the desk lights that drive's LED). */
  onAccess?: (drive: string) => void;

  addDrive(d: Drive): void {
    this.drives.set(d.letter, d);
  }

  /** Finds the node at a path; undefined if missing, null if the drive is not ready. */
  async find(drive: string, parts: string[]): Promise<DosNode | null | undefined> {
    const d = this.drives.get(drive);
    if (!d) return undefined;
    this.onAccess?.(drive);
    let list = await d.root();
    if (list === null) return null;
    let node: DosNode = { name: '\\', dir: true, size: 0, date: DOS_DATE, list: async () => list! };
    for (const p of parts) {
      if (!node.dir || !node.list) return undefined;
      const children: DosNode[] = await node.list();
      const next = children.find((c) => c.name === p);
      if (!next) return undefined;
      node = next;
      list = null;
    }
    return node;
  }

  async listDir(drive: string, parts: string[]): Promise<DosNode[] | null | undefined> {
    const n = await this.find(drive, parts);
    if (n === null) return null;
    if (!n?.dir || !n.list) return undefined;
    return n.list();
  }
}

// ---- formatting ---------------------------------------------------------------

export function commas(n: number): string {
  return n.toLocaleString('en-US');
}

function dosDateText(d: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  let h = d.getHours();
  const ap = h >= 12 ? 'p' : 'a';
  h = h % 12 || 12;
  return `${two(d.getMonth() + 1)}-${two(d.getDate())}-${two(d.getFullYear() % 100)}  ${String(h).padStart(2)}:${two(d.getMinutes())}${ap}`;
}

export function splitName(name: string): [string, string] {
  if (name === '.' || name === '..') return [name, ''];
  const i = name.lastIndexOf('.');
  return i < 0 ? [name, ''] : [name.slice(0, i), name.slice(i + 1)];
}

/** One line of DIR output. */
export function dirLine(n: DosNode): string {
  const [base, ext] = splitName(n.name);
  const size = n.dir ? '<DIR>     ' : commas(n.size).padStart(10);
  return `${base.padEnd(8)} ${ext.padEnd(3)} ${size.padStart(13)} ${dosDateText(n.date)}`;
}

export function dirWide(n: DosNode): string {
  return (n.dir ? `[${n.name}]` : n.name).padEnd(16);
}
