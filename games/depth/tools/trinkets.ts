// DEPTH PERCEPTION: the plastic trinkets for its box, as binary STL files.
//   cd web && npx vite-node ../games/depth/tools/trinkets.ts [--force] [--out DIR] [--png DIR]
// Writes web/public/trinkets/depth/<id>.stl and manifest.json (git-ignored build output the site serves),
// or does nothing when they are already made from the same sources. --png writes a preview of each.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeStl } from '@lewismoten/gamemaker-sandbox-tools/mesh/stl';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const out = resolve(flag('--out') ?? join(here, '../../../web/public/trinkets/depth'));

/** Everything the meshes are made from: the models, the tracer shapes, the trinket code and the mesher. */
function sourceKey(): string {
  const h = createHash('sha1');
  const dirs = [join(here, '../src/models'), join(here, '../src/trinkets'), join(here, '../../../web/packages/tools/src/mesh')];
  for (const f of [
    join(here, '../src/render/shapes.ts'),
    join(here, '../src/render/vec.ts'),
    join(here, '../src/render/look.ts'),
    ...dirs.flatMap((d) =>
      readdirSync(d)
        .sort()
        .map((n) => join(d, n)),
    ),
  ])
    h.update(f.slice(f.lastIndexOf('/'))).update(readFileSync(f));
  return h.digest('hex').slice(0, 16);
}

const key = sourceKey();
const manifestFile = join(out, 'manifest.json');
if (!args.includes('--force') && !flag('--png') && existsSync(manifestFile) && JSON.parse(readFileSync(manifestFile, 'utf8')).key === key) {
  console.log('trinkets: up to date');
  process.exit(0);
}
const { TRINKETS } = await import('../src/trinkets/trinkets');
const { makeTrinket } = await import('../src/trinkets/make');
mkdirSync(out, { recursive: true });
const began = Date.now();
const items = [];
for (const def of TRINKETS) {
  const t0 = Date.now();
  const { mesh, report } = makeTrinket(def);
  if (report.badEdges || report.flippedEdges || report.pieces !== 1) throw new Error(`trinket ${def.id} is not one closed solid: ${JSON.stringify(report)}`);
  const file = writeStl(mesh, { name: `Depth Perception: ${def.title}, mm` });
  writeFileSync(join(out, `${def.id}.stl`), file);
  const size = report.max.map((v, i) => +(v - report.min[i]).toFixed(1));
  items.push({ id: def.id, title: def.title, blurb: def.blurb, file: `${def.id}.stl`, triangles: report.triangles, bytes: file.length, mm: size });
  console.log(`trinket ${def.id}: ${report.triangles} triangles, ${size.join(' x ')} mm, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
writeFileSync(manifestFile, JSON.stringify({ key, game: 'depth', items }, null, 1) + '\n');
console.log(`trinkets: ${items.length} made in ${((Date.now() - began) / 1000).toFixed(1)} s`);
