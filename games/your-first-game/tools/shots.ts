// Pictures of the game (never on the disk), for the progress shots: each level's start, Kit at the
// wall, the gumdrop and the spikes, the key on its ledge and the locked door in level 3.
//   cd web && npx vite-node ../games/your-first-game/tools/shots.ts <outDir>
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
const kit = (col: number): Sprite[] => {
  const h = heroPicture(hero, 'stand.top', 'stand');
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 },
  ];
};
const save = (name: string, level: number, col: number, kitAt: number) =>
  writePng(join(out, name), renderRegion(levels[level].map.done(), bbl, mbl, set, ORIGIN + col, ORIGIN, 16, 11, kit(kitAt)), pal.pal, 3);

save('1-start.png', 0, 0, 3);
save('2-the-wall.png', 0, 14, 19);
save('3-the-gumdrop.png', 0, 36, 42);
save('4-the-spikes.png', 1, 0, 3);
save('5-the-key.png', 1, 14, 18);
save('6-the-door.png', 2, 26, 36);
console.log(`shots in ${out}`);
