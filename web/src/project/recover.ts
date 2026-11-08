// Reading a stored editor project that may be damaged (a cut-short main .GAM, a wrong-type file,
// a bad companion, a lost main .GAM). It keeps every intact file and lists what is broken in
// plain words (editor/shell/recoverNotice.ts shows the list). Only what storage broke counts:
// a file the .GAM names but the game never had (common in imported DOS games), an empty file
// or a second .GAM that does not parse is how the game was made, and the health check lists those.
// Pure: no IndexedDB here.
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { GameFiles } from './files';
import { COMPANION_FORMAT, parseCompanion, type Companion } from './companion';
import type { ProjectRecord } from './storage';

export interface Damage {
  /** file: stored but unusable; missing: named by the .GAM, not stored; companion: the editor-only extras; record: the project's own details. */
  kind: 'file' | 'missing' | 'companion' | 'record';
  file?: string;
  /** Plain words: what is broken and what happens to it. */
  message: string;
}

interface Recovered {
  record: ProjectRecord;
  files: GameFiles;
  damage: Damage[];
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** The bytes of a stored value, when it is some kind of byte array; undefined for any other type. */
function bytesOf(v: unknown): Uint8Array | undefined {
  if (v instanceof Uint8Array) return v;
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (ArrayBuffer.isView(v)) return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
  return undefined;
}

/** A companion is fine when it is an object of the right format; a damaged one is replaced by an empty one. */
function companionOf(raw: unknown): { companion?: Companion; damage?: Damage } {
  if (raw === undefined || raw === null) return {};
  const bad: Damage = {
    kind: 'companion',
    message:
      'The editor-only notes saved with this game (its release notes and settings) are damaged, so they start empty. The game’s own files are not affected.',
  };
  if (!isObject(raw) || (raw.format !== undefined && raw.format !== COMPANION_FORMAT) || (raw.files !== undefined && !isObject(raw.files)))
    return { damage: bad };
  return { companion: parseCompanion(raw) };
}

/** Sorts what was stored for one project into usable files and a list of what is broken. Never throws. */
export function recoverRecord(id: string, raw: unknown): Recovered {
  const damage: Damage[] = [];
  const src = isObject(raw) ? raw : {};
  if (!isObject(raw)) damage.push({ kind: 'record', message: 'The stored project could not be read at all, so it opens empty.' });
  const name = typeof src.name === 'string' && src.name.trim() ? src.name : 'Damaged game';
  if (isObject(raw) && typeof src.name !== 'string')
    damage.push({ kind: 'record', message: 'The game’s name was not stored, so it is called “Damaged game” until you rename it.' });
  let gam = typeof src.gam === 'string' && src.gam ? src.gam : '';
  const files = new GameFiles();
  if (isObject(raw) && !isObject(src.files)) damage.push({ kind: 'record', message: 'The list of the game’s files was not stored, so it opens without any.' });
  for (const [n, v] of isObject(src.files) ? Object.entries(src.files) : []) {
    const b = bytesOf(v);
    if (!b)
      damage.push({ kind: 'file', file: n, message: `${n} was stored as the wrong kind of data, so it is left out. Replace it with a copy, or drop it.` });
    else files.set(n, b);
  }
  // a cut-short main .gam does not parse: it would stop the editor, so it is set aside
  const main = files.mainGame(gam || undefined);
  for (const n of main ? [main] : []) {
    try {
      if (!parseGame(files.get(n)!).scenes.length) throw new Error('no scenes');
    } catch {
      files.delete(n);
      damage.push({
        kind: 'file',
        file: n,
        message: `${n} is cut short or garbled, so it can’t be opened. Replace it with a copy, or drop it (the game starts a fresh ${n}).`,
      });
    }
  }
  if (gam && !files.names().some((n) => n.toLowerCase() === gam.toLowerCase())) {
    if (!damage.some((d) => d.file === gam))
      damage.push({ kind: 'missing', file: gam, message: `The game file ${gam} is missing. Add a copy of it, or let the editor start a fresh one.` });
    gam = '';
  }
  const c = companionOf(src.companion);
  if (c.damage) damage.push(c.damage);
  const record: ProjectRecord = {
    id,
    name,
    gam: gam || files.mainGame() || '',
    updated: typeof src.updated === 'number' ? src.updated : 0,
    files: Object.fromEntries(files.entries()),
  };
  if (c.companion) record.companion = c.companion;
  for (const k of ['checkpoints', 'checkpoint'] as const)
    if (src[k] !== undefined && Array.isArray(src[k]) === (k === 'checkpoints')) Object.assign(record, { [k]: src[k] });
  return { record, files, damage };
}
