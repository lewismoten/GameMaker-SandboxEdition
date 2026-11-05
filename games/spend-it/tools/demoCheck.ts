// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: Kit has two coins and the stall does nothing, he gathers two more, pays three,
// one coin is left (Money, counter 3, holds one more than the coins carried).
//   cd web && npx vite-node ../games/spend-it/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -1); // the Esc itself is not pressed
const sim = new GameSim(undefined, 1);
let ticks = 0;
let money = 0;
let peak = 0;
let bumped = false;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    ticks++;
    money = sim.ci.meter[3] - 1;
    peak = Math.max(peak, money);
    if (money === 2 && sim.ci.meter[20] === 1) bumped = true;
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(`demo: ${ticks} ticks; money peaked at ${peak}, ends at ${money}`);
if (peak !== 4) throw new Error('demoCheck: expected all four coins taken');
if (!bumped) throw new Error('demoCheck: expected the demo to stand at the stall with two coins');
if (money !== 1) throw new Error('demoCheck: expected three coins paid and one left');
