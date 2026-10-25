// Records the day each Sandbox Scoop story was first committed (git log -S on its headline in
// its game's printables.json) in scoopDates.json, for the RSS feed (scoopFeed.ts). Dates
// already recorded stay; a story not committed yet gets today. Run after adding a story:
//   npx vite-node scripts/scoopDates.ts
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { cdCatalog } from './cdGames';
import { readScoopDates, scoopKey, scoopStories, type ScoopDates } from './scoopFeed';

const ROOT = resolve(__dirname, '../..');
const old = readScoopDates();
const dates: ScoopDates = {};
for (const s of scoopStories(cdCatalog(join(ROOT, 'cd')))) {
  const key = scoopKey(s.id, s.head);
  if (old[key]) {
    dates[key] = old[key];
    continue;
  }
  // the headline as JSON writes it, so quotes and the like match the file's text
  const text = JSON.stringify(s.head).slice(1, -1);
  const log = execFileSync('git', ['log', '-S', text, '--reverse', '--format=%as', '--', `games/${s.id}/printables.json`], { cwd: ROOT, encoding: 'utf8' });
  dates[key] = log.split('\n')[0] || new Date().toISOString().slice(0, 10);
  console.log(`${dates[key]}  ${key}`);
}
writeFileSync(join(__dirname, 'scoopDates.json'), `${JSON.stringify(dates, null, 2)}\n`);
