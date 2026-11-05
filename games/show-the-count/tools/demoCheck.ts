// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lessons once: Kit is stopped by the gate with nothing lit, then walks the ledge and lights bulbs
// (the count goes up as each lights).
//   cd web && npx vite-node ../games/show-the-count/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { COUNT } from '../src/meterBlocks';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
let stopped = false;
let most = 0;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await sim.tick();
  if (sim.pos.x - 10 >= 29 && sim.pos.x - 10 <= 30 && sim.ci.meter[COUNT] - 1 === 0) stopped = true; // at the shut gate with nothing lit
  most = Math.max(most, sim.ci.meter[COUNT] - 1);
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(`demo: stopped at the gate with nothing lit: ${stopped}; most bulbs lit: ${most}`);
if (!stopped || most < 2) {
  console.error('demoCheck: expected Kit stopped by the gate with nothing lit, then at least two bulbs lit');
  process.exit(1);
}
console.log('demoCheck ok: the gate stayed shut with nothing lit and bulbs lit along the ledge');
