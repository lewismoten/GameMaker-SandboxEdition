// DEPTH PERCEPTION: the plastic trinkets for its box, as binary STL files.
//   cd web && npx vite-node ../games/depth/tools/trinkets.ts [--force] [--out DIR] [--png DIR]
// Writes web/public/trinkets/depth/<id>.stl and manifest.json (git-ignored build output the site serves),
// or does nothing when they are already made from the same sources. --png writes a preview of each.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';
import { writeStl } from '@lewismoten/gamemaker-sandbox-tools/mesh/stl';
import { inspectMesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/meshCheck';
import { write3mf } from '@lewismoten/gamemaker-sandbox-tools/mesh/threeMf';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const out = resolve(flag('--out') ?? join(here, '../../../web/public/trinkets/depth'));

/** Everything the meshes are made from: the models, the tracer shapes, the trinket code and the mesher. */
function sourceKey(): string {
  const h = createHash('sha1');
  const dirs = [join(here, '../src/models'), join(here, '../src/trinkets'), join(here, '../../../web/packages/tools/src/mesh')];
  for (const f of [
    fileURLToPath(import.meta.url),
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
  const { mesh, report, erodedPieces, erodedSpecks, overhang, support, bodies, wholeVolume } = makeTrinket(def);
  if (report.badEdges || report.flippedEdges || report.pieces !== 1) throw new Error(`trinket ${def.id} is not one closed solid: ${JSON.stringify(report)}`);
  if (erodedPieces !== 1)
    throw new Error(`trinket ${def.id} has parts joined by less than a millimeter (${erodedPieces} bodies when eroded by half a millimeter)`);
  const file = writeStl(mesh, { name: `Depth Perception: ${def.title}, mm` });
  writeFileSync(join(out, `${def.id}.stl`), file);
  const size = report.max.map((v, i) => +(v - report.min[i]).toFixed(1));
  // the colors: one closed body each, together the same solid as the STL
  const reports = bodies.map((b) => inspectMesh(b.mesh));
  if (reports.some((r) => r.badEdges || r.flippedEdges)) throw new Error(`trinket ${def.id}: a color body is not closed`);
  const bodyVolume = reports.reduce((n, r) => n + r.volume, 0);
  if (Math.abs(bodyVolume / wholeVolume - 1) > 0.05)
    throw new Error(`trinket ${def.id}: its colors fill ${bodyVolume.toFixed(0)} mm3, its solid ${wholeVolume.toFixed(0)}`);
  // the file's colors against the viewer's: how far each triangle's color is from the nearest color in the file
  let off = 0;
  const tc = mesh.colors!;
  for (let t = 0; t < tc.length; t += 3) off += Math.min(...bodies.map((b) => Math.hypot(b.color[0] - tc[t], b.color[1] - tc[t + 1], b.color[2] - tc[t + 2])));
  const colorError = Math.round(off / (tc.length / 3));
  const colored = write3mf(
    bodies.map((b, i) => ({ name: `Color ${i + 1}`, mesh: b.mesh, color: b.color })),
    `Depth Perception: ${def.title}`,
    { deflate: (d) => deflateRawSync(d) },
  );
  writeFileSync(join(out, `${def.id}.3mf`), colored);
  let supports;
  if (support) {
    const sfile = writeStl(support, { name: `Depth Perception: ${def.title}, supports, mm` });
    writeFileSync(join(out, `${def.id}-supports.stl`), sfile);
    supports = { file: `${def.id}-supports.stl`, triangles: support.indices.length / 3, bytes: sfile.length };
  }
  items.push({
    id: def.id,
    title: def.title,
    blurb: def.blurb,
    file: `${def.id}.stl`,
    triangles: report.triangles,
    bytes: file.length,
    mm: size,
    thinSpecks: erodedSpecks,
    colors: { file: `${def.id}.3mf`, bytes: colored.length, palette: bodies.map((b) => b.color), meanColorError: colorError },
    overhangMm2: Math.round(overhang.area),
    overhangShare: +overhang.share.toFixed(3),
    supports: supports ?? null,
  });
  console.log(
    `trinket ${def.id}: ${report.triangles} triangles, ${size.join(' x ')} mm, colors ${bodies.length} (error ${colorError}), overhang ${Math.round(overhang.area)} mm2${support ? ' (supports file)' : ''}, ${((Date.now() - t0) / 1000).toFixed(1)} s`,
  );
}
writeFileSync(manifestFile, JSON.stringify({ key, game: 'depth', items }, null, 1) + '\n');
console.log(`trinkets: ${items.length} made in ${((Date.now() - began) / 1000).toFixed(1)} s`);
