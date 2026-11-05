// Pictures of the lessons (never on the disk), for the progress shots: Kit on the board's pads, jumping up
// through the long and short pair, and by the gate in level 2.
//   cd web && npx vite-node ../games/sound-board/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { BOARD, GROUND, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

/** Kit in column `col` (in the level) with his feet in row `row`, as two sprites for renderRegion. */
const kit = (pose: [string, string], col: number, row = GROUND - 1) => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + row - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + row },
  ];
};
const region = (map: ReturnType<(typeof levels)[0]['map']['done']>, col: number, w: number, extra: ReturnType<typeof kit> = []) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + 3, w, 8, extra);

// the board with the chime and coin pads pressed, Kit on the blip pad
const m1 = levels[0].map.done();
for (const [pad, x0] of BOARD.units.slice(0, 2)) m1.blocks[(GROUND - 1 + ORIGIN) * MLEN + x0 + 1 + ORIGIN] = book.n(`padOn.${pad}`);
writePng(join(out, 'board-1-pads.png'), region(m1, 12, 16, kit(['stand.top', 'stand'], BOARD.units[2][1] + 1)), pal.pal, 3);
// the long and short pads, and Kit jumping up through them
const m1b = levels[0].map.done();
m1b.blocks[(BOARD.jump.long + ORIGIN) * MLEN + BOARD.jump.x + ORIGIN] = book.n('padOn.long');
writePng(join(out, 'board-2-jump.png'), region(m1b, 33, 16, kit(['cheer.top', 'jump'], BOARD.jump.x, GROUND - 3)), pal.pal, 3);
const m2 = levels[1].map.done();
writePng(join(out, 'feedback-1-gate.png'), region(m2, 17, 16, kit(['stand.top', 'stand'], 25)), pal.pal, 3);
