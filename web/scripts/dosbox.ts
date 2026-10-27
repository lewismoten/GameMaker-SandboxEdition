// Lays out a folder to mount as drive C: in DOSBox, for trying everything under real DOS:
//   GM\                 Game-Maker 3.0 as installed (runtime/run/GM), with every Sandbox and
//                       Bard of Bizarre game's disk in a folder of its own beside the samples,
//                       where GM's menus look for games
//   GAMES\GAMEWARE\     the CD's gameware, each in its own folder, as on the CD
//   GAMES\SHARWARE\     the CD's shareware (with each one's own .EXE)
//   GAMES\SANDBOX\      Sandbox Software's games, and
//   GAMES\BIZARRE\      the Bard of Bizarre's: each as the site's DOS export makes it (its .gam
//                       with the CD's XFERPLAY.EXE named after it, SNDBLAST.DRV, CONFIG.BAT)
// The folder (dosbox/ at the repository's root, or the path given) is in .gitignore and is
// emptied first (only when this script made it: it leaves a .gm-dosbox file there). Secret games are left out unless --secret is given.
// It also writes DOSBOX.command, which opens the DOSBox app with the folder as C:, in C:\GM:
// double-click it in Finder, or `npm run dosbox:open` (or --launch, to start it right after).
//   npx vite-node scripts/dosbox.ts [target folder] [--secret] [--launch]
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, join, resolve } from 'node:path';
import { GameFiles } from '../src/project/files';
import { exportDos } from '../src/export/exportDos';
import { readZip } from '../src/project/zip';

const ROOT = resolve(__dirname, '../..');
const args = process.argv.slice(2);
const withSecret = args.includes('--secret');
const target = resolve(args.find((a) => !a.startsWith('--')) ?? join(ROOT, 'dosbox'));

/** Left in the folder, so it is only ever emptied when this script made it. */
const MARK = '.gm-dosbox';
if (existsSync(target) && readdirSync(target).length && !existsSync(join(target, MARK))) {
  throw new Error(`${target} has files this script didn't put there; give an empty or new folder.`);
}

/** The site's DOS export fetches its player from the app; here it comes from the CD. */
const PLAYER: Record<string, string> = Object.fromEntries(['xferplay.exe', 'sndblast.drv', 'config.hlp'].map((n) => [`dos/${n}`, `cd/gm/${n}`]));
globalThis.fetch = (async (url: string | URL) => {
  const path = Object.entries(PLAYER).find(([k]) => String(url).endsWith(k))?.[1];
  if (!path) return new Response(null, { status: 404 });
  return new Response(readFileSync(join(ROOT, path)));
}) as typeof fetch;

/** Every file in a folder, by its name in upper case (DOS has no lower case). */
function readDir(dir: string): GameFiles {
  const files = new GameFiles();
  for (const name of readdirSync(dir)) if (statSync(join(dir, name)).isFile()) files.set(name.toLowerCase(), new Uint8Array(readFileSync(join(dir, name))));
  return files;
}

function writeFiles(dir: string, files: { name: string; data: Uint8Array }[]): void {
  mkdirSync(dir, { recursive: true });
  for (const f of files) writeFileSync(join(dir, f.name.toUpperCase()), f.data);
}

/** A copy of a folder with every name in upper case. */
function copyUpper(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    const dst = join(to, name.toUpperCase());
    if (statSync(src).isDirectory()) copyUpper(src, dst);
    else cpSync(src, dst);
  }
}

// what playing in DOS wrote survives a rebuild: each game's sound and video setup (CONFIG.DAT),
// saved games (GAME0-9.SAV, SAVNAMES.DAT) and high scores (.HIS). They are copied first to
// dosbox-saves/<date and time>/ beside the folder (git-ignored), then put back into the new one.
const PLAYED = /^(config\.dat|game\d\.sav|savnames\.dat|.*\.his)$/i;
const kept = new Map<string, Buffer>();
const keep = (dir: string, rel = ''): void => {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) keep(path, join(rel, name));
    else if (PLAYED.test(name)) kept.set(join(rel, name), readFileSync(path));
  }
};
keep(target);
let backup: string | undefined;
if (kept.size) {
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  backup = join(target, '..', `${basename(target)}-saves`, stamp);
  for (const [rel, data] of kept) {
    mkdirSync(join(backup, rel, '..'), { recursive: true });
    writeFileSync(join(backup, rel), data);
  }
}
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

/** Removes empty folders under (and including) `dir`, after the backup is pruned. */
function pruneEmpty(dir: string): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) if (statSync(join(dir, name)).isDirectory()) pruneEmpty(join(dir, name));
  if (!readdirSync(dir).length) rmSync(dir, { recursive: true });
}
writeFileSync(join(target, MARK), 'Made by web/scripts/dosbox.ts; emptied and rebuilt each time it runs.\n');
const gm = join(target, 'GM');
copyUpper(join(ROOT, 'runtime/run/GM'), gm);
console.log(`GM\\  Game-Maker 3.0 (runtime/run/GM)`);

