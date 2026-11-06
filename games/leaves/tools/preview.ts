// Design previews (never on the disk): every room as a picture with the hero in place, and the block sheets, as PNGs in
// the folder given (default: the system temp dir); plus every picture on the built disk. The leaves are born while the
// game runs, so a room picture shows none: shots.ts takes pictures of the game playing.
//   cd web && npx vite-node ../games/leaves/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildHeroBlocks } from '../../kit/starter/hero';
import { buildLeafBlocks, buildLeaves } from '../src/leaves';
import { BOTTOM, buildLevels, finishBlocks } from '../src/levels';

const out = process.argv[2] ?? join(tmpdir(), 'leaves-preview');
mkdirSync(out, { recursive: true });
const { pal, tumble, gust } = buildLevels();
const hero = buildHeroBlocks(pal);
const leaves = buildLeafBlocks(pal);
const rooms = [
  { name: 'tumble', level: tumble },
  { name: 'gust', level: gust },
];
for (const r of rooms) {
  const bbl = finishBlocks(r.level);
  writePng(join(out, `blocks-${r.name}.png`), blockSheet(bbl.slice(0, r.level.book.index.size), 14, 0), pal.pal, 2);
  const chars = hero.finish();
  const w = r.level.map.width;
  for (let col = 0, k = 0; col < w - 8; col += 16, k++) {
    const kitX = Math.min(col + 8, w - 2);
    const kit = [
      { pixels: chars[hero.n('stand.top')].pixels, x: ORIGIN + kitX, y: ORIGIN + BOTTOM - 1 },
      { pixels: chars[hero.n('walk1')].pixels, x: ORIGIN + kitX, y: ORIGIN + BOTTOM },
    ];
    // rows 1 to 10: what the screen shows (it does not scroll up or down)
    const pic = renderRegion(r.level.map.done(), bbl, leaves.finish(), buildLeaves(leaves), ORIGIN + col, ORIGIN + 1, 16, 10, kit);
    writePng(join(out, `view-${r.name}-${k}.png`), pic, pal.pal, 3);
  }
}
writePng(join(out, 'leaf-pictures.png'), blockSheet(leaves.finish().slice(0, leaves.index.size), 8, 0), pal.pal, 4);
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
