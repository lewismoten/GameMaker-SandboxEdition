// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lessons once: Kit picks up three words, the lock takes all three, and the tray right behind it
// gives three back.
//   cd web && npx vite-node ../games/word-lock/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { WORDS } from '../src/wordBlocks';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
let full = false; // three words before the lock
let paid = false; // through the lock with none left
let refunded = false; // the tray gave three back
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    const col = sim.pos.x - 10;
    const held = sim.ci.meter[WORDS] - 1;
    if (col < 19 && held === 3) full = true;
    if (full && col >= 20 && col < 21 && held === 0) paid = true;
    if (paid && col >= 22 && held === 3) refunded = true;
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(`demo: three words ${full}, paid the lock ${paid}, tray gave them back ${refunded}`);
if (!full || !paid || !refunded) {
  console.error('demoCheck: expected Kit to carry three words, pay the lock, and get three back from the tray');
  process.exit(1);
}
console.log('demoCheck ok: the lock took three and the tray gave three back');
