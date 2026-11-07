// Builds src/imported/knownGames.json: the content fingerprint (imported/contentFingerprint.ts)
// of every game on the CD, with the tags the deterministic tagger (imported/gameTags.ts)
// suggests, plus any curated tags from src/imported/knownGames.curated.json (a hand-kept
// { "<title or folder>": ["tag", ...] } map that replaces the suggestion for that game).
// Run: npx vite-node scripts/knownGamesTable.ts  (from web/)
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { contentFingerprint } from '../src/imported/contentFingerprint';
import { suggestTags } from '../src/imported/gameTags';

function gamsIn(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return gamsIn(p);
    return /\.gam$/i.test(n) ? [p] : [];
  });
}

const cd = join(import.meta.dirname, '../../cd');
const curatedPath = join(import.meta.dirname, '../src/imported/knownGames.curated.json');
const curated: Record<string, string[]> = existsSync(curatedPath) ? JSON.parse(readFileSync(curatedPath, 'utf8')) : {};
const table: Record<string, string[]> = {};
for (const gam of gamsIn(cd).sort()) {
  const dir = dirname(gam);
  const names = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), n]));
  const get = (name: string) => {
    const real = names.get(name.toLowerCase());
    return real ? new Uint8Array(readFileSync(join(dir, real))) : undefined;
  };
  const bytes = new Uint8Array(readFileSync(gam));
  const fp = await contentFingerprint(bytes, get);
  if (!fp) continue;
  const key = dir.split('/').pop()!;
  table[fp] = curated[key] ?? suggestTags(bytes, get);
}
writeFileSync(join(import.meta.dirname, '../src/imported/knownGames.json'), JSON.stringify(table, null, 1) + '\n');
console.log(`${Object.keys(table).length} games`);
