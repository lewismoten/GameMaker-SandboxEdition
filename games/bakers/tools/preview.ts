// Design previews (never on the disk): every block set under each of its rooms' palettes,
// and the monster blocks, as PNG sheets in the folder given (default: the scratchpad's).
//   cd web && npx vite-node ../games/bakers/tools/preview.ts [out dir]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { blockSheet, writePng } from '../../kit/png';
import { buildPalette, type ThemeName } from '../src/art/pal';
import { buildTileSet, type Style } from '../src/blocks/tiles';

const out = process.argv[2] ?? join(process.env.TMPDIR ?? '/tmp', 'bakers-preview');
mkdirSync(out, { recursive: true });
const SETS: Record<Style, ThemeName[]> = {
  kitchen: ['pantry', 'bakehouse', 'sugar'],
  cellar: ['larder', 'cellar', 'brewery'],
  parlor: ['parlor', 'tearoom', 'clock', 'hidey'],
  works: ['bottling', 'loft', 'cistern', 'vault'],
};
for (const [style, themes] of Object.entries(SETS) as [Style, ThemeName[]][]) {
  const set = buildTileSet(style);
  const sheet = blockSheet(set.tiles.build().slice(0, set.tiles.names.length), 16);
  for (const th of themes) writePng(join(out, `set-${style}-${th}.png`), sheet, buildPalette(th).pal, 2);
  console.log(`${style}: ${set.tiles.names.length} blocks`);
}

// every room, drawn from its map with its monsters on it
import { compileAll } from '../src/compile';
import { Pixels } from '../../kit/pixels';
import { ORIGIN } from '../src/levels/room';
const all = compileAll();
const mbl = all.mb.build();
for (const room of all.rooms) {
  const rows = room.spec.rows;
  const w = rows[0].length;
  const h = rows.length;
  const bbl = all.sets[room.spec.style].tiles.build();
  const p = new Pixels(w * 20, h * 20);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const b = bbl[room.map.blocks[(y + ORIGIN.y) * 100 + x + ORIGIN.x]];
      for (let yy = 0; yy < 20; yy++) for (let xx = 0; xx < 20; xx++) p.set(x * 20 + xx, y * 20 + yy, b.pixels[yy * 20 + xx]);
    }
  const mons = room.mons.build();
  for (const m of room.map.monsters) {
    if (m.monnum >= 64) continue;
    const pic = mbl[mons[m.monnum].pic[0][0]].pixels;
    for (let yy = 0; yy < 20; yy++) for (let xx = 0; xx < 20; xx++) if (pic[yy * 20 + xx] !== 255) p.set((m.curx - ORIGIN.x) * 20 + xx, (m.cury - ORIGIN.y) * 20 + yy, pic[yy * 20 + xx]);
  }
  writePng(join(out, `room-${String(room.spec.level).padStart(2, '0')}-${room.spec.file}.png`), p, buildPalette(room.spec.theme).pal, 1);
}

// the screens
import { menuScreen, recipePage, titleScreen, eggScreen } from '../src/screens/screens';
import { PAL } from '../src/art/pal';
writePng(join(out, 'scr-title.png'), titleScreen(), PAL.pal, 2);
writePng(join(out, 'scr-menu.png'), menuScreen(), PAL.pal, 2);
writePng(join(out, 'scr-recipe05.png'), recipePage(5), PAL.pal, 2);
writePng(join(out, 'scr-egg-rotten.png'), eggScreen(true), PAL.pal, 2);

// Doc Leo and the monster blocks
writePng(join(out, 'leo.png'), blockSheet(all.cb.build().slice(0, all.cb.names.length), 16, 3), PAL.pal, 4);
writePng(join(out, 'mons.png'), blockSheet(mbl.slice(0, all.mb.names.length), 20, 3), PAL.pal, 3);
