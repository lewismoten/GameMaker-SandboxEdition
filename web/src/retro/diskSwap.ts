// Which programs on the retro PC let you swap the disk in drive A: while they run (the desk's
// disk box and Eject). The utilities that keep their own lists and never hold a file open on
// A: (PLAYHACK, SAVEHACK, BACKUP, GMCRACK, VPIC and the little ledgers) carry on with the new
// disk; a game and Game-Maker are quit first, as before, and so is anything that may be part
// way through reading or writing: the BBS terminal (a download), HEXEDIT (a file open on A:),
// the Warez installer and a batch file.
import type { ProgramRef } from './dos/vfs';

type ProgramKind = ProgramRef['kind'];

const SWAPS: ReadonlySet<ProgramKind> = new Set<ProgramKind>(['playhack', 'savehack', 'backup', 'gmcrack', 'vpic', 'egg', 'achieve', 'offline']);

/** True when the disk in A: can change under `kind` without quitting it. */
export function swapsDisks(kind: ProgramKind | undefined): boolean {
  return !!kind && SWAPS.has(kind);
}
