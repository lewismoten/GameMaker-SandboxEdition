// Pictures of the lesson (never on the disk), for the progress shots: level 1 at its first,
// second and third turn (the lit lamp and the open gate), and level 2 in the sun's turn.
//   cd web && npx vite-node ../games/block-brains/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { GATES_ONE, GATES_TWO, GATE_TOP, GROUND, LAMPS_ONE, buildLevels, finishBlocks, startOf } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);
const h = heroPicture(hero, 'stand.top', 'stand');
const kit = (col: number) => [
  { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 },
  { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 },
];

/** Level `i` as it looks `turn` turns after the room loads: every ring cell shows the block its ring has reached. */
function at(i: number, turn: number) {
  const l = buildLevels().levels[i];
  const m = l.map.done();
  const n = (name: string) => l.book.n(name);
  const turns = i === 0 ? 3 : 2;
  const cells: [string, string, number, number][] = [];
  if (i === 0) GATES_ONE.forEach((x, k) => cells.push([`gate${k}`, 'g', x, k]));
  if (i === 0) LAMPS_ONE.forEach((x, k) => cells.push([`lamp${k}`, 'l', x, k]));
  if (i === 1) GATES_TWO.forEach((x, k) => cells.push([k % 2 ? 'moon.gate' : 'sun.gate', 'g', x, k % 2]));
  if (i === 1) cells.push(['sun.lamp', 'l', 10, 0], ['moon.lamp', 'l', 11, 1]);
  for (const [ring, kind, x, openTurn] of cells) {
    // the block the cell's ring is on after `turn` turns
    const start = Number(startOf(ring, turns, openTurn).split('.').pop());
    const shown = n(`${ring}.${(start + turn) % turns}`);
    if (kind === 'g') for (let y = GATE_TOP; y < GROUND; y++) m.blocks[(ORIGIN + y) * 100 + ORIGIN + x] = shown;
    else m.blocks[(ORIGIN + GROUND - 1) * 100 + ORIGIN + x] = shown;
  }
  return { m, bbl: finishBlocks(l) };
}
const save = (name: string, i: number, turn: number, col0: number, cols: number, heroCol: number) => {
  const { m, bbl } = at(i, turn);
  writePng(join(out, name), renderRegion(m, bbl, mbl, set, ORIGIN + col0, ORIGIN, cols, 11, kit(heroCol)), pal.pal, 3);
};
save('1-turn-1.png', 0, 0, 8, 16, 19);
save('2-turn-2.png', 0, 1, 8, 16, 19);
save('3-turn-3.png', 0, 2, 8, 16, 19);
save('4-sun.png', 1, 0, 8, 16, 14);
save('5-moon.png', 1, 1, 8, 16, 14);
console.log(`shots in ${out}`);
