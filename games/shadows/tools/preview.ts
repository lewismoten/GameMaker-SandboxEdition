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
import { buildLevels } from '../src/levels';

const out = process.argv[2] ?? join(tmpdir(), 'shadows-preview');
mkdirSync(out, { recursive: true });
const { pal, yardSolid, yardDither, hop, hover } = buildLevels();
const assets = buildAssets(pal);
const rooms = [
  { name: 'yard-solid', level: yardSolid, a: assets.solid, kitX: 14 },
  { name: 'yard-dither', level: yardDither, a: assets.dither, kitX: 14 },
  { name: 'hop', level: hop, a: assets.dither, kitX: 16 },
  { name: 'hover', level: hover, a: assets.dither, kitX: 16 },
];
for (const r of rooms) {
  const bbl = r.level.book.finish();
  const hero = r.a.hero.finish();
  const kit = ['stand.top', 'walk1'].map((n, i) => ({ pixels: hero[r.a.hero.n(n)].pixels, x: (ORIGIN + r.kitX) * 20, y: (ORIGIN + 7 + i) * 20 }));
  const mons = buildCritters(r.a.critters);
  const pic = renderRegion(r.level.map.done(), bbl, r.a.critters.finish(), mons, ORIGIN, ORIGIN + 2, r.level.map.width, 11, kit.map((k) => ({ ...k, x: k.x - ORIGIN * 20, y: k.y - (ORIGIN + 2) * 20 })));
  writePng(join(out, `room-${r.name}.png`), pic, pal.pal, 2);
  writePng(join(out, `blocks-${r.name}.png`), blockSheet(bbl.slice(0, r.level.book.index.size), 14, 0), pal.pal, 2);
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
