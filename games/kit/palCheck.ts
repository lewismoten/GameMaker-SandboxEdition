// Fails when a game's disk/ holds byte-identical .pal files: the build merges them (Disk.write ->
// tools/kit/palMerge.ts), so a duplicate means a build path that skipped the shared writer.
//   npx vite-node ../games/kit/palCheck.ts [<id>...]   (every game with an about.json when none)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { identicalPalettes } from '@lewismoten/gamemaker-sandbox-tools/kit/palMerge';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(gamesDir).filter((id) => existsSync(join(gamesDir, id, 'about.json')));
let bad = 0;
for (const id of ids) {
  const dir = join(gamesDir, id, 'disk');
  if (!existsSync(dir)) {
    console.log(`${id}: no disk/ (build it first)`);
    bad++;
    continue;
  }
  const files = new Map(readdirSync(dir).map((n) => [n, new Uint8Array(readFileSync(join(dir, n)))] as const));
  const groups = identicalPalettes(files);
  for (const g of groups) console.log(`${id}: identical palettes ${g.join(', ')}`);
  bad += groups.length;
}
console.log(bad ? `${bad} problem${bad === 1 ? '' : 's'}` : `ok: ${ids.length} game${ids.length === 1 ? '' : 's'}, no identical palettes`);
process.exit(bad ? 1 : 0);