for (const [kind, from] of [
  ['GAMEWARE', 'cd/gameware'],
  ['SHARWARE', 'cd/sharware'],
] as const) {
  const dir = join(ROOT, from);
  const games = readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory() && n !== 'library' && n !== 'tools');
  for (const g of games) copyUpper(join(dir, g), join(target, 'GAMES', kind, g.toUpperCase().slice(0, 8)));
  console.log(`GAMES\\${kind}\\  ${games.length} games`);
}

/** Games left out of the DOSBox folder, as Lewis asked. */
const LEFT_OUT = new Set(['logic']);

interface About {
  title?: string;
  series?: string;
  company?: string;
  secret?: boolean;
}
const made: Record<string, string[]> = { SANDBOX: [], BIZARRE: [] };
for (const id of readdirSync(join(ROOT, 'games'))) {
  const disk = join(ROOT, 'games', id, 'disk');
  const aboutPath = join(ROOT, 'games', id, 'about.json');
  if (!existsSync(disk) || !existsSync(aboutPath)) continue;
  const about = JSON.parse(readFileSync(aboutPath, 'utf8')) as About;
  if (about.secret && !withSecret) continue;
  if (LEFT_OUT.has(id)) continue;
  const files = readDir(disk);
  const gam = files.mainGame();
  if (!gam) continue;
  const kind = about.series === 'bizarre' || about.company === 'The Bard of Bizarre' ? 'BIZARRE' : 'SANDBOX';
  // named after its .gam, as its .EXE is (TUIT\TUIT.EXE for realm), the way GM's Transfer named
  // a game's folder; already a DOS name (the export checks), so no NAME~1 short names
  const dir = gam.replace(/\.gam$/i, '').toUpperCase();
  // for GM's menus: the disk's files, in a folder beside GM's samples
  writeFiles(
    join(gm, dir),
    files.entries().map(([name, data]) => ({ name, data })),
  );
  // to play straight from DOS: the site's DOS export of it
  const { zip } = await exportDos(files, { title: about.title ?? id, gam, appBase: 'http://local/' });
  writeFiles(join(target, 'GAMES', kind, dir), await readZip(zip));
  made[kind].push(dir);
}
let restored = 0;
for (const [rel, data] of kept) {
  const path = join(target, rel);
  // the same as the fresh build (a sample game's own high scores, say): nothing to keep
  if (existsSync(path) && readFileSync(path).equals(data)) {
    if (backup) rmSync(join(backup, rel));
    continue;
  }
  if (existsSync(join(path, '..'))) (writeFileSync(path, data), restored++);
}
if (backup) pruneEmpty(backup);
if (backup && existsSync(backup)) console.log(`backed up what DOS wrote (setups, saved games, high scores) to ${backup}`);
if (restored) console.log(`put back ${restored} played file${restored === 1 ? '' : 's'} (a game left out this time keeps its copy in the backup only)`);
for (const [kind, dirs] of Object.entries(made)) console.log(`GAMES\\${kind}\\  and GM\\  ${dirs.length} games: ${dirs.join(' ')}`);

// DOSBox starts already in C:\GM, with this folder as drive C: given as -c commands, so the app
// keeps its own settings (a -conf file would replace them)
const startUp = ['-c', `mount c "${target}"`, '-c', 'c:', '-c', 'cd \\GM'];
const command = join(target, 'DOSBOX.command');
const quoted = startUp.map((a) => `'${a.replace(/'/g, `'\\''`)}'`).join(' ');
// the app's own program, run directly: `open -a DOSBox --args …` loses the arguments
writeFileSync(
  command,
  [
    '#!/bin/sh',
    '# Starts DOSBox with this folder as drive C:, in C:\\GM (double-click in Finder)',
    'for app in /Applications/DOSBox.app "$HOME/Applications/DOSBox.app"; do',
    `  if [ -x "$app/Contents/MacOS/DOSBox" ]; then "$app/Contents/MacOS/DOSBox" ${quoted} >/dev/null 2>&1 & exit 0; fi`,
    'done',
    'echo "DOSBox.app is not in /Applications or ~/Applications." >&2',
    'exit 1',
    '',
  ].join('\n'),
);
chmodSync(command, 0o755);

console.log(`
Start DOSBox with C: mounted and in \\GM:
  npm run dosbox:open        (from web/), or double-click ${command}

Or by hand in DOSBox:
  mount c "${target}"
  c:
  cd \\GM
  gm                         (Game-Maker; its games are the folders beside it)
or play one straight from DOS, e.g.
  cd \\GAMES\\SANDBOX\\${made.SANDBOX[0] ?? 'TEDDY'}
  dir *.exe                  (the game's .EXE; CONFIG.BAT sets up sound and video)
`);
// DOSBox keeps its own listing of a mounted folder: an open one still shows the old games
let dosboxOpen = false;
try {
  execFileSync('pgrep', ['-x', 'DOSBox'], { stdio: 'ignore' });
  dosboxOpen = true;
} catch {
  /* not running (pgrep exits 1) */
}
if (dosboxOpen) console.log('DOSBox is open: type RESCAN at its prompt (or press Ctrl+F4) to see the rebuilt folder.\n');
if (args.includes('--launch')) execFileSync(command);
