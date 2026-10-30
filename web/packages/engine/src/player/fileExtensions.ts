// File extensions the DOS export can rename, as Acord Games did by hand to their players (.gam to
// .z0g, .gif to .z0n…) so other copies of Game-Maker 3.0 couldn't open the games' files. Each
// kind is a patch "file.ext.<stock>" holding three characters. The player's own kinds are the
// extensions XFERPLAY 3.00 tests or builds (every copy, from PLAYGAME.C, HISCOREL.C and
// SOUNDC.C, as Acord's NEVER.EXE changed them); the others are named in the .gam, so renaming
// those needs no patch. Only the DOS export uses them (export/exportDos.ts): the project, Play
// and the web-page exports keep Game-Maker's own names. An import reads them back from a player
// that has them (project/importPlayer.ts).

interface ExtKind {
  /** Game-Maker's own extension, lower case, no dot. */
  ext: string;
  label: string;
  note: string;
  /**
   * File offsets of each ".ext" in XFERPLAY 3.00, the one it opens files by first; none for the
   * kinds the .gam names in full.
   */
  offsets: number[];
}

export const EXT_KINDS: ExtKind[] = [
  { ext: 'gam', label: 'Game file', note: 'The .EXE opens the game file named after itself with this extension.', offsets: [0x256b6] },
  { ext: 'gif', label: 'Pictures', note: 'Shown as a GIF picture.', offsets: [0x257b2] },
  { ext: 'bkd', label: 'Backdrops', note: 'Shown as a backdrop (a window of a picture).', offsets: [0x257b7] },
  { ext: 'fli', label: 'Animations', note: 'Played as an animation.', offsets: [0x257bc] },
  { ext: 'txt', label: 'Text pages', note: 'Shown as a text page. Text files the game doesn’t name keep .txt.', offsets: [0x257c1] },
  { ext: 'lst', label: 'Slide lists', note: 'Shown as a slide show.', offsets: [0x257c6] },
  {
    ext: 'rec',
    label: 'Recordings',
    note: 'The demo, the high-score replays and the recording of each game the player makes.',
    offsets: [0x256fb, 0x25673, 0x256f5, 0x257ad],
  },
  { ext: 'voc', label: 'Voices', note: 'The sound set names its voices without one; the player adds this.', offsets: [0x26048] },
  { ext: 'his', label: 'High scores', note: 'The high-score file, which the player makes.', offsets: [0x268c3, 0x26907] },
  { ext: 'sav', label: 'Saved games', note: 'GAME0 to GAME9, which the player makes.', offsets: [0x257fb, 0x2581c] },
  { ext: 'dat', label: 'Save names', note: 'SAVNAMES, which the player makes. CONFIG.DAT keeps its name.', offsets: [0x257eb, 0x25809] },
  { ext: 'pal', label: 'Palettes', note: '', offsets: [] },
  { ext: 'map', label: 'Maps', note: '', offsets: [] },
  { ext: 'bbl', label: 'Background blocks', note: '', offsets: [] },
  { ext: 'mon', label: 'Monsters', note: '', offsets: [] },
  { ext: 'mbl', label: 'Monster blocks', note: '', offsets: [] },
  { ext: 'chr', label: 'Characters', note: '', offsets: [] },
  { ext: 'cbl', label: 'Character blocks', note: '', offsets: [] },
  { ext: 'snd', label: 'Sound sets', note: '', offsets: [] },
  { ext: 'cmf', label: 'Songs', note: '', offsets: [] },
];

const BY_EXT = new Map(EXT_KINDS.map((k) => [k.ext, k]));
const PREFIX = 'file.ext.';

/** The patch id for a kind. */
export const extId = (ext: string) => PREFIX + ext;

/** The kind an id names, if it is one. */
export function extKind(id: string): ExtKind | undefined {
  return id.startsWith(PREFIX) ? BY_EXT.get(id.slice(PREFIX.length)) : undefined;
}

