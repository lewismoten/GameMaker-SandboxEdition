// Builds Mac disk images (.dmg) of the CD's games, or of any one-web-page export, with the
// same code the web app's "Download for Mac" runs (src/export/macApp.ts). Run from web/:
//
//   npx vite-node scripts/macDmg.ts teddy goat realm      some catalog games, by id
//   npx vite-node scripts/macDmg.ts --all                 every listed game
//   npx vite-node scripts/macDmg.ts --html mygame.html --title "My Game" --id mygame
//   ... --zip                                              a .zip of the app as well
//   ... --out <dir>                                        instead of ../dist/mac
//
// The images are written in plain JavaScript (an ISO 9660 + Rock Ridge image that macOS
// mounts like any .dmg), so this runs anywhere, including Linux CI. On a Mac, signing and
// notarizing can be switched on for when there is an Apple Developer ID:
//
//   MAC_SIGN_IDENTITY="Developer ID Application: Name (TEAMID)"   codesign the app with it
//                                    (hardened runtime) and build a compressed UDZO image
//                                    with hdiutil instead
//   MAC_NOTARY_PROFILE=<profile>      then notarize it (xcrun notarytool submit --wait, with a
//                                    profile saved by `xcrun notarytool store-credentials`)
//                                    and staple the ticket to the image
//   MAC_UDZO=1                        hdiutil UDZO image even without an identity (ad-hoc)
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { cdCatalog, cdFiles } from './cdGames';
import { buildSinglePageTemplate } from './singlePageBuild';
import { encodeGame, fillPage } from '../src/export/singlePage';
import { appName, boxColors, iconPicture, macAppDmg, macAppFiles, macAppZip, type MacAppOptions } from '../src/export/macApp';
import { dsStore } from '../src/export/dsStore';
import { GameFiles } from '../src/project/files';

const web = resolve(__dirname, '..');
const cd = resolve(web, '../cd');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i < 0 ? undefined : process.argv[i + 1];
}

const flags = new Set(['--all', '--zip']);
const valued = new Set(['--html', '--title', '--id', '--out']);
const ids = process.argv.slice(2).filter((a, i, all) => !flags.has(a) && !valued.has(a) && !valued.has(all[i - 1]));
const out = resolve(arg('--out') ?? resolve(web, '../dist/mac'));
const player = new Uint8Array(readFileSync(resolve(web, 'public/mac/GameMakerPlayer')));
const identity = process.env.MAC_SIGN_IDENTITY;
const notary = process.env.MAC_NOTARY_PROFILE;
const udzo = !!identity || !!process.env.MAC_UDZO;

/** With hdiutil: the app signed (by `identity`, or ad-hoc), on a compressed image, notarized if asked. */
async function hdiutilDmg(o: MacAppOptions, file: string): Promise<void> {
  const stage = mkdtempSync(join(tmpdir(), 'gm-dmg-'));
  try {
    const { name, files } = await macAppFiles(o);
    for (const f of files) {
      mkdirSync(dirname(join(stage, f.path)), { recursive: true });
      writeFileSync(join(stage, f.path), f.data!, { mode: f.mode });
    }
    symlinkSync('/Applications', join(stage, 'Applications'));
    writeFileSync(join(stage, '.DS_Store'), dsStore({ x: 200, y: 140, width: 600, height: 380, iconSize: 128, icons: { [name]: [160, 170], Applications: [440, 170] } }));
    const app = join(stage, name);
    if (identity) execFileSync('codesign', ['--force', '--deep', '--options', 'runtime', '--timestamp', '--sign', identity, app], { stdio: 'inherit' });
    execFileSync('codesign', ['--verify', '--deep', '--strict', app], { stdio: 'inherit' });
    rmSync(file, { force: true });
    execFileSync('hdiutil', ['create', '-quiet', '-volname', name.replace(/\.app$/, ''), '-srcfolder', stage, '-format', 'UDZO', '-ov', file], { stdio: 'inherit' });
    if (identity) execFileSync('codesign', ['--sign', identity, '--timestamp', file], { stdio: 'inherit' });
    if (notary) {
      execFileSync('xcrun', ['notarytool', 'submit', file, '--keychain-profile', notary, '--wait'], { stdio: 'inherit' });
      execFileSync('xcrun', ['stapler', 'staple', file], { stdio: 'inherit' });
    }
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

async function write(o: MacAppOptions): Promise<void> {
  const base = join(out, appName(o.title).replace(/\.app$/, ''));
  const date = new Date(Date.UTC(2026, 0, 1, 12));
  if (udzo) await hdiutilDmg(o, `${base}.dmg`);
  else writeFileSync(`${base}.dmg`, await macAppDmg(o, date));
  if (process.argv.includes('--zip')) writeFileSync(`${base}.zip`, await macAppZip(o, date));
  console.log(`${base}.dmg`);
}

async function main(): Promise<void> {
  mkdirSync(out, { recursive: true });
  const html = arg('--html');
  if (html) {
    const title = arg('--title') ?? 'Game';
    await write({ title, id: arg('--id') ?? title, html: readFileSync(html, 'utf8'), player });
    return;
  }
  const catalog = cdCatalog(cd);
  const picked = process.argv.includes('--all') ? catalog.filter((e) => e.gam) : ids.map((id) => catalog.find((e) => e.id === id) ?? (() => { throw new Error(`No game "${id}" in the catalog.`); })());
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
      player,
      author: e.author ?? e.company,
      year: e.year,
      picture: iconPicture(new GameFiles(entries), e.gam!),
      colors: boxColors(e.original?.box),
    });
  }
}

main().catch((e: Error) => {
  console.error(e.message);
  process.exit(1);
});
