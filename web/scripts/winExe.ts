// Builds Windows programs (.exe) of the CD's games, or of any one-web-page export, with the
// same code the web app's "Download for Windows" runs (src/export/winApp.ts). Run from web/:
//
//   npx vite-node scripts/winExe.ts teddy goat realm      some catalog games, by id
//   npx vite-node scripts/winExe.ts --all                 every game the web app offers for download
//                                                         (export/downloadable.ts: not other authors' games)
//   npx vite-node scripts/winExe.ts --html mygame.html --title "My Game" --id mygame
//   ... --zip                                              a .zip of each program as well
//   ... --arm64                                            programs for Windows on Arm as well
//                                                         ("<Title> (Arm).exe"); x64 ones run there too
//   ... --out <dir>                                        instead of ../dist/win
//
// The programs are written in plain JavaScript, so this runs anywhere, including Linux CI.
// They are not code-signed. With a certificate, sign them afterwards on Windows
// (signtool sign /fd sha256 /tr <timestamp server> /td sha256 ...); signing adds a
// certificate table after the resources, which winApp.ts never needs to touch again.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { cdCatalog, cdFiles } from './cdGames';
import { buildSinglePageTemplate } from './singlePageBuild';
import { encodeGame, fillPage } from '../src/export/singlePage';
import { fictionNote } from '../src/export/fiction';
import { boxColors, iconPicture } from '../src/export/macApp';
import { exeName, winExe, winExeZip, type WinAppOptions, type WinArch } from '../src/export/winApp';
import { GameFiles } from '../src/project/files';
import { catalogDownloadable } from '../src/export/downloadable';

const web = resolve(__dirname, '..');
const cd = resolve(web, '../cd');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i < 0 ? undefined : process.argv[i + 1];
}

const flags = new Set(['--all', '--zip', '--arm64']);
const valued = new Set(['--html', '--title', '--id', '--out']);
const ids = process.argv.slice(2).filter((a, i, all) => !flags.has(a) && !valued.has(a) && !valued.has(all[i - 1]));
const out = resolve(arg('--out') ?? resolve(web, '../dist/win'));
const arches: WinArch[] = process.argv.includes('--arm64') ? ['x64', 'arm64'] : ['x64'];
const players = Object.fromEntries(arches.map((a) => [a, new Uint8Array(readFileSync(resolve(web, `public/win/GameMakerPlayer-${a}.exe`)))])) as Record<WinArch, Uint8Array>;

async function write(o: Omit<WinAppOptions, 'player'>): Promise<void> {
  const date = new Date(Date.UTC(2026, 0, 1, 12));
  for (const arch of arches) {
    const base = join(out, exeName(o.title).replace(/\.exe$/, '') + (arch === 'arm64' ? ' (Arm)' : ''));
    const options = { ...o, player: players[arch] };
    writeFileSync(`${base}.exe`, await winExe(options));
    if (process.argv.includes('--zip')) writeFileSync(`${base}.zip`, await winExeZip(options, date));
    console.log(`${base}.exe`);
  }
}

async function main(): Promise<void> {
  mkdirSync(out, { recursive: true });
  const html = arg('--html');
  if (html) {
    const title = arg('--title') ?? 'Game';
    await write({ title, id: arg('--id') ?? title, html: readFileSync(html, 'utf8') });
    return;
  }
  const catalog = cdCatalog(cd);
  const named = ids.map((id) => catalog.find((e) => e.id === id) ?? (() => { throw new Error(`No game "${id}" in the catalog.`); })());
  for (const e of named) if (!catalogDownloadable(e)) throw new Error(`"${e.id}" is another author's game; it is offered play-only, without downloads.`);
  // the same games the web app's Download button offers
  const picked = process.argv.includes('--all') ? catalog.filter(catalogDownloadable) : named;
  if (!picked.length) throw new Error('Name the games (catalog ids), --all, or --html <file>.');
  const template = await buildSinglePageTemplate();
  const where = cdFiles(cd);
  for (const e of picked) {
    const entries: [string, Uint8Array][] = e.files.map((n) => [n, new Uint8Array(readFileSync(where.get(`${e.path}${n}`)!))]);
    const game = await encodeGame({ id: e.id, title: e.title, gam: e.gam!, notice: e.notice }, entries);
    const page = fillPage(template, game, { blurb: e.blurb, author: e.author, company: e.company, year: e.year });
    await write({
      title: e.title,
      id: e.id,
      html: page,
      author: e.author ?? e.company,
      year: e.year,
      fiction: fictionNote(e),
      picture: iconPicture(new GameFiles(entries), e.gam!),
      colors: boxColors(e.original?.box),
    });
  }
}

main().catch((e: Error) => {
  console.error(e.message);
  process.exit(1);
});
