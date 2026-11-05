// Pictures of the lessons (never on the disk), for the progress shots: the tower with Kit before it and
// inside it, the village row, and Kit stopped by the brick wall.
//   cd web && npx vite-node ../games/blocks-budget/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, TOWER_X, VILLAGE_X, WALL_X, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** Kit standing in column `col` (in the level), his feet on the ground row, as two sprites for renderRegion. */
const kit = (col: number): Sprite[] => {
  const h = heroPicture(hero, 'stand.top', 'stand');
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 },
  ];
};
const region = (level: number, col: number, w: number, extra: Sprite[]) =>
  renderRegion(levels[level].map.done(), bbl, mbl, set, ORIGIN + col, ORIGIN + 1, w, 10, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

save('1-before-tower.png', region(0, TOWER_X - 8, 16, kit(TOWER_X - 3)));
save('2-inside-tower.png', region(0, TOWER_X - 6, 16, kit(TOWER_X + 1)));
save('3-village.png', region(1, VILLAGE_X - 3, 20, kit(VILLAGE_X - 1)));
save('4-brick-wall.png', region(1, WALL_X - 12, 20, kit(WALL_X - 1)));
console.log(`shots in ${out}`);
