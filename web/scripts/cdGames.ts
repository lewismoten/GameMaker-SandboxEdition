// Makes the games on the original Game-Maker CD (../cd) available to the web app without
// copying them into the web project: the dev server serves them straight from cd/, and
// the production build (e.g. in GitHub Actions) emits them into dist/.
//
//   games/index.json             catalog of every playable game
//   games/gameware/<id>/<file>   the free sample games that came with Game-Maker (editable)
//   games/shareware/<id>/<file>  shareware games (play only, with the author's notice)
//   dos/xferplay.exe, dos/sndblast.drv   the DOS stand-alone player for "Export for DOS"
//   gm/index.json, gm/<file>     the installed C:\GM folder (runtime/run/GM) for the retro
//                                desk: a listing plus its text files (.HLP screens, .TXT)
import type { Plugin } from 'vite';
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface CdCatalogEntry {
  id: string;
  title: string;
  kind: 'gameware' | 'shareware';
  /** Folder of the game's files, relative to the site root. */
  path: string;
  gam: string | null;
  files: string[];
  /** Shareware: the author's notice (readme / order form), as text. */
  notice?: string;
  /** Shareware: CRC-32 of the .gam file, to recognize the game when imported. */
  gamCrc?: number;
}

// Files that only matter to DOS (executables, batch files, icons, archives).
const SKIP = /\.(exe|bat|com|ico|bak|drv|zip|lzh)$/i;
const NOTICES = ['readme.txt', 'order.doc', 'register.txt', 'order.txt'];
const NOTICE_WORDS = /shareware|freeware|regist/i;

// Old .gam files often name the title scene "Title Screen" or a version number, so
// shareware titles come from each game's own credits and story screens.
const SHAREWARE_TITLES: Record<string, string> = {
  ajqst2: "A-J's Quest 2 (demo)",
  ajquest: "A-J's Quest",
  bounerm: 'Bounerim',
  congress: 'Progress or Congress?',
  fluffyr: 'Fluffy Ralf',
  gridlin: 'Gridline',
  njlnflx: 'Nejilian Flux',
  octolrs: 'Octolris',
  orb: 'ORB - The Derelict Planet',
  pac: 'PAC',
  paperair: 'Paper Airplane',
  parsec3d: 'Parsec Man 3D',
  signhdg: 'Sign',
  zoom: 'Zoom',
};

function cString(bytes: Uint8Array): string {
  const end = bytes.indexOf(0);
  return new TextDecoder('latin1').decode(end < 0 ? bytes : bytes.subarray(0, end)).trim();
}

function gameTitle(gam: Uint8Array): string {
  const isV3 = gam[0] === 0x47 && gam[1] === 0x4d; // "GM" header
  // v3: 256 byte header + 6 byte grator header + scene0 { type 2, pos 4, scroll 16, links 1 } -> desc[20]
  return isV3 ? cString(gam.subarray(285, 305)) : cString(gam.subarray(6, 21));
}

function dosText(bytes: Uint8Array): string {
  return new TextDecoder('latin1')
    .decode(bytes)
    .replace(/\x1a[\s\S]*$/, '')
    .replace(/\r/g, '')
    .replace(/[^\n\t\x20-\x7e]/g, '')
    .replace(/^\s*\n/, '')
    .trimEnd();
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

export interface GmInstallEntry {
  name: string;
  size: number;
  dir: boolean;
}

// Text files of the installed Game-Maker the retro desk shows (help screens are raw
// 80x25 text-mode dumps); programs are listed but never served.
const GM_TEXT = /\.(hlp|txt)$/i;

interface Scan {
  gm: GmInstallEntry[];
  catalog: CdCatalogEntry[];
  /** Site path -> file on disk. */
  files: Map<string, string>;
}

function scan(cdRoot: string): Scan {
  const files = new Map<string, string>();
  const catalog: CdCatalogEntry[] = [];
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
      const entry: CdCatalogEntry = {
        id,
        title: (kind === 'shareware' && SHAREWARE_TITLES[id]) || (gamBytes && gameTitle(gamBytes)) || id,
        kind,
        path,
        gam,
        files: names,
      };
      if (kind === 'shareware') {
        // The author's readme/order form, plus any screen that talks about shareware or registering.
        const own = NOTICES.map((n) => disk.get(n)).filter((p): p is string => !!p);
        const screens = names
          .filter((n) => n.endsWith('.txt') && !NOTICES.includes(n) && n !== 'gmhelp.txt')
          .map((n) => disk.get(n)!)
          .filter((p) => NOTICE_WORDS.test(readFileSync(p, 'latin1')));
        entry.notice = [...own, ...screens].map((p) => dosText(readFileSync(p))).concat(cdNotice ? [cdNotice] : []).join('\n\n----\n\n');
        entry.gamCrc = crc32(gamBytes!);
      }
      for (const [name, p] of disk) files.set(`${path}${name}`, p);
      catalog.push(entry);
    }
  }
  // The DOS player used by "Export for DOS".
  for (const name of ['xferplay.exe', 'sndblast.drv']) {
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
  return { gm, catalog, files };
}

export function cdGames(cdRoot: string): Plugin {
  let cache: Scan | undefined;
  const get = () => (cache ??= scan(cdRoot));
  return {
    name: 'gamemaker-cd-games',
    configureServer(server) {
      server.watcher.add(cdRoot);
      server.watcher.on('change', (f) => f.startsWith(cdRoot) && (cache = undefined));
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\/+/, '');
        if (url === 'games/index.json' || url === 'gm/index.json') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(url.startsWith('gm/') ? get().gm : get().catalog));
          return;
        }
        const file = get().files.get(url.toLowerCase());
        if (!file) return next();
        res.setHeader('Content-Type', 'application/octet-stream');
        createReadStream(file).pipe(res);
      });
    },
    generateBundle() {
      const { gm, catalog, files } = get();
      this.emitFile({ type: 'asset', fileName: 'games/index.json', source: JSON.stringify(catalog) });
      this.emitFile({ type: 'asset', fileName: 'gm/index.json', source: JSON.stringify(gm) });
      for (const [site, disk] of files) this.emitFile({ type: 'asset', fileName: site, source: readFileSync(disk) });
    },
  };
}
