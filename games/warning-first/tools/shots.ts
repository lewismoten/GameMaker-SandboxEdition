// Pictures of the lessons (never on the disk), for the progress shots: a vent at rest, rumbling and puffing, and a bridge solid, flickering and gone.
//   cd web && npx vite-node ../games/warning-first/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { BRIDGE_X, GROUND, PIT_ROWS, VENT_X, buildLevels, finishBlocks, ventBlock, type Level } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
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

/** The level's map as the clocks leave it. Level 1: every vent in `mood`. Level 2: both bridges in `mood`. */
function at(l: Level, mood: string) {
  // a fresh copy of the level each time, so one picture's changes stay out of the next
  const m = buildLevels().levels[l.file === 'one' ? 0 : 1].map.done();
  const swap = (from: string, to: string) => {
    for (let i = 0; i < m.blocks.length; i++) if (m.blocks[i] === l.book.n(from)) m.blocks[i] = l.book.n(to);
  };
  if (l.file === 'one')
    for (let k = 0; k < VENT_X.length; k++) for (const c of ['g', 'a', 'b'] as const) swap(ventBlock(k, c, 'start'), ventBlock(k, c, mood as 'rest'));
  else for (let k = 0; k < BRIDGE_X.length; k++) swap(`p${k}.start`, `p${k}.${mood}`);
  return m;
}
const region = (l: Level, m: ReturnType<typeof at>, col: number, row: number, w: number, extra: Sprite[]) =>
  renderRegion(m, finishBlocks(l), mbl, set, ORIGIN + col, ORIGIN + row, w, 11, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);
const [one, two] = levels;

save('1-rest.png', region(one, at(one, 'rest'), 8, 0, 16, kit(14)));
save('2-rumble.png', region(one, at(one, 'rumble'), 8, 0, 16, kit(14)));
save('3-puff.png', region(one, at(one, 'puff'), 8, 0, 16, kit(14)));
save('4-solid.png', region(two, at(two, 'solid'), 4, 4, 16, kit(8)));
save('5-flicker.png', region(two, at(two, 'flicker'), 4, 4, 16, kit(11)));
save('6-gone.png', region(two, at(two, 'gone'), 4, 4, 16, kit(11, PIT_ROWS[0])));
console.log(`shots in ${out}`);
