// Builds src/imported/knownGames.json: the content fingerprint (imported/contentFingerprint.ts)
// of each known game, with the tags the deterministic tagger (imported/gameTags.ts) suggests,
// or the curated tags from src/imported/knownGames.curated.json (a hand-kept
// { "<folder or zip name>": ["tag", ...] } map that replaces the suggestion for that game).
// Sources: every game on the CD (../cd), and, when the maintainer's research folders exist,
// the public archive's zips (.for-lewis/reference/archive) and found games (.for-lewis/reference/found-games).
// Run: npx vite-node scripts/knownGamesTable.ts [--reference <.for-lewis/reference dir>] [--archive <dir>]  (from web/); GM_TAG_DEBUG=1 lists each game.
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { contentFingerprint } from '../src/imported/contentFingerprint';
import { suggestTags, tagFacts } from '../src/imported/gameTags';

const here = import.meta.dirname;
const out = join(here, '../src/imported/knownGames.json');
const curatedPath = join(here, '../src/imported/knownGames.curated.json');
const curated: Record<string, string[]> = existsSync(curatedPath) ? JSON.parse(readFileSync(curatedPath, 'utf8')) : {};
const table: Record<string, string[]> = {};
const counts = { cd: 0, found: 0, zips: 0, skipped: 0 };

function walk(dir: string, keep: (n: string) => boolean): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return walk(p, keep);
    return keep(n) ? [p] : [];
  });
}

async function add(label: string, gam: Uint8Array, get: (n: string) => Uint8Array | undefined): Promise<boolean> {
  const fp = await contentFingerprint(gam, get);
  if (!fp) return false;
  table[fp] = curated[label] ?? suggestTags(gam, get);
  if (process.env.GM_TAG_DEBUG) console.log(label, JSON.stringify(tagFacts(gam, get)), table[fp].join(','));
  return true;
}

/** Games in a folder tree: each .gam with the files beside it. */
async function folderGames(root: string, count: 'cd' | 'found'): Promise<void> {
  for (const gam of walk(root, (n) => /\.gam$/i.test(n)).sort()) {
    const dir = dirname(gam);
    const names = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), n]));
    const get = (name: string) => {
      const real = names.get(name.toLowerCase());
      return real ? new Uint8Array(readFileSync(join(dir, real))) : undefined;
    };
    if (await add(basename(dir), new Uint8Array(readFileSync(gam)), get)) counts[count]++;
    else counts.skipped++;
  }
}

await folderGames(join(here, '../../cd'), 'cd');
const refArg = process.argv.indexOf('--reference');
const lewis = refArg > 0 ? process.argv[refArg + 1] : join(here, '../../.for-lewis/reference');
const archiveArg = process.argv.indexOf('--archive');
const archive = archiveArg > 0 ? process.argv[archiveArg + 1] : join(lewis, 'archive');
if (existsSync(join(lewis, 'found-games'))) await folderGames(join(lewis, 'found-games'), 'found');
if (existsSync(archive)) {
  for (const zip of walk(archive, (n) => /\.zip$/i.test(n)).sort()) {
    let entries;
    try {
      entries = await readZip(new Uint8Array(readFileSync(zip)));
    } catch {
      counts.skipped++;
      continue;
    }
    const byDir = new Map<string, Map<string, Uint8Array>>();
    for (const e of entries) {
      const d = dirname(e.name.replace(/\\/g, '/'));
      if (!byDir.has(d)) byDir.set(d, new Map());
      byDir.get(d)!.set(basename(e.name).toLowerCase(), e.data);
    }
    for (const files of byDir.values()) {
      for (const [name, data] of files) {
        if (!name.endsWith('.gam')) continue;
        if (await add(basename(zip, '.zip') + '/' + name, data, (n) => files.get(n.toLowerCase()))) counts.zips++;
        else counts.skipped++;
      }
    }
  }
}
writeFileSync(out, JSON.stringify(table) + '\n');
console.log(`${Object.keys(table).length} fingerprints from`, JSON.stringify(counts), `${(statSync(out).size / 1024).toFixed(1)} KB`);
