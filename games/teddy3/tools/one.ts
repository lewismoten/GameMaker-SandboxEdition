// Plays one level module by itself with the bot (no disk, no game list needed), for building a
// level before it joins the game:
//   cd web && npx vite-node ../games/teddy3/tools/one.ts <level file> [VERBOSE=1]
// It imports src/levels/<file>.ts (the exported function of the same name) and
// tools/routes/<file>.ts, starts with fresh energy, and fails on a missed exit or a lost life.
import { newCharInfo } from '../../../web/src/engine/world';
import { HEROES } from '../src/heroes';
import type { Level } from '../src/levels/level';
import { Recorder, playLevel, type Order } from './bot';
import { Sim } from '../../kit/sceneSim';

const file = process.argv[2];
const mod = (await import(`../src/levels/${file}.ts`)) as Record<string, () => Level>;
const l = mod[file]();
const { route } = (await import(`./routes/${file}.ts`)) as { route: Order[] };
const ci = newCharInfo();
const r = await playLevel(
  (ci) => {
    const sim = new Sim(
      {
        map: l.map.done(),
        bbl: l.bs.build(),
        mbl: l.beasts.mb.build(),
        mon: l.beasts.build(),
        ...HEROES[l.hero],
        links: [{ from: l.exit, to: l.exit }],
        names: l.beasts.names,
      },
      l.start,
      ci,
    );
    return { sim, rec: new Recorder(sim) };
  },
  route,
  `${file}: `,
  ci,
);
console.log(r.log.join('\n'));
const lost = r.ci.lives < newCharInfo().lives;
console.log(
  `${file}: ${r.ok ? 'REACHED THE EXIT' : 'did not finish'} in ${r.sim.ticks} ticks (${(r.sim.ticks / 18.2).toFixed(0)}s), energy ${r.ci.hitpts}${lost ? ', LOST A LIFE' : ''}`,
);
console.log(
  `${l.title}: ${l.bs.names.length} blocks, ${l.beasts.mb.names.length} monster blocks, ${l.beasts.names.filter(Boolean).length} monsters, ${l.map.monsters} placed`,
);
process.exit(r.ok && !lost ? 0 : 1);
