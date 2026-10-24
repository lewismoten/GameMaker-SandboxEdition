// Reading and replacing the resources of a Windows program (a PE file: an .exe), in plain
// JavaScript, so the web app can make each game's program from the one player program
// (win/Player) without a compiler: winApp.ts puts in the game's page, its info, its icon
// and its version information.
//
// The resources live in one section (.rsrc), as a three-level tree of directories (type,
// name, language) whose leaves point (by RVA) at the data. This module reads every leaf,
// then writes a whole new tree with the data after it, in place of the old section. The
// section may grow: the sections after it may only be ones nothing else points into but
// its data directory entry (the base relocations, .reloc, which lld puts last), and they
// move down. The headers' sizes and the checksum are brought up to date.
//
// References: Microsoft's "PE Format" specification (the .rsrc section).

export interface PeResource {
  /** A number (3 icon, 10 RCDATA, 14 group icon, 16 version, 24 manifest) or an upper-case name. */
  type: number | string;
  name: number | string;
  lang: number;
  data: Uint8Array;
  codepage?: number;
}

interface Section {
  /** Offset of the section's 40-byte header in the file. */
  header: number;
  name: string;
  va: number;
  vsize: number;
  ptr: number;
  raw: number;
  flags: number;
}

interface PeLayout {
  /** Offset of "PE\0\0". */
  pe: number;
  machine: number;
  is64: boolean;
  /** Offset of the optional header. */
  opt: number;
  /** Offset of the data directories, and how many there are. */
  dirs: number;
  dirCount: number;
  sectionAlign: number;
  fileAlign: number;
  sections: Section[];
}

export const MACHINE_X64 = 0x8664;
export const MACHINE_ARM64 = 0xaa64;
export const RT = { ICON: 3, RCDATA: 10, GROUP_ICON: 14, VERSION: 16, MANIFEST: 24 } as const;
const DIR_RESOURCE = 2;
const DIR_SECURITY = 4;
const DIR_BASERELOC = 5;
const DIR_DEBUG = 6;

const align = (n: number, a: number) => Math.ceil(n / a) * a;

/** The headers of a PE file (throws when it is not one). */
export function peLayout(exe: Uint8Array): PeLayout {
  const dv = new DataView(exe.buffer, exe.byteOffset, exe.byteLength);
  if (exe.length < 64 || dv.getUint16(0, true) !== 0x5a4d) throw new Error('Not a Windows program (no MZ header).');
  const pe = dv.getUint32(60, true);
  if (pe + 24 > exe.length || dv.getUint32(pe, true) !== 0x00004550) throw new Error('Not a Windows program (no PE header).');
  const machine = dv.getUint16(pe + 4, true);
  const count = dv.getUint16(pe + 6, true);
  const optSize = dv.getUint16(pe + 20, true);
  const opt = pe + 24;
  const magic = dv.getUint16(opt, true);
  if (magic !== 0x10b && magic !== 0x20b) throw new Error('Unknown PE optional header.');
  const is64 = magic === 0x20b;
  const dirs = opt + (is64 ? 112 : 96);
  const dirCount = dv.getUint32(opt + (is64 ? 108 : 92), true);
  const sections: Section[] = [];
  for (let i = 0; i < count; i++) {
    const h = opt + optSize + i * 40;
    const name = String.fromCharCode(...exe.subarray(h, h + 8)).replace(/\0+$/, '');
    sections.push({
      header: h,
      name,
      vsize: dv.getUint32(h + 8, true),
      va: dv.getUint32(h + 12, true),
      raw: dv.getUint32(h + 16, true),
      ptr: dv.getUint32(h + 20, true),
      flags: dv.getUint32(h + 36, true),
    });
  }
  return { pe, machine, is64, opt, dirs, dirCount, sectionAlign: dv.getUint32(opt + 32, true), fileAlign: dv.getUint32(opt + 36, true), sections };
}

function directory(exe: Uint8Array, l: PeLayout, i: number): { rva: number; size: number } {
  if (i >= l.dirCount) return { rva: 0, size: 0 };
  const dv = new DataView(exe.buffer, exe.byteOffset, exe.byteLength);
  return { rva: dv.getUint32(l.dirs + i * 8, true), size: dv.getUint32(l.dirs + i * 8 + 4, true) };
}

const sectionAt = (l: PeLayout, rva: number) => l.sections.find((s) => rva >= s.va && rva < s.va + Math.max(s.vsize, s.raw));

/** File offset of an RVA. */
function rvaToOffset(l: PeLayout, rva: number): number {
  const s = sectionAt(l, rva);
  if (!s) throw new Error(`RVA ${rva.toString(16)} is in no section.`);
  return s.ptr + (rva - s.va);
}

