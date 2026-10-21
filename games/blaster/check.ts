// Play-tests every leg with the bot in the headless simulator:
//   cd web && npx vite-node ../games/blaster/check.ts [leg file...]
import { fly } from './bot';
import { STAGES } from './src/stages/stages';
import { arenaGoal, simOf } from './testkit';

const only = process.argv.slice(2);
for (const make of STAGES) {
  const st = make();
  for (const l of st.legs) {
    if (only.length && !only.includes(l.file)) continue;
    const sim = simOf(l);
    const t0 = Date.now();
    const human = process.env.HUMAN ? { horizon: 5, every: 5 } : {};
    const r = await fly(sim, { maxTicks: l.kind === 'boss' ? 2400 : 1600, goal: l.kind === 'boss' ? arenaGoal : undefined, ...human });
    console.log(
      `${l.file} ${l.title}: ${r.ok ? 'CLEARED' : r.dead ? 'DIED' : 'TIMED OUT'} in ${r.ticks} ticks (${(r.ticks / 18.2).toFixed(0)}s), lost ${r.hpLost} energy, score ${r.score}, ${((Date.now() - t0) / 1000).toFixed(1)}s`,
    );
    for (const line of r.log) console.log('   ', line);
  }
}
