// Pictures of the lessons (never on the disk), for the progress shots: a 16x10 block view of each level with Kit in it
// (level 3 dark and lit), and the five brightnesses of air, floor and rock side by side.
//   cd web && npx vite-node ../games/lights-out/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { recordCamera } from '@lewismoten/gamemaker-sandbox-tools/kit/cameraLog';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { GROUND, buildLevels } from '../src/levels';
import { finishBlocks } from '../src/loops';
import { mapAt } from './frames';
import { play } from './play';
import { GameSim } from './sim';

// where the screen really was on the bot's way through the game (it rests in a new place after a climb or a drop)
const cam = await recordCamera(GameSim, () => play());
const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { levels } = buildLevels();
const mb = buildMonsterBlocks(levels[0].pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(levels[0].pal);

/** A 16x10 block view of level n centered on column `col`, `tick` ticks in, Kit standing in the middle (and `lit` ticks of tunnel walked if given). */
function view(n: number, col: number, tick: number, kitAt = col, walked = -1): Pixels {
  const l = levels[n];
  const m = mapAt(l, tick);
  // level 2: the tunnel's dark blocks up to column `walked` as they are after Kit has walked that far
  if (walked >= 0)
    for (let y = 0; y < 14; y++)
      for (let x = 0; x <= walked; x++) {
        const at = (y + ORIGIN) * MLEN + x + ORIGIN;
        const name = [...l.book.index.keys()][m.blocks[at]];
        if (name.startsWith('tdark.')) m.blocks[at] = l.book.n(name.replace('tdark', 'tlit'));
      }
  const h = heroPicture(hero, 'stand.top', 'stand');
  const kit = [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + kitAt, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + kitAt, y: ORIGIN + GROUND - 1 },
  ];
  return renderRegion(m, finishBlocks(l), mbl, set, ORIGIN + col - 8, cam.top(n, kit), 16, 10, kit);
}
const shot = (name: string, n: number, col: number, tick: number, kitAt?: number, walked?: number) =>
  writePng(join(out, name), view(n, col, tick, kitAt, walked), levels[n].pal.pal, 3);
shot('lanterns-1-beside-a-lamp.png', 0, 14, 0, 12);
shot('lanterns-2-in-the-dark.png', 0, 22, 0);
shot('tunnel-1-start.png', 1, 8, 0, 4);
shot('tunnel-2-lit-behind.png', 1, 18, 0, 15, 14);
shot('hall-1-dark.png', 2, 14, 0, 6);
shot('hall-2-bulbs-half-lit.png', 2, 10, 100, 7);
shot('hall-3-lights-on.png', 2, 14, 200, 12);

/** A row of blocks, each on a card with a gap. */
function strip(name: string, pics: Pixels[], zoom: number): void {
  const pal = levels[0].pal;
  const w = pics[0].w;
  const s = new Pixels(pics.length * (w + 4) + 4, pics[0].h + 8, pal.c('ink', 0));
  pics.forEach((p, i) => s.blit(p, 4 + i * (w + 4), 4));
  writePng(join(out, name), s, pal.pal, zoom);
}
const pic = (name: string) => levels[0].book.pics.get(name)!;
strip(
  'shades-air.png',
  [0, 1, 2, 3, 4].map((k) => pic(`air.${k}`)),
  4,
);
strip(
  'shades-floor.png',
  [0, 1, 2, 3].map((k) => pic(`floor.${k}.${[...levels[0].book.index.keys()].includes(`floor.${k}.0`) ? 0 : 1}`)),
  4,
);
console.log(`shots in ${out}`);
