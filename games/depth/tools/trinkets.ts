// DEPTH PERCEPTION: the plastic trinkets for its box: <id>.stl, <id>.3mf (up to four color bodies) and, where
// the figure leans out over nothing, <id>-supports.stl.
//   cd web && npx vite-node ../games/depth/tools/trinkets.ts [--force] [--out DIR] [--workers N]
// Writes web/public/trinkets/depth/ and manifest.json (git-ignored build output the site serves), or does
// nothing when they are already made from the same sources. The pipeline is shared
// (web/packages/tools/src/mesh/trinketTool.ts); this file names Depth's sources and trinkets.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTrinketTool } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

const { TRINKETS } = await import('../src/trinkets/trinkets');
const { makeTrinket } = await import('../src/trinkets/make');

await runTrinketTool({
  game: 'depth',
  gameTitle: 'Depth Perception',
  out: resolve(flag('--out') ?? join(here, '../../../web/public/trinkets/depth')),
  // everything the meshes are made from: the models, the tracer shapes, the trinket code and the mesher
  keyFiles: [
    fileURLToPath(import.meta.url),
    join(here, '../src/render/shapes.ts'),
    join(here, '../src/render/vec.ts'),
    join(here, '../src/render/look.ts'),
    join(here, '../src/models'),
    join(here, '../src/trinkets'),
    join(here, '../../../web/packages/tools/src/mesh'),
  ],
  defs: TRINKETS,
  make: makeTrinket,
  args,
});
