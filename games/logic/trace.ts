// Design aid: plays a few moves (M=UUL...) on board B (its file name) and prints what the parts are doing.
import { newCharInfo } from '../../web/src/engine/world';
import { BOARDS } from './boards';
import { compileHouse } from './board';
import { isWire } from './mons';
import { buildMonsterBlocks, buildWattBlocks } from './sprites';
import { buildWatt } from './watt';
import { Sim } from './sim';
const mb = buildMonsterBlocks(),
  cb = buildWattBlocks();
const rooms = compileHouse(BOARDS, mb);
const room = rooms.find((r) => r.boards.some((x) => x.spec.file === process.env.B))!;
const b = room.boards.find((x) => x.spec.file === process.env.B)!;
const tiles = room.tiles;
const sim = new Sim(
  { map: b.map, bbl: tiles.build(), mbl: mb.build(), mon: b.mons.build(), chr: buildWatt(cb, b.mons.id('boom')), cbl: cb.build() },
  b.start,
  newCharInfo(),
);
const show = (t: number) =>
  console.log(
    t,
    `watt ${sim.pos.bx - b.ox},${sim.pos.by - b.oy}+${sim.w.chr.x[1]},${sim.w.chr.y[1]} seq${sim.w.chr.cseq}`,
    sim.w.mm
      .map((m, i) => (m.monnum < 64 && !isWire(m.monnum) ? `${b.mons.names[m.monnum]}@${sim.w.mi[i].curx[0] - b.ox},${sim.w.mi[i].cury[0] - b.oy}` : ''))
      .filter(Boolean)
      .join(' '),
    'sparks',
    process.env.SPARKS
      ? sim.w.mm
          .map((m, i) => (isWire(m.monnum) ? `${m.monnum}@${sim.w.mi[i].curx[0] - b.ox},${sim.w.mi[i].cury[0] - b.oy}` : ''))
          .filter(Boolean)
          .join(' ')
      : '',
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
