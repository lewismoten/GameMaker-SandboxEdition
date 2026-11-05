// Pictures of the lessons (never on the disk), for the progress shots: each hall, in two halves.
//   cd web && npx vite-node ../games/title-demo/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, buildLevels, finishBlocks } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, book, scenes } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** Kit standing in column `col` (in the level). */
const kit = (col: number): Sprite[] => {
  const h = heroPicture(hero, 'stand.top', 'stand');
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 },
  ];
};
const save = (name: string, pic: ReturnType<typeof renderRegion>) => writePng(join(out, name), pic, pal.pal, 3);
const view = (i: number, col: number, w: number) => renderRegion(scenes[i].map.done(), finishBlocks(book), mbl, set, ORIGIN + col, ORIGIN, w, 11, kit(col + 2));

save('1-menu-hall.png', view(0, 0, 20));
save('2-menu-hall-right.png', view(0, 20, 20));
save('3-demo-hall.png', view(1, 0, 20));
save('4-demo-hall-right.png', view(1, 20, 20));
console.log(`shots in ${out}`);
