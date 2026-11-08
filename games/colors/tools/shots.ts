// Color-vision pictures of both levels (never on the disk): each level's whole map as you see it and as a
// player with deuteranopia, protanopia or tritanopia sees it (web/packages/engine/src/gfx/colorVision.ts), as PNGs, plus a
// zoomed row of the plates for each. Used to check level 2 and for the progress shots.
//   cd web && npx vite-node ../games/colors/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { simulatePalette, type Vision } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { PLATE_X, ROW, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);

const KINDS: (Vision | 'normal')[] = ['normal', 'deutan', 'protan', 'tritan'];
for (const l of levels) {
  const m = l.map.done();
  const whole = renderRegion(m, bbl, mbl, set, ORIGIN, ORIGIN + 4, l.map.width, 8);
  const row = renderRegion(m, bbl, mbl, set, ORIGIN + PLATE_X - 1, ORIGIN + 6, ROW.length + 2, 4);
  for (const k of KINDS) {
    const p = k === 'normal' ? pal.pal : simulatePalette(pal.pal, k);
    writePng(join(out, `${l.file}-${k}.png`), whole, p, 2);
    writePng(join(out, `${l.file}-${k}-plates.png`), row, p, 6);
  }
}
console.log(`color-vision shots in ${out}`);
