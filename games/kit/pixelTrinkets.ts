// Pixel-figure trinkets for the Sandbox games: each game's hero and one signature character as a chunky
// 3D-printable standee (one pixel = one block), a multi-color 3MF (one body per color, 4 colors at most)
// and a single-color STL, built from the game's own character and monster blocks and their palette.
//   cd web && npx vite-node ../games/kit/pixelTrinkets.ts [--game <id>[,<id>...]] [--force] [--colors 3|4] [--block 1.5]
//                                                         [--layers 4] [--out ROOT] [--png DIR]
// Writes web/public/trinkets/<game>/<id>.stl, <id>.3mf and manifest.json (git-ignored build output the
// site serves, the same shape as Depth's). --png writes front, three-quarter and contact-sheet renders.
// The build (scripts/build-games.mjs) runs it after the games: a game whose figures, options and mesh code match the
// `source` key in its manifest.json is skipped, so unchanged games cost nothing (--force remakes them). Games whose disk isn't built are skipped.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';
import { inspectMesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/meshCheck';
import { overhang } from '@lewismoten/gamemaker-sandbox-tools/mesh/overhang';
import { pixelFigure, type PixelPicture } from '@lewismoten/gamemaker-sandbox-tools/mesh/pixelFigure';
import { writeStl } from '@lewismoten/gamemaker-sandbox-tools/mesh/stl';
import { write3mf } from '@lewismoten/gamemaker-sandbox-tools/mesh/threeMf';
import { GAMES } from './pixelTrinketDefs';
import { picture } from './pixelPicture';
import type { Mesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/mesh';
import { encodePng, renderBodies, sheet, type Image } from './trinketRender';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

/** The color bodies as one mesh with a color on each triangle: what the desk's viewer shows (an STL that carries colors; the printable files are the STL and 3MF). */
function colored(bodies: { color: [number, number, number]; mesh: Mesh }[]): Mesh {
  const positions: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];
  for (const b of bodies) {
    const base = positions.length / 3;
    positions.push(...b.mesh.positions);
    for (const i of b.mesh.indices) indices.push(base + i);
    for (let t = 0; t < b.mesh.indices.length / 3; t++) colors.push(...b.color);
  }
  return { positions: Float32Array.from(positions), indices: Uint32Array.from(indices), colors: Uint8Array.from(colors) };
}

/** Everything a game's trinkets are made from: its pictures and palettes, the options and the code that meshes them. */
const codeKey = (() => {
  const h = createHash('sha1');
  const dir = join(here, '../../web/packages/tools/src/mesh');
  for (const f of [
    fileURLToPath(import.meta.url),
    join(here, 'pixelTrinketDefs.ts'),
    ...readdirSync(dir)
      .sort()
      .map((n) => join(dir, n)),
  ])
    h.update(f.slice(f.lastIndexOf('/'))).update(readFileSync(f));
  return h.digest('hex');
})();
const sourceKey = (pics: PixelPicture[], opts: unknown) => {
  const h = createHash('sha1').update(codeKey).update(JSON.stringify(opts));
  for (const p of pics) h.update(`${p.w}x${p.h}`).update(p.cells).update(p.palette);
  return h.digest('hex').slice(0, 16);
};

const colors = Number(flag('--colors') ?? 4);
const block = Number(flag('--block') ?? 1.5);
const layers = Number(flag('--layers') ?? 4);
const games = flag('--game')
  ? flag('--game')!
      .split(',')
      .filter((g) => g in GAMES)
  : Object.keys(GAMES);
const pngDir = flag('--png') ? resolve(flag('--png')!) : undefined;
if (pngDir) mkdirSync(pngDir, { recursive: true });
const table: string[] = [];
const sheets: Image[] = [];

for (const game of games) {
  const out = flag('--out') ? join(resolve(flag('--out')!), game) : resolve(join(here, '../../web/public/trinkets', game));
  mkdirSync(out, { recursive: true });
  if (!existsSync(join(here, '..', game, 'disk', GAMES[game][0].pal))) {
    console.log(`${game}: skipped (its disk isn't built)`);
    continue;
  }
  const pics = GAMES[game].map((d) => picture(game, d));
  const source = sourceKey(pics, { colors, block, layers, keys: GAMES[game].map((d) => [d.id, d.title, d.blurb, d.keep]) });
  // a file is there as itself or as the site's pack of it (games/kit/trinketPacks.ts)
  const made = (file: string) => existsSync(file) || existsSync(`${file}.pack`);
  try {
    const have = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8')) as {
      source?: string;
      items: { file: string; preview?: string; colors: { file: string } }[];
    };
    if (
      !pngDir &&
      !args.includes('--force') &&
      have.source === source &&
      have.items.every((i) => made(join(out, i.file)) && made(join(out, i.colors.file)) && !!i.preview && made(join(out, i.preview)))
    ) {
      console.log(`${game}: up to date`);
      continue;
    }
  } catch {
    // no manifest yet
  }
  const items = [];
  for (const [at, d] of GAMES[game].entries()) {
    const t0 = performance.now();
    const fig = pixelFigure(pics[at], { colors, block, layers, keep: d.keep });
    const stl = writeStl(fig.solid, { name: `${game} ${d.title}` });
    const parts = fig.bodies.map((b, i) => ({ name: i === 0 ? 'outline and base' : `color ${i + 1}`, mesh: b.mesh, color: b.color }));
    const mf = write3mf(parts, d.title, { deflate: (x) => deflateRawSync(x) });
    const ms = performance.now() - t0;
    writeFileSync(join(out, `${d.id}.stl`), stl);
    writeFileSync(join(out, `${d.id}.3mf`), mf);
    writeFileSync(join(out, `${d.id}.view.stl`), writeStl(colored(fig.bodies), { name: `${game} ${d.title} (colors, for viewing)` }));
    const rep = inspectMesh(fig.solid);
    const bodyReps = fig.bodies.map((b) => inspectMesh(b.mesh));
    const oh = overhang(fig.solid);
    const mm = [0, 1, 2].map((k) => +(rep.max[k] - rep.min[k]).toFixed(1));
    items.push({
      id: d.id,
      title: d.title,
      blurb: d.blurb,
      file: `${d.id}.stl`,
      preview: `${d.id}.view.stl`,
      triangles: rep.triangles,
      bytes: stl.length,
      mm,
      thinSpecks: 0,
      colors: { file: `${d.id}.3mf`, bytes: mf.length, palette: fig.bodies.map((b) => b.color), meanColorError: 0 },
      overhangMm2: Math.round(oh.area),
      overhangShare: +oh.share.toFixed(3),
    });
    table.push(
      `${game}/${d.id}: ${ms.toFixed(0)} ms, stl ${(stl.length / 1024).toFixed(0)} KB, 3mf ${(mf.length / 1024).toFixed(0)} KB, ${rep.triangles} tri, ${fig.bodies.length} colors, ${mm.join('x')} mm, pieces ${rep.pieces}, bad edges ${rep.badEdges + bodyReps.reduce((n, r) => n + r.badEdges + r.flippedEdges, 0)}, overhang ${oh.area.toFixed(0)} mm2 (${(oh.share * 100).toFixed(1)}%), specks dropped ${fig.droppedSpecks}, bridged ${fig.bridged}`,
    );
    if (pngDir) {
      const front = renderBodies(fig.bodies, 0, 0, 360, 520);
      const three = renderBodies(fig.bodies, -35, 22, 360, 520);
      const small = [renderBodies(fig.bodies, 0, 0, 240, 340), renderBodies(fig.bodies, -35, 22, 240, 340)];
      writeFileSync(join(pngDir, `${game}-${d.id}-front.png`), encodePng(front));
      writeFileSync(join(pngDir, `${game}-${d.id}-three-quarter.png`), encodePng(three));
      sheets.push(...small);
    }
  }
  writeFileSync(join(out, 'manifest.json'), JSON.stringify({ key: 'pixel', game, source, items }, null, 1) + '\n');
}
if (pngDir && sheets.length) writeFileSync(join(pngDir, 'contact-sheet.png'), encodePng(sheet(sheets, 8, [236, 232, 224], 8)));
console.log(table.join('\n'));
