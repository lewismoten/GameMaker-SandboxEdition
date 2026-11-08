// Writes games for Game-Maker OS (the Raspberry Pi player, github.com/lewismoten/gamemaker-os) to a card folder:
// <out>/GAMES/<DIR>/ holds each game's DOS files as the build wrote them (upper-case 8.3 names; DIR is the .GAM's name),
// and <out>/GAMES/LIBRARY.JSL is its library index: the Pocket Player's library.jsonl format (scripts/pocketData.ts,
// src/export/pocketLibrary.ts), one JSON line a game with its title, category and the .GAM's CRC-32, plus the company,
// year and blurb the web Games page shows. Game-Maker OS reads the title screens from the games' own files.
//   cd web && npx vite-node scripts/gmosCard.ts --out <card> [--only id,id] [--series starter|sandbox|bizarre|any]
// --index-only writes LIBRARY.JSL alone (every public game, or --only's), for a card that already holds the games:
// Game-Maker OS matches a line to a folder by the .GAM's CRC-32. Secret games are never written.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gamCrc32, pocketCategory, writeLibrary, type PocketLibrary } from '../src/export/pocketLibrary';

const args = process.argv.slice(2);
const opt = (n: string) => (args.includes(n) ? (args[args.indexOf(n) + 1] ?? '').split(',').filter(Boolean) : []);
const out = opt('--out')[0];
if (!out) throw new Error('usage: gmosCard.ts --out <card folder> [--only id,id] [--series name|any] [--index-only]');
const only = opt('--only');
const series = opt('--series')[0] ?? 'any';
const indexOnly = args.includes('--index-only');

interface About {
  title: string;
  series?: string;
  company?: string;
  year?: number;
  blurb?: string;
  secret?: boolean;
}
const games = readdirSync('../games')
  .filter((id) => existsSync(`../games/${id}/about.json`) && existsSync(`../games/${id}/disk`))
  .map((id) => ({ id, about: JSON.parse(readFileSync(`../games/${id}/about.json`, 'utf8')) as About }))
  .filter(({ id, about }) => !about.secret && (!only.length || only.includes(id)))
  .map((g) => ({ ...g, series: g.about.series ?? (g.about.company === undefined || g.about.company === 'Sandbox Software' ? 'sandbox' : undefined) }))
  .filter((g) => series === 'any' || g.series === series);

const root = `${out}/GAMES/`;
mkdirSync(root, { recursive: true });
const used = new Set<string>();
const lines = [JSON.stringify({ schema: 'gmp-library-index', version: 1 })];
for (const { id, about, series: s } of games) {
  const disk = `../games/${id}/disk/`;
  const names = readdirSync(disk).filter((n) => !n.startsWith('.'));
  const gam = names.find((n) => /\.gam$/i.test(n));
  if (!gam) continue;
  const dosName = gam.replace(/\.gam$/i, '').toUpperCase();
  let dir = dosName.slice(0, 8);
  for (let k = 2; used.has(dir); k++) dir = dosName.slice(0, 8 - String(k).length) + k;
  used.add(dir);
  const library: PocketLibrary = {
    schema: 'gmp-library',
    version: 1,
    uid: `catalog:${id}`,
    title: about.title,
    dosName,
    ...pocketCategory(id, s),
    gamCrc32: gamCrc32(new Uint8Array(readFileSync(disk + gam))),
  };
  writeLibrary(library); // the same bounds as the Pocket Player's records
  lines.push(
    JSON.stringify({
      ...library,
      id,
      storage: 'gmos',
      locator: dir,
      ...(about.company ? { company: about.company } : {}),
      ...(about.year ? { year: about.year } : {}),
      ...(about.blurb ? { blurb: about.blurb } : {}),
    }),
  );
  if (indexOnly) continue;
  mkdirSync(root + dir, { recursive: true });
  for (const n of names) copyFileSync(disk + n, `${root}${dir}/${n.toUpperCase()}`);
}
writeFileSync(root + 'LIBRARY.JSL', lines.join('\n') + '\n');
console.log(`${lines.length - 1} games in ${root}LIBRARY.JSL${indexOnly ? '' : ', their files in ' + root + '<DIR>/'}`);
