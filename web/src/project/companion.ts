// The companion file: editor-only extras for a game (terrains, stamps, buildings…) that DOS Game-Maker never had.
//
// It is a small versioned JSON object kept beside the project's files, never among them:
// in IndexedDB it is the project record's `companion` field (storage.ts), so the DOS,
// native and web-page exports, which only see the game's files, never carry it. The
// "Game files (.zip)" backup adds it as <game>.GMX, and importing such a zip takes it out
// of the files again (takeCompanion), so nothing is lost on the way round.
//
// Shape (version 1):
//   {
//     "format": "gamemaker-companion",
//     "version": 1,
//     "releaseNotes": { "1.2": "…" },   // text per game version (optional; see releaseNotesOf)
//     "gameVersion": "1.0",         // the author's version of the game (optional; see gameVersionOf)
//     "about": { "title": "…", "author": "…", "credits": [{ "role": "Music", "name": "…" }] },
//                                   // "About this game" (aboutGame.ts): FILE_ID.DIZ and the web page's credits (optional)
//     "showVersion": true,         // letter it on the menu picture of Play and exports (composeFiles.ts); off when absent
//     "files": {                    // extras of one game file, by its normalized name
//       "forest.bbl": {
//         "terrains": [ … ],       // map/tools/autotile.ts
//         "stamps": [ … ],         // map/tools/stamps.ts
//         "buildings": [ … ]       // map/tools/building.ts
//       },
//       "hero.chr": { … }          // any editor may add a section of its own
//     }
//   }
// Keys this version does not know (at any level) are kept as they are, so an older editor
// never drops what a newer one wrote.
import { normalize, type GameFiles } from './files';

const COMPANION_FORMAT = 'gamemaker-companion';
const COMPANION_VERSION = 1;
/** The extension of the companion in a backup zip: <game>.GMX holds JSON. */
const COMPANION_EXT = 'gmx';

/** One game file's extras: section name -> whatever its editor keeps there. */
type FileExtras = Record<string, unknown>;

export interface Companion {
  format: typeof COMPANION_FORMAT;
  version: number;
  files: Record<string, FileExtras>;
  /** Release notes by game version, such as "1.2". Editor-only; absent unless set. */
  releaseNotes?: Record<string, string>;
  /** The author's version of the game, such as "1.0" (not the companion's own `version`). Editor-only. */
  gameVersion?: string;
  /** True to letter `gameVersion` on the menu picture of Play and exports. Off when absent. */
  showVersion?: boolean;
  /** "About this game" (aboutGame.ts): title, author, description, credits… Editor-only; absent unless set. */
  about?: unknown;
  /** Anything else a newer version wrote. */
  [key: string]: unknown;
}

