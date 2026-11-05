// Design previews (never on the disk): the block sheet, each map whole, and the pictures on the built disk, as PNGs in the
// folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/road-tiles/tools/preview.ts [outDir]
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
