// Design previews (never on the disk): every room as a picture with Kit and the critters in place, and the block sheet, as PNGs in the
// folder given (default: the system temp dir); plus every picture on the built disk.
//   cd web && npx vite-node ../games/shadows/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildAssets } from '../src/assets';
import { buildCritters } from '../src/critters';
import { LANE, buildLevels } from '../src/levels';

const out = process.argv[2] ?? join(tmpdir(), 'shadows-preview');
mkdirSync(out, { recursive: true });
const { pal, yardSolid, yardDither, hop, hover } = buildLevels();
const assets = buildAssets(pal);
const rooms = [
  { name: 'yard-solid', level: yardSolid, a: assets.solid },
  { name: 'yard-dither', level: yardDither, a: assets.dither },
  { name: 'hop', level: hop, a: assets.dither },
  { name: 'hover', level: hover, a: assets.dither },
];
/** A 16x10 block view (the size of the game screen) of a room, from level column `col`, with Kit standing at `kitX`. */
export function view(r: (typeof rooms)[number], col: number, kitX: number, pose = 'stand') {
  const bbl = r.level.book.finish();
  const hero = assets.plain.finish();
  const kit = [
    { pixels: hero[assets.plain.n('stand.top')].pixels, x: ORIGIN + kitX, y: ORIGIN + LANE - 1 },
    { pixels: hero[assets.plain.n(pose)].pixels, x: ORIGIN + kitX, y: ORIGIN + LANE },
  ];
  const mons = buildCritters(r.a.critters);
  return renderRegion(r.level.map.done(), bbl, r.a.critters.finish(), mons, ORIGIN + col, ORIGIN + 1, 16, 10, kit);
}
for (const r of rooms) {
  const bbl = r.level.book.finish();
  writePng(join(out, `blocks-${r.name}.png`), blockSheet(bbl.slice(0, r.level.book.index.size), 14, 0), pal.pal, 2);
  const w = r.level.map.width;
  for (let col = 0, k = 0; col < w - 8; col += 16, k++)
    writePng(join(out, `view-${r.name}-${k}.png`), view(r, col, Math.min(col + 8, w - 2), 'walk1'), pal.pal, 3);
}
const disk = new URL('../disk/', import.meta.url);
try {
  for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
    const g = decodeGif(readFileSync(new URL(f, disk)));
    const p = new Pixels(g.width, g.height);
    p.px.set(g.pixels);
    writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
  }
} catch {
  /* no disk built yet */
}
console.log(`previews in ${out}`);
