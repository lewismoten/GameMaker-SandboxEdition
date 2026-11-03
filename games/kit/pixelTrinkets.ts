// Pixel-figure trinkets for the Sandbox games: each game's hero and one signature character as a chunky
// 3D-printable standee (one pixel = one block), a multi-color 3MF (one body per color, 4 colors at most)
// and a single-color STL, built from the game's own character and monster blocks and their palette.
//   cd web && npx vite-node ../games/kit/pixelTrinkets.ts [--game tuneup|teddy] [--colors 3|4] [--block 1.5]
//                                                         [--layers 4] [--out DIR] [--png DIR]
// Writes web/public/trinkets/<game>/<id>.stl, <id>.3mf and manifest.json (git-ignored build output the
// site serves, the same shape as Depth's). --png writes front, three-quarter and contact-sheet renders.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';
import { BLEN, CHARBL, TRANSPARENT, orientIndex, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { inspectMesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/meshCheck';
import { overhang } from '@lewismoten/gamemaker-sandbox-tools/mesh/overhang';
import { pixelFigure, type PixelPicture } from '@lewismoten/gamemaker-sandbox-tools/mesh/pixelFigure';
import { writeStl } from '@lewismoten/gamemaker-sandbox-tools/mesh/stl';
import { write3mf } from '@lewismoten/gamemaker-sandbox-tools/mesh/threeMf';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { chicken } from '../tuneup/src/art/chicken';
import { encodePng, renderBodies, sheet, type Image } from './trinketRender';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

interface Def {
  id: string;
  title: string;
  blurb: string;
  /** A hero (character file: its standing frame) or a monster (monster file and number: its first picture). */
  source: { chr: string; cbl: string; seq?: number } | { draw: () => Pixels } | { mon: string; mbl: string; n: number };
  pal: string;
  /** Palette indices that keep a color of their own (the first is the outline and base). */
  keep?: number[];
}
const GAMES: Record<string, Def[]> = {
  tuneup: [
    {
      id: 'leo',
      title: 'Doc Leo',
      blurb: 'The hobo clown mechanic in his gray fedora, ready to tune up anything.',
      source: { chr: 'leo.chr', cbl: 'leo.cbl' },
      pal: 'gear1.pal',
      keep: [9, 44, 157, 175],
    },
    {
      id: 'regina',
      title: 'Lady Regina III',
      blurb: 'The rubber chicken who laid the egg.',
      source: { draw: () => chicken(1, { lady: true, stand: true }) },
      pal: 'gear1.pal',
      keep: [9, 197, 179, 83],
    },
  ],
  teddy: [
    {
      id: 'teddy',
      title: 'Teddy',
      blurb: 'The little corgi with a ton of tricks.',
      source: { chr: 'teddy.chr', cbl: 'teddy.cbl', seq: 5 },
      pal: 'backyard.pal',
    },
    {
      id: 'gwinn',
      title: 'Gwinn',
      blurb: 'Teddy’s big sister, all muscle and tongue.',
      source: { mon: 'backyard.mon', mbl: 'backyard.mbl', n: 10 },
      pal: 'backyard.pal',
    },
  ],
};

/** The sprite the game draws: a hero's standing frame (top block over bottom block) or a monster's first picture. */
function picture(game: string, d: Def): PixelPicture {
  const disk = (f: string) => new Uint8Array(readFileSync(join(here, '..', game, 'disk', f)));
  const palette = disk(d.pal).subarray(0, 768);
  const blocks = (f: string, n: number) => parseBlocks(disk(f), n);
  const draw = (pixels: Uint8Array, orient: number, cells: Uint8Array, w: number, row: number) => {
    for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) cells[(row + y) * w + x] = pixels[orientIndex(orient, x, y)];
  };
  if ('draw' in d.source) {
    const p = d.source.draw();
    return { w: p.w, h: p.h, cells: Uint8Array.from(p.px), palette };
  }
  if ('chr' in d.source) {
    const frame = parseCharacter(disk(d.source.chr)).sequences[d.source.seq ?? 0].frames[0];
    const bl = blocks(d.source.cbl, CHARBL);
    const cells = new Uint8Array(BLEN * BLEN * 2).fill(TRANSPARENT);
    if (frame.pic1 < CHARBL) draw(bl[frame.pic1].pixels, frame.orient & 15, cells, BLEN, 0);
    if (frame.pic2 < CHARBL) draw(bl[frame.pic2].pixels, (frame.orient >> 4) & 15, cells, BLEN, BLEN);
    return { w: BLEN, h: BLEN * 2, cells, palette };
  }
  const mon = parseMonsters(disk(d.source.mon))[d.source.n];
  const cells = new Uint8Array(BLEN * BLEN).fill(TRANSPARENT);
  draw(blocks(d.source.mbl, 100)[mon.pic[0][0]].pixels, 0, cells, BLEN, 0);
  return { w: BLEN, h: BLEN, cells, palette };
}

const colors = Number(flag('--colors') ?? 4);
const block = Number(flag('--block') ?? 1.5);
const layers = Number(flag('--layers') ?? 4);
const games = flag('--game') ? [flag('--game')!] : Object.keys(GAMES);
const pngDir = flag('--png') ? resolve(flag('--png')!) : undefined;
if (pngDir) mkdirSync(pngDir, { recursive: true });
const table: string[] = [];
const sheets: Image[] = [];

for (const game of games) {
  const out = resolve(flag('--out') ?? join(here, '../../web/public/trinkets', game));
  mkdirSync(out, { recursive: true });
  const items = [];
  for (const d of GAMES[game]) {
    const t0 = performance.now();
    const fig = pixelFigure(picture(game, d), { colors, block, layers, keep: d.keep });
    const stl = writeStl(fig.solid, { name: `${game} ${d.title}` });
    const parts = fig.bodies.map((b, i) => ({ name: i === 0 ? 'outline and base' : `color ${i + 1}`, mesh: b.mesh, color: b.color }));
    const mf = write3mf(parts, d.title, { deflate: (x) => deflateRawSync(x) });
    const ms = performance.now() - t0;
    writeFileSync(join(out, `${d.id}.stl`), stl);
    writeFileSync(join(out, `${d.id}.3mf`), mf);
    const rep = inspectMesh(fig.solid);
    const bodyReps = fig.bodies.map((b) => inspectMesh(b.mesh));
    const oh = overhang(fig.solid);
    const mm = [0, 1, 2].map((k) => +(rep.max[k] - rep.min[k]).toFixed(1));
    items.push({
      id: d.id,
      title: d.title,
      blurb: d.blurb,
      file: `${d.id}.stl`,
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
      writeFileSync(join(pngDir, `${game}-${d.id}-front.png`), encodePng(front));
      writeFileSync(join(pngDir, `${game}-${d.id}-three-quarter.png`), encodePng(three));
      sheets.push(front, three);
    }
  }
  writeFileSync(join(out, 'manifest.json'), JSON.stringify({ key: 'pixel', game, items }, null, 1) + '\n');
}
if (pngDir && sheets.length) writeFileSync(join(pngDir, 'contact-sheet.png'), encodePng(sheet(sheets)));
console.log(table.join('\n'));
