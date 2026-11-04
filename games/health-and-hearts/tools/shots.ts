// Pictures of the lessons (never on the disk), for the progress shots: Kit before the lone spike, hurt
// by it (the spike flat), before the pool, and back at the way in after the fall; and the safe way.
//   cd web && npx vite-node ../games/health-and-hearts/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { GROUND, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

/** Kit standing in column `col` (in the level) in `pose`, as two sprites for renderRegion. */
const kit = (pose: [string, string], col: number) => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 },
  ];
};
const region = (map: ReturnType<(typeof levels)[0]['map']['done']>, col: number, w: number, extra: ReturnType<typeof kit> = []) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + 4, w, 8, extra);

const m1 = levels[0].map.done();
writePng(join(out, 'spikes-1-before.png'), region(m1, 8, 12, kit(['stand.top', 'stand'], 11)), pal.pal, 3);
// the moment after the touch: the spike under him is the flat one
const flat = levels[0].map.done();
flat.blocks[(GROUND - 1 + ORIGIN) * MLEN + 14 + ORIGIN] = book.n('spikeFlat');
writePng(join(out, 'spikes-2-hurt.png'), region(flat, 8, 12, kit(['hurt.top', 'hurt'], 13)), pal.pal, 3);

const m2 = levels[1].map.done();
writePng(join(out, 'pool-1-before.png'), region(m2, 6, 14, kit(['stand.top', 'stand'], 10)), pal.pal, 3);
writePng(join(out, 'pool-2-back-at-the-way-in.png'), region(m2, 0, 14, kit(['stand.top', 'stand'], 3)), pal.pal, 3);

const m3 = levels[2].map.done();
writePng(join(out, 'safe-way.png'), renderRegion(m3, bbl, mbl, set, ORIGIN, ORIGIN + 3, 36, 9), pal.pal, 2);
console.log(`shots in ${out}`);
