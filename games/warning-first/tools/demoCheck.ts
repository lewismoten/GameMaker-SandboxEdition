// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the hero stands on the first vent through its rumble and its puff takes exactly one
// sting (10 hit points), then he crosses the other vents without losing more and goes on.
// Each sting is put down to the vent whose lower fog he touched (a touched puff cell turns into
// that vent's twin "h" block on the map), and the demo must take him past the last vent and out of
// level 1 into level 2.
//   cd web && npx vite-node ../games/warning-first/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, VENT_X, buildLevels, ventBlock } from '../src/levels';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const { book } = buildLevels().levels[0];
const sim = new GameSim(undefined, 1);
/** Whether vent k's lower fog has been touched (its cell is now the twin chain that does not sting). */
const touched = (k: number) => sim.blockAt(ORIGIN + VENT_X[k], ORIGIN + GROUND - 1) === book.n(ventBlock(k, 'h', 'start'));
const start = sim.ci.hitpts;
let low = start;
let last = start;
let farthest = 0;
/** One entry per sting: the hit points it took and the vents touched on that tick. */
const stings: { lost: number; vents: number[] }[] = [];
let wasTouched = VENT_X.map((_, k) => touched(k));
const step = async () => {
  await sim.tick();
  if (sim.trail.length !== 1) return;
  const now = VENT_X.map((_, k) => touched(k));
  if (sim.ci.hitpts < last) stings.push({ lost: last - sim.ci.hitpts, vents: now.flatMap((t, k) => (t && !wasTouched[k] ? [k] : [])) });
  wasTouched = now;
  low = Math.min(low, sim.ci.hitpts);
  last = sim.ci.hitpts;
  farthest = Math.max(farthest, sim.pos.x - ORIGIN);
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await step();
const told = stings.map((s) => `${s.lost} from ${s.vents.length ? s.vents.map((k) => `vent ${k + 1}`).join('+') : 'no vent'}`).join(', ');
console.log(
  `demo: hit points ${start} -> lowest ${low}; stings: ${told || 'none'}; farthest column ${farthest}; ${sim.trail.length} scenes entered; score ${sim.ci.score}`,
);
const fail = (m: string): never => {
  console.error(`demoCheck: ${m}`);
  process.exit(1);
};
if (stings.length !== 1 || stings[0].lost !== 10 || start - low !== 10) fail('expected exactly one 10-point sting');
if (stings[0].vents.join() !== '0') fail(`the sting should come from the first vent's puff; it came from ${told}`);
if (farthest <= VENT_X[VENT_X.length - 1]) fail(`the hero should cross all three vents; he got no farther than column ${farthest}`);
if (sim.trail.length < 2) fail('the demo should take the hero out of level 1 into level 2');
console.log('demoCheck ok: one sting from the first vent, then across the others and on to level 2');
