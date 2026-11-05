// Pictures of the lessons (never on the disk), for the progress shots: level 1's room by day and by night
// (the same map, two palettes), and level 2's street by day, at dusk and by night.
//   cd web && npx vite-node ../games/day-night/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, buildLevels, finishBlocks, type Level } from '../src/levels';

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

const region = (l: Level, col: number, w: number, extra: Sprite[]) => renderRegion(l.map.done(), finishBlocks(l), mbl, set, ORIGIN + col, ORIGIN, w, 11, extra);
const save = (name: string, hour: 'day' | 'dusk' | 'night', pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pals[hour], 3);
const [one, two] = levels;

save('1-room-by-day.png', 'day', region(one, 10, 20, kit(19)));
save('2-same-room-by-night.png', 'night', region(one, 10, 20, kit(19)));
save('3-street-day.png', 'day', region(two, 0, 20, kit(8)));
save('4-street-dusk.png', 'dusk', region(two, 0, 20, kit(8)));
save('5-street-night.png', 'night', region(two, 0, 20, kit(8)));
save('6-cottage-by-night.png', 'night', region(two, 21, 20, kit(32)));
console.log(`shots in ${out}`);
