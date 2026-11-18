// Reads CD, original-game and installed Game-Maker files into the catalog and source map.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseGame, gameTitle as displayGameTitle } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { gameZipName } from './gameArchive';
import { GAME_INFO, type CdCatalogEntry, type OriginalExtras, type GameInfo, type GmInstallEntry } from './cdGamesModel';
import { blurbOf, dosText, storyFile } from '../src/export/gameAbout';
import { checkGame, QUICK_CHECK_FILE, type Issue } from '../src/project/health';
import { boxGame, type BoxGame } from '../src/desk/boxes/boxFacts';

// Files that only matter to DOS (executables, batch files, icons, archives).
const SKIP = /\.(exe|bat|com|ico|bak|drv|zip|lzh)$/i;
const NOTICES = ['readme.txt', 'order.doc', 'register.txt', 'order.txt'];
const NOTICE_WORDS = /shareware|freeware|regist/i;

function gameTitle(gam: Uint8Array): string {
  try {
    return displayGameTitle(parseGame(gam));
  } catch {
    return ''; // A damaged menu keeps the catalog's directory-name fallback.
  }
}

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of data) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Text files of the installed Game-Maker the retro desk shows (help screens are raw
// 80x25 text-mode dumps); programs are listed but never served.
const GM_TEXT = /\.(hlp|txt|bat)$/i;

/** First lines of a story/instruction screen, joined. */
function blurbFor(names: string[], disk: Map<string, string>): string | undefined {
  const pick = storyFile(names);
  return pick ? blurbOf(dosText(readFileSync(disk.get(pick)!))) : undefined;
}

/** The quick check of a game's files (its .gam and graphic scripts, src/project/health.ts): what the ⚠ note says. */
export function quickHealth(e: Pick<CdCatalogEntry, 'gam' | 'files' | 'sizes' | 'path'>, files: ReadonlyMap<string, string>): Issue[] {
  const loaded = new Map(
    e.files.filter((n) => QUICK_CHECK_FILE.test(n) && files.has(`${e.path}${n}`)).map((n) => [n, new Uint8Array(readFileSync(files.get(`${e.path}${n}`)!))]),
  );
  return checkGame({ names: () => [...e.files].sort(), get: (n) => loaded.get(n), byteSize: (n) => e.sizes[e.files.indexOf(n)] }, e.gam ?? undefined);
}

/** What a game's box reads from its .gam (levels, screenshot captions), so the desk's shelf fetches none. */
export function boxGameOf(e: Pick<CdCatalogEntry, 'gam' | 'path' | 'original' | 'series'>, files: ReadonlyMap<string, string>): BoxGame | undefined {
  const at = e.gam && files.get(`${e.path}${e.gam}`);
  if (!e.original?.box || !at || e.series === 'starter') return undefined; // a Starter has no retail box on the desk (hasRetailBox)
  try {
    return boxGame(parseGame(new Uint8Array(readFileSync(at))), e.original.box.shots);
  } catch {
    return undefined;
  }
}

/** Native source paths for one game, shared by previews and library metadata. */
export function entryFiles(entry: Pick<CdCatalogEntry, 'files' | 'path'>, files: ReadonlyMap<string, string>): Map<string, string> {
  return new Map(
    entry.files.flatMap((name) => {
      const path = files.get(`${entry.path}${name}`);
      return path ? [[name, path] as [string, string]] : [];
    }),
  );
}

export interface Scan {
  gm: GmInstallEntry[];
  catalog: CdCatalogEntry[];
  /** Original games whose about.json says "secret": true: in no listing, page, sitemap or picture the build makes; only in games/extra-<gate>.json. */
  secret: CdCatalogEntry[];
  /** Each secret game's gate (its extra-<gate>.json): 2 when every tin heart reveals it, else 1 (every felt egg). */
  gates: Map<string, number>;
  /** Site path -> file on disk. */
  files: Map<string, string>;
}

/** True for a regular file; false for anything else, or a file that vanished since the listing (another build moved it). */
function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

export function scan(cdRoot: string): Scan {
  const files = new Map<string, string>();
  const catalog: CdCatalogEntry[] = [];
  const secret: CdCatalogEntry[] = [];
  const cdNotice = existsSync(join(cdRoot, 'sharware/readme.txt')) ? dosText(readFileSync(join(cdRoot, 'sharware/readme.txt'))) : '';

  for (const kind of ['gameware', 'shareware'] as const) {
    const root = join(cdRoot, kind === 'gameware' ? 'gameware' : 'sharware');
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root).sort()) {
      const from = join(root, dir);
      if (!statSync(from).isDirectory()) continue;
      const id = dir.toLowerCase();
      const path = `games/${kind}/${id}/`;
      const names: string[] = [];
      const disk = new Map<string, string>();
      for (const name of readdirSync(from).sort()) {
        if (SKIP.test(name) || !statSync(join(from, name)).isFile()) continue;
        const lower = name.toLowerCase();
        disk.set(lower, join(from, name));
        names.push(lower);
      }
      const gam = names.find((f) => f.endsWith('.gam')) ?? null;
      // Shareware folders without a game (e.g. archiving tools) are left out.
      if (kind === 'shareware' && !gam) continue;
      const gamBytes = gam ? readFileSync(disk.get(gam)!) : undefined;
      const exe = readdirSync(from).find((n) => /\.exe$/i.test(n));
      const entry: CdCatalogEntry = {
        id,
        title: GAME_INFO[id]?.title || (gamBytes && gameTitle(gamBytes)) || id,
        ...(GAME_INFO[id] ? { author: GAME_INFO[id].author, company: GAME_INFO[id].company, year: GAME_INFO[id].year, price: GAME_INFO[id].price } : {}),
        kind,
        path,
        gam,
        files: names,
        sizes: names.map((n) => statSync(disk.get(n)!).size),
        bytes: [...disk.values()].reduce((n, p) => n + statSync(p).size, 0),
        blurb: blurbFor(names, disk),
        pack: gameZipName({ id }),
      };
      if (kind === 'shareware' && exe) entry.exe = exe.toUpperCase();
      if (kind === 'shareware') {
        // The author's readme/order form, plus any screen that talks about shareware or registering.
        const own = NOTICES.map((n) => disk.get(n)).filter((p): p is string => !!p);
        const screens = names
          .filter((n) => n.endsWith('.txt') && !NOTICES.includes(n) && n !== 'gmhelp.txt')
          .map((n) => disk.get(n)!)
          .filter((p) => NOTICE_WORDS.test(readFileSync(p, 'latin1')));
        entry.notice = [...own, ...screens]
          .map((p) => dosText(readFileSync(p)))
          .concat(cdNotice ? [cdNotice] : [])
          .join('\n\n----\n\n');
        entry.gamCrc = crc32(gamBytes!);
      }
      for (const [name, p] of disk) files.set(`${path}${name}`, p);
      catalog.push(entry);
    }
  }
  const gates = new Map<string, number>();
  scanOriginals(join(cdRoot, '../games'), catalog, secret, files, gates);
  // The DOS player used by "Export for DOS".
  for (const name of ['xferplay.exe', 'sndblast.drv', 'config.hlp']) {
    const p = join(cdRoot, 'gm', name);
    if (existsSync(p)) files.set(`dos/${name}`, p);
  }
  // The installed Game-Maker (C:\GM) shown on the retro desk's PC.
  const gm: GmInstallEntry[] = [];
  const install = join(cdRoot, '../runtime/run/GM');
  if (existsSync(install)) {
    for (const name of readdirSync(install).sort()) {
      const st = statSync(join(install, name));
      gm.push({ name: name.toUpperCase(), size: st.isDirectory() ? 0 : st.size, dir: st.isDirectory() });
      if (st.isFile() && GM_TEXT.test(name)) files.set(`gm/${name.toLowerCase()}`, join(install, name));
    }
  }
  return { gm, catalog, secret, files, gates };
}

