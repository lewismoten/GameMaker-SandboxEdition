import { writeLibrary, type PocketLibrary } from './pocketLibrary';
// The Pocket Player's bundle of files, "GMS1" (hardware/pocket-player/src/gmsmall.h): "GMS1", a count, entries
// sorted by name (name[32], offset, length; little endian), then the data. The Starters' small.pak is one,
// and so is a game on its own for the microSD card, NAME.GMP in the card's /pocket folder: its `game.txt`
// ("GMP 1", then id|title|levels, then "version <game version>" when known, for a catalog to match), `<id>.cfg`, `cards.pak` (the card references in the .cfg are offsets
// into that entry) and its packed files. The firmware finds a .GMP by listing /pocket, so copying the
// one file is the whole install.

/** The one-file game's format version (the first line of its game.txt); a firmware lists only the versions it reads. */
const GMP_VERSION = 1;
const ENTRY = 40;

/** One bundle of the entries, sorted by name (byte order, as the firmware's strcmp). */
export function writeBundle(entries: Iterable<[string, Uint8Array]>, deduplicate = false): Uint8Array {
  const list = [...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const unique: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  for (const [, b] of list) {
    const same = deduplicate ? unique.findIndex((v) => v.length === b.length && v.every((x, i) => x === b[i])) : -1;
    if (same >= 0) offsets.push(unique.slice(0, same).reduce((n, v) => n + v.length, 0));
    else {
      offsets.push(length);
      unique.push(b);
      length += b.length;
    }
  }
  const size = 8 + list.length * ENTRY + length;
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  out.set([0x47, 0x4d, 0x53, 0x31]); // GMS1
  view.setUint32(4, list.length, true);
  const start = 8 + list.length * ENTRY;
  list.forEach(([name, bytes], i) => {
    if (name.length > 31 || /[^\x20-\x7e]/.test(name)) throw new Error(`Pocket bundle: bad name ${name}`);
    for (let k = 0; k < name.length; k++) out[8 + i * ENTRY + k] = name.charCodeAt(k);
    const off = start + offsets[i];
    view.setUint32(8 + i * ENTRY + 32, off, true);
    view.setUint32(8 + i * ENTRY + 36, bytes.length, true);
    out.set(bytes, off);
  });
  return out;
}

/** A bundle's entries (where each starts, its bytes); throws when it isn't one. */
export function readBundle(bytes: Uint8Array): Map<string, { off: number; bytes: Uint8Array }> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 8 || String.fromCharCode(...bytes.subarray(0, 4)) !== 'GMS1') throw new Error('not a Pocket bundle');
  const count = view.getUint32(4, true);
  if (8 + count * ENTRY > bytes.length) throw new Error('Pocket bundle: table cut short');
  const out = new Map<string, { off: number; bytes: Uint8Array }>();
  let last = '';
  for (let i = 0; i < count; i++) {
    const at = 8 + i * ENTRY;
    const raw = bytes.subarray(at, at + 32);
    const name = String.fromCharCode(...raw.subarray(0, raw.indexOf(0) < 0 ? 31 : raw.indexOf(0)));
    const off = view.getUint32(at + 32, true);
    const len = view.getUint32(at + 36, true);
    if (off < 8 + count * ENTRY || off + len > bytes.length) throw new Error(`Pocket bundle: ${name} runs past the end`);
    if (i && !(last < name)) throw new Error('Pocket bundle: names out of order');
    last = name;
    out.set(name, { off, bytes: bytes.subarray(off, off + len) });
  }
  return out;
}

/** A DOS 8.3 name for the card: up to 8 letters and digits of the id, then .GMP. */
export function gmpName(id: string): string {
  return `${
    id
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8) || 'GAME'
  }.GMP`;
}

/** The game id the firmware keeps (27 characters, its cfg name fits the bundle's 31): lower case letters, digits and dashes. */
export function pocketId(id: string): string {
  return (
    id
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 27) || 'game'
  );
}

interface GmpParts {
  id: string;
  title: string;
  levels: number;
  /** The game's own version (about.json, or the author's), so a catalog can tell an update; left out when unknown. */
  version?: string;
  cfg: string[];
  files: Map<string, Uint8Array>;
  cards: Uint8Array[];
  library?: PocketLibrary;
  thumbnail?: Uint8Array;
}

/** The one-file game for the card. */
export function writeGmp(p: GmpParts): Uint8Array {
  const text = (s: string) => new Uint8Array([...s].map((c) => (c.charCodeAt(0) < 256 ? c.charCodeAt(0) : 63)));
  const version = p.version?.replace(/[^\x21-\x7e]/g, '').slice(0, 16);
  const title = p.title.replace(/[|\r\n]/g, ' ').slice(0, 95);
  const cards = new Uint8Array(p.cards.reduce((t, b) => t + b.length, 0));
  let at = 0;
  for (const b of p.cards) {
    cards.set(b, at);
    at += b.length;
  }
  return writeBundle([
    ['game.txt', text(`GMP ${GMP_VERSION}\n${p.id}|${title}|${p.levels}\n${version ? `version ${version}\n` : ''}`)],
    [`${p.id}.cfg`, text(p.cfg.join('\n') + '\n')],
    ['cards.pak', cards],
    ...p.files,
    ...(p.library ? [['library.json', writeLibrary(p.library)] as [string, Uint8Array]] : []),
    ...(p.thumbnail ? [['thumb.pth', p.thumbnail] as [string, Uint8Array]] : []),
  ]);
}
