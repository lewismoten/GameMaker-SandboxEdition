// Pictures of the lessons (never on the disk), for the progress shots: a 16x10 block view of each level with Kit in it, the
// wrong sky when its stars are all dim and all bright (the same stars, 12 ticks apart), the right sky at the same two
// moments, and one star's frames side by side (what the manual's pages show).
//   cd web && npx vite-node ../games/twinkle/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildLevels } from '../src/levels';
import { SPOTS, starFrame, finishBlocks } from '../src/stars';
import { mapAt } from './frames';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);
const GROUND = 11;

/** A 16x10 block view of level n centered on column `col`, `tick` ticks in, Kit standing in the middle. */
function view(n: 0 | 1, col: number, tick: number): Pixels {
  const l = levels[n];
  const h = heroPicture(hero, 'stand.top', 'stand');
  const kit = [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 },
  ];
  return renderRegion(mapAt(l, tick), finishBlocks(l), mbl, set, ORIGIN + col - 8, ORIGIN + 2, 16, 10, kit);
}
const shot = (name: string, n: 0 | 1, col: number, tick: number) => writePng(join(out, name), view(n, col, tick), pal.pal, 3);
shot('one-1-wrong-sky-dim.png', 0, 12, 5);
shot('one-1-wrong-sky-bright.png', 0, 12, 19);
shot('one-2-right-sky-t5.png', 0, 40, 5);
shot('one-2-right-sky-t19.png', 0, 40, 19);
shot('two-1-night-moon.png', 1, 45, 12);
shot('two-2-start.png', 1, 8, 30);

// one star's four frames side by side
const strip = new Pixels(4 * 24 + 4, 28, pal.c('sky', 3));
[0, 1, 2, 1].forEach((size, i) => strip.blit(starFrame(pal, SPOTS[0], size as 0 | 1 | 2), 4 + i * 24, 4));
writePng(join(out, 'frames-star.png'), strip, pal.pal, 6);
console.log(`shots in ${out}`);