/** Every resource of the program, in the order of its tree. */
export function readResources(exe: Uint8Array): PeResource[] {
  const l = peLayout(exe);
  const { rva } = directory(exe, l, DIR_RESOURCE);
  if (!rva) return [];
  const dv = new DataView(exe.buffer, exe.byteOffset, exe.byteLength);
  const base = rvaToOffset(l, rva);
  const name = (v: number): number | string => {
    if (!(v & 0x80000000)) return v & 0xffff;
    const at = base + (v & 0x7fffffff);
    const n = dv.getUint16(at, true);
    let s = '';
    for (let i = 0; i < n; i++) s += String.fromCharCode(dv.getUint16(at + 2 + i * 2, true));
    return s;
  };
  const entries = (off: number): [number | string, number][] => {
    const at = base + off;
    const n = dv.getUint16(at + 12, true) + dv.getUint16(at + 14, true);
    return Array.from({ length: n }, (_, i) => [name(dv.getUint32(at + 16 + i * 8, true)), dv.getUint32(at + 20 + i * 8, true)]);
  };
  const out: PeResource[] = [];
  for (const [type, t] of entries(0))
    for (const [nm, n] of entries(t & 0x7fffffff))
      for (const [lang, d] of entries(n & 0x7fffffff)) {
        const e = base + (d & 0x7fffffff);
        const at = rvaToOffset(l, dv.getUint32(e, true));
        out.push({ type, name: nm, lang: lang as number, data: exe.slice(at, at + dv.getUint32(e + 4, true)), codepage: dv.getUint32(e + 8, true) });
      }
  return out;
}

/** Named entries first (by name), then numbered ones (by number), as the loader's search expects. */
function compareKeys(a: number | string, b: number | string): number {
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
  if (typeof a === 'string') return -1;
  if (typeof b === 'string') return 1;
  return a - b;
}

/** A resource section holding `resources`, for loading at `rva`. */
export function buildResourceSection(resources: PeResource[], rva: number): Uint8Array {
  const tree = new Map<number | string, Map<number | string, PeResource[]>>();
  for (const r of resources) {
    for (const k of [r.type, r.name]) if (typeof k === 'string' && (!k || k !== k.toUpperCase())) throw new Error(`Resource names must be upper case: "${k}".`);
    const names = tree.get(r.type) ?? new Map<number | string, PeResource[]>();
    tree.set(r.type, names);
    const langs = names.get(r.name) ?? [];
    names.set(r.name, langs);
    if (langs.some((x) => x.lang === r.lang)) throw new Error(`Two resources ${r.type}/${r.name}/${r.lang}.`);
    langs.push(r);
  }
  const types = [...tree.keys()].sort(compareKeys);
  // sizes: the directories, then the name strings, then the data entries, then the data
  const dirSize = (n: number) => 16 + 8 * n;
  let size = dirSize(types.length);
  for (const t of types) {
    const names = tree.get(t)!;
    size += dirSize(names.size);
    for (const langs of names.values()) size += dirSize(langs.length);
  }
  const strings = new Map<string, number>();
  for (const t of types)
    for (const k of [t, ...tree.get(t)!.keys()])
      if (typeof k === 'string' && !strings.has(k)) {
        strings.set(k, size);
        size += 2 + 2 * k.length;
      }
  size = align(size, 4);
  const entriesAt = size;
  size += 16 * resources.length;
  const ordered: PeResource[] = [];
  for (const t of types)
    for (const n of [...tree.get(t)!.keys()].sort(compareKeys))
      ordered.push(
        ...tree
          .get(t)!
          .get(n)!
          .sort((a, b) => a.lang - b.lang),
      );
  const dataAt: number[] = [];
  for (const r of ordered) {
    size = align(size, 8);
    dataAt.push(size);
    size += r.data.length;
  }
  size = align(size, 8);

  const out = new Uint8Array(size);
  const dv = new DataView(out.buffer);
  for (const [s, at] of strings) {
    dv.setUint16(at, s.length, true);
    for (let i = 0; i < s.length; i++) dv.setUint16(at + 2 + i * 2, s.charCodeAt(i), true);
  }
  const key = (k: number | string) => (typeof k === 'string' ? (strings.get(k)! | 0x80000000) >>> 0 : k);
  const writeDir = (at: number, keys: (number | string)[], targets: number[]) => {
    dv.setUint16(at + 12, keys.filter((k) => typeof k === 'string').length, true);
    dv.setUint16(at + 14, keys.filter((k) => typeof k === 'number').length, true);
    keys.forEach((k, i) => {
      dv.setUint32(at + 16 + i * 8, key(k), true);
      dv.setUint32(at + 20 + i * 8, targets[i] >>> 0, true);
    });
  };
  let next = dirSize(types.length);
  let leaf = 0;
  const typeDirs: number[] = [];
  for (const t of types) {
    typeDirs.push(next);
    next += dirSize(tree.get(t)!.size);
  }
  writeDir(
    0,
    types,
    typeDirs.map((d) => d | 0x80000000),
  );
  types.forEach((t, ti) => {
    const names = [...tree.get(t)!.keys()].sort(compareKeys);
    const langDirs = names.map((n) => {
      const at = next;
      next += dirSize(tree.get(t)!.get(n)!.length);
      return at;
    });
    writeDir(
      typeDirs[ti],
      names,
      langDirs.map((d) => d | 0x80000000),
    );
    names.forEach((n, ni) => {
      const langs = tree.get(t)!.get(n)!;
      writeDir(
        langDirs[ni],
        langs.map((r) => r.lang),
        langs.map(() => entriesAt + 16 * leaf++),
      );
    });
  });
  ordered.forEach((r, i) => {
    const e = entriesAt + 16 * i;
    dv.setUint32(e, rva + dataAt[i], true);
    dv.setUint32(e + 4, r.data.length, true);
    dv.setUint32(e + 8, r.codepage ?? 0, true);
    out.set(r.data, dataAt[i]);
  });
  return out;
}

