// Checks that each game's walkthrough plays its levels' end and start clips to the end
// (kit/clips.ts): cd web && npx vite-node ../games/kit/clipCheck.ts <id>...
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Walkthrough } from '../../web/src/walkthrough/format';
import { describeCut } from './clips';
import { replay } from './walkthrough';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
let bad = 0;
for (const id of process.argv.slice(2)) {
  const walk = JSON.parse(readFileSync(join(gamesDir, id, 'walkthrough.json'), 'utf8')) as Walkthrough;
  const r = await replay(id, walk, { clips: true });
  const cuts = r.clipCuts ?? [];
  for (const c of cuts) console.log(`${id}: ${describeCut(c)}`);
  console.log(`${id}: ${cuts.length ? `${cuts.length} clips cut off` : 'every end and start clip plays to the end'}${r.won ? '' : ' (the run did not reach the ending)'}`);
  if (cuts.length || !r.won) bad++;
}
process.exit(bad ? 1 : 0);
