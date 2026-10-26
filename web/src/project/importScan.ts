// What an import holds: the games in the picked or dropped files, found by their .gam files,
// in folders and in zips (zips inside zips too, a few deep). A folder with a .gam file is a
// game, with the files under it that no deeper game claims; a source (the picked files, or
// one zip) with a single game gives it every file, as an import always has. Only the .gam
// files are read while looking, so a folder of hundreds of zips holds one zip at a time; the
// games picked are read again by GameReader. No DOM: the home page's import (editor/shell/
// homeImport.ts, importChooser.ts) shows it.
import { cdName, GameFiles, IGNORED_FILE, normalize } from './files';
import { crc32, isZip, listZip } from './zip';
import { parseGame } from '../formats/game';
import { markZipLeftovers } from './importLeftovers';

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
  /** Where else the same game is (its .gam files byte for byte): those copies are left out. */
  alsoIn?: string[];
  /** Files its .gam names that are not here. */
  missing?: number;
  /** Why it is left unticked: a leftover .gam beside the real game, lacking files, that no player loads. */
  leftover?: string;
}

export interface ScanReport {
  games: FoundGame[];
  /** Zips looked in (inside others too). */
  zips: number;
  /** Zips with no .gam file in them, and what they did hold ("only text files"). */
  emptyZips: { path: string; held: string }[];
  /** Zips that could not be read, and why. */
  badZips: { path: string; error: string }[];
  /** Files in no game, zips aside (none of them is imported, unless no game was found at all). */
  loose: ScanFile[];
}

/** A game's own player is an .EXE of XFERPLAY 3.00's size; the import reads those and leaves out the rest. */
export const PLAYER_EXE = (name: string, size: number) => /\.exe$/i.test(name) && size === 160_598;

/** Zips inside zips are looked in this deep. */
const MAX_DEPTH = 3;
/** A program bigger than this is not opened to see if it is a self-extracting zip. */
const MAX_SFX_BYTES = 64 << 20;
const isExe = (path: string) => /\.exe$/i.test(path);
/** Files with words in them, not a game's: a zip with only these is "only text files". */
const TEXT_FILE = /\.(txt|doc|diz|nfo|me|1st|htm|html|md|wri|rtf|cfg|conf|bat)$/i;
/** "a self-extracting archive" labels: these .EXEs, looked in as zips. */
const sfxNote = (path: string) => `${path} (a self-extracting archive)`;

/** What a zip with no game held, for its note. */
function heldBy(files: ScanFile[], sfx: Set<ScanFile>): string {
  const kept = files.filter((f) => !isJunk(clean(f.path)));
  const names = kept.map((f) => baseOf(clean(f.path)));
  if (!kept.length) return 'it is empty';
  if (kept.length === 1) return `only ${names[0]}${sfx.has(kept[0]) ? ', a self-extracting archive with no game' : ''}`;
  if (kept.every((f) => TEXT_FILE.test(f.path))) return `only text files (${names.join(', ')})`;
  const shown = names.slice(0, 3).join(', ');
  return `${kept.length} files, such as ${shown}${kept.length > 3 ? '…' : ''}`;
}

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
 * The extension a player .EXE opens its game by: XFERPLAY 3.00 keeps ".GAM" at 0x256b6, which
 * Acord Games' players changed to ".Z0G" and Virtual Mario's blanked to ".". (The DOS player
 * panel reads all of its extensions, in dosPlayer/; this needs only that one.)
 */
function gamExtension(exe: Uint8Array): string {
  let now = '';
  for (let i = 0; i < 4 && exe[0x256b6 + i]; i++) now += String.fromCharCode(exe[0x256b6 + i]);
  now = now.trim().toLowerCase();
  return now === '.' || !now ? '' : now;
}

/**
 * Each player .EXE here and the game file beside it that it plays: the one named after it, with
 * the .gam extension it asks for (Acord Games' players ask for .z0g; Virtual Mario's for none).
 * `games`: the files with an extension a player beside them asks for in place of .gam (a
 * leftover SPACE.Z0G beside ZAPAK.EXE too).
 */
export async function playedBy(files: ScanFile[]): Promise<{ players: Map<ScanFile, ScanFile>; games: Set<ScanFile> }> {
  const players = new Map<ScanFile, ScanFile>();
  const games = new Set<ScanFile>();
  const kept = files.filter((f) => !isJunk(clean(f.path)));
  for (const exe of kept.filter((f) => PLAYER_EXE(f.path, f.size))) {
    const bytes = await exe.read().catch(() => undefined);
    if (!bytes) continue;
    const ext = gamExtension(bytes);
    const path = clean(exe.path);
    const beside = kept.filter((f) => f !== exe && dirOf(clean(f.path)) === dirOf(path));
    const want = normalize(`${baseOf(path).replace(/\.[^.]*$/, '')}${ext}`);
    const gam = beside.find((f) => normalize(f.path) === want);
    if (gam) {
      players.set(exe, gam);
      games.add(gam);
    }
    // a blanked extension names no others: files without one are a game's pictures and maps too
    if (ext && ext !== '.gam') for (const f of beside) if (normalize(f.path).endsWith(ext)) games.add(f);
  }
  return { players, games };
}

