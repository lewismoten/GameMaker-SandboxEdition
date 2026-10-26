// What an import holds: the games in the picked or dropped files, found by their .gam files,
// in folders and in zips (zips inside zips too, a few deep). A folder with a .gam file is a
// game, with the files under it that no deeper game claims; a source (the picked files, or
// one zip) with a single game gives it every file, as an import always has. Only the .gam
// files are read while looking, so a folder of hundreds of zips holds one zip at a time; the
// games picked are read again by GameReader. No DOM: the home page's import (editor/shell/
// homeImport.ts, importChooser.ts) shows it.
import { GameFiles, IGNORED_FILE, normalize } from './files';
import { crc32, isZip, listZip } from './zip';
import { parseGame } from '../formats/game';
import { renamedExtensions } from '../dosPlayer/renamedExtensions';

/** A file to look at: picked, dropped or in a zip. Its path is from the top of what was given. */
export interface ScanFile {
  path: string;
  size: number;
  read: () => Promise<Uint8Array | undefined>;
}

/** A game found, without its files' bytes. */
export interface FoundGame {
  /** Its title (the first scene's), else its .gam file's name. */
  name: string;
  /** Where it is: "games/zark.zip › zark/", or the folder, or "" for the files picked. */
  from: string;
  /** Its .gam files' CRC-32s (a CD shareware game is matched by these). */
  gamCrcs: number[];
  /** The files it brings (the .EXEs DOS alone needs are left out). */
  fileCount: number;
  /** The picked zip it is in (none for loose files), and the paths of the zips inside that one it is in, outermost first. */
  zips: ScanFile[];
  inner: string[];
  /** Its files' paths, inside that zip or among the loose files. */
  paths: string[];
  /** When a folder holds several games, each with its own player: the .gam this one plays (named as it is once renamed back), and its title. */
  gam?: string;
}

export interface ScanReport {
  games: FoundGame[];
  /** Zips looked in (inside others too). */
  zips: number;
  /** Zips with no .gam file in them. */
  emptyZips: string[];
  /** Zips that could not be read, and why. */
  badZips: { path: string; error: string }[];
  /** Files in no game, zips aside (none of them is imported, unless no game was found at all). */
  loose: ScanFile[];
}

/** A game's own player is an .EXE of XFERPLAY 3.00's size; the import reads those and leaves out the rest. */
export const PLAYER_EXE = (name: string, size: number) => /\.exe$/i.test(name) && size === 160_598;

/** Zips inside zips are looked in this deep. */
const MAX_DEPTH = 3;

const clean = (path: string) => path.replace(/\\/g, '/').replace(/^(\.\/|\/)+/, '');
const dirOf = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
const baseOf = (path: string) => path.slice(path.lastIndexOf('/') + 1);
/** Copies made by other systems: a Mac's __MACOSX/ and ._ files, .DS_Store, Thumbs.db. */
const isJunk = (path: string) => /(^|\/)__MACOSX\//i.test(path) || /^\._|^\.ds_store$|^thumbs\.db$/i.test(baseOf(path));
const isGam = (path: string) => /\.gam$/i.test(path);
const isZipName = (path: string) => /\.zip$/i.test(path);
/** A file a game brings: not the zips (looked in apart) and not the .EXEs DOS alone needs, but a player .EXE. */
const brings = (f: ScanFile) => !isZipName(f.path) && (!IGNORED_FILE.test(baseOf(f.path)) || PLAYER_EXE(f.path, f.size));

interface Group {
  dir: string;
  files: ScanFile[];
}

/**
 * The games among these files (by their folders) and the files in none. Zips are left out.
 * `played`: game files a player .EXE names with an extension of its own (playedBy).
 */
export function groupGames(files: ScanFile[], played: ReadonlySet<ScanFile> = new Set()): { games: Group[]; loose: ScanFile[] } {
  const kept = files.filter((f) => !isJunk(clean(f.path)) && !isZipName(f.path));
  const dirs = [...new Set(kept.filter((f) => isGam(f.path) || played.has(f)).map((f) => dirOf(clean(f.path))))].sort((a, b) => b.length - a.length);
  const games = new Map(dirs.map((d) => [d, [] as ScanFile[]]));
  const loose: ScanFile[] = [];
  for (const f of kept) {
    const dir = dirOf(clean(f.path));
    // one game takes everything, as importing a game's folder always did; else the deepest folder above it
    const home = dirs.length === 1 ? dirs[0] : dirs.find((d) => d === '' || dir === d || dir.startsWith(`${d}/`));
    if (home === undefined) loose.push(f);
    else if (brings(f)) games.get(home)!.push(f);
  }
  return {
    games: [...games].map(([dir, files]) => ({ dir, files })).sort((a, b) => a.dir.localeCompare(b.dir, undefined, { numeric: true, sensitivity: 'base' })),
    loose,
  };
}

