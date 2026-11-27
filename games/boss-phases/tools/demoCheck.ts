// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lessons once each: Kit walks into Big Bug and is stung (no hit counted), then four stars take it from
// a calm green bug through the hurried orange one to a puff. It prints what happened.
//   cd web && npx vite-node ../games/boss-phases/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { CHAINS, HIT_SCORE, POOF, STING } from '../src/monsters';

const { first, looks } = CHAINS[0];
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url))));
const sim = new GameSim(undefined, 1);
const stage = () => sim.w.mm.map((m) => m.monnum).find((n) => (n >= first && n < first + looks.length) || n === POOF);
const hp0 = sim.ci.hitpts;
let stings = -1;
let stageAtSting: number | undefined;
let ticks = 0;
let exited = false;
const step = async () => {
  await sim.tick();
  ticks++;
  if (stings < 0 && sim.ci.hitpts < hp0) {
    stings = hp0 - sim.ci.hitpts;
    stageAtSting = stage();
  }
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key === 1) {
    exited = true;
    break;
  }
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
console.log(`demo: ${ticks} ticks; stung for ${stings} (bug at stage ${stageAtSting}); ends with the bug at stage ${stage()}; score ${sim.ci.score}`);
const fail = (m: string) => {
  console.error(`demoCheck: ${m}`);
  process.exit(1);
};
if (!exited) fail('the demo should exit with Esc');
if (stings < STING) fail('the demo should walk into the bug once and be stung');
if (stageAtSting !== first) fail('the sting should come before any hit');
if (sim.ci.score < looks.length * HIT_SCORE) fail(`the demo should land all ${looks.length} hits (score ${sim.ci.score})`);
console.log('demoCheck ok: one sting that counted for nothing, then four hits, calm then hurried');
