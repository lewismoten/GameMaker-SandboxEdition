// Pictures of the lessons (never on the disk), for the progress shots: Kit before the spike and hurt by it
// (the spike flat), by the hearts in level 2, and in the quiet room in level 3.
//   cd web && npx vite-node ../games/sounds-and-music/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { GROUND, SPIKE_X, buildLevels } from '../src/levels';

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

const region2 = (map: ReturnType<(typeof levels)[0]['map']['done']>, col: number, w: number, extra: ReturnType<typeof kit> = []) => region(map, col, w, extra);

const m1 = levels[0].map.done();
writePng(join(out, 'song-1-signs.png'), region2(m1, 3, 14, kit(['stand.top', 'stand'], 9)), pal.pal, 3);

const m2 = levels[1].map.done();
writePng(join(out, 'pickups-1-bags.png'), region2(m2, 10, 14, kit(['stand.top', 'stand'], 17)), pal.pal, 3);
const flat = levels[1].map.done();
flat.blocks[(GROUND - 1 + ORIGIN) * MLEN + SPIKE_X + ORIGIN] = book.n('spikeFlat');
writePng(join(out, 'pickups-2-hurt.png'), region2(flat, 22, 14, kit(['hurt.top', 'hurt'], SPIKE_X)), pal.pal, 3);
writePng(join(out, 'pickups-3-hearts.png'), region2(m2, 28, 14, kit(['cheer.top', 'jump'], 36)), pal.pal, 3);

const m3 = levels[2].map.done();
writePng(join(out, 'quiet-1-jump.png'), region2(m3, 10, 16, kit(['cheer.top', 'jump'], 17)), pal.pal, 3);
writePng(join(out, 'quiet-2-coins.png'), region2(m3, 26, 16, kit(['stand.top', 'stand'], 32)), pal.pal, 3);