/**
 * Each player .EXE here and the game file beside it that it plays: the one named after it, with
 * the .gam extension it asks for (Acord Games' players ask for .z0g; Virtual Mario's for none).
 */
export async function playedBy(files: ScanFile[]): Promise<Map<ScanFile, ScanFile>> {
  const out = new Map<ScanFile, ScanFile>();
  const kept = files.filter((f) => !isJunk(clean(f.path)));
  for (const exe of kept.filter((f) => PLAYER_EXE(f.path, f.size))) {
    const bytes = await exe.read().catch(() => undefined);
    if (!bytes) continue;
    const ext = renamedExtensions(bytes)['.gam'] ?? '.gam';
    const path = clean(exe.path);
    const want = normalize(`${baseOf(path).replace(/\.[^.]*$/, '')}${ext}`);
    const gam = kept.find((f) => f !== exe && dirOf(clean(f.path)) === dirOf(path) && normalize(f.path) === want);
    if (gam) out.set(exe, gam);
  }
  return out;
}

/** The title on a game's menu screen, from its main .gam (as Project.fromFiles names it). */
function titleOf(bytes: Uint8Array | undefined, gamName: string): string {
  try {
    if (bytes) return parseGame(bytes).scenes[0]?.desc.trim() || gamName;
  } catch {
    // a damaged .gam is still a game to import; its name will do
  }
  return gamName;
}

/** Where a game is, for people: the zips it is in, then its folder. */
const fromLabel = (zips: string[], dir: string) => [...zips, dir ? `${dir}/` : ''].filter(Boolean).join(' › ');

interface ScanOptions {
  signal?: AbortSignal;
  /** Told before each zip given (not those inside them) is read, and once at the end. */
  onProgress?: (done: number, total: number, path?: string) => void;
}

/** Waits a moment, so a long look through many zips leaves the page free to draw and click. */
const breathe = () => new Promise<void>((r) => setTimeout(r, 0));

/** Looks through what was given for its games. Throws an AbortError when canceled. */
export async function scanImport(given: ScanFile[], { signal, onProgress }: ScanOptions = {}): Promise<ScanReport> {
  const report: ScanReport = { games: [], zips: 0, emptyZips: [], badZips: [], loose: [] };
  const topZips = given.filter((f) => isZipName(f.path));
  let done = 0;

  /** These files' games (and their zips', `depth` zips down); how many games that was. */
  const look = async (files: ScanFile[], zips: ScanFile[], inner: string[], depth: number): Promise<number> => {
    const players = await playedBy(files);
    const played = new Set(players.values());
    const { games, loose } = groupGames(files, played);
    if (!zips.length) report.loose.push(...loose);
    let found = 0;
    const add = async (g: Group, gams: ScanFile[], files: ScanFile[], gam?: string) => {
      const crcs: number[] = [];
      let title = '';
      for (const [i, f] of gams.entries()) {
        const bytes = await f.read().catch(() => undefined);
        if (bytes) crcs.push(crc32(bytes));
        if (i === 0) title = titleOf(bytes, gam ?? normalize(f.path));
      }
      report.games.push({
        name: title,
        from: fromLabel(zips.length ? [zips[0].path, ...inner].map(clean) : [], g.dir),
        gamCrcs: crcs,
        fileCount: files.length,
        zips: zips.slice(0, 1),
        inner,
        paths: files.map((f) => f.path),
        gam,
      });
      found++;
    };
    for (const g of games) {
      // a folder of games sharing their files, each with its own player (Acord Games'): one game each
      const own = [...players].filter(([exe, gam]) => g.files.includes(exe) && g.files.includes(gam));
      if (new Set(own.map(([, gam]) => gam)).size >= 2) {
        for (const [exe, gam] of own) {
          const others = new Set(own.map(([e]) => e).filter((e) => e !== exe));
          await add(
            g,
            [gam],
            g.files.filter((f) => !others.has(f)),
            normalize(`${baseOf(clean(gam.path)).replace(/\.[^.]*$/, '')}.gam`),
          );
        }
        continue;
      }
      const gams = g.files.filter((f) => isGam(f.path) || played.has(f)).sort((a, b) => normalize(a.path).localeCompare(normalize(b.path)));
      await add(g, gams, g.files);
    }
    for (const z of files.filter((f) => isZipName(f.path) && !isJunk(clean(f.path)))) {
      signal?.throwIfAborted();
      const top = depth === 0;
      if (top) onProgress?.(done++, topZips.length, z.path);
      const n = await lookInZip(z, top ? [z] : zips, top ? [] : [...inner, z.path], depth);
      found += n;
      if (top) await breathe();
    }
    return found;
  };

  const lookInZip = async (z: ScanFile, zips: ScanFile[], inner: string[], depth: number): Promise<number> => {
    const label = [zips[0].path, ...inner].map(clean).join(' › ');
    report.zips++;
    let entries: ScanFile[];
    try {
      const bytes = await z.read();
      if (!bytes || !isZip(bytes)) throw new Error('It is not a zip file.');
      entries = listZip(bytes).map((e) => ({ path: e.name, size: e.size, read: e.read }));
    } catch (e) {
      report.badZips.push({ path: label, error: (e as Error).message || 'It could not be read.' });
      return 0;
    }
    // zips deeper than this are left unopened
    const files = depth + 1 >= MAX_DEPTH ? entries.filter((e) => !isZipName(e.path)) : entries;
    const n = await look(files, zips, inner, depth + 1);
    if (!n) report.emptyZips.push(label);
    return n;
  };

  await look(given, [], [], 0);
  onProgress?.(topZips.length, topZips.length);
  return report;
}

