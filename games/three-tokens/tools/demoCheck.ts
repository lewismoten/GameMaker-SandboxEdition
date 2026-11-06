// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lessons once: Kit picks up two tokens and is stopped by the gate, takes the third, and the gate
// opens and takes all three.
//   cd web && npx vite-node ../games/three-tokens/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { TOKENS } from '../src/tokenBlocks';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
let stopped = false;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await sim.tick();
  if (sim.pos.x - 10 === 27 && sim.ci.meter[TOKENS] - 1 === 2) stopped = true; // at the shut gate with two
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
const held = sim.ci.meter[TOKENS] - 1;
const x = sim.pos.x - 10;
console.log(`demo: ${held} tokens held, Kit at column ${x}, stopped at the gate with two: ${stopped}`);
if (!stopped || held !== 0 || x < 29) {
  console.error('demoCheck: expected Kit stopped by the gate with two tokens, then through it with none left');
  process.exit(1);
}
console.log('demoCheck ok: the gate stayed shut with two and opened with three');
