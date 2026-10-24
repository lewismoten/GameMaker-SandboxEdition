// Checks that the files made from the games are current, without writing them: the Level Maps'
// hidden blocks (web/src/manual/printables/levelSecrets.json, web/scripts/levelSecrets.ts) and
// each box's play hours (about.json box.hours, kit/playtime.ts). Names only the games given.
//
//   cd web && npx vite-node ../games/kit/syncCheck.ts <id>...
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claimedHours, playMinutes, type Timeline } from '../../web/src/desk/boxes/playtime';
import { levelSecretsJson, scanLevelSecrets } from '../../web/scripts/levelSecretsScan';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const ids = process.argv.slice(2);
const problems: string[] = [];

const secretsPath = join(gamesDir, '../web/src/manual/printables/levelSecrets.json');
const fresh = JSON.parse(levelSecretsJson(scanLevelSecrets(gamesDir))) as Record<string, unknown>;
const saved = JSON.parse(readFileSync(secretsPath, 'utf8')) as Record<string, unknown>;
const keys = new Set([...Object.keys(fresh), ...Object.keys(saved)]);
const stale = [...keys].filter((k) => JSON.stringify(fresh[k]) !== JSON.stringify(saved[k]));
for (const id of stale.filter((k) => ids.includes(k))) problems.push(`${id}: levelSecrets.json is out of date`);
if (stale.some((k) => !ids.includes(k))) problems.push('levelSecrets.json is out of date');

for (const id of ids) {
  const walkPath = join(gamesDir, id, 'walkthrough.json');
  const aboutPath = join(gamesDir, id, 'about.json');
  if (!existsSync(walkPath) || !existsSync(aboutPath)) continue;
  const about = JSON.parse(readFileSync(aboutPath, 'utf8')) as { box?: { hours?: number } };
  if (!about.box) continue;
  const hours = claimedHours(playMinutes((JSON.parse(readFileSync(walkPath, 'utf8')) as { timeline: Timeline }).timeline));
  if (about.box.hours !== hours) problems.push(`${id}: box says ${about.box.hours ?? '-'} hours; its walkthrough makes it ${hours}`);
}

for (const p of problems) console.log(p);
if (problems.length) console.log('Rerun: npx vite-node scripts/levelSecrets.ts, then npx vite-node ../games/kit/playtime.ts');
console.log(`levelSecrets and box hours: ${problems.length ? `${problems.length} out of date` : 'current'}`);
process.exit(problems.length ? 1 : 0);
