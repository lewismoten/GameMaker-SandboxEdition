// The 3.5" floppy disks in the desk's disk box: Recreational Software Designs' own
// games first, the other gameware samples, your projects, and blank disks.
import { loadCatalog, loadHostedGame, type CatalogEntry, GameFiles } from '../project/files';
import { listProjects, loadProject } from '../project/storage';

export const FLOPPY_BYTES = 1_457_664; // 1.44 MB formatted capacity
/** The games RSD made to show off Game-Maker. */
export const RSD_GAMES = ['sample', 'pipemare', 'nebula'];

export type DiskKind = 'rsd' | 'gameware' | 'project' | 'blank';

export interface Disk {
  id: string;
  kind: DiskKind;
  title: string;
  /** Hand-written label text. */
  label: string;
  /** Plastic color of the disk. */
  color: string;
  /** .gam file on the disk (none for blank disks and asset libraries). */
  gam?: string;
  /** Bytes used, for the "1 of 2" disk count. */
  bytes: number;
  /** The write-protect tab: originals are protected, so editing makes a copy. */
  writeProtected: boolean;
  projectId?: string;
  catalog?: CatalogEntry;
  load: () => Promise<GameFiles>;
}

const COLORS = ['#2b2b2b', '#1d3b8a', '#8a1d1d', '#1d6b3a', '#5a3a8a', '#9a7a10', '#1c6f7a', '#444b55'];

export function diskCount(bytes: number): number {
  return Math.max(1, Math.ceil(bytes / FLOPPY_BYTES));
}

export async function loadDisks(): Promise<Disk[]> {
  const catalog = await loadCatalog().catch(() => [] as CatalogEntry[]);
  const gameware = catalog.filter((g) => g.kind === 'gameware');
  const disks: Disk[] = [];
  const order = [...RSD_GAMES.map((id) => gameware.find((g) => g.id === id)).filter((g): g is CatalogEntry => !!g), ...gameware.filter((g) => !RSD_GAMES.includes(g.id))];
  order.forEach((g, i) => {
    const rsd = RSD_GAMES.includes(g.id);
    disks.push({
      id: `cd:${g.id}`,
      kind: rsd ? 'rsd' : 'gameware',
      title: g.gam ? g.title : `${g.id} art & sounds`,
      label: g.gam ? g.title : `${g.id.toUpperCase()}\npictures, monsters, sounds`,
      color: rsd ? '#1d3b8a' : COLORS[i % COLORS.length],
      gam: g.gam ?? undefined,
      bytes: g.bytes ?? 0,
      writeProtected: true,
      catalog: g,
      load: () => loadHostedGame(g),
    });
  });
  for (const p of (await listProjects().catch(() => [])).filter((p) => !p.id.startsWith('hd-'))) {
    disks.push({
      id: `project:${p.id}`,
      kind: 'project',
      title: p.name,
      label: p.name,
      color: '#d8d2c0',
      gam: p.gam,
      bytes: 0,
      writeProtected: false,
      projectId: p.id,
      load: async () => (await loadProject(p.id))?.files ?? new GameFiles(),
    });
  }
  disks.push({
    id: 'blank',
    kind: 'blank',
    title: 'Blank disk',
    label: '',
    color: '#2b2b2b',
    bytes: 0,
    writeProtected: false,
    load: async () => new GameFiles(),
  });
  return disks;
}

/** Fills in each disk's size once its files are loaded. */
export function measure(files: GameFiles): number {
  return files.entries().reduce((n, [, b]) => n + b.length, 0);
}
