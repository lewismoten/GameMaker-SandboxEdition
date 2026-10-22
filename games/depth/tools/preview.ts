// A whole level as one picture, both focus planes one above the other, drawn from the built
// disk's blocks (monsters marked by their first picture), for checking a level's layout.
//   cd web && npx vite-node ../games/depth/tools/preview.ts <level 1-6> <out.png>
import { parseBlocks } from '../../../web/src/formats/blocks';
import { parseMap } from '../../../web/src/formats/map';
import { parseMonsters } from '../../../web/src/formats/monster';
import { Pixels } from '../../kit/pixels';
import { writePng } from '../../kit/png';
import { LEVELS } from '../src/levels/levels';
import { buildLevel } from '../src/levels/map';
import { TileBook } from '../src/tiles/book';
import { rulesFor } from '../src/tiles/rules';
import { readDisk } from './sim';

const n = Number(process.argv[2] ?? 1);
const out = process.argv[3] ?? 'preview.png';
const level = LEVELS[n - 1];
const b = buildLevel(new TileBook(level.theme, rulesFor({ level: n })), level);
const files = readDisk();
const mbl = parseBlocks(files.get('depth.mbl')!, 100);
const mon = parseMonsters(files.get('depth.mon')!);
const W = (b.width + 2) * 20;
const H = (b.height + 2) * 20;
const p = new Pixels(W, H * 2 + 4);
['near', 'far'].forEach((plane, k) => {
  const bbl = parseBlocks(files.get(`l${n}${plane}.bbl`)!, 150);
  const map = parseMap(files.get(`l${n}${plane}.map`)!);
  for (let y = -1; y <= b.height; y++)
    for (let x = -1; x <= b.width; x++) {
      const blk = bbl[map.blocks[(b.oy + y) * 100 + b.ox + x]];
      for (let yy = 0; yy < 20; yy++) for (let xx = 0; xx < 20; xx++) p.set((x + 1) * 20 + xx, k * (H + 4) + (y + 1) * 20 + yy, blk.pixels[yy * 20 + xx]);
    }
  for (const m of map.monsters) {
    if (m.monnum >= 64) continue;
    const pic = mbl[mon[m.monnum].pic[0][0]];
    for (let yy = 0; yy < 20; yy++)
      for (let xx = 0; xx < 20; xx++) {
        const c = pic.pixels[yy * 20 + xx];
        if (c !== 255) p.set((m.curx - b.ox + 1) * 20 + xx, k * (H + 4) + (m.cury - b.oy + 1) * 20 + yy, c);
      }
  }
});
writePng(out, p, files.get(`l${n}.pal`)!, 1);
console.log(`${level.name}: ${b.width}x${b.height}`);