/**
 * ../games/<id>/: original games made for this project. disk/ holds the game as it would
 * be on its floppy; about.json its credits, label and box; manual.json its manual.
 */
function scanOriginals(root: string, catalog: CdCatalogEntry[], secret: CdCatalogEntry[], files: Map<string, string>, gates: Map<string, number>): void {
  if (!existsSync(root)) return;
  for (const dir of readdirSync(root).sort()) {
    const base = join(root, dir);
    const diskDir = join(base, 'disk');
    if (!existsSync(join(base, 'about.json')) || !existsSync(diskDir)) continue;
    const about = JSON.parse(readFileSync(join(base, 'about.json'), 'utf8')) as GameInfo &
      OriginalExtras & { blurb?: string; exe?: string; dosName?: string; secret?: boolean; series?: string; unlock?: string };
    const manual = existsSync(join(base, 'manual.json')) ? JSON.parse(readFileSync(join(base, 'manual.json'), 'utf8')) : undefined;
    const printables = existsSync(join(base, 'printables.json')) ? JSON.parse(readFileSync(join(base, 'printables.json'), 'utf8')) : undefined;
    // its DOS player look (games/kit/player.ts): the catalog carries it, never the game's files
    const player = existsSync(join(base, 'player.json')) ? (JSON.parse(readFileSync(join(base, 'player.json'), 'utf8')) as unknown) : undefined;
    // what its controls mean (the editor's Overview > Controls); editor-only, never in a download
    const controls = existsSync(join(base, 'controls.json')) ? (JSON.parse(readFileSync(join(base, 'controls.json'), 'utf8')) as unknown) : undefined;
    const id = dir.toLowerCase();
    const path = `games/originals/${id}/`;
    const names: string[] = [];
    const disk = new Map<string, string>();
    for (const name of readdirSync(diskDir).sort()) {
      if (name.startsWith('.') || SKIP.test(name) || !isFile(join(diskDir, name))) continue; // a build's half-written .NAME.pid.part comes and goes
      disk.set(name.toLowerCase(), join(diskDir, name));
      names.push(name.toLowerCase());
    }
    const gam = names.find((f) => f.endsWith('.gam')) ?? null;
    if (!gam) continue;
    const gamBytes = readFileSync(disk.get(gam)!);
    const notice = NOTICES.map((n) => disk.get(n)).filter((p): p is string => !!p);
    // the walkthrough is served beside the disk's files, but is not one of them
    const walk = join(base, 'walkthrough.json');
    const walkthrough = existsSync(walk) ? `${path}walkthrough.json` : undefined;
    if (walkthrough) files.set(walkthrough, walk);
    if (about.secret === true) gates.set(id, about.unlock === 'hearts' ? 2 : 1);
    (about.secret === true ? secret : catalog).push({
      id,
      title: about.title,
      author: about.author,
      company: about.company,
      year: about.year,
      price: about.price,
      kind: 'shareware',
      path,
      gam,
      files: names,
      sizes: names.map((n) => statSync(disk.get(n)!).size),
      bytes: [...disk.values()].reduce((n, p) => n + statSync(p).size, 0),
      blurb: about.blurb ?? blurbFor(names, disk),
      exe: about.exe ?? `${id.slice(0, 8).toUpperCase()}.EXE`,
      notice: notice.map((p) => dosText(readFileSync(p))).join('\n\n----\n\n'),
      gamCrc: crc32(gamBytes),
      original: { label: about.label, box: about.box, sound: about.sound, manual, printables },
      ...(about.series ? { series: about.series } : {}),
      ...(walkthrough ? { walkthrough } : {}),
      ...(player ? { player } : {}),
      ...(controls ? { controls } : {}),
      pack: gameZipName({ id, exe: about.exe, dosName: about.dosName }),
      ...(about.dosName ? { dosName: about.dosName.toUpperCase() } : {}),
    });
    for (const [name, p] of disk) files.set(`${path}${name}`, p);
  }
}
