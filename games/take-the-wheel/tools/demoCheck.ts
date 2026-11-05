// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: Kit touches a coin, which pays 100 and becomes a blinking 100 that rises and is gone.
//   cd web && npx vite-node ../games/take-the-wheel/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { COIN, POP100 } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const count = (n: number) => sim.w.mm.filter((m) => m.monnum === n).length;
let seenNumber = false;
let score = 0;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    seenNumber ||= count(POP100) > 0;
    score = sim.ci.score;
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
for (let i = 0; i < 70; i++) await sim.tick(); // the wait before Escape
console.log(`demo: number ${seenNumber ? 'seen' : 'never seen'}, ${count(POP100)} on screen at the end, ${count(COIN)} coins left, score ${score}`);
if (!seenNumber || count(POP100) !== 0 || score < 100 || count(COIN) !== 2) {
  console.error('demoCheck: expected one coin taken, its 100 seen and gone, and the other two coins still there');
  process.exit(1);
}
console.log('demoCheck ok: the coin paid 100 and its number rose and was gone');
