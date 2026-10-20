// The 3.5" floppy disks in the desk's disk box: Recreational Software Designs' own
// games first, the other gameware samples, your projects, and blank disks.
import { loadCatalog, loadHostedGame, type CatalogEntry, GameFiles } from '../project/files';
import { listProjects, loadProject } from '../project/storage';

export const FLOPPY_BYTES = 1_457_664; // 1.44 MB formatted capacity
/** The games RSD made to show off Game-Maker. */
export const RSD_GAMES = ['sample', 'pipemare', 'nebula', 'houses', 'tutor', 'terrain', 'penguin'];
/** Up to 720 KB fit on a double density disk; more needs high density (1.44 MB). */
export const DD_BYTES = 737_280;

export type DiskKind = 'rsd' | 'gameware' | 'project' | 'blank';

export interface Disk {
  id: string;
  kind: DiskKind;
  title: string;
  /** Hand-written label text. */
  label: string;
  /** Plastic color of the disk: the same for every disk from one author or company. */
  color: string;
  /** The label's printed band across the top. */
  stripe: string;
  /** Something written on the label later in red marker, if anything. */
  note?: string;
  /** HD disks have a second hole, opposite the write-protect tab. */
  density: 'HD' | 'DD';
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

const COLORS = ['#2b2b2b', '#8a1d1d', '#1d6b3a', '#5a3a8a', '#9a7a10', '#1c6f7a', '#444b55', '#a4471b'];
const RSD_BLUE = '#1d3b8a';
/** Publishers of the disks, so each gets a distinct color (filled in by loadDisks). */
const PUBLISHERS: string[] = [];
const STRIPES = ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a', '#00838f', '#ef6c00'];
const NOTES = ['Do not erase!', 'BACKUP', 'keep!!', 'Mine - hands off', 'v2 - good one', 'DO NOT FORMAT', 'from Jeff', 'BEAT IT!'];

/** A small stable number from a string, to pick colors and notes. */
function hash(s: string): number {
  let n = 2166136261;
  for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 16777619);
  return n >>> 0;
}

/** Disks from one author or company share a color; RSD's own are blue. */
function looks(g: CatalogEntry): Pick<Disk, 'color' | 'stripe' | 'note' | 'density'> {
  const group = g.company ?? g.author;
  const rsd = RSD_GAMES.includes(g.id);
  const h = hash(g.id);
  // Each publisher gets its own color, in the order they appear; others are light grey.
  const groupIndex = group ? [...new Set(PUBLISHERS)].indexOf(group) : -1;
  return {
    color: rsd ? RSD_BLUE : groupIndex >= 0 ? COLORS[groupIndex % COLORS.length] : '#bdb8ad',
    stripe: rsd ? '#000080' : STRIPES[hash(`${group ?? g.id}*`) % STRIPES.length],
    note: h % 10 < 4 ? NOTES[(h >>> 4) % NOTES.length] : undefined,
    density: (g.bytes ?? 0) > DD_BYTES ? 'HD' : 'DD',
  };
}

export function diskCount(bytes: number): number {
  return Math.max(1, Math.ceil(bytes / FLOPPY_BYTES));
}

export async function loadDisks(): Promise<Disk[]> {
  const catalog = await loadCatalog().catch(() => [] as CatalogEntry[]);
  const gameware = catalog.filter((g) => g.kind === 'gameware');
  PUBLISHERS.length = 0;
  for (const g of gameware) if (!RSD_GAMES.includes(g.id) && (g.company ?? g.author)) PUBLISHERS.push((g.company ?? g.author)!);
  const disks: Disk[] = [];
  const order = [...RSD_GAMES.map((id) => gameware.find((g) => g.id === id)).filter((g): g is CatalogEntry => !!g), ...gameware.filter((g) => !RSD_GAMES.includes(g.id))];
  order.forEach((g) => {
    const rsd = RSD_GAMES.includes(g.id);
    disks.push({
      id: `cd:${g.id}`,
      kind: rsd ? 'rsd' : 'gameware',
      title: g.gam ? g.title : `${g.id} art & sounds`,
      label: g.gam ? g.title : `${g.id.toUpperCase()}\npictures, monsters, sounds`,
      ...looks(g),
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
      stripe: STRIPES[hash(p.id) % STRIPES.length],
      density: 'HD',
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
    stripe: '#9e9e9e',
    density: 'HD',
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
