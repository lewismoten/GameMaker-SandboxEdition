// Coming back to the desk the address describes (#/desk?disk=cd:nebula&run=play&open=gm-manual):
// the disk in drive A:, what the PC runs, what is open on the desk, and a prop to look at.
import { toast } from '../editor/core/ui';
import type { Disk } from '../retro/dos/disks';
import type { DiskAction } from './disks/diskBox';
import { loadCatalog, type CatalogEntry } from '../project/files';
import type { viewState } from '../urlState';

/** What the address asked for when the desk was drawn. */
interface Wanted {
  disk?: string;
  run?: string;
  open?: string;
}

/** What the desk can do to get there (desk.ts). */
interface RestoreActions {
  disks(): Promise<Disk[]>;
  insert(d: Disk): Promise<void>;
  onDisk(d: Disk, action: DiskAction): Promise<void>;
  startGameMaker(): Promise<void>;
  command(cmd: string): Promise<void>;
  power(onlyOn: boolean): Promise<void>;
  look(prop: string): void;
  catalog(): Promise<void>;
  magazine(): Promise<void>;
  openGmBox(): Promise<void>;
  dosManual(): Promise<void>;
  gameManual(g: CatalogEntry): Promise<void>;
}

export async function restoreDesk(wanted: Wanted, deskView: ReturnType<typeof viewState>, on: RestoreActions): Promise<void> {
  const { disk, run, open } = wanted;
  const looking = deskView.get('look');
  if (looking) {
    deskView.set({ look: undefined });
    on.look(looking);
  }
  if (!disk && !run && !open) return;
  const disks = await on.disks();
  const d = disk ? disks.find((x) => x.id === disk) : undefined;
  if (disk && !d) {
    deskView.set({ disk: undefined });
    toast(disk.startsWith('project:') ? 'That disk holds a game made in another browser, so it isn’t in this disk box.' : 'That disk isn’t in the disk box.');
  }
  if (d) await on.insert(d);
  if (run === 'play' && d?.gam) await on.onDisk(d, 'play');
  else if (run === 'design' && d) await on.onDisk(d, 'design');
  else if (run === 'gm') await on.startGameMaker();
  else if (run === 'bbs') await on.command('C:\nTERMINAL');
  else if (run) await on.power(true);
  if (open === 'catalog') void on.catalog();
  else if (open === 'magazine') void on.magazine();
  else if (open === 'gm-box') void on.openGmBox();
  else if (open === 'gm-manual') void on.dosManual();
  else if (open?.startsWith('manual:')) {
    const g = (await loadCatalog().catch(() => [])).find((x) => x.id === open.slice(7) && x.original?.manual);
    if (g) void on.gameManual(g);
  }
}