/** What DOS, the player and the export use themselves, which no kind may take. */
const RESERVED = new Set(['exe', 'com', 'bat', 'sys', 'drv', 'hlp', 'cfg', 'gmx', 'zip']);
/** Characters a DOS name takes, less the % a printf format would read as a code. */
const EXT_CHARS = /^[a-z0-9_\-~!@#$^&()]{3}$/;

/** Why `value` can't be kind `ext`'s new extension, or undefined when it can. */
export function extValueProblem(ext: string, value: unknown): string | undefined {
  if (typeof value !== 'string') return 'not text';
  const v = value.toLowerCase();
  if (v.length !== 3) return 'exactly 3 characters, as the extension it replaces';
  if (!EXT_CHARS.test(v)) return 'letters, digits or _ - ~ ! @ # $ ^ & ( ) only';
  if (v !== ext && BY_EXT.has(v)) return `.${v} is Game-Maker’s own extension for ${BY_EXT.get(v)!.label.toLowerCase()}`;
  if (RESERVED.has(v)) return `.${v} is a DOS or player file’s own`;
  return undefined;
}

/** The kinds a set of patches renames: Game-Maker's extension -> the new one (both lower case, no dot). */
export function extensionMap(patches: Record<string, unknown> | undefined): Map<string, string> {
  const out = new Map<string, string>();
  for (const k of EXT_KINDS) {
    const v = patches?.[extId(k.ext)];
    if (typeof v === 'string' && !extValueProblem(k.ext, v) && v.toLowerCase() !== k.ext) out.set(k.ext, v.toLowerCase());
  }
  return out;
}

/** Kinds that share a new extension (each problem names both), for the panel and the export. */
export function extensionClashes(patches: Record<string, unknown> | undefined): Map<string, string> {
  const map = extensionMap(patches);
  const out = new Map<string, string>();
  for (const [from, to] of map) {
    const other = [...map].find(([f, t]) => t === to && f !== from)?.[0];
    if (other) out.set(from, `${BY_EXT.get(other)!.label} use .${to} too`);
  }
  return out;
}

/** The patches without any renamed extensions (what the web player and web-page exports carry). */
export function withoutExtensions<T>(patches: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(patches).filter(([id]) => !id.startsWith(PREFIX)));
}

const extAt = (exe: Uint8Array, o: number) => (exe[o] === 0x2e ? String.fromCharCode(exe[o + 1], exe[o + 2], exe[o + 3]).toLowerCase() : undefined);

/** Writes each renamed kind's extension into every one of its copies in the player. */
export function writeExtensions(exe: Uint8Array, patches: Record<string, unknown>): void {
  for (const [from, to] of extensionMap(patches)) for (const o of BY_EXT.get(from)!.offsets) for (let i = 0; i < 3; i++) exe[o + 1 + i] = to.charCodeAt(i);
}

/**
 * A player's renamed extensions as patches, for the kinds whose copies all agree and keep the
 * rules; `read` lists the kinds read (so their bytes are explained).
 */
export function readExtensions(exe: Uint8Array): { patches: Record<string, string>; read: string[] } {
  const patches: Record<string, string> = {};
  const read: string[] = [];
  for (const k of EXT_KINDS) {
    if (!k.offsets.length) continue;
    const vs = k.offsets.map((o) => extAt(exe, o));
    const v = vs[0];
    if (!v || vs.some((x) => x !== v) || extValueProblem(k.ext, v)) continue;
    read.push(k.ext);
    if (v !== k.ext) patches[extId(k.ext)] = v;
  }
  return { patches, read };
}

/** Writes Game-Maker's own extension back into every copy of the kinds listed. */
export function writeStockExtensions(exe: Uint8Array, kinds: string[]): void {
  for (const ext of kinds) for (const o of BY_EXT.get(ext)!.offsets) for (let i = 0; i < 3; i++) exe[o + 1 + i] = ext.charCodeAt(i);
}

/**
 * The CD's extension -> the one this player opens files by instead ('' when blanked), lower
 * case with the dot, for the player's own kinds that differ. (Virtual Mario blanked .gam.)
 */
export function renamedExtensions(exe: Uint8Array): Record<string, string> {
  const out: Record<string, string> = {};
  if (exe.length !== 160_598) return out;
  for (const k of EXT_KINDS) {
    if (!k.offsets.length) continue;
    let now = '';
    for (let i = 0; i < 4 && exe[k.offsets[0] + i]; i++) now += String.fromCharCode(exe[k.offsets[0] + i]);
    now = now.trim().toLowerCase();
    if (now !== `.${k.ext}`) out[`.${k.ext}`] = now === '.' ? '' : now;
  }
  return out;
}

/** Acord Games' extensions, as NEVER.EXE and its games' files use them (.lst, .voc and .dat kept). */
export const ACORD_EXTENSIONS: Record<string, string> = {
  gam: 'z0g',
  gif: 'z0n',
  bkd: 'z0j',
  fli: 'z0p',
  txt: 'z0l',
  rec: 'z0r',
  his: 'z0h',
  sav: 'z0m',
  pal: 'z0i',
  map: 'z0b',
  bbl: 'z0a',
  mon: 'z0d',
  mbl: 'z0c',
  chr: 'z0f',
  cbl: 'z0e',
  snd: 'z0k',
  cmf: 'z0q',
};
