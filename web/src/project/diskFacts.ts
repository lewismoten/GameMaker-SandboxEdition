// What a 1990s buyer asked about a game before anything else: how many floppies, how much
// of the hard disk it takes, and how long its ZIP ties up the phone line. All worked out
// from the catalog's own sizes (games/index.json "bytes", "sizes", "packBytes"), so the box,
// the catalogs, the BBS and the manual say the same thing.
import type { CatalogEntry } from './files';
import { diskCount } from '../retro/dos/disks';

/** The DOS player, renamed for each game (retro/computer/drives.ts gives it this size too). */
export const PLAYER_EXE_BYTES = 160_598;
/** Bytes the DOS release adds to the game's files: the player .EXE, sound driver, CONFIG.BAT, README. */
export const DOS_EXTRA_BYTES = PLAYER_EXE_BYTES + 2_493 + 3_000;

type Sized = Pick<CatalogEntry, 'bytes' | 'original' | 'exe'>;

/** What the release adds to the game's own files: our games' whole DOS kit, another author's game its .EXE. */
export function extraBytes(g: Pick<CatalogEntry, 'original' | 'exe'>): number {
  return g.original ? DOS_EXTRA_BYTES : g.exe ? PLAYER_EXE_BYTES : 0;
}

/** Bytes the game takes on the hard disk once installed (or unzipped). */
export function installedBytes(g: Sized): number {
  return (g.bytes ?? 0) + extraBytes(g);
}

/** How many 3½" 1.44 MB disks the game ships on. Every disk count shown anywhere comes from here. */
export function gameDisks(g: Sized): number {
  return diskCount(installedBytes(g));
}

export function disksLine(n: number): string {
  return n === 1 ? 'One 3½" 1.44 MB disk' : `${n} × 3½" 1.44 MB disks`;
}

/** A size as a 1995 catalog printed it: "812K" up to a megabyte, then "1.8 MB" (rounded up: it's what you need free). */
export function sizeText(bytes: number, space = true): string {
  if (bytes < 1000 * 1024) return `${Math.max(1, Math.ceil(bytes / 1024))}K`;
  return `${(Math.ceil((bytes * 10) / 1_048_576) / 10).toFixed(1)}${space ? ' ' : ''}MB`;
}

export function hardDiskLine(g: Sized): string {
  return `${sizeText(installedBytes(g))} on hard disk`;
}

/** "One 3½" 1.44 MB disk · 1.8 MB on hard disk": what a catalog says about a game's size. */
export function storageLine(g: Sized): string {
  return `${disksLine(gameDisks(g))} · ${hardDiskLine(g)}`;
}

// ---- the ZIP on a BBS --------------------------------------------------------------------

/**
 * How much PKZIP 2.04g's deflate leaves of each kind of file, measured on the games' own disks
 * (only used when the catalog has no packBytes: the dev server's doesn't).
 */
const SHRINK: Record<string, number> = { gif: 0.98, voc: 0.64, txt: 0.61, pal: 0.59, rec: 0.52, exe: 0.41, fli: 0.28, snd: 0.26, cmf: 0.24, gam: 0.16, bbl: 0.12 };
const SHRINK_OTHER = 0.08;
const shrink = (name: string) => SHRINK[name.split('.').pop()!.toLowerCase()] ?? SHRINK_OTHER;
/** A ZIP's local header (30 bytes) and central directory entry (46), each with the name; then the 22-byte end record. */
const zipHeaders = (names: string[]) => 22 + names.reduce((n, f) => n + 76 + 2 * f.length, 0);

export const zipName = (g: Pick<CatalogEntry, 'exe' | 'id'>) => `${(g.exe ?? g.id).replace(/\.EXE$/i, '').slice(0, 8).toUpperCase()}.ZIP`;

/** The ZIP's size on a BBS: the game's files (their real pack size when the build measured it), the release's extras, FILE_ID.DIZ and the ZIP's own headers. */
export function zipBytes(g: Pick<CatalogEntry, 'bytes' | 'original' | 'exe' | 'files' | 'sizes' | 'packBytes' | 'id'>): number {
  const files = g.packBytes ?? (g.sizes?.length === g.files.length ? g.files.reduce((n, f, i) => n + g.sizes![i] * shrink(f), 0) : (g.bytes ?? 0) * 0.4);
  const extra = extraBytes(g) * SHRINK.exe;
  const names = [...g.files, ...(g.exe || g.original ? [g.exe ?? `${g.id}.exe`] : []), 'FILE_ID.DIZ'];
  return Math.round(files + extra + 450 + zipHeaders(names));
}

/** Characters a second Zmodem moves: 2400 bps (no compression), 14,400 with V.42bis (ZIPs don't shrink further, but the start and stop bits go). */
export const MODEM_CPS = { 2400: 230, 14400: 1650 } as const;

export function transferMinutes(bytes: number, bps: keyof typeof MODEM_CPS): number {
  return Math.max(1, Math.ceil(bytes / MODEM_CPS[bps] / 60));
}

/** "57 min", "2 hr 5 min". */
export function minutesText(min: number): string {
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} hr${min % 60 ? ` ${min % 60} min` : ''}`;
}

/** "57 min at 2400 · 8 min at 14.4k" */
export function downloadLine(bytes: number, sep = ' · '): string {
  return `${minutesText(transferMinutes(bytes, 2400))} at 2400${sep}${minutesText(transferMinutes(bytes, 14400))} at 14.4k`;
}
