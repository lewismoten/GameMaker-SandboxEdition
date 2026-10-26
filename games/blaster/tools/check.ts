// Play-tests every leg with the bot in the headless simulator:
//   cd web && npx vite-node ../games/blaster/tools/check.ts [leg file...]
import { fly } from './bot';
import { STAGES } from '../src/stages/stages';
import { arenaGoal, maxTicksOf, simOf } from './testkit';
import { Sim } from './sim';
import { MLEN } from '../../../web/src/formats/map';
import { SCAN } from '../src/ids';
import { EGG_BLOCK } from '../src/blocks/egg';
import type { Stage } from '../src/stages/stage';

/** A side room: the bot finds the way in, then takes what sits on the pad (Enter) and leaves. */
async function sideRoom(st: Stage): Promise<string> {
  const side = st.side!;
  const leg = st.legs.find((l) => l.file === side.from)!;
  const to = { x: side.cell.x * 20, y: side.cell.y * 20 };
  const inSim = new Sim({ ...simOf(leg).scene, links: [side.cell] });
  const r = await fly(inSim, { maxTicks: 1600, until: (s) => s.pos.by <= side.cell.y + 10 });
  if (r.dead) return 'DIED on the way in';
  for (let t = 0; t < 200 && inSim.link < 0 && !inSim.dead; t++) {
    inSim.only(inSim.pos.x > to.x ? SCAN.left : undefined);
    await inSim.tick();
  }
  if (inSim.link < 0) return 'NO WAY IN';
  const room = simOf(side.room);
  const egg = side.room.grid.map.blocks.indexOf(EGG_BLOCK);
  const want = { x: (egg % MLEN) * 20, y: Math.floor(egg / MLEN) * 20 };
  for (let t = 0; t < 200; t++) {
    const p = room.pos;
    const k = p.x > want.x ? SCAN.left : p.x < want.x ? SCAN.right : p.y < want.y - 10 ? SCAN.down : p.y > want.y + 10 ? SCAN.up : undefined;
    room.only(k);
    await room.tick();
    if (k === undefined) break;
  }
  room.only(SCAN.enter);
  await room.tick();
  room.only(undefined);
  await room.tick();
  if (!room.w.ci.inv.includes(EGG_BLOCK)) return 'NOTHING PICKED UP';
  const out = await fly(room, { maxTicks: 600, goal: arenaGoal });
  return out.ok ? `in at tick ${inSim.ticks}, picked up block ${EGG_BLOCK}, out in ${out.ticks} ticks` : 'NO WAY OUT';
}

const only = process.argv.slice(2);
const failed: string[] = [];
for (const make of STAGES) {
  const st = make();
  for (const l of st.legs) {
    if (only.length && !only.includes(l.file)) continue;
    const sim = simOf(l);
    const t0 = Date.now();
    const human = process.env.HUMAN ? { horizon: 5, every: 5 } : {};
    const r = await fly(sim, { maxTicks: maxTicksOf(l), goal: l.kind === 'boss' ? arenaGoal : undefined, ...human });
    console.log(
      `${l.file} ${l.title}: ${r.ok ? 'CLEARED' : r.dead ? 'DIED' : 'TIMED OUT'} in ${r.ticks} ticks (${(r.ticks / 18.2).toFixed(0)}s), lost ${r.hpLost} energy, score ${r.score}, ${((Date.now() - t0) / 1000).toFixed(1)}s`,
    );
    for (const line of r.log) console.log('   ', line);
    if (!r.ok || r.dead) failed.push(`${l.file} ${r.dead ? 'died' : 'timed out'}`);
  }
  if (st.side && (!only.length || only.includes(st.side.room.file))) {
    const res = await sideRoom(st);
    console.log(`${st.side.room.file} ${st.side.room.title}: ${res}`);
    if (!res.startsWith('in at')) failed.push(`${st.side.room.file}: ${res}`);
  }
}
// any death or failed leg fails the check
if (failed.length) throw new Error(`blaster check failed: ${failed.join(', ')}`);
