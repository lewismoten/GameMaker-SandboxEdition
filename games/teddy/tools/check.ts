// Plays every level headlessly with the bot, one after another the way the game does
// (Teddy's energy, treats and counters carry over), and reports how it went:
//   cd web && npx vite-node ../games/teddy/tools/check.ts [level file...]
// TEDDY_WALK=<file> also writes the whole run as a .rec recording (for play-testing the
// real engine: it plays the game from start to finish).
import { writeFileSync } from 'node:fs';
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';
import { buildCharacter, CB } from '../src/characters/character';
import { newCharInfo } from '../../../web/src/engine/world';
import { LEVELS } from '../src/game';
import { ROUTES } from './routes';
import { Recorder, playLevel } from './bot';
import { Sim } from '../../kit/sceneSim';
import { CTR } from '../src/ids';

const only = process.argv.slice(2);
const chr = buildCharacter();
const cbl = CB.build();
let ci = newCharInfo();
const keys: RecordedKey[] = [];
let offset = 0;
let last = 0;
let failed = 0;
for (const make of LEVELS) {
  const l = make();
  if (only.length && !only.includes(l.file)) continue;
  const r = await playLevel(
    (ci) => {
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
        ci,
      );
      return { sim, rec: new Recorder(sim, offset, last) };
    },
    ROUTES[l.file] ?? [],
    `${l.file}: `,
    ci,
  );
  const { sim, rec } = r;
  ci = r.ci;
  if (process.env.VERBOSE) console.log(r.log.join('\n'));
  keys.push(...rec.keys);
  offset += sim.ticks;
  last = rec.lastTick;
  console.log(
    `${l.file}: ${r.ok ? 'REACHED THE EXIT' : 'did not finish: ' + r.log.slice(-1)[0]} in ${sim.ticks} ticks (${(sim.ticks / 18.2).toFixed(0)}s), score ${ci.score}, treats ${ci.meter[CTR.treats] - 1}, energy ${ci.hitpts}, lives ${ci.lives}`,
  );
  if (!r.ok) failed++;
}
console.log(`${keys.length} key events in all`);
if (process.env.TEDDY_WALK) writeFileSync(process.env.TEDDY_WALK, serializeRecording(keys));
process.exit(failed ? 1 : 0);
