// Home search, deeper: the searchable text of one game, read from the files it was given. It
// reuses searchIndex.ts (file names, text screens, slide lists, scene names, high-score names)
// and adds the plain-text files a BBS ZIP carries (FILE_ID.DIZ, .doc, .nfo) and a game's own
// extra words. No DOM, no storage: deepIndexWorker.ts runs it off the main thread.
import { fileEntries, strings, type FileSource } from './searchIndex';
import type { Part } from './searchMatch';
import { cp437Text } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';

/** One searchable line of a game: the file it is in ('' when it is not in a file) and what it says. */
export interface DeepPart {
  file: string;
  label: string;
  text: string;
}

/** What the main thread hands over for one game. */
export interface DeepJob {
  /** The bytes of the files worth reading; every name is in `names`. */
  files: [string, Uint8Array][];
  names: string[];
  /** Words that are not in a file: the blurb, the box text, the questions. */
  extras: Part[];
  /** A project's companion sections (sidecar text), by file. */
  companion?: Record<string, Record<string, unknown>>;
}

/** Files that are plain text under other extensions. */
const PLAIN_TEXT = /\.(diz|doc|nfo|1st|me|asc)$/i;
/** Whether the main thread should fetch this file for the worker to read. */
export const worthReading = (name: string): boolean => /\.(txt|lst|gam|his|snd|bkd|diz|doc|nfo|1st|me|asc)$/i.test(name);

const MAX_PARTS = 4000;
const SKIP_SECTIONS = new Set(['controls', 'joystickButtons', 'dosPlayer']);

function plainLines(bytes: Uint8Array, file: string): DeepPart[] {
  const text = cp437Text(bytes.subarray(0, 64 * 1024)).replace(/\x1a[\s\S]*$/, '');
  return text
    .split(/\r?\n/)
    .map((t, i) => ({ file, label: `Line ${i + 1}`, text: t.replace(/[\x00-\x1f\x7f]/g, ' ').trim() }))
    .filter((p) => /[\p{L}\p{N}]/u.test(p.text));
}

export async function extractDeep(job: DeepJob): Promise<DeepPart[]> {
  const byName = new Map(job.files);
  const source: FileSource = { names: () => job.names, get: (n) => byName.get(n) };
  const out: DeepPart[] = [];
  for (const e of await fileEntries({ files: source }, { stale: false })) {
    for (const p of e.parts) out.push({ file: e.file ?? '', label: p.label, text: p.text });
  }
  for (const [name, bytes] of job.files) if (PLAIN_TEXT.test(name)) out.push(...plainLines(bytes, name.toUpperCase()));
  for (const e of job.extras) out.push({ file: '', label: e.label, text: e.text });
  for (const [file, extras] of Object.entries(job.companion ?? {})) {
    for (const [section, value] of Object.entries(extras)) {
      if (SKIP_SECTIONS.has(section)) continue;
      const parts: Part[] = [];
      strings(value, '', parts);
      for (const p of parts) out.push({ file: file.toUpperCase(), label: `${section} ${p.label}`.trim(), text: p.text });
    }
  }
  return out.slice(0, MAX_PARTS);
}
