// Play-tests every board headlessly:  cd web && npx vite-node ../games/logic/tools/check.ts [file]
import { BOARDS } from '../src/levels/boards';
import { compileHouse } from '../src/levels/board';
import { buildMonsterBlocks, buildWattBlocks } from '../src/sprites/sprites';
import { buildWatt } from '../src/characters/watt';
import { playSolution } from './verify';
import { lagFailures } from './lag';

const only = process.argv[2];
const mb = buildMonsterBlocks();
const cb = buildWattBlocks();
let bad = 0;
// Solid parts must be felt at their very edge: Watt rolls up to 6 pixels a tick and PLAYGAME
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
for (const room of compileHouse(BOARDS, mb)) {
  console.log(`${room.room}: ${room.boards.length} boards, ${room.tiles.names.length} blocks, ${room.mons.names.length} monsters`);
  for (const b of room.boards) {
    if (only && b.spec.file !== only) continue;
    const chr = buildWatt(cb, b.mons.id('boom'));
    const r = await playSolution(b, room.tiles, mb, cb, chr);
    if (!r.ok) bad++;
    console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${b.spec.file.padEnd(10)} ${r.why}, ${(r.ticks / 18.2).toFixed(1)}s, peak ${r.peak} monsters`);
    if (process.env.SHORTCUT) {
      const s = await playSolution(b, room.tiles, mb, cb, chr, process.env.SHORTCUT);
      console.log(`     shortcut: ${s.why}`);
    }
  }
}
// A person taps slower than the bot: every board must also work with up to 9 ticks
// (half a second) between rolls (tools/lag.ts). SKIPLAG=1 skips this slower pass.
if (!process.env.SKIPLAG)
  for (let lag = 1; lag <= 9; lag++) {
    const fails = await lagFailures(lag, only);
    if (fails.length) {
      console.log(`FAIL at ${lag} ticks of lag: ${fails.join(', ')}`);
      bad++;
    }
  }
if (!process.env.SKIPLAG && !bad) console.log('every board also works tapping with up to 9 ticks of lag');
if (bad) process.exitCode = 1;
