// A read-only disk image written in plain JavaScript: an ISO 9660 file system with Rock
// Ridge extensions, which macOS mounts when it is opened (as a .dmg, too: DiskImageMounter
// takes a raw CD image). Rock Ridge keeps what a Mac app needs and plain ISO 9660 cannot
// store: long, mixed-case names (NM), Unix permissions so the program is executable (PX),
// and symbolic links (SL), for the "Applications" shortcut a game is dragged onto.
//
// Layout (ECMA-119; Rock Ridge is IEEE P1282 on SUSP, IEEE P1281): 2048-byte sectors;
// sectors 0-15 unused, 16 the primary volume descriptor, 17 the terminator, then the path
// tables (little- and big-endian), every directory, and the files' data. Numbers are mostly
// stored "both-endian" (little-endian then big-endian). Names in the plain ISO records are
// made-up 8.3 names; systems that read Rock Ridge show the NM names instead.

export interface IsoEntry {
  /** Path inside the image, '/'-separated, without a leading '/'. Folders are implied. */
  path: string;
  /** File contents (none for a symbolic link). */
  data?: Uint8Array;
  /** Unix permission bits (default 0o644 for files, 0o755 for folders). */
  mode?: number;
  /** Makes this entry a symbolic link to the given path. */
  symlink?: string;
}

export interface IsoOptions {
  /** The volume's name, shown under the mounted disk (up to 32 characters). */
  volume: string;
  date?: Date;
  /** Who made the image (the volume descriptor's application field). */
  application?: string;
}

const SECTOR = 2048;

interface Node {
  name: string;
  isoName: string;
  dir: boolean;
  mode: number;
  data?: Uint8Array;
  symlink?: string;
  children: Node[];
  parent?: Node;
  /** Directories: number in the path table (1 = root). */
  number?: number;
  lba: number;
  size: number;
}

const enc = new TextEncoder();

function both16(dv: DataView, at: number, v: number): void {
  dv.setUint16(at, v, true);
  dv.setUint16(at + 2, v, false);
}

function both32(dv: DataView, at: number, v: number): void {
  dv.setUint32(at, v, true);
  dv.setUint32(at + 4, v, false);
}

/** A d-character (A-Z, 0-9, _) version of a name, for the plain ISO 9660 record. */
function dChars(s: string, max: number): string {
  return (
    s
      .toUpperCase()
      .replace(/[^A-Z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, max) || 'X'
  );
}

/** Unique 8.3 names for a folder's entries (folders without an extension or version). */
function assignIsoNames(nodes: Node[]): void {
  const used = new Set<string>();
  for (const n of nodes) {
    const dot = n.name.lastIndexOf('.');
    const base = dChars(dot > 0 ? n.name.slice(0, dot) : n.name, 8);
    const ext = dot > 0 && !n.dir ? dChars(n.name.slice(dot + 1), 3) : '';
    let name = base;
    for (let i = 1; used.has(name + '.' + ext); i++) name = base.slice(0, 8 - String(i).length - 1) + '~' + i;
    used.add(name + '.' + ext);
    n.isoName = n.dir ? name : `${name}.${ext};1`;
  }
}

// System Use entries (SUSP / Rock Ridge): two letters, length, version 1, then the fields.
function sue(sig: string, body: number[]): number[] {
  return [sig.charCodeAt(0), sig.charCodeAt(1), 4 + body.length, 1, ...body];
}

function both32Bytes(v: number): number[] {
  return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, v >>> 24, v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
}

/** PX: mode, links, user, group (RRIP 1.09: 32 bytes of fields). */
function px(mode: number, links: number): number[] {
  return sue('PX', [...both32Bytes(mode), ...both32Bytes(links), ...both32Bytes(0), ...both32Bytes(0)]);
}

function nm(name: string): number[] {
  return sue('NM', [0, ...enc.encode(name)]);
}

/** SL: the link's path as components ("/" makes the first one the root). */
function sl(target: string): number[] {
  const parts = target.split('/');
  const comps: number[] = [];
  parts.forEach((p, i) => {
    if (p === '' && i === 0) comps.push(0x08, 0);
    else if (p === '.') comps.push(0x02, 0);
    else if (p === '..') comps.push(0x04, 0);
    else if (p !== '') {
      const b = enc.encode(p);
      comps.push(0, b.length, ...b);
    }
  });
  return sue('SL', [0, ...comps]);
}

// RR: which Rock Ridge entries follow (PX 1, PN 2, SL 4, NM 8 ...), for older readers.
const rr = (flags: number) => sue('RR', [flags]);

const ER_ID = 'RRIP_1991A';
const ER_DES = 'THE ROCK RIDGE INTERCHANGE PROTOCOL PROVIDES SUPPORT FOR POSIX FILE SYSTEM SEMANTICS';
const ER_SRC = 'PLEASE CONTACT DISC PUBLISHER FOR SPECIFICATION SOURCE';

/** ER: the extension in use (only in the root's "." record). */
function er(): number[] {
  const [id, des, src] = [ER_ID, ER_DES, ER_SRC].map((s) => [...enc.encode(s)]);
  return sue('ER', [id.length, des.length, src.length, 1, ...id, ...des, ...src]);
}

/** CE: the rest of this record's System Use entries are at `lba` + `offset`, `length` bytes. */
function ce(lba: number, offset: number, length: number): number[] {
  return sue('CE', [...both32Bytes(lba), ...both32Bytes(offset), ...both32Bytes(length)]);
}

function recordDate(d: Date): number[] {
  return [d.getUTCFullYear() - 1900, d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), 0];
}