/** "212 games found, 3 zips had no game" */
export function scanSummary(r: Pick<ScanReport, 'games' | 'emptyZips' | 'badZips' | 'zips'>): string {
  const n = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
  const parts = [`${n(r.games.length, 'game')} found`];
  if (r.emptyZips.length) parts.push(`${n(r.emptyZips.length, 'zip')} had no game`);
  if (r.badZips.length) parts.push(`${n(r.badZips.length, 'zip')} could not be read`);
  if (!r.games.length && r.zips && !r.emptyZips.length && !r.badZips.length) parts.push(`in ${n(r.zips, 'zip')}`);
  return parts.join(', ');
}

/** A found game's files, ready to import. */
export interface ReadGame {
  files: GameFiles;
  /** Its player .EXEs (left out of the files): a hand-edited one becomes DOS player patches. */
  players: { name: string; bytes: Uint8Array }[];
  /** Its title and the .gam it plays, when its folder holds others (FoundGame.gam); else the project names them. */
  name?: string;
  gam?: string;
}

/** Fills a game's files from these, as an import of the game's own files always has. */
export async function gameFromFiles(list: ScanFile[]): Promise<ReadGame> {
  const files = new GameFiles();
  const players: ReadGame['players'] = [];
  for (const f of list) {
    const name = baseOf(clean(f.path));
    if (PLAYER_EXE(name, f.size)) {
      const bytes = await f.read();
      if (bytes) players.push({ name, bytes });
    } else if (!IGNORED_FILE.test(name)) {
      const bytes = await f.read();
      if (bytes) files.set(name, bytes);
    }
  }
  return { files, players };
}

/**
 * Reads found games' files again, from the files given. The zip read last is kept (read the
 * games in the order found, and a zip with several is read once); none before it is.
 */
export class GameReader {
  private loose: Map<string, ScanFile>;
  private last?: { key: string; entries: Map<string, ScanFile> };

  constructor(given: ScanFile[]) {
    this.loose = new Map(given.map((f) => [f.path, f]));
  }

  async read(game: FoundGame): Promise<ReadGame> {
    const from = game.zips.length ? await this.zipEntries(game) : this.loose;
    const read = await gameFromFiles(game.paths.map((p) => from.get(p)).filter((f): f is ScanFile => !!f));
    return game.gam ? { ...read, name: game.name, gam: game.gam } : read;
  }

  private async zipEntries(game: FoundGame): Promise<Map<string, ScanFile>> {
    const key = [game.zips[0].path, ...game.inner].join('\n');
    if (this.last?.key === key) return this.last.entries;
    this.last = undefined;
    let bytes = await game.zips[0].read();
    for (const name of game.inner) {
      const inside = bytes && listZip(bytes).find((e) => e.name === name);
      bytes = inside ? await inside.read() : undefined;
    }
    if (!bytes) throw new Error(`${fromLabel([game.zips[0].path, ...game.inner].map(clean), '')} could not be read again.`);
    const entries = new Map(listZip(bytes).map((e) => [e.name, { path: e.name, size: e.size, read: e.read }]));
    this.last = { key, entries };
    return entries;
  }
}

/** A picked or dropped file as one to look at (`path` is where it was under the folder given). */
export function scanFile(file: File, path = file.webkitRelativePath || file.name): ScanFile {
  return { path, size: file.size, read: async () => new Uint8Array(await file.arrayBuffer()) };
}
