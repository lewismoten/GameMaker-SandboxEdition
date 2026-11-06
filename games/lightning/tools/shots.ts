// Pictures of the lessons (never on the disk), for the progress shots: a 16x10 block view of each level with the hero
// in it, dark and in the flash (the same place, a tick before and a tick into it), and the bolt's five blocks side by side.
//   cd web && npx vite-node ../games/lightning/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { GROUND, buildLevels } from '../src/levels';
import { BOLT, DARK, boltPicture, finishBlocks } from '../src/storm';
import { mapAt } from './frames';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

/** A 16x10 block view of level n centered on column `col`, `tick` ticks in, the hero standing on row `row`. */
function view(n: 0 | 1, col: number, tick: number, row = GROUND - 1): Pixels {
  const l = levels[n];
  const h = heroPicture(hero, 'stand.top', 'stand');
  const kit = [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + row - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + row },
  ];
  return renderRegion(mapAt(l, tick), finishBlocks(l), mbl, set, ORIGIN + col - 8, ORIGIN + 2, 16, 10, kit);
}
const shot = (name: string, n: 0 | 1, col: number, tick: number, row?: number) => writePng(join(out, name), view(n, col, tick, row), pal.pal, 3);
shot('one-1-bolt-sign-dark.png', 0, 15, DARK - 1);
shot('one-2-bolt-sign-flash.png', 0, 15, DARK + 1);
shot('two-1-stones-dark.png', 1, 20, DARK - 1, GROUND - 1);
shot('two-2-stones-flash.png', 1, 20, DARK + 1, GROUND - 1);

// the bolt's five blocks, a gap between each
const strip = new Pixels(BOLT * 24 + 4, 28, pal.c('sky', 3));
const bolt = boltPicture(pal);
for (let i = 0; i < BOLT; i++) strip.blit(bolt.crop(0, i * 20, 20, 20), 4 + i * 24, 4);
writePng(join(out, 'frames-bolt.png'), strip, pal.pal, 6);
console.log(`shots in ${out}`);