function volumeDate(d: Date): Uint8Array {
  const p = (n: number, w: number) => String(n).padStart(w, '0');
  const s = `${p(d.getUTCFullYear(), 4)}${p(d.getUTCMonth() + 1, 2)}${p(d.getUTCDate(), 2)}${p(d.getUTCHours(), 2)}${p(d.getUTCMinutes(), 2)}${p(d.getUTCSeconds(), 2)}00`;
  return Uint8Array.from([...enc.encode(s), 0]);
}

/** One directory record: the ISO fields, the name, then the System Use entries. */
function dirRecord(name: Uint8Array, lba: number, size: number, flags: number, date: Date, su: number[]): Uint8Array {
  const base = 33 + name.length + (name.length % 2 === 0 ? 1 : 0);
  const len = base + su.length + ((base + su.length) % 2);
  if (len > 255) throw new Error('A name is too long for the disk image.');
  const r = new Uint8Array(len);
  const dv = new DataView(r.buffer);
  r[0] = len;
  both32(dv, 2, lba);
  both32(dv, 10, size);
  r.set(recordDate(date), 18);
  r[25] = flags;
  both16(dv, 28, 1);
  r[32] = name.length;
  r.set(name, 33);
  r.set(su, base);
  return r;
}

function buildTree(entries: IsoEntry[]): Node {
  const root: Node = { name: '', isoName: '', dir: true, mode: 0o755, children: [], lba: 0, size: 0 };
  for (const e of entries) {
    const parts = e.path.split('/').filter(Boolean);
    let at = root;
    parts.forEach((part, i) => {
      const last = i === parts.length - 1;
      let child = at.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, isoName: '', dir: !last, mode: last ? (e.mode ?? (e.symlink !== undefined ? 0o755 : 0o644)) : 0o755, children: [], parent: at, lba: 0, size: 0 };
        at.children.push(child);
      }
      if (last) {
        child.data = e.data;
        child.symlink = e.symlink;
        if (!e.data && !e.symlink) {
          child.dir = true;
          child.mode = e.mode ?? 0o755;
        }
      }
      at = child;
    });
  }
  const walk = (n: Node) => {
    assignIsoNames(n.children);
    n.children.sort((a, b) => (a.isoName < b.isoName ? -1 : a.isoName > b.isoName ? 1 : 0));
    n.children.filter((c) => c.dir).forEach(walk);
  };
  walk(root);
  return root;
}

/** Folders, breadth first (the path table's order, which needs each parent before its children). */
function folders(root: Node): Node[] {
  const out = [root];
  for (let i = 0; i < out.length; i++) out.push(...out[i].children.filter((c) => c.dir));
  out.forEach((d, i) => (d.number = i + 1));
  return out;
}

function fileType(n: Node): number {
  return n.symlink !== undefined ? 0o120000 : n.dir ? 0o040000 : 0o100000;
}

/** A node's System Use entries in its parent's record. */
function systemUse(n: Node): number[] {
  const links = n.dir ? 2 + n.children.filter((c) => c.dir).length : 1;
  const flags = 1 | 8 | (n.symlink !== undefined ? 4 : 0);
  return [...rr(flags), ...px(fileType(n) | n.mode, links), ...nm(n.name), ...(n.symlink !== undefined ? sl(n.symlink) : [])];
}

/** The records of one directory: ".", "..", then its entries, never across a sector. */
function directoryRecords(d: Node, date: Date, erAt?: number): Uint8Array[] {
  const dirLinks = (n: Node) => 2 + n.children.filter((c) => c.dir).length;
  const parent = d.parent ?? d;
  const dotSu = d.parent ? [...rr(1), ...px(0o040000 | d.mode, dirLinks(d))] : [...sue('SP', [0xbe, 0xef, 0]), ...rr(1), ...px(0o040000 | d.mode, dirLinks(d)), ...(erAt !== undefined ? ce(erAt, 0, er().length) : [])];
  const records = [dirRecord(Uint8Array.of(0), d.lba, d.size, 2, date, dotSu), dirRecord(Uint8Array.of(1), parent.lba, parent.size, 2, date, [...rr(1), ...px(0o040000 | parent.mode, dirLinks(parent))])];
  for (const c of d.children) {
    const size = c.dir ? c.size : (c.data?.length ?? 0);
    records.push(dirRecord(enc.encode(c.isoName), c.dir || c.data?.length ? c.lba : 0, size, c.dir ? 2 : 0, date, systemUse(c)));
  }
  return records;
}

