// Pictures of the lessons (never on the disk), for the progress shots: Kit stepping onto the ice and, hurt, at the
// spike it slid into; on the belt and at its spike; at the spring; and up on the shelf, blown there by the wind.
//   cd web && npx vite-node ../games/slippery-and-bouncy/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { GROUND, ICE_SPIKE, SHELF_ROW, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

/** Kit standing at level column `col`, his feet on row `row`, in `pose`, as two sprites for renderRegion. */
const kit = (pose: [string, string], col: number, row = GROUND - 1) => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + row - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + row },
  ];
};
const region = (map: ReturnType<(typeof levels)[0]['map']['done']>, col: number, y: number, w: number, extra: ReturnType<typeof kit> = []) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + y, w, 8, extra);
const png = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

const m1 = levels[0].map.done();
png('ice-1-before.png', region(m1, 11, 4, 16, kit(['stand.top', 'stand'], 12)));
png('ice-2-sliding.png', region(m1, 11, 4, 16, kit(['stand.top', 'stand'], 20)));
const flat = levels[0].map.done();
flat.blocks[(GROUND - 1 + ORIGIN) * MLEN + ICE_SPIKE + ORIGIN] = book.n('spikeFlat');
png('ice-3-hurt.png', region(flat, 11, 4, 16, kit(['hurt.top', 'hurt'], ICE_SPIKE)));

const m2 = levels[1].map.done();
png('belt-1-before.png', region(m2, 9, 4, 16, kit(['stand.top', 'stand'], 11)));
png('belt-2-riding.png', region(m2, 9, 4, 16, kit(['stand.top', 'stand'], 16)));

const m3 = levels[2].map.done();
png('spring-1-bounce.png', region(m3, 5, 2, 16, kit(['cheer.top', 'jump'], 10, 6)));
png('wind-1-before.png', region(m3, 18, 0, 16, kit(['stand.top', 'stand'], 22)));
png('wind-2-up.png', region(m3, 18, 0, 16, kit(['cheer.top', 'jump'], 25, 4)));
png('wind-3-shelf.png', region(m3, 18, 0, 16, kit(['stand.top', 'stand'], 26, SHELF_ROW - 1)));
