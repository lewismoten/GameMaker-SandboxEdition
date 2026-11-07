// Builds src/imported/knownGames.json: the content fingerprint (imported/contentFingerprint.ts)
// of each known game (knownGamesSources.ts) to a KnownGame (imported/knownGame.ts): the tags
// curated by looking at it, from src/imported/knownGames.curated.json (a hand-kept
// { "<folder or zip name>": ["view", "genre", "theme", ...] } map, made from the contact sheets
// of scripts/knownGamesSheets.ts), else the deterministic tagger's guesses (imported/gameTags.ts);
// with its level count and, when the archive walk bot tried it, whether it finished.
// Run: npx vite-node scripts/knownGamesTable.ts [--reference <.for-lewis/reference dir>] [--archive <dir>]  (from web/); GM_TAG_DEBUG=1 lists each game.
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseGame, ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { contentFingerprint } from '../src/imported/contentFingerprint';
import { suggestTags, tagFacts } from '../src/imported/gameTags';
import type { KnownGame } from '../src/imported/knownGame';
import { knownSources, slugOf, botWins } from './knownGamesSources';

const here = import.meta.dirname;
const argv = process.argv.slice(2);
const out = join(here, '../src/imported/knownGames.json');
const curatedPath = join(here, '../src/imported/knownGames.curated.json');
const curated: Record<string, string[]> = existsSync(curatedPath) ? JSON.parse(readFileSync(curatedPath, 'utf8')) : {};
const won = botWins(argv);
const table: Record<string, KnownGame> = {};
const counts = { cd: 0, found: 0, zip: 0, curated: 0, skipped: 0 };

for await (const src of knownSources(argv, () => counts.skipped++)) {
  const fp = await contentFingerprint(src.gam, src.get);
  if (!fp) {
    counts.skipped++;
    continue;
  }
  counts[src.from]++;
  const hand = curated[src.label];
  if (table[fp]?.c && !hand) continue; // a copy already curated under another name
  const entry: KnownGame = { t: hand ?? suggestTags(src.gam, src.get), l: parseGame(src.gam).scenes.filter((s) => s.gametype === ADVTYPE).length };
  if (hand) ((entry.c = true), counts.curated++);
  const bot = won.get(slugOf(src.label).split(':')[0]);
  if (bot !== undefined) entry.b = bot;
  table[fp] = entry;
  if (process.env.GM_TAG_DEBUG) console.log(src.label, JSON.stringify(tagFacts(src.gam, src.get)), entry.t.join(','));
}
writeFileSync(out, JSON.stringify(table) + '\n');
console.log(`${Object.keys(table).length} fingerprints from`, JSON.stringify(counts), `${(statSync(out).size / 1024).toFixed(1)} KB`);
