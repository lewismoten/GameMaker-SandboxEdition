// Lists a built game's `voc-stutter` suggestions (kit/vocCues.ts): npx vite-node ../games/kit/vocCuesCli.ts <id>...
import { vocCuesOfGame } from './vocCues';

for (const id of process.argv.slice(2)) {
  try {
    for (const t of vocCuesOfGame(id)) console.log(`${id}: ${t}`);
  } catch (e) {
    console.log(`${id}: could not read (${(e as Error).message})`);
  }
}
