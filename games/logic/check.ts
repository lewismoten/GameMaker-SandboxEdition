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
