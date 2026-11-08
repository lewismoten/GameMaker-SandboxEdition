// What the desk says when its address asks for a disk the disk box doesn't hold (#/desk?disk=cd:<id>, which the
// Desk | DOS | Web switch makes from whatever game was in front of you). The PC may well be off, so it says
// where the game really is and what to do, rather than a bare "not in the disk box": a Starter or graduation
// comes on the Game-Maker Sample Disk or the CD's SAMPLES folder, a game made in another browser isn't here.
// Only Starters are named (never a secret game).
import type { CatalogEntry } from '../project/files';
import { isStarterGame } from '../project/starter';
import { floppyFolders, sampleFolders } from '../retro/dos/sampleDisk';
import { SAMPLE_DISK_TITLE } from '../retro/dos/disks';

/** The toast for a wanted disk id that isn't in the disk box. */
export function missingDiskNote(id: string, catalog: readonly CatalogEntry[]): string {
  if (id.startsWith('project:')) return 'That disk holds a game made in another browser, so it isn’t in this disk box.';
  const game = id.startsWith('cd:') ? catalog.find((g) => g.id === id.slice(3)) : undefined;
  if (game && isStarterGame(game)) {
    const onFloppy = floppyFolders(catalog).find((f) => f.entry.id === game.id);
    if (onFloppy) return `${game.title} is on the ${SAMPLE_DISK_TITLE}, in A:\\${onFloppy.dir}. Pick that disk from the disk box.`;
    const onCd = sampleFolders(catalog).find((f) => f.entry.id === game.id);
    if (onCd)
      return `${game.title} comes on the Game-Maker CD, not a floppy. Open the Game-Maker box, put the CD in drive D: and look in D:\\SAMPLES\\${onCd.dir}.`;
  }
  return 'That game isn’t in the disk box, so drive A: was left empty.';
}
