// PLAYHACK's "Disk in A:" line: the game on the floppy in drive A:, to patch straight from its
// first screen. A disk of yours is patched as it is; an original (write-protected) game disk is
// patched through a copy on C:, the way Game-Maker treats a read-only game (writableProject),
// and the copy becomes a game of yours under its catalog game's kind (homeOrigin); a blank disk
// has nothing to patch.
import type { InsertedDisk, RetroHost } from '../host';
import type { Disk } from '../dos/disks';
import { errorBox } from '../text/textUi';
import { dosDirName } from '../dos/hardDisk';
import { listProjects } from '../../project/storage';
import { originId, rememberOrigin } from '../../editor/shell/homeOrigin';

/** What choosing the disk does: nothing to patch, patch it as it is, or patch a copy on C:. */
export type DiskChoice = 'empty' | 'mine' | 'protected';

type DiskFacts = Pick<Disk, 'kind' | 'gam' | 'writeProtected' | 'projectId'>;

export function diskChoice(d: DiskFacts): DiskChoice {
  if (d.kind === 'blank' || !d.gam) return 'empty';
  if (d.writeProtected) return 'protected';
  return d.projectId ? 'mine' : 'empty';
}

/** The line at the top of PLAYHACK's first screen. */
export function diskLine(d: Pick<Disk, 'kind' | 'title'>): string {
  return `Disk in A: ${d.kind === 'blank' ? 'blank disk' : d.title.trim()}`;
}

/** Your copy of catalog game `catalogId` made before (the newest), if any. */
export function earlierCopy<T extends { id: string }>(projects: readonly T[], catalogId: string | undefined, origin = originId): T | undefined {
  return catalogId ? projects.find((p) => !p.id.startsWith('hd-') && origin(p.id) === catalogId) : undefined;
}

/** The game to patch for the disk in A: (its project and DOS name), or undefined after saying why not. */
export async function diskGame(h: RetroHost, inA: InsertedDisk): Promise<{ id: string; dos: string } | undefined> {
  const d = inA.disk;
  const choice = diskChoice(d);
  if (choice === 'empty') {
    await errorBox(h, 'No game on that disk.', 'Put a game disk from the disk box in drive A:.  (C)ontinue');
    return undefined;
  }
  if (choice === 'mine') return { id: d.projectId!, dos: dosDirName(d.gam ?? d.title) };
  const catalogId = d.catalog?.id;
  const copy = earlierCopy(await listProjects().catch(() => []), catalogId);
  if (copy) {
    const dos = await folderOf(h, copy.id, copy.gam);
    const r = await errorBox(h, `${d.title}: the disk is write-protected.`, `(P)atch your copy in C:\\GM\\${dos}   (E)xit`);
    return r === 'P' || r === 'Enter' ? { id: copy.id, dos } : undefined;
  }
  // asks "(C)opy it to C:\GM\NAME on the hard disk", as Game-Maker does
  const p = await h.writableProject();
  if (!p) return undefined;
  if (!p.id.startsWith('hd-')) rememberOrigin(p.id, catalogId);
  return { id: p.id, dos: await folderOf(h, p.id, p.gam ?? d.title) };
}

/** The game's folder in C:\GM. */
async function folderOf(h: RetroHost, id: string, gam: string): Promise<string> {
  const g = (await h.hdGames()).find((x) => x.projectId === id || (x.source === 'installed' && `hd-${x.catalog?.id}` === id));
  return g?.dir ?? dosDirName(gam);
}
