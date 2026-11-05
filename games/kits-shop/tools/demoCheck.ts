// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows the shop once:
// six coins and both keys bought, a stall that does nothing with no coins left, two more coins from
// the ladder, and the heart bought with the last of them (Money, counter 3, holds one more than the coins carried).
//   cd web && npx vite-node ../games/kits-shop/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -1); // the Esc itself is not pressed
const sim = new GameSim(undefined, 1);
let ticks = 0;
let money = 0;
let peak = 0;
let brokeWithKeys = false;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    ticks++;
    money = sim.ci.meter[3] - 1;
    peak = Math.max(peak, money);
    if (money === 0 && sim.ci.meter[20] === 2 && sim.ci.meter[21] === 2 && sim.ci.lives === 3) brokeWithKeys = true;
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(`demo: ${ticks} ticks; money peaked at ${peak}, ends at ${money}; lives ${sim.ci.lives}`);
if (!brokeWithKeys) throw new Error('demoCheck: expected both keys bought with no coins left and no heart yet');
if (money !== 0) throw new Error('demoCheck: expected every coin spent');
if (sim.ci.lives !== 4) throw new Error('demoCheck: expected the heart bought (a fourth life)');
