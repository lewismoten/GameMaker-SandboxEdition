// Pictures of the lessons (never on the disk), for the progress shots: the stage with its floor shut,
// flashing, and open with Kit dropping, and the menu room with its three doors.
//   cd web && npx vite-node ../games/cutscenes/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, MAT_ROW, WIDTH_MENU, WIDTH_STAGE, buildLevels, finishBlocks } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, book, timed } = buildLevels();
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

/** The map as the clock leaves it: the floor shut, flashing or open. */
function stageAt(floor: 'shut' | 'warn' | 'open') {
  const m = buildLevels().scenes[0].map.done();
  if (floor !== 'shut') for (let i = 0; i < m.blocks.length; i++) if (m.blocks[i] === book.n('trap.shut')) m.blocks[i] = book.n(floor === 'warn' ? 'trap.warn' : 'shaft');
  return m;
}
const save = (name: string, pic: ReturnType<typeof renderRegion>) => writePng(join(out, name), pic, pal.pal, 3);
const view = (m: ReturnType<typeof stageAt>, col: number, row: number, w: number, h: number, extra: Sprite[]) =>
  renderRegion(m, finishBlocks(book, timed), mbl, set, ORIGIN + col, ORIGIN + row, w, h, extra);

save('1-stage-shut.png', view(stageAt('shut'), 0, 0, WIDTH_STAGE, 11, kit(1)));
save('2-floor-flashes.png', view(stageAt('warn'), 0, 0, WIDTH_STAGE, 11, kit(8)));
save('3-the-drop.png', view(stageAt('open'), 0, 9, WIDTH_STAGE, 11, kit(8, MAT_ROW - 3)));
save('4-menu-room.png', view(buildLevels().scenes[1].map.done(), 0, 0, WIDTH_MENU, 11, kit(2)));
console.log(`shots in ${out}`);
