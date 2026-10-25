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
  return { ...v, format: COMPANION_FORMAT, version: typeof v.version === 'number' ? v.version : COMPANION_VERSION, files };
}

/** Pretty JSON bytes, for the backup zip. */
export function serializeCompanion(c: Companion): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(c, null, 2)}\n`);
}

/** True when it holds nothing worth keeping. */
export function isEmptyCompanion(c: Companion | undefined): boolean {
  if (!c) return true;
  const { format: _f, version: _v, files, ...rest } = c;
  return !Object.keys(rest).length && Object.values(files).every((x) => !Object.keys(x).length);
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