/** Files a .gam names (its scenes' files) that `have` lacks; the high scores and saves a game makes as it plays aside. */
function missingFiles(bytes: Uint8Array | undefined, have: ScanFile[]): number {
  if (!bytes) return 0;
  const names = new Set(have.flatMap((f) => [normalize(f.path), cdName(f.path)]));
  try {
    const wanted = new Set(
      parseGame(bytes)
        .scenes.flatMap((s) => s.files)
        .filter((n) => n && !/\.(his|sav|rec)$/i.test(n))
        .map(normalize),
    );
    return [...wanted].filter((n) => !names.has(n) && !names.has(cdName(n))).length;
  } catch {
    return 0;
  }
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
    const { players, games: played } = await playedBy(files);
    const { games, loose } = groupGames(files, played);
    if (!zips.length) report.loose.push(...loose);
    let found = 0;
    /** Adds a game; how many files its .gam names that it lacks. */
    const add = async (g: Group, gams: ScanFile[], files: ScanFile[], gam?: string, leftover?: (missing: number) => string | undefined) => {
      const crcs: number[] = [];
      let title = '';
      let missing = 0;
      for (const [i, f] of gams.entries()) {
        const bytes = await f.read().catch(() => undefined);
        if (bytes) crcs.push(crc32(bytes));
        if (i === 0) {
          title = titleOf(bytes, gam ?? normalize(f.path));
          missing = missingFiles(bytes, files);
        }
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
        ...(missing ? { missing } : {}),
        ...(leftover?.(missing) ? { leftover: leftover(missing) } : {}),
      });
      found++;
    };
    for (const g of games) {
      const gams = g.files.filter((f) => isGam(f.path) || played.has(f)).sort((a, b) => normalize(a.path).localeCompare(normalize(b.path)));
      if (gams.length < 2) {
        await add(g, gams, g.files);
        continue;
      }
      // several games sharing a folder's files (Acord Games' NEVER and NEVER1B, or a leftover
      // SPACE beside ZAPAK): one game each, those a player beside them loads first, each
      // without the others' game files, and with only its own player when it has one
      const exeOf = new Map([...players].filter(([exe, gam]) => g.files.includes(exe) && g.files.includes(gam)).map(([exe, gam]) => [gam, exe]));
      const ownExes = new Set(exeOf.values());
      const hasPlayers = g.files.some((f) => PLAYER_EXE(f.path, f.size));
      const where = zips.length ? 'the zip' : 'the folder';
      for (const gf of [...gams].sort((a, b) => Number(exeOf.has(b)) - Number(exeOf.has(a)))) {
        const exe = exeOf.get(gf);
        const files = g.files.filter((f) => f === gf || (!gams.includes(f) && (!exe || !ownExes.has(f) || f === exe)));
        const gam = normalize(`${baseOf(clean(gf.path)).replace(/\.[^.]*$/, '')}.gam`);
        await add(g, [gf], files, gam, (missing) =>
          missing && !exe
            ? `${gam.toUpperCase()}: ${missing} of its files ${missing === 1 ? 'isn’t' : 'aren’t'} in ${where}${hasPlayers ? '; no player loads it' : ''}`
            : undefined,
        );
      }
    }
    for (const z of files.filter((f) => isZipName(f.path) && !isJunk(clean(f.path)))) {
      signal?.throwIfAborted();
      const top = depth === 0;
      if (top) onProgress?.(done++, topZips.length, z.path);
      const n = await lookInZip(z, top ? [z] : zips, top ? [] : [...inner, z.path], depth);
      found += n ?? 0;
      if (top) await breathe();
    }
    // a program in no game may be a self-extracting zip (never run: only read)
    if (depth < MAX_DEPTH)
      for (const z of loose.filter((f) => isExe(f.path) && !PLAYER_EXE(f.path, f.size) && f.size <= MAX_SFX_BYTES)) {
        signal?.throwIfAborted();
        const n = await lookInZip(z, depth === 0 ? [z] : zips, depth === 0 ? [] : [...inner, z.path], depth, true);
        if (n !== undefined) {
          sfx.add(z);
          found += n;
        }
      }
    return found;
  };

  /** The .EXEs found to be self-extracting zips. */
  const sfx = new Set<ScanFile>();

  /** How many games a zip holds; for a program (`asSfx`), undefined when it is not a self-extracting zip. */
  const lookInZip = async (z: ScanFile, zips: ScanFile[], inner: string[], depth: number, asSfx = false): Promise<number | undefined> => {
    const label = [zips[0].path, ...inner].map(clean).join(' › ');
    let entries: ScanFile[];
    try {
      const bytes = await z.read();
      if (asSfx) {
        // an MS-DOS program (MZ) with a zip's end record in it
        if (!bytes || bytes[0] !== 0x4d || bytes[1] !== 0x5a) return undefined;
        try {
          entries = listZip(bytes).map((e) => ({ path: e.name, size: e.size, read: e.read }));
        } catch {
          return undefined;
        }
      } else {
        if (!bytes || !isZip(bytes)) throw new Error('It is not a zip file.');
        entries = listZip(bytes).map((e) => ({ path: e.name, size: e.size, read: e.read }));
      }
    } catch (e) {
      report.zips++;
      report.badZips.push({ path: label, error: (e as Error).message || 'It could not be read.' });
      return 0;
    }
    report.zips++;
    if (asSfx) sfxPaths.add(label);
    // zips deeper than this are left unopened
    const files = depth + 1 >= MAX_DEPTH ? entries.filter((e) => !isZipName(e.path)) : entries;
    const n = await look(files, zips, inner, depth + 1);
    if (!n) report.emptyZips.push({ path: asSfx ? sfxNote(label) : label, held: heldBy(files, sfx) });
    return n;
  };
  /** Labels of the self-extracting archives found. */
  const sfxPaths = new Set<string>();

  await look(given, [], [], 0);
  report.games = markZipLeftovers(sameGamesOnce(report.games, sfxPaths));
  report.loose = report.loose.filter((f) => !sfx.has(f));
  // listed by where they are (a zip's games stay together, so GameReader reads it once)
  report.games.sort((a, b) => a.from.localeCompare(b.from, undefined, { numeric: true, sensitivity: 'base' }));
  onProgress?.(topZips.length, topZips.length);
  return report;
}

