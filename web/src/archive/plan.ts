// What archive.html fetches, and in what order. The build lists every file (archive.json, made from the
// whole built site, so a new kind of file is found with no edit here); this
// puts the shell and the code for the home page and the desk first, then the rest of the code, the
// tour, the desk's and BBS's data and the magazine, and the game packs (and the phone's files) last,
// only when asked. Names stay in this module: the page shows counts only.

/** [path, bytes on the wire, bytes stored] as archive.json (and offline.json) list them. */
type Entry = [string, number, number];

export interface Manifest {
  shell: string[];
  files: Entry[];
}

/** The size of one `?part=N` slice, in bytes on the wire. */
const PART_BYTES = 12_000_000;

/** Code the home page and the desk start from, by chunk name (assets/<name>-<hash>.<ext>). */
const FIRST_CODE = /^assets\/(main|site|ui|offline|preload-helper|tourButton|desk|designers|tinHearts|modernUi|web|dos|shared-[a-z-]+)[-.]/;
/** Data the desk and its PC read as they start. */
const FIRST_DATA = /^((desk|frames|opening|dos|gm)\/|games\/(catalog|catalog-files|index)\.json$)/;
/** The game lists the build writes after offline.json is made: the page asks for them, so they are listed here. */
const LISTS = ['games/catalog.json', 'games/catalog-files.json', 'games/index.json'];
/** The big packs: games, the phone's files and the 3D-print and laser kits. */
const LAST = /^(games\/.*\.(zip|gmpak)$|phone\/|trinkets\/|laser\/)/;
/** Never fetched: the gate lists, which name the secret games. The build leaves them out too; this is the second lock. */
const NEVER = /^games\/extra-\d+\.json$/;

const tierOf = (path: string, shell: Set<string>): number => {
  if (shell.has(path)) return 0;
  if (FIRST_CODE.test(path) || FIRST_DATA.test(path)) return 1;
  if (LAST.test(path)) return 3;
  return 2;
};

/** The files to fetch, in order. `games` adds the packs. The shell's './' is the page itself. */
export function fetchOrder(m: Manifest, games: boolean): Entry[] {
  const clean = (s: string) => (s === './' ? '' : s.replace(/^\.\//, ''));
  const shell = new Set(m.shell.map(clean));
  const all: Entry[] = [...m.shell.map((s): Entry => [s === './' ? './' : clean(s), 0, 0]), ...m.files.filter(([p]) => !shell.has(p) && !NEVER.test(p))];
  for (const p of LISTS) if (!all.some((e) => e[0] === p)) all.push([p, 0, 0]);
  return all
    .map((e, i) => ({ e, i, t: tierOf(clean(e[0]), shell) }))
    .filter(({ t }) => games || t < 3)
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map(({ e }) => e);
}

/** How many `?part=` slices an ordered list makes. */
export function partCount(order: Entry[]): number {
  return slices(order).length;
}

/** Slice number `part` (from 1) of the list, or all of it when `part` is 0. */
export function takePart(order: Entry[], part: number): Entry[] {
  return part > 0 ? (slices(order)[part - 1] ?? []) : order;
}

function slices(order: Entry[]): Entry[][] {
  const out: Entry[][] = [];
  let cur: Entry[] = [];
  let bytes = 0;
  for (const e of order) {
    if (bytes >= PART_BYTES) {
      out.push(cur);
      cur = [];
      bytes = 0;
    }
    cur.push(e);
    bytes += e[1];
  }
  if (cur.length) out.push(cur);
  return out;
}