/** The PE checksum (the file's 16-bit words summed with carries, the checksum field left out, plus its length). */
export function peChecksum(exe: Uint8Array, at: number): number {
  let sum = 0;
  const n = exe.length;
  for (let i = 0; i < n; i += 2) {
    if (i === at || i === at + 2) continue;
    sum += exe[i] | ((i + 1 < n ? exe[i + 1] : 0) << 8);
    sum = (sum & 0xffff) + (sum >>> 16);
  }
  sum = (sum & 0xffff) + (sum >>> 16);
  return (sum + n) >>> 0;
}

/** The program with its resources replaced by `resources`. */
export function writeResources(exe: Uint8Array, resources: PeResource[]): Uint8Array {
  const l = peLayout(exe);
  if (directory(exe, l, DIR_SECURITY).size) throw new Error('The program is signed; its resources cannot be changed.');
  const res = directory(exe, l, DIR_RESOURCE);
  const rsrc = res.rva ? sectionAt(l, res.rva) : undefined;
  if (!rsrc || rsrc.va !== res.rva) throw new Error('The program has no resource section to replace.');
  const index = l.sections.indexOf(rsrc);
  const after = l.sections.slice(index + 1);
  // the sections after it move: only base relocations may be in them
  for (let d = 0; d < l.dirCount; d++) {
    const { rva, size } = directory(exe, l, d);
    if (!size || d === DIR_BASERELOC) continue;
    if (after.some((s) => rva >= s.va && rva < s.va + Math.max(s.vsize, s.raw))) throw new Error(`Data directory ${d} is in a section after the resources.`);
  }
  const dvIn = new DataView(exe.buffer, exe.byteOffset, exe.byteLength);
  const debug = directory(exe, l, DIR_DEBUG);
  if (debug.size) {
    const at = rvaToOffset(l, debug.rva);
    for (let i = 0; i < debug.size / 28; i++) if (dvIn.getUint32(at + i * 28 + 24, true) >= rsrc.ptr) throw new Error('Debug data lies after the resources.');
  }
  const end = Math.max(...l.sections.map((s) => s.ptr + s.raw));
  if (end < exe.length) throw new Error('The program has data after its sections.');

  const section = buildResourceSection(resources, rsrc.va);
  const raw = align(section.length, l.fileAlign);
  const moved = after.map((s) => ({ ...s }));
  let va = align(rsrc.va + section.length, l.sectionAlign);
  let ptr = rsrc.ptr + raw;
  for (const s of moved) {
    s.va = va;
    s.ptr = ptr;
    va = align(va + Math.max(s.vsize, 1), l.sectionAlign);
    ptr += s.raw;
  }
  const out = new Uint8Array(ptr);
  out.set(exe.subarray(0, rsrc.ptr));
  out.set(section, rsrc.ptr);
  after.forEach((s, i) => out.set(exe.subarray(s.ptr, s.ptr + s.raw), moved[i].ptr));

  const dv = new DataView(out.buffer);
  dv.setUint32(rsrc.header + 8, section.length, true);
  dv.setUint32(rsrc.header + 16, raw, true);
  after.forEach((s, i) => {
    dv.setUint32(s.header + 12, moved[i].va, true);
    dv.setUint32(s.header + 20, moved[i].ptr, true);
  });
  dv.setUint32(l.dirs + DIR_RESOURCE * 8 + 4, section.length, true);
  const reloc = directory(exe, l, DIR_BASERELOC);
  if (reloc.size) {
    const i = after.findIndex((s) => reloc.rva >= s.va && reloc.rva < s.va + Math.max(s.vsize, s.raw));
    if (i >= 0) dv.setUint32(l.dirs + DIR_BASERELOC * 8, reloc.rva - after[i].va + moved[i].va, true);
  }
  const last = moved.length ? moved[moved.length - 1] : { va: rsrc.va, vsize: section.length };
  dv.setUint32(l.opt + 56, align(last.va + last.vsize, l.sectionAlign), true); // SizeOfImage
  const sections = [...l.sections.slice(0, index), { ...rsrc, raw }, ...moved];
  dv.setUint32(
    l.opt + 8,
    sections.filter((s) => s.flags & 0x40).reduce((n, s) => n + s.raw, 0),
    true,
  ); // SizeOfInitializedData
  dv.setUint32(l.opt + 64, 0, true);
  dv.setUint32(l.opt + 64, peChecksum(out, l.opt + 64), true);
  return out;
}
