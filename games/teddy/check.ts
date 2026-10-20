// Plays every level headlessly with the bot and reports how it went:
//   cd web && npx vite-node ../games/teddy/check.ts [level file...]
import { buildCharacter, CB } from './character';
import { newCharInfo } from '../../web/src/engine/world';
import { LEVELS } from './game';
import { ROUTES } from './routes';
import { runRoute } from './bot';
import { Sim } from './sim';
import { CTR } from './ids';

const only = process.argv.slice(2);
const chr = buildCharacter();
const cbl = CB.build();
let failed = 0;
for (const make of LEVELS) {
  const l = make();
  if (only.length && !only.includes(l.file)) continue;
  const sim = new Sim(
    {
      map: l.map.done(),
      bbl: l.bs.build(),
      mbl: l.beasts.mb.build(),
      mon: l.beasts.build(),
      chr,
      cbl,
      links: [{ from: l.exit, to: l.exit }],
      names: l.beasts.names,
    },
    l.start,
    newCharInfo(),
  );
  const r = await runRoute(sim, ROUTES[l.file] ?? [], `${l.file}: `);
  console.log(r.log.join('\n'));
  const ci = sim.w.ci;
  console.log(
    `${l.file}: ${r.ok ? 'REACHED THE EXIT' : 'did not finish'} in ${sim.ticks} ticks (${(sim.ticks / 18.2).toFixed(0)}s), score ${ci.score}, treats ${ci.meter[CTR.treats] - 1}, energy ${ci.hitpts}, ${r.keys.length} key events`,
  );
  if (!r.ok) failed++;
}
process.exit(failed ? 1 : 0);
