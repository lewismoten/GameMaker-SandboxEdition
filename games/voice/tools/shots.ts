// Pictures of the lessons (never on the disk), for the progress shots: Kit saying hello, the two
// speakers (loud, then hushed) and the long walk from the last speaker to the door.
//   cd web && npx vite-node ../games/voice/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { GROUND, L2, L3, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

/** Kit standing in column `col` with his feet on level row `feet` (the row he stands in), in `pose`, as two sprites for renderRegion. */
const kit = (pose: [string, string], col: number, feet = GROUND - 1) => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + feet - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + feet },
  ];
};
type Map = ReturnType<(typeof levels)[0]['map']['done']>;
const region = (map: Map, col: number, w: number, extra: ReturnType<typeof kit> = [], top = 2, h = 10) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + top, w, h, extra);
const stand: [string, string] = ['stand.top', 'stand'];

// level 1: Kit says hello
const l1 = levels[0].map.done();
writePng(join(out, 'hello-1-before.png'), region(l1, 3, 14, kit(stand, 9)), pal.pal, 3);
writePng(join(out, 'hello-2-says.png'), region(l1, 3, 14, kit(['cheer2.top', 'cheer'], 9)), pal.pal, 3);

// level 2: the speakers, loud then hushed
const l2 = levels[1].map;
writePng(join(out, 'speaker-1-loud.png'), region(l2.done(), 17, 24, kit(stand, L2.up - 2)), pal.pal, 3);
l2.set(L2.up, GROUND - 1, 'hush');
l2.set(L2.down, GROUND - 1, 'hush');
writePng(join(out, 'speaker-2-hushed.png'), region(l2.done(), 17, 24, kit(['cheer.top', 'jump'], L2.down + 1)), pal.pal, 3);

// level 3: the speaker, and how far the door is
const l3 = levels[2].map.done();
writePng(join(out, 'finish-1-walk.png'), region(l3, 24, 28, kit(stand, L3.speaker + 3)), pal.pal, 3);
for (const [i, l] of levels.entries()) {
  writePng(join(out, `level-${i + 1}.png`), renderRegion(l.map.done(), bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, 12), pal.pal, 2);
}
console.log(`shots in ${out}`);
