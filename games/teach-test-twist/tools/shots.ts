// Pictures of the game (never on the disk), for the progress shots: the gap in level 1, Kit dropped
// into it, the spiked gap, the key in the gap and the locked door.
//   cd web && npx vite-node ../games/teach-test-twist/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, buildLevels } from '../src/levels';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, book, levels } = buildLevels();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
const hero = buildHeroBlocks(pal);
const bbl = book.finish();

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** Kit standing in column `col` (in the level). */
const kit = (col: number, dy: number): Sprite[] => {
  const h = heroPicture(hero, 'stand.top', 'stand');
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 + dy },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 + dy },
  ];
};
const save = (name: string, level: number, col: number, kitAt: number, dy = 0) =>
  writePng(join(out, name), renderRegion(levels[level].map.done(), bbl, mbl, set, ORIGIN + col, ORIGIN + 3, 16, 11, kit(kitAt, dy)), pal.pal, 3);

save('1-teach-the-gap.png', 0, 7, 11);
save('2-teach-dropping-in.png', 0, 10, 17, 2);
save('3-test-the-spikes.png', 1, 7, 11);
save('4-twist-the-key.png', 2, 7, 14, 2);
save('5-twist-the-door.png', 2, 20, 29);
console.log(`shots in ${out}`);
