// Design previews (never on the disk): the block sheet, Kit's four facings, each map whole, each area as the screen
// shows it (16 x 10 blocks around the landing cell, with Kit standing there) and every picture on the built disk, as
// PNGs in the folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/town-links/tools/preview.ts [outDir]
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
import { HOUSE_LANDING, TOWN_LANDING, TOWN_YARD, WORLD_BESIDE, WORLD_START, buildLevels } from '../src/levels';
import { buildTinyHeroBlocks } from '../src/worldBlocks';

const out = process.argv[2] ?? join(tmpdir(), 'town-links-preview');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
writePng(join(out, 'blocks.png'), blockSheet(bbl.slice(0, book.index.size), 12, 0), pal.pal, 3);

// Kit from above: four facings, three steps each
const top = buildTopHeroBlocks(pal);
const grid = new Pixels(3 * 24 + 4, 4 * 24 + 4, pal.r('grass')[2]);
['down', 'up', 'right', 'left'].forEach((f, row) =>
  ['0', 'stand', '1'].forEach((st, col) => grid.blit(top.pics.get(`${f}.${st}`)!, 4 + col * 24, 4 + row * 24, 255)),
);
writePng(join(out, 'hero-top.png'), grid, pal.pal, 6);

const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const tiny = buildTinyHeroBlocks(pal, top);
const kit = (b: typeof top, x: number, y: number) => [{ pixels: Uint8Array.from(b.finish()[b.n('down.stand')].pixels), x, y }];
for (const l of levels)
  writePng(join(out, `map-${l.file}.png`), renderRegion(l.map.done(), bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height), pal.pal, 2);
// each place as the screen shows it: 16 x 10 blocks around the cell Kit lands on
const view = (name: string, file: number, [lx, ly]: [number, number], hero: typeof top) =>
  writePng(join(out, `screen-${name}.png`), renderRegion(levels[file].map.done(), bbl, mbl, set, lx - 8, ly - 5, 16, 10, kit(hero, lx, ly)), pal.pal, 2);
view('world-start', 0, WORLD_START, tiny);
view('world-beside', 0, WORLD_BESIDE, tiny);
view('town-gate', 1, TOWN_LANDING, top);
view('town-yard', 1, TOWN_YARD, top);
view('house', 2, HOUSE_LANDING, top);
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
  const g = decodeGif(readFileSync(new URL(f, disk)));
  const p = new Pixels(g.width, g.height);
  p.px.set(g.pixels);
  writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
}
console.log(`previews in ${out}`);
