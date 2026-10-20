// Play-tests every board headlessly:  cd web && npx vite-node ../games/logic/check.ts [file]
import { BOARDS } from './boards';
import { compileBoard } from './board';
import { STYLES, buildTiles } from './tiles';
import { buildMonsterBlocks, buildWattBlocks } from './sprites';
import { buildWatt } from './watt';
import { playSolution } from './verify';

const only = process.argv[2];
const mb = buildMonsterBlocks();
const cb = buildWattBlocks();
let bad = 0;
// Watt's rolling frames must keep clear of current reaching an open gate: nothing in the
// top four rows, nor in the outer four columns of the middle rows (any mirror image).
for (const name of ['down0', 'down1', 'blink', 'up0', 'up1', 'side0', 'side1']) {
  const px = cb.pic(name);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const solid = px.get(x, y) !== 255;
      if (solid && (y < 4 || (y >= 8 && y < 12 && (x < 4 || x >= 16)))) {
        console.log(`Watt's ${name} has a pixel at ${x},${y}`);
        bad++;
      }
    }
}
for (const spec of BOARDS) {
  if (only && spec.file !== only) continue;
  const tiles = buildTiles(STYLES[spec.room]);
  const b = compileBoard(spec, tiles, mb);
  const chr = buildWatt(cb, b.mons.id('boom'));
  const r = await playSolution(b, tiles, mb, cb, chr);
  if (!r.ok) bad++;
  console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${spec.file.padEnd(10)} ${r.why}, ${(r.ticks / 18.2).toFixed(1)}s, peak ${r.peak} monsters`);
  if (process.env.SHORTCUT) {
    const s = await playSolution(b, tiles, mb, cb, chr, process.env.SHORTCUT);
    console.log(`     shortcut: ${s.why}`);
  }
}
if (bad) process.exitCode = 1;
