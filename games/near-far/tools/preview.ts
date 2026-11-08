// Design previews (never on the disk): the block sheet, each map whole, each room as the player sees it (16 x 10
// blocks around the landing cell, with Kit standing there) and every picture on the built disk, as PNGs in the
// folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/near-far/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { farPalette } from '../src/haze';
import { half } from '../src/scenery';
import { buildLevels } from '../src/levels';

const out = process.argv[2] ?? join(tmpdir(), 'near-far-preview');
mkdirSync(out, { recursive: true });
const { book, pal, levels, rooms } = buildLevels();
const bbl = book.finish();
writePng(join(out, 'blocks.png'), blockSheet(bbl.slice(0, book.index.size), 12, 0), pal.pal, 3);

const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = heroPicture(buildHeroBlocks(pal), 'stand.top', 'stand');
for (const l of levels) {
  const pic = renderRegion(l.map.done(), bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height);
  writePng(join(out, `map-${l.file}.png`), pic, l.file.startsWith('far') ? farPalette(pal) : pal.pal, 2);
}
// each room as the screen shows it: the window is 16 x 10 blocks with the hero's cell in the middle (column 8, row 5 down to his feet)
const farKit = new Pixels(20, 40, 255).blit(half(hero, 255), 5, 20, 255);
for (const r of rooms) {
  const who = r.plane === 'far' ? farKit : hero;
  const map = levels.find((l) => l.file === r.file)!.map.done();
  const [lx, ly] = r.landing;
  const kit = [
    { pixels: Uint8Array.from(who.px.subarray(0, 400)), x: lx, y: ly - 1 },
    { pixels: Uint8Array.from(who.px.subarray(400)), x: lx, y: ly },
  ];
  writePng(join(out, `room-${r.id}.png`), renderRegion(map, bbl, mbl, set, lx - 8, ly - 5, 16, 10, kit), r.plane === 'far' ? farPalette(pal) : pal.pal, 2);
}
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
  const g = decodeGif(readFileSync(new URL(f, disk)));
  const p = new Pixels(g.width, g.height);
  p.px.set(g.pixels);
  writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
}
console.log(`previews in ${out}`);
