// Lists the monsters a game's walkthrough shows hidden by the edge rule (kit/viewCheck.ts):
// npx vite-node ../games/kit/viewCheckCli.ts [<id>...]   (no id: every game with a walkthrough)
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hiddenMonstersOfGame } from './viewCheck';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(dir).filter((d) => d !== 'kit' && !d.startsWith('.'));
for (const id of ids) {
  try {
    for (const h of await hiddenMonstersOfGame(id)) {
      console.log(
        `${id}: scene ${h.scene} monster ${h.monster}: hidden ${h.longest} frames in a row (${h.frames} in all) at the ${h.edges.join('/') || '?'} edge (from frame ${h.first.frame}, cell ${h.first.cell}, pixels ${h.first.at})`,
      );
    }
  } catch (e) {
    console.log(`${id}: could not read (${(e as Error).message})`);
  }
}
