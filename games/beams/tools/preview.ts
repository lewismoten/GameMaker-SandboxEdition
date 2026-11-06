// Design previews (never on the disk): every room as a picture with Kit and the critters in place, and the block sheet, as PNGs in the
// folder given (default: the system temp dir); plus every picture on the built disk.
//   cd web && npx vite-node ../games/beams/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildHeroBlocks } from '../../kit/starter/hero';
import { buildCritterBlocks, buildCritters } from '../src/critters';
import { BOTTOM, buildLevels } from '../src/levels';

const out = process.argv[2] ?? join(tmpdir(), 'beams-preview');
mkdirSync(out, { recursive: true });
const { pal, beams, fog, glow } = buildLevels();
const hero = buildHeroBlocks(pal);
const critters = buildCritterBlocks(pal);
const rooms = [
  { name: 'beams', level: beams },
  { name: 'fog', level: fog },
  { name: 'glow', level: glow },
];
/** A 16x10 block view (the size of the game screen) of a room, from level column `col`, with Kit standing at `kitX`. */
export function view(r: (typeof rooms)[number], col: number, kitX: number, pose = 'stand') {
  const bbl = r.level.book.finish();
  const chars = hero.finish();
  const kit = [
    { pixels: chars[hero.n('stand.top')].pixels, x: ORIGIN + kitX, y: ORIGIN + BOTTOM - 1 },
    { pixels: chars[hero.n(pose)].pixels, x: ORIGIN + kitX, y: ORIGIN + BOTTOM },
  ];
  return renderRegion(r.level.map.done(), bbl, critters.finish(), buildCritters(critters), ORIGIN + col, ORIGIN, 16, 10, kit);
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
