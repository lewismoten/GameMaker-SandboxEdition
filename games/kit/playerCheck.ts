// Checks each game's DOS player look (games/<id>/player.json, kit/player.ts): every patch known
// and within its rules, words, colors, frames and positions only, the patched XFERPLAY.EXE
// writes, and recolored words readable on the black screens. Exits 1 when one breaks a rule.
//   npx vite-node ../games/kit/playerCheck.ts [<id>...]   (every game with an about.json when none)
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { playerPath, playerProblems } from './player';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const named = process.argv.slice(2);
const ids = named.length ? named : readdirSync(gamesDir).filter((id) => existsSync(join(gamesDir, id, 'about.json')));
let bad = 0;
for (const id of ids) {
  if (!existsSync(playerPath(id))) {
    if (named.length) console.log(`${id}: no player.json (the CD player's look)`);
    continue;
  }
  const problems = playerProblems(id);
  bad += problems.length ? 1 : 0;
  console.log(problems.length ? `${id}: player.json breaks ${problems.length} rule${problems.length === 1 ? '' : 's'}:` : `${id}: player.json ok`);
  for (const p of problems) console.log(`  ${p}`);
}
process.exit(bad ? 1 : 0);
