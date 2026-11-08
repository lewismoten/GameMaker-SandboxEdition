// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lessons once each: Kit walks into Big Bug and is stung (no hit counted), then five stars take it
// from five hits to a puff. It prints what happened.
//   cd web && npx vite-node ../games/boss-hits/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { HITS, HIT_SCORE, PLAIN, POOF, STING } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const stage = () => sim.w.mm.map((m) => m.monnum).find((n) => (n >= PLAIN && n < PLAIN + HITS) || n === POOF);
const hp0 = sim.ci.hitpts;
let stings = -1;
let stageAtSting: number | undefined;
const step = async () => {
  await sim.tick();
  if (stings < 0 && sim.ci.hitpts < hp0) {
    stings = hp0 - sim.ci.hitpts;
    stageAtSting = stage();
  }
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 70; i++) await step();
console.log(`demo: stung for ${stings} (bug at stage ${stageAtSting}); ends with the bug at stage ${stage()}; score ${sim.ci.score}`);
const fail = (m: string) => {
  console.error(`demoCheck: ${m}`);
  process.exit(1);
};
if (stings < STING) fail('the demo should walk into the bug once and be stung');
if (stageAtSting !== PLAIN) fail('the sting should come before any hit');
if (sim.ci.score < HITS * HIT_SCORE) fail(`the demo should land all ${HITS} hits (score ${sim.ci.score})`);
console.log('demoCheck ok: one sting that counted for nothing, then five hits');
