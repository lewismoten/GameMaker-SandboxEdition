// The disk box's index-card dividers: which group each floppy files under, in the home
// page's collection names (editor/shell/homeCategories.ts), and which groups are folded shut.
import type { Disk } from '../../retro/dos/disks';
import { isBizarreGame } from '../../project/bizarre';

export type DiskGroup = 'mine' | 'sandbox' | 'bizarre' | 'special' | 'starter' | 'gameware' | 'shareware' | 'imported';

/** The dividers front to back, each with the case it stands in and its tab's color. */
export const DISK_GROUPS: { id: DiskGroup; name: string; side: 'mine' | 'site'; tab: string }[] = [
  { id: 'mine', name: 'My games', side: 'mine', tab: '#c62828' },
  { id: 'imported', name: 'Imported', side: 'mine', tab: '#1565c0' },
  { id: 'sandbox', name: 'Sandbox', side: 'site', tab: '#2e7d32' },
  { id: 'bizarre', name: 'Bizarre', side: 'site', tab: '#a0287a' },
  { id: 'special', name: 'Specials', side: 'site', tab: '#ef6c00' },
  { id: 'starter', name: 'Starters', side: 'site', tab: '#f9a825' },
  { id: 'gameware', name: 'Gameware', side: 'site', tab: '#00838f' },
  { id: 'shareware', name: 'Shareware', side: 'site', tab: '#6a1b9a' },
];

/**
 * The group a disk files under. Your own disks (and the blank one) are My games unless
 * homeOrigin marked them imported; Sandbox Software's are Sandbox, Bizarre or Specials (the
 * same test as the Specials' own `"series": "special"`); the Sample Disk holds the Starters;
 * the CD's are Gameware or Shareware.
 */
export function diskGroupOf(d: Disk, isImported: (projectId: string) => boolean): DiskGroup {
  switch (d.kind) {
    case 'project':
      return d.projectId && isImported(d.projectId) ? 'imported' : 'mine';
    case 'blank':
      return 'mine';
    case 'sample':
      return 'starter';
    case 'original': {
      const g = d.catalog;
      if (g && isBizarreGame(g)) return 'bizarre';
      if (g?.series === 'special') return 'special';
      return 'sandbox';
    }
    default:
      return d.catalog?.kind === 'shareware' ? 'shareware' : 'gameware';
  }
}

/** The groups that have disks, in divider order, each with its disks' indexes into `disks`. */
export function groupDisks(disks: readonly Disk[], isImported: (projectId: string) => boolean): { id: DiskGroup; indexes: number[] }[] {
  const by = new Map<DiskGroup, number[]>();
  disks.forEach((d, i) => {
    const id = diskGroupOf(d, isImported);
    by.set(id, [...(by.get(id) ?? []), i]);
  });
  return DISK_GROUPS.flatMap(({ id }) => (by.has(id) ? [{ id, indexes: by.get(id)! }] : []));
}

const FOLDED_KEY = 'gm-disk-box-folded';

/** The groups folded shut in this browser. */
export function foldedGroups(): Set<DiskGroup> {
  try {
    const list = JSON.parse(localStorage.getItem(FOLDED_KEY) ?? '[]') as unknown;
    return new Set(Array.isArray(list) ? list.filter((g): g is DiskGroup => DISK_GROUPS.some((x) => x.id === g)) : []);
  } catch {
    return new Set();
  }
}

export function saveFolded(folded: ReadonlySet<DiskGroup>): void {
  try {
    if (folded.size) localStorage.setItem(FOLDED_KEY, JSON.stringify([...folded]));
    else localStorage.removeItem(FOLDED_KEY);
  } catch {
    /* not remembered: every group opens next time */
  }
}
