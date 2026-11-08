// QUEST FOR THE ROUND TUIT: the plastic trinkets for its box: <id>.stl and <id>.3mf (one body per color).
//   cd web && npx vite-node ../games/realm/tools/trinkets.ts [--force] [--out DIR] [--workers N]
// Writes web/public/trinkets/realm/ and manifest.json (git-ignored build output the site serves), or does nothing when
// they are already made from the same sources. The pipeline is shared (web/packages/tools/src/mesh/trinketTool.ts).
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTrinketTool } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

const { TRINKETS, makeTrinket } = await import('../src/trinkets/trinkets');

await runTrinketTool({
  game: 'realm',
  gameTitle: 'Quest for the Round Tuit',
  out: resolve(flag('--out') ?? join(here, '../../../web/public/trinkets/realm')),
  keyFiles: [fileURLToPath(import.meta.url), join(here, '../src/trinkets'), join(here, '../../../web/packages/tools/src/mesh')],
  defs: TRINKETS,
  make: makeTrinket,
  args,
});
