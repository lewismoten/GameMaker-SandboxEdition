// Where the Pocket Player's own repository (gamemaker-pocket) is, for the host checks that compile its C++,
// and where the packers write what the board plays. Nothing in normal test, lint or verify needs the repository:
// a check that does says so and exits 0 when it is not there.
//   GAMEMAKER_POCKET_DIR  the clone of lewismoten/gamemaker-pocket (default: ../gamemaker-pocket beside this repository)
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = new URL('../../', import.meta.url).pathname;

/** The Pocket Player repository's folder, with a trailing slash. */
export const pocketRepoDir = resolve(process.env.GAMEMAKER_POCKET_DIR ?? resolve(repoRoot, '../gamemaker-pocket')) + '/';

/** GameMaker-owned output of pocketData.ts (data/) and pocketArt.ts (src/); git ignores it. The Pocket repository copies from here. */
export const pocketOutDir = repoRoot + 'pocket-out/';

/** Exits 0 with a message when the Pocket Player repository is not present, so a check that needs its C++ skips cleanly. */
export function requirePocketRepo(check: string): void {
  if (existsSync(pocketRepoDir + 'src')) return;
  console.log(`${check}: skipped. The Pocket Player repository is not at ${pocketRepoDir} (clone https://github.com/lewismoten/gamemaker-pocket there or set GAMEMAKER_POCKET_DIR).`);
  process.exit(0);
}
