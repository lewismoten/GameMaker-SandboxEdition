// The backup file: a zip (project/zip.ts) named game-maker-backup-YYYY-MM-DD.gmbackup holding
// manifest.json (the format and its version, when it was made, the site's name and version, and
// each section with its item count) and sections/<id>.json for each section in it, written with
// codec.ts so binary data comes back byte for byte. Reading checks everything before anything
// is written. No DOM.
import { createZip, isZip, listZip } from '../project/zip';
import { PRODUCT } from '../edition';
import { version as SITE_VERSION } from '../../package.json';
import { decode, encode } from './codec';
import type { SectionId } from './inventory';
import { SECTIONS, sectionById } from './sections';
import { BackupError, isRecord } from './sections/types';
import { withoutApiKey } from './sections/settings';
import type { World } from './world';

export const FORMAT = 'game-maker-backup';
export const FORMAT_VERSION = 1;
export const EXTENSION = '.gmbackup';

export interface ManifestSection {
  id: SectionId;
  title: string;
  items: number;
}

export interface Manifest {
  format: typeof FORMAT;
  version: number;
  /** ISO date and time it was made. */
  created: string;
  site: { name: string; version: string };
  sections: ManifestSection[];
}

/** One section of this browser as a backup would hold it. */
export interface SectionSnapshot {
  id: SectionId;
  title: string;
  short: string;
  description: string;
  items: number;
  /** Its size in the file, before packing. */
  bytes: number;
  payload: unknown;
  text: string;
}

/** Every section of this browser, with its size (the API key left out unless `withApiKey`). */
export async function snapshot(w: World, opts: { withApiKey?: boolean } = {}): Promise<SectionSnapshot[]> {
  const out: SectionSnapshot[] = [];
  for (const s of SECTIONS) {
    let payload = await s.extract(w);
    if (s.id === 'ai' && !opts.withApiKey) payload = { local: withoutApiKey((payload as { local: Record<string, string> }).local) };
    const text = encode(payload);
    out.push({
      id: s.id,
      title: s.title,
      short: s.short,
      description: s.description,
      items: s.count(payload),
      bytes: new TextEncoder().encode(text).length,
      payload,
      text,
    });
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const backupName = (d: Date) => `game-maker-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}${EXTENSION}`;

/** The backup file of the chosen sections. */
export async function makeBackup(
  snaps: SectionSnapshot[],
  ids: SectionId[],
  now = new Date(),
): Promise<{ bytes: Uint8Array; name: string; manifest: Manifest }> {
  const chosen = snaps.filter((s) => ids.includes(s.id));
  const manifest: Manifest = {
    format: FORMAT,
    version: FORMAT_VERSION,
    created: now.toISOString(),
    site: { name: PRODUCT, version: SITE_VERSION },
    sections: chosen.map((s) => ({ id: s.id, title: s.title, items: s.items })),
  };
  const enc = new TextEncoder();
  const entries = [
    { name: 'manifest.json', data: enc.encode(JSON.stringify(manifest, null, 2)) },
    ...chosen.map((s) => ({ name: `sections/${s.id}.json`, data: enc.encode(s.text) })),
  ];
  return { bytes: await createZip(entries, now), name: backupName(now), manifest };
}

export interface ReadBackup {
  manifest: Manifest;
  payloads: Partial<Record<SectionId, unknown>>;
  /** Sections this version doesn't know (from a later one), skipped. */
  unknown: string[];
  /** Each section's size in the file, before packing. */
  sizes: Partial<Record<SectionId, number>>;
}

const LIMITS = { maxEntries: 256, maxBytes: 2 * 1024 * 1024 * 1024 };

/** A backup file read and checked through; throws BackupError with a plain reason when it can't be used. */
export async function readBackup(bytes: Uint8Array): Promise<ReadBackup> {
  if (!isZip(bytes)) throw new BackupError('This isn’t a Game-Maker backup file.');
  let files: Map<string, () => Promise<Uint8Array | undefined>>;
  try {
    files = new Map(listZip(bytes, LIMITS).map((e) => [e.name, e.read]));
  } catch (e) {
    throw new BackupError(`This backup file is damaged (${(e as Error).message}).`);
  }
  const text = async (name: string): Promise<string> => {
    const read = files.get(name);
    if (!read) throw new BackupError(`This backup file is missing ${name}.`);
    try {
      const data = await read();
      if (!data) throw new Error('unreadable');
      return new TextDecoder('utf-8', { fatal: true }).decode(data);
    } catch {
      throw new BackupError(`This backup file is damaged (${name} can’t be read).`);
    }
  };
  if (!files.has('manifest.json')) throw new BackupError('This isn’t a Game-Maker backup file (it has no manifest.json).');
  let m: unknown;
  try {
    m = JSON.parse(await text('manifest.json'));
  } catch (e) {
    if (e instanceof BackupError) throw e;
    throw new BackupError('This backup file is damaged (its manifest can’t be read).');
  }
  if (!isRecord(m) || m.format !== FORMAT) throw new BackupError('This isn’t a Game-Maker backup file.');
  if (typeof m.version !== 'number' || !Number.isInteger(m.version) || m.version < 1)
    throw new BackupError('This backup file is damaged (its version is missing).');
  if (m.version > FORMAT_VERSION)
    throw new BackupError(
      `This backup was made by a newer version of the site (backup format ${m.version}; this one reads up to ${FORMAT_VERSION}). Reload the page to get the newest version, then try again.`,
    );
  if (!Array.isArray(m.sections) || typeof m.created !== 'string') throw new BackupError('This backup file is damaged (its manifest is incomplete).');
  const manifest = m as unknown as Manifest;
  const payloads: Partial<Record<SectionId, unknown>> = {};
  const sizes: Partial<Record<SectionId, number>> = {};
  const unknown: string[] = [];
  for (const entry of manifest.sections) {
    if (!isRecord(entry) || typeof entry.id !== 'string') throw new BackupError('This backup file is damaged (its manifest is incomplete).');
    const s = sectionById(entry.id);
    if (!s) {
      unknown.push(typeof entry.title === 'string' ? entry.title : entry.id);
      continue;
    }
    let raw: unknown;
    try {
      const t = await text(`sections/${s.id}.json`);
      sizes[s.id] = new TextEncoder().encode(t).length;
      raw = decode(t);
    } catch (e) {
      if (e instanceof BackupError) throw e;
      throw new BackupError(`This backup file is damaged (${s.title} can’t be read).`);
    }
    try {
      payloads[s.id] = s.validate(raw);
    } catch (e) {
      if (e instanceof BackupError) throw new BackupError(`${e.message} (${s.title})`);
      throw new BackupError(`This backup file is damaged (${s.title} can’t be read).`);
    }
  }
  return { manifest, payloads, unknown, sizes };
}
