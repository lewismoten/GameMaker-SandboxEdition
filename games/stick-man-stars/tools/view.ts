// What the player really sees (never on the disk): the 16 x 10 block screen the engine shows when Stick Man stands
// in a column (the camera puts his feet 120 px down: four rows of sky over his head, four of ground under his feet)
// and when he is `lift` blocks up in a jump (the camera holds until he is 60 px off its center). Mark each shot with a name.
//   cd web && npx vite-node ../games/stick-man-stars/tools/view.ts <outDir> [prefix]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildStickBlocks } from '../src/stick';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { GROUND, L0, buildLevels } from '../src/levels';

const out = process.argv[2];
const prefix = process.argv[3] ?? '';
if (!out) throw new Error('usage: view.ts <outDir> [prefix]');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const hero = buildStickBlocks(pal);

/** The screen with Stick Man in column `col`, `lift` blocks off the ground; the camera follows his standing place. */
function screen(name: string, level: number, col: number, lift: number, pose: [string, string], camLift = 0): void {
  const h = heroPicture(hero, pose[0], pose[1]);
  const top = GROUND - 2 - lift;
  const sprites = [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + top },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + top + 1 },
  ];
  const m = levels[level].map.done();
  writePng(
    join(out, `${prefix}${name}.png`),
    renderRegion(m, bbl, mbl, monsterSet(mb), ORIGIN + col - 8, ORIGIN + GROUND - 6 - camLift, 16, 10, sprites),
    levels[level].pal.pal,
    3,
  );
}
screen('start-standing', 0, 4, 0, ['front.top', 'stand']);
screen('moon-standing', 0, 24, 0, ['front.top', 'stand']);
screen('jump-peak', 0, 4, 3, ['up.top', 'jumpup']);
screen('gate-standing', 0, L0.gate - 4, 0, ['front.top', 'stand']);
screen('gate-jump', 0, L0.gate - 4, 3, ['up.top', 'jumpup']);
console.log(`views in ${out}`);
