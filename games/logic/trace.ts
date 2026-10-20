// Design aid: plays a few moves (M=UUL...) on board B and prints what the parts are doing.
import { newCharInfo } from '../../web/src/engine/world';
import { BOARDS } from './boards';
import { compileBoard } from './board';
import { STYLES, buildTiles } from './tiles';
import { buildMonsterBlocks, buildWattBlocks } from './sprites';
import { buildWatt } from './watt';
import { Sim } from './sim';
const mb = buildMonsterBlocks(),
  cb = buildWattBlocks();
const spec = BOARDS[Number(process.env.B ?? 0)];
const tiles = buildTiles(STYLES[spec.room]);
const b = compileBoard(spec, tiles, mb);
const sim = new Sim(
  { map: b.map, bbl: tiles.build(), mbl: mb.build(), mon: b.mons.build(), chr: buildWatt(cb, b.mons.id('boom')), cbl: cb.build() },
  { x: 18, y: 15 },
  newCharInfo(),
);
const show = (t: number) =>
  console.log(
    t,
    `watt ${sim.pos.bx - 10},${sim.pos.by - 10}+${sim.w.chr.x[1]},${sim.w.chr.y[1]} seq${sim.w.chr.cseq}`,
    sim.w.mm
      .map((m, i) => (m.monnum < 64 && m.monnum >= 16 ? `${b.mons.names[m.monnum]}@${sim.w.mi[i].curx[0] - 10},${sim.w.mi[i].cury[0] - 10}` : ''))
      .filter(Boolean)
      .join(' '),
    'sparks',
    sim.w.mm.filter((m) => m.monnum < 16).length,
  );
const moves = (process.env.M ?? 'UUULLU').split('');
await sim.run(10);
const step = Number(process.env.STEP ?? 10);
for (const ch of moves) {
  if (ch === '.') {
    await sim.run(30);
    continue;
  }
  const sc = { U: 72, D: 80, L: 75, R: 77, r: 19 }[ch]!;
  sim.press(sc);
  await sim.tick();
  sim.release(sc);
  for (let i = 0; i < 8; i++) {
    await sim.tick();
    if (step === 1) show(sim.ticks);
  }
  show(sim.ticks);
}
for (let t = 0; t < 120; t += step) {
  await sim.run(step);
  show(sim.ticks);
}
