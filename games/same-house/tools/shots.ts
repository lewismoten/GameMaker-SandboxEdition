// Pictures of the lessons (never on the disk), for the progress shots: the street, the same house in
// each of its three palettes, and the same tower room in wood, ice and lava.
//   cd web && npx vite-node ../games/same-house/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, buildLevels, finishBlocks, type Place } from '../src/levels';
import type { PalName } from '../src/palettes';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, pals, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** Kit standing in column `col` (in the level), his feet on row `feet`. */
const kit = (col: number, feet = GROUND - 1): Sprite[] => {
  const h = heroPicture(hero, 'stand.top', 'stand');
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + feet - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + feet },
  ];
};
const region = (p: Place, col: number, w: number, extra: Sprite[]) => renderRegion(p.map.done(), finishBlocks(p), mbl, set, ORIGIN + col, ORIGIN, w, 11, extra);
const save = (name: string, pn: PalName, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pals.files[pn], 3);
const [one, two] = levels;

save('1-street.png', 'street', region(one.hub, 6, 20, kit(15)));
save('2-house-red.png', 'red', region(one.room, 3, 20, kit(7)));
save('3-house-blue.png', 'blue', region(one.room, 3, 20, kit(7)));
save('4-house-green.png', 'green', region(one.room, 3, 20, kit(7)));
save('5-square.png', 'street', region(two.hub, 0, 20, kit(10)));
save('6-tower-wood.png', 'wood', region(two.room, 3, 20, kit(7)));
save('7-tower-ice.png', 'ice', region(two.room, 3, 20, kit(7)));
save('8-tower-lava.png', 'lava', region(two.room, 3, 20, kit(7)));
console.log(`shots in ${out}`);