function sectorsFor(records: Uint8Array[]): number {
  let sectors = 1;
  let used = 0;
  for (const r of records) {
    if (used + r.length > SECTOR) {
      sectors++;
      used = 0;
    }
    used += r.length;
  }
  return sectors;
}

function pathTable(dirs: Node[], little: boolean): Uint8Array {
  const parts: number[] = [];
  for (const d of dirs) {
    const name = d.parent ? enc.encode(d.isoName) : Uint8Array.of(0);
    const rec = new Uint8Array(8 + name.length + (name.length % 2));
    const dv = new DataView(rec.buffer);
    rec[0] = name.length;
    dv.setUint32(2, d.lba, little);
    dv.setUint16(6, (d.parent ?? d).number!, little);
    rec.set(name, 8);
    parts.push(...rec);
  }
  return Uint8Array.from(parts);
}

function padString(s: string, len: number): Uint8Array {
  const out = new Uint8Array(len).fill(0x20);
  out.set(enc.encode(s).subarray(0, len));
  return out;
}

/** The disk image of `entries`. */
export function createIso(entries: IsoEntry[], opts: IsoOptions): Uint8Array {
  const date = opts.date ?? new Date();
  const root = buildTree(entries);
  const dirs = folders(root);
  const files: Node[] = [];
  const collect = (n: Node) => n.children.forEach((c) => (c.dir ? collect(c) : c.data?.length && files.push(c)));
  collect(root);

  // Sizes first (a record's length does not depend on where things are), then places.
  for (const d of dirs) d.size = SECTOR * sectorsFor(directoryRecords(d, date, 0));
  const ptSize = pathTable(dirs, true).length;
  const ptSectors = Math.ceil(ptSize / SECTOR);
  let lba = 18;
  const lPath = lba;
  lba += ptSectors;
  const mPath = lba;
  lba += ptSectors;
  const erAt = lba++;
  for (const d of dirs) {
    d.lba = lba;
    lba += d.size / SECTOR;
  }
  for (const f of files) {
    f.lba = lba;
    lba += Math.ceil(f.data!.length / SECTOR);
  }
  const total = lba;

  const img = new Uint8Array(total * SECTOR);
  // the primary volume descriptor
  const pvd = new DataView(img.buffer, 16 * SECTOR, SECTOR);
  const P = 16 * SECTOR;
  img[P] = 1;
  img.set(enc.encode('CD001'), P + 1);
  img[P + 6] = 1;
  img.set(padString('', 32), P + 8);
  img.set(padString(opts.volume.slice(0, 32), 32), P + 40);
  both32(pvd, 80, total);
  both16(pvd, 120, 1);
  both16(pvd, 124, 1);
  both16(pvd, 128, SECTOR);
  both32(pvd, 132, ptSize);
  pvd.setUint32(140, lPath, true);
  pvd.setUint32(148, mPath, false);
  img.set(dirRecord(Uint8Array.of(0), root.lba, root.size, 2, date, []), P + 156);
  img.set(padString('', 128), P + 190);
  img.set(padString('', 128), P + 318);
  img.set(padString('', 128), P + 446);
  img.set(padString(opts.application ?? '', 128), P + 574);
  img.set(padString('', 37), P + 702);
  img.set(padString('', 37), P + 739);
  img.set(padString('', 37), P + 776);
  img.set(volumeDate(date), P + 813);
  img.set(volumeDate(date), P + 830);
  img.set(enc.encode('0000000000000000'), P + 847);
  img.set(volumeDate(date), P + 864);
  img[P + 881] = 1;
  // the terminator
  const T = 17 * SECTOR;
  img[T] = 255;
  img.set(enc.encode('CD001'), T + 1);
  img[T + 6] = 1;

  img.set(pathTable(dirs, true), lPath * SECTOR);
  img.set(pathTable(dirs, false), mPath * SECTOR);
  img.set(er(), erAt * SECTOR);
  for (const d of dirs) {
    let at = d.lba * SECTOR;
    let used = 0;
    for (const r of directoryRecords(d, date, d.parent ? undefined : erAt)) {
      if (used + r.length > SECTOR) {
        at += SECTOR - used;
        used = 0;
      }
      img.set(r, at);
      at += r.length;
      used += r.length;
    }
  }
  for (const f of files) img.set(f.data!, f.lba * SECTOR);
  return img;
}
