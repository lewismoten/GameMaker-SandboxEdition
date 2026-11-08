// Pictures of the lesson (never on the disk), for the progress shots: the die rolling on three
// faces, and stopped on one.
//   cd web && npx vite-node ../games/dice/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { DIE_X, GROUND, buildLevels, finishBlocks, rolling, stopped } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);
const h = heroPicture(hero, 'stand.top', 'stand');
const kit = (col: number) => [
  { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 },
  { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 },
];
/** The level with the die's cell showing `name`. */
function at(name: string) {
  const l = buildLevels().levels[0];
  const m = l.map.done();
  m.blocks[(ORIGIN + GROUND - 1) * 100 + ORIGIN + DIE_X] = l.book.n(name);
  return m;
}
const [one] = levels;
const save = (name: string, block: string, col: number) =>
  writePng(join(out, name), renderRegion(at(block), finishBlocks(one), mbl, set, ORIGIN + 8, ORIGIN, 16, 11, kit(col)), pal.pal, 3);
save('1-rolling-3.png', rolling(3), DIE_X - 3);
save('2-rolling-6.png', rolling(6), DIE_X - 3);
save('3-stopped-4.png', stopped(4), DIE_X - 3);
console.log(`shots in ${out}`);
