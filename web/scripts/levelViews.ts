// Writes src/manual/printables/levelViews.json: the part of each map the player ever sees, which
// the printed Level Maps crop to (levelViewsPlay.ts). Slow, a minute or more a game: it replays
// the walkthrough and plays every scene from every way in. With no ids it rescans only the games
// whose disk or walkthrough changed since (levelViewsScan.ts levelViewsHash), saving after each;
// `--all` rescans every one. levelViews.test.ts and games/kit/syncCheck.ts fail until it's rerun.
//
//   cd web && npx vite-node scripts/levelViews.ts [--all | id...]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { levelViewsHash, levelViewsJson } from './levelViewsScan';
import { scanLevelViews } from './levelViewsPlay';
import SECRETS from '../src/manual/printables/levelSecrets.json';
import type { LevelViews } from '../src/manual/printables/levelViews';

const args = process.argv.slice(2);
const gamesDir = join(__dirname, '../../games');
const path = join(__dirname, '../src/manual/printables/levelViews.json');
const views = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as LevelViews) : {};
// only the games that may show Level Maps (never a secret one)
const listed = Object.keys(SECRETS);
for (const id of Object.keys(views)) if (!listed.includes(id)) delete views[id];
const ids = args.includes('--all') ? listed : args.length ? args : listed.filter((id) => views[id]?.hash !== levelViewsHash(gamesDir, id));
for (const id of ids) {
  Object.assign(views, await scanLevelViews(gamesDir, [id], (s) => console.log(s)));
  writeFileSync(path, levelViewsJson(views));
}
writeFileSync(path, levelViewsJson(views));
console.log(`${ids.length} games scanned${ids.length ? `: ${ids.join(' ')}` : ''}`);