export function emptyCompanion(): Companion {
  return { format: COMPANION_FORMAT, version: COMPANION_VERSION, files: {} };
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** A companion from JSON text, bytes or an object; an empty one when it is not one. Unknown keys stay. */
export function parseCompanion(src: unknown): Companion {
  let v: unknown = src;
  try {
    if (src instanceof Uint8Array) v = JSON.parse(new TextDecoder().decode(src));
    else if (typeof src === 'string') v = JSON.parse(src);
  } catch {
    return emptyCompanion();
  }
  if (!isObject(v)) return emptyCompanion();
  const files: Record<string, FileExtras> = {};
  if (isObject(v.files)) for (const [k, x] of Object.entries(v.files)) if (isObject(x)) files[normalize(k)] = { ...x };
  const { releaseNotes: _rn, ...rest } = v;
  const out: Companion = { ...rest, format: COMPANION_FORMAT, version: typeof v.version === 'number' ? v.version : COMPANION_VERSION, files };
  const notes: Record<string, string> = {};
  if (isObject(v.releaseNotes)) for (const [k, x] of Object.entries(v.releaseNotes)) if (typeof x === 'string') notes[k] = x;
  if (Object.keys(notes).length) out.releaseNotes = notes;
  return out;
}

/** Pretty JSON bytes, for the backup zip. */
export function serializeCompanion(c: Companion): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(c, null, 2)}\n`);
}

/** True when it holds nothing worth keeping. */
export function isEmptyCompanion(c: Companion | undefined): boolean {
  if (!c) return true;
  const { format: _f, version: _v, files, releaseNotes, ...rest } = c;
  return !Object.keys(rest).length && !Object.keys(releaseNotes ?? {}).length && Object.values(files).every((x) => !Object.keys(x).length);
}

/** One section of a file's extras (e.g. the terrains of forest.bbl), or `fallback`. */
export function getSection<T>(c: Companion, file: string, section: string, fallback: T): T {
  const v = c.files[normalize(file)]?.[section];
  return v === undefined ? fallback : (v as T);
}

/** Sets (or, with undefined, removes) one section of a file's extras, in place. */
export function setSection(c: Companion, file: string, section: string, value: unknown): void {
  const n = normalize(file);
  const extras = { ...c.files[n] };
  if (value === undefined) delete extras[section];
  else extras[section] = value;
  if (Object.keys(extras).length) c.files[n] = extras;
  else delete c.files[n];
}

/** A game file was renamed: its extras follow it. */
export function renameInCompanion(c: Companion, from: string, to: string): void {
  const f = normalize(from);
  const t = normalize(to);
  if (f === t || !c.files[f]) return;
  c.files[t] = { ...c.files[t], ...c.files[f] };
  delete c.files[f];
}

/** The companion's name in a backup: the .gam's stem with .GMX. */
function companionFileName(gam: string): string {
  return `${normalize(gam).replace(/\.[^.]*$/, '')}.${COMPANION_EXT}`;
}

function isCompanionFile(name: string): boolean {
  return normalize(name).endsWith(`.${COMPANION_EXT}`);
}

/**
 * Takes companion files (.gmx) out of imported files and returns what they held, merged
 * (undefined when there were none). The game's own files are left as they were.
 */
export function takeCompanion(files: GameFiles): Companion | undefined {
  const names = files.names().filter(isCompanionFile);
  if (!names.length) return undefined;
  const out = emptyCompanion();
  for (const n of names) {
    const c = parseCompanion(files.get(n)!);
    const { files: extras, ...rest } = c;
    Object.assign(out, rest);
    for (const [k, x] of Object.entries(extras)) out.files[k] = { ...out.files[k], ...x };
    files.delete(n);
  }
  return out;
}

/** The entries of a "Game files (.zip)" backup: every file, plus the companion when it holds anything. */
export function backupEntries(files: GameFiles, gam: string, companion?: Companion): { name: string; data: Uint8Array }[] {
  const out = files.entries().map(([name, data]) => ({ name: name.toUpperCase(), data }));
  if (companion && !isEmptyCompanion(companion)) out.push({ name: companionFileName(gam).toUpperCase(), data: serializeCompanion(companion) });
  return out;
}

/** The release notes saved for a game version ("1.2"), or '' when there are none. */
export function releaseNotesOf(c: Companion, version: string): string {
  return c.releaseNotes?.[version] ?? '';
}

/** Saves a version's release notes; empty text removes them, and the last one gone drops the field. */
export function setReleaseNotes(c: Companion, version: string, text: string): void {
  const notes = { ...c.releaseNotes };
  if (text.trim()) notes[version] = text;
  else delete notes[version];
  if (Object.keys(notes).length) c.releaseNotes = notes;
  else delete c.releaseNotes;
}

/** A version the menu picture can hold: a short run of letters, digits, dots, dashes and pluses. */
export const VERSION_PATTERN = /^[0-9A-Za-z.+-]{1,10}$/;

/** The game's version and whether it is lettered on the menu picture (a version nobody can read there counts as none). */
export function menuVersionOf(c: Companion | undefined): { version: string; show: boolean } {
  const version = typeof c?.gameVersion === 'string' && VERSION_PATTERN.test(c.gameVersion) ? c.gameVersion : '';
  return { version, show: c?.showVersion === true };
}

/** Sets the version and the toggle in place; an empty version and an off toggle leave nothing behind. */
export function setMenuVersion(c: Companion, version: string, show: boolean): void {
  const v = version.trim();
  if (v) c.gameVersion = v;
  else delete c.gameVersion;
  if (show) c.showVersion = true;
  else delete c.showVersion;
}