/**
 * One of each game whose .gam files are the same byte for byte (a zip holding a self-extracting
 * copy of itself): the copy with the most files, else the one found first, noting where the others are.
 */
function sameGamesOnce(games: FoundGame[], sfxPaths: Set<string>): FoundGame[] {
  const label = (g: FoundGame) => {
    const at = [...sfxPaths].find((p) => g.from === p || g.from.startsWith(`${p} › `));
    return at ? g.from.replace(at, sfxNote(at)) : g.from || 'the files picked';
  };
  const byGam = new Map<string, FoundGame[]>();
  const out: FoundGame[] = [];
  for (const g of games) {
    if (!g.gamCrcs.length) {
      out.push(g);
      continue;
    }
    const key = [...g.gamCrcs].sort().join(',');
    const same = byGam.get(key);
    if (same) same.push(g);
    else byGam.set(key, [g]);
  }
  for (const same of byGam.values()) {
    const keep = same.reduce((best, g) => (g.fileCount > best.fileCount ? g : best));
    const others = same.filter((g) => g !== keep);
    out.push(others.length ? { ...keep, alsoIn: others.map(label) } : keep);
  }
  return out;
}

/** "212 games found, 3 zips had no game" */
export function scanSummary(r: Pick<ScanReport, 'games' | 'emptyZips' | 'badZips' | 'zips'>): string {
  const n = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
  const parts = [`${n(r.games.length, 'game')} found`];
  if (r.emptyZips.length) parts.push(`${n(r.emptyZips.length, 'zip')} had no game`);
  if (r.badZips.length) parts.push(`${n(r.badZips.length, 'zip')} could not be read`);
  const copies = r.games.reduce((sum, g) => sum + (g.alsoIn?.length ?? 0), 0);
  if (copies) parts.push(`${n(copies, 'copy', 'copies')} of the same ${copies === 1 ? 'game' : 'games'} left out`);
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

  /** One of a found game's files by its DOS name (its title screen's), without reading the rest. */
  async file(game: FoundGame, name: string): Promise<Uint8Array | undefined> {
    const from = game.zips.length ? await this.zipEntries(game) : this.loose;
    const want = normalize(name);
    const cd = cdName(name);
    const path = game.paths.find((p) => normalize(p) === want) ?? game.paths.find((p) => normalize(p) === cd);
    return path ? from.get(path)?.read() : undefined;
  }

  /** The .gam a found game plays: its own when its folder holds others, else the first. */
  mainGam(game: FoundGame): string | undefined {
    return game.gam ?? game.paths.filter(isGam).map(normalize).sort()[0];
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
