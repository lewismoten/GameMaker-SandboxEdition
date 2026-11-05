// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: Kit throws two stars from the ground and the two bottom parts of Rocky pop, then
// a third star from the ground flies under his head and the two top parts are still there. It prints what happened.
//   cd web && npx vite-node ../games/giant/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { HIT_SCORE, ROCKY } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const alive = (n: number) => sim.w.mm.filter((m) => m.monnum === n).length;
const parts = () => [0, 1, 2, 3].map((p) => alive(ROCKY + p)).join('');
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await sim.tick();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 70; i++) await sim.tick();
console.log(`demo: parts alive (top left, top right, bottom left, bottom right) ${parts()}; score ${sim.ci.score}`);
const fail = (m: string) => {
  console.error(`demoCheck: ${m}`);
  process.exit(1);
};
const throws = keys.filter((k) => k.key === 28).length;
if (throws < 3) fail(`the demo should throw three stars (two pops and the one under the head), not ${throws}`);
if (alive(ROCKY + 2) || alive(ROCKY + 3)) fail('the demo should pop both bottom parts');
if (!alive(ROCKY) || !alive(ROCKY + 1)) fail('the demo should leave the head: a star from the ground flies under it');
if (sim.ci.score < 2 * HIT_SCORE) fail(`the demo should land two hits (score ${sim.ci.score})`);
console.log('demoCheck ok: two bottom parts popped, the head untouched');
