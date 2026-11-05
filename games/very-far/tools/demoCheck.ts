// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows the first lesson:
// Kit walks to the door up close, and it lands him in the far scene.
//   cd web && npx vite-node ../games/very-far/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { LAND_X } from '../src/levels';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await sim.tick();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 130; i++) await sim.tick();
const at = sim.trail[sim.trail.length - 1];
const p = sim.pos;
console.log(`demo: scenes ${sim.trail.join(' ')}; score ${sim.ci.score}; ends at ${p.x},${p.y}`);
const fail = (m: string) => {
  console.error(`demoCheck: ${m}`);
  process.exit(1);
};
if (at !== 3) fail(`the door should lead to the far scene (scene 3), not scene ${at}`);
if (p.x < 10 + LAND_X) fail('he should have walked on in the far scene');
console.log('demoCheck ok: Kit walks up close to the door and lands in the far scene');
