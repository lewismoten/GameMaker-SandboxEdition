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
// Solid parts must be felt at their very edge: Watt rolls 4 pixels a tick and PLAYGAME
// notices a touch a tick late, so a gap at the edge lets him reach the current inside.
mb.names.forEach((name, i) => {
  if (!mb.defs[i].solid) return;
  const px = mb.pics[i];
  for (let k = 3; k < 17; k++)
    for (const [ax, ay] of [
      [() => k, (d: number) => d],
      [() => k, (d: number) => 19 - d],
      [(d: number) => d, () => k],
      [(d: number) => 19 - d, () => k],
    ] as const)
      if (![0, 1, 2, 3].some((d) => px.get(ax(d), ay(d)) !== 255)) {
        console.log(`${name} has a gap at its edge near ${ax(0)},${ay(0)}`);
        bad++;
        return;
      }
});
// Watt's rolling frames must keep clear of current reaching an open gate: nothing in the
// top four rows, nor in the outer four columns of the middle rows (any mirror image).
for (const name of ['down0', 'down1', 'blink', 'up0', 'up1', 'side0', 'side1']) {
  const px = cb.pic(name);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const solid = px.get(x, y) !== 255;
      if (solid && (y < 4 || x < 2 || x > 17 || (y >= 8 && y < 14 && (x < 4 || x >= 16)))) {
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
