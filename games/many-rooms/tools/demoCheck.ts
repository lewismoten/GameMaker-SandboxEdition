// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's lesson:
// Kit takes the red room's coins and the red door lands him in the blue room, on its middle cell.
//   cd web && npx vite-node ../games/many-rooms/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { FLOOR, LAND_X } from '../src/levels';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await sim.tick();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await sim.tick();
const at = sim.trail[sim.trail.length - 1];
const p = sim.pos;
console.log(`demo: scenes ${sim.trail.join(' ')}; score ${sim.ci.score}; ends at ${p.x},${p.y}`);
const fail = (m: string) => {
  console.error(`demoCheck: ${m}`);
  process.exit(1);
};
if (sim.ci.score < 20) fail("the demo should take the red room's two coins");
if (at !== 3) fail(`the red door should land in the blue room (scene 3), not scene ${at}`);
if (p.x !== 10 + 16 + LAND_X || p.y !== 10 + FLOOR - 1) fail("he should be standing on the blue room's middle cell");
console.log('demoCheck ok: two coins, then a door that lands in the blue room');
