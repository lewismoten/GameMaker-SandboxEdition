// Design previews (never on the disk): the block sheet, each map whole, and the pictures on the built disk, as PNGs in the
// folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/road-tiles/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildTopHeroBlocks } from '../../kit/starter/topHero';
import { buildLevels } from '../src/levels';

const out = process.argv[2] ?? join(tmpdir(), 'road-tiles-preview');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
writePng(join(out, 'blocks.png'), blockSheet(bbl.slice(0, book.index.size), 12, 0), pal.pal, 3);
console.log(`${book.index.size} blocks`);
const top = buildTopHeroBlocks(pal);
const topBl = top.finish();
const mon = buildMonsterBlocks(pal);
const mbl = mon.finish();
const mons = buildMonsters(mon);
levels.forEach((l) => {
  const kit = [{ pixels: Uint8Array.from(topBl[top.n('down.stand')].pixels), x: ORIGIN + l.start[0], y: ORIGIN + l.start[1] }];
  const pic = renderRegion(l.map.done(), bbl, mbl, mons, ORIGIN, ORIGIN, l.map.width, l.map.height, kit);
  writePng(join(out, `${l.file}.png`), pic, pal.pal, 2);
});
// the screen as the game shows it (16 x 10 blocks) at the start of each level, and every picture on the built disk
levels.forEach((l) => {
  const [sx, sy] = l.start;
  const x0 = Math.max(ORIGIN, ORIGIN + sx - 2);
  const y0 = Math.max(ORIGIN, ORIGIN + sy - 4);
  const kit = [{ pixels: Uint8Array.from(topBl[top.n('down.stand')].pixels), x: ORIGIN + sx, y: ORIGIN + sy }];
  writePng(join(out, `screen-${l.file}.png`), renderRegion(l.map.done(), bbl, mbl, mons, x0, y0, 16, 10, kit), pal.pal, 2);
});
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
  const g = decodeGif(readFileSync(new URL(f, disk)));
  const p = new Pixels(g.width, g.height);
  p.px.set(g.pixels);
  writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
}
console.log(`previews in ${out}`);
