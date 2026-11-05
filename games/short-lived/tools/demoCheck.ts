// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the bubble is in the tunnel while Kit waits, then it pops by itself (and leaves a sparkle).
//   cd web && npx vite-node ../games/short-lived/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { BUBBLE, TWINKLE } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const count = (n: number) => sim.w.mm.filter((m) => m.monnum === n).length;
let seenBubble = false;
let seenSparkle = false;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    seenBubble ||= count(BUBBLE) > 0;
    seenSparkle ||= count(TWINKLE) > 0;
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(`demo: bubble ${seenBubble ? 'seen' : 'never seen'}, ${count(BUBBLE)} left, sparkle ${seenSparkle ? 'seen' : 'never seen'}`);
if (!seenBubble || !seenSparkle || count(BUBBLE) !== 0) {
  console.error('demoCheck: expected the bubble to be there and then pop by itself');
  process.exit(1);
}
console.log('demoCheck ok: the bubble popped by itself');
