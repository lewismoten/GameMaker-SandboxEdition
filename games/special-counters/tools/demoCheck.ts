// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: Kit takes both gold keys, the gold door takes one, and one stays in his pocket
// (gold counter 2: a counter holds one more than the keys carried).
//   cd web && npx vite-node ../games/special-counters/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -1); // the Esc itself is not pressed
const sim = new GameSim(undefined, 1);
let ticks = 0;
let gold = 0;
let peak = 0;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    ticks++;
    gold = sim.ci.meter[20];
    peak = Math.max(peak, gold);
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(`demo: ${ticks} ticks; gold counter peaked at ${peak}, ends at ${gold}`);
if (peak !== 3) throw new Error('demoCheck: expected both gold keys taken (counter 3)');
if (gold !== 2) throw new Error('demoCheck: expected the door to take one key and a spare to remain (counter 2)');
