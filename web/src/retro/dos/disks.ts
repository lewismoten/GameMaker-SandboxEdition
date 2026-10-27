// The 3.5" floppy disks in the desk's disk box: Recreational Software Designs' own
// games first, the other gameware samples, your projects, and blank disks.
import { isSandboxGame, loadGameList, loadHostedGame, type CatalogEntry, GameFiles } from '../../project/files';
import { listProjects, loadProject } from '../../project/storage';
import { isBizarreGame } from '../../project/bizarre';
import { fnv1a } from '../../seededRandom';

export const FLOPPY_BYTES = 1_457_664; // 1.44 MB formatted capacity
/** The games RSD made to show off Game-Maker. */
const RSD_GAMES = ['sample', 'pipemare', 'nebula', 'houses', 'tutor', 'terrain', 'penguin'];
/** Up to 720 KB fit on a double density disk; more needs high density (1.44 MB). */
const DD_BYTES = 737_280;

/** original: the games made for this project, on professionally printed labels. */
type DiskKind = 'rsd' | 'gameware' | 'original' | 'project' | 'blank';

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
  /** The user's disks: when the game was last saved (Date.now()). */
  updated?: number;
  catalog?: CatalogEntry;
  load: () => Promise<GameFiles>;
}

const COLORS = ['#2b2b2b', '#8a1d1d', '#1d6b3a', '#5a3a8a', '#9a7a10', '#1c6f7a', '#444b55', '#a4471b'];
/** RSD's own disks: a deeper pink than the label (the Game-Maker box's #f0a090), so they read apart. */
const RSD_PINK = '#d9786a';
/** Publishers of the disks, so each gets a distinct color (filled in by loadDisks). */
const PUBLISHERS: string[] = [];
const STRIPES = ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a', '#00838f', '#ef6c00'];
/** Your own disk of a Bard of Bizarre game: magenta with a gold stripe, easy to spot among the beige ones. */
const BARD_DISK = { color: '#a0287a', stripe: '#f2c14e' };
const NOTES = ['Do not erase!', 'BACKUP', 'keep!!', 'Mine - hands off', 'v2 - good one', 'DO NOT FORMAT', 'from Doc Leo', 'BEAT IT!'];

/** A small stable number from a string, to pick colors and notes. */
const hash = fnv1a;

/** Disks from one author or company share a color; RSD's own are the Game-Maker box's pink. */
function looks(g: CatalogEntry): Pick<Disk, 'color' | 'stripe' | 'note' | 'density'> {
  const group = g.company ?? g.author;
  const rsd = RSD_GAMES.includes(g.id);
  // Each publisher gets its own color, in the order they appear; others are light gray.
  const groupIndex = group ? [...new Set(PUBLISHERS)].indexOf(group) : -1;
  return {
    color: rsd ? RSD_PINK : groupIndex >= 0 ? COLORS[groupIndex % COLORS.length] : '#bdb8ad',
    stripe: rsd ? '#0b0b0b' : STRIPES[hash(`${group ?? g.id}*`) % STRIPES.length],
    // printed labels carry no scribbles; notes are for the user's own hand-written disks
    density: (g.bytes ?? 0) > DD_BYTES ? 'HD' : 'DD',
  };
}

export function diskCount(bytes: number): number {
  return Math.max(1, Math.ceil(bytes / FLOPPY_BYTES));
}

export async function loadDisks(): Promise<Disk[]> {
  const catalog = await loadGameList().catch(() => [] as CatalogEntry[]);
  const gameware = catalog.filter((g) => g.kind === 'gameware');
  PUBLISHERS.length = 0;
  for (const g of gameware) if (!RSD_GAMES.includes(g.id) && (g.company ?? g.author)) PUBLISHERS.push((g.company ?? g.author)!);
  const disks: Disk[] = [];
  const order = [
    ...RSD_GAMES.map((id) => gameware.find((g) => g.id === id)).filter((g): g is CatalogEntry => !!g),
    ...gameware.filter((g) => !RSD_GAMES.includes(g.id)),
  ];
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
  // Our own games, on their printed shareware disks (open to change, unlike other shareware).
  for (const g of catalog.filter(isSandboxGame)) {
    const label = g.original?.label;
    disks.push({
      id: `cd:${g.id}`,
      kind: 'original',
      title: g.title,
      label: g.title,
      color: label?.band ?? '#222',
      stripe: label?.band ?? '#c62828',
      density: (g.bytes ?? 0) > DD_BYTES ? 'HD' : 'DD',
      gam: g.gam ?? undefined,
      bytes: g.bytes ?? 0,
      writeProtected: true,
      catalog: g,
      load: () => loadHostedGame(g),
    });
  }
  // a Bard of Bizarre game of your own (downloaded or copied) keeps its .gam's name
  const bardGams = new Set(catalog.filter(isBizarreGame).flatMap((g) => (g.gam ? [g.gam.toLowerCase()] : [])));
  for (const p of (await listProjects().catch(() => [])).filter((p) => !p.id.startsWith('hd-'))) {
    const bard = bardGams.has(p.gam.toLowerCase());
    disks.push({
      id: `project:${p.id}`,
      kind: 'project',
      title: p.name,
      label: p.name,
      color: bard ? BARD_DISK.color : '#d8d2c0',
      stripe: bard ? BARD_DISK.stripe : STRIPES[hash(p.id) % STRIPES.length],
      // a scribbled note now and then, as on any kid's own disks
      note: hash(p.id) % 10 < 4 ? NOTES[(hash(p.id) >>> 4) % NOTES.length] : undefined,
      density: 'HD',
      gam: p.gam,
      bytes: 0,
      writeProtected: false,
      projectId: p.id,
      updated: p.updated,
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
  // Sandbox Software's games at the front, then RSD's and the other gameware, then the
  // user's own disks (newest first, as listProjects gives them) and a blank one.
  const rank: Record<DiskKind, number> = {
    original: 0,
    rsd: 1,
    gameware: 2,
    project: 3,
    blank: 4,
  };
  return disks.sort((a, b) => rank[a.kind] - rank[b.kind]);
}
