// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's lessons
// once: the hero picks up the four bytes of Play and the gate takes all four.
//   cd web && npx vite-node ../games/under-the-hood/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { BYTES } from '../src/hoodBlocks';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
let full = false; // four bytes before the gate
let paid = false; // through the gate with none left
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    const col = sim.pos.x - 10;
    const held = sim.ci.meter[BYTES] - 1;
    if (col < 33 && held === 4) full = true;
    if (full && col >= 34 && held === 0) paid = true;
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(`demo: four bytes ${full}, through the gate ${paid}`);
if (!full || !paid) {
  console.error('demoCheck: expected the hero to carry the four bytes of Play and pay the gate with them');
  process.exit(1);
}
console.log('demoCheck ok: four bytes picked up, the gate took all four');
